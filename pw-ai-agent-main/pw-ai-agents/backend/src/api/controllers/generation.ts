/**
 * Test Generation Controller
 * Handles test case upload, parsing, and script generation
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  TestCaseUploadRequest,
  ScriptGenerationRequest,
  ScriptGenerationResponse,
  ApiResponse,
} from '../../types';
import logger from '../../utils/logger';
import testCaseParser from '../../agents/test-case-parser';
import scriptGenerator from '../../agents/script-generator';
import scriptValidator from '../../agents/script-validator';

export async function uploadTestCases(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { testCases, format, projectId } = req.body as TestCaseUploadRequest;

    logger.info('Processing test case upload', {
      testCaseCount: testCases.length,
      format,
      projectId,
    });

    // Parse all test cases
    const parseResults = await testCaseParser.parseMultiple(testCases);

    const successfulParse = parseResults.filter(r => r.success && r.testMetadata);
    const failedParse = parseResults.filter(r => !r.success);

    logger.info('Test case parsing completed', {
      successful: successfulParse.length,
      failed: failedParse.length,
    });

    const response: ApiResponse<any> = {
      success: failedParse.length === 0,
      data: {
        uploadId: uuidv4(),
        parsedTestCases: successfulParse.map(r => r.testMetadata),
        errors: failedParse.map(r => ({
          testCaseId: r.errors?.[0],
          errors: r.errors,
        })),
        summary: {
          total: testCases.length,
          successful: successfulParse.length,
          failed: failedParse.length,
        },
      },
      timestamp: new Date(),
    };

    res.status(failedParse.length > 0 ? 207 : 200).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Test case upload failed', errorMessage, { component: 'uploadTestCases' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function generateScript(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { testMetadata } = req.body as ScriptGenerationRequest;

    logger.info('Generating test script', {
      testId: testMetadata.id,
      testName: testMetadata.name,
    });

    // Generate script
    const generatorResult = await scriptGenerator.generate(testMetadata);

    if (!generatorResult.success || !generatorResult.generatedScript) {
      throw new Error(`Script generation failed: ${generatorResult.errors?.join(', ')}`);
    }

    // Validate generated script
    const validationResult = await scriptValidator.validate(generatorResult.generatedScript);

    // Save script to file system
    let scriptPath = `./scripts/${testMetadata.id}.ts`;
    if (validationResult.isValid) {
      try {
        scriptPath = await scriptGenerator.saveScript(testMetadata.id, generatorResult.generatedScript);
        logger.info('Script saved successfully', { testId: testMetadata.id, scriptPath });
      } catch (saveError) {
        const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
        logger.warn('Failed to save script to disk', { message: errorMsg, testId: testMetadata.id });
      }
    }

    const response: ApiResponse<ScriptGenerationResponse> = {
      success: validationResult.isValid,
      data: {
        testId: testMetadata.id,
        generatedScript: generatorResult.generatedScript,
        scriptPath: scriptPath,
        validationStatus: validationResult.isValid ? 'valid' : 'invalid',
        llm: {
          enabled: Boolean(generatorResult.llmEnabled),
          used: Boolean(generatorResult.llmUsed),
        },
        errors: validationResult.validationResult.errors,
        warnings: validationResult.validationResult.warnings,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };

    res.status(validationResult.isValid ? 200 : 202).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Script generation failed', errorMessage, { component: 'generateScript' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}

export async function generateScriptBatch(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { testMetadataList } = req.body;

    if (!Array.isArray(testMetadataList) || testMetadataList.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'testMetadataList must be a non-empty array',
        },
      });
      return;
    }

    logger.info('Batch generating test scripts', {
      count: testMetadataList.length,
    });

    // Generate scripts in parallel
    const generationPromises = testMetadataList.map(metadata =>
      scriptGenerator.generate(metadata)
    );

    const generationResults = await Promise.all(generationPromises);

    // Validate all scripts
    const validations = await Promise.all(
      generationResults.map(result =>
        result.generatedScript
          ? scriptValidator.validate(result.generatedScript)
          : Promise.resolve(null)
      )
    );

    // Save all validated scripts to disk
    const savePromises = generationResults.map(async (result, index) => {
      if (result.success && result.generatedScript && validations[index]?.isValid) {
        try {
          return await scriptGenerator.saveScript(testMetadataList[index].id, result.generatedScript);
        } catch (saveError) {
          const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
          logger.warn('Failed to save batch script', { error: errorMsg, testId: testMetadataList[index].id });
          return `./scripts/${testMetadataList[index].id}.ts`;
        }
      }
      return `./scripts/${testMetadataList[index].id}.ts`;
    });

    const scriptPaths = await Promise.all(savePromises);

    const response: ApiResponse<any> = {
      success: generationResults.every(r => r.success),
      data: {
        batchId: uuidv4(),
        scripts: generationResults.map((result, index) => ({
          testId: testMetadataList[index].id,
          success: result.success,
          script: result.generatedScript,
          scriptPath: scriptPaths[index],
          validationStatus: validations[index]?.isValid ? 'valid' : 'invalid',
          llm: {
            enabled: Boolean(result.llmEnabled),
            used: Boolean(result.llmUsed),
          },
          errors: result.errors || validations[index]?.validationResult.errors,
          warnings: validations[index]?.validationResult.warnings,
        })),
        summary: {
          total: generationResults.length,
          successful: generationResults.filter(r => r.success).length,
          failed: generationResults.filter(r => !r.success).length,
        },
      },
      timestamp: new Date(),
    };

    res.status(response.success ? 200 : 207).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as any).statusCode || 500;
    logger.error('Batch script generation failed', errorMessage, { component: 'generateScriptBatch' });
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    });
  }
}
