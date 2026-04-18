/**
 * Test Case Service
 * Service for managing test case operations
 */

import { StoredTestCase, TestMetadata, AutomationStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

class TestCaseService {
  private storage = new Map<string, StoredTestCase>();

  /**
   * Save test case
   */
  async save(
    projectId: string,
    metadata: TestMetadata,
    scriptPath?: string,
    createdBy: string = 'system'
  ): Promise<StoredTestCase> {
    const testCase: StoredTestCase = {
      id: uuidv4(),
      projectId,
      testName: metadata.name,
      description: metadata.description,
      metadata,
      scriptPath,
      automationStatus: scriptPath ? 'automated' : 'not-started',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    this.storage.set(testCase.id, testCase);

    logger.info('Test case saved', {
      testCaseId: testCase.id,
      projectId,
      automationStatus: testCase.automationStatus,
    });

    return testCase;
  }

  /**
   * Get test case by ID
   */
  async getById(testCaseId: string): Promise<StoredTestCase | null> {
    return this.storage.get(testCaseId) || null;
  }

  /**
   * Get all test cases for a project
   */
  async getByProject(projectId: string): Promise<StoredTestCase[]> {
    return Array.from(this.storage.values()).filter(
      tc => tc.projectId === projectId
    );
  }

  /**
   * Update test case status
   */
  async updateStatus(
    testCaseId: string,
    status: AutomationStatus
  ): Promise<StoredTestCase | null> {
    const testCase = this.storage.get(testCaseId);

    if (!testCase) {
      return null;
    }

    testCase.automationStatus = status;
    testCase.updatedAt = new Date();

    this.storage.set(testCaseId, testCase);

    logger.info('Test case status updated', {
      testCaseId,
      status,
    });

    return testCase;
  }

  /**
   * Delete test case
   */
  async delete(testCaseId: string): Promise<boolean> {
    const result = this.storage.delete(testCaseId);

    if (result) {
      logger.info('Test case deleted', { testCaseId });
    }

    return result;
  }

  /**
   * Count test cases by status
   */
  async countByStatus(projectId: string): Promise<Record<string, number>> {
    const testCases = await this.getByProject(projectId);
    const counts: Record<string, number> = {
      'not-started': 0,
      'in-progress': 0,
      'automated': 0,
      'failed': 0,
      'manual-review': 0,
    };

    testCases.forEach(tc => {
      counts[tc.automationStatus]++;
    });

    return counts;
  }
}

export default new TestCaseService();
