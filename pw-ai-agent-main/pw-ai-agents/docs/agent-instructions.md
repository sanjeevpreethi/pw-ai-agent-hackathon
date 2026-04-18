Agent Objective:

Convert test cases to playwright script based on the framework context

Group Name: AI test case to Playwright 

Boundaries and Responsibilities:
    - Phase -1:
        - Using playwright MCP connect to the application and get the DOM
        - Generate the script in the framework format
        - Save it to script folder in the project
        - Success metrics - 70% of the generated automation script to be executed successfully

    - Phase -2:
        - Get Test case from Jira
        - Convert the test cases to Gherkin

    -Phase -3:
        - Auto healing agent
    
    -Phase -4:
        - Test data generator agent


Input Contracts:
    - Test cases with detailed steps, test data, expected results (Use Faker library)
    - Locator strategy
    - Application should be stable
    - Excel

Output Contracts:
    - Playwright script (Typescript preferred)
    - Test Report Dashboard

Workflow & Orchestration Logic:
    - Retry for 3 times in case of failure

Tools & System Integration
    - Playwright MCP


Next steps:
1. Generate a architecture md file for enterprise grade level - DONE
2. Review the Architecture.md file - DONE
3. Create a backend using Architecture md (Agent) - DONE
4. [Agent] Start the backend server - Perform Unit and Integration test for the backend API
=====================
12-April2026
4a. Scripts created in the automation folder - DONE
4b. Run playwright test from local and installed playwright - DONE
4c. Fix compilation errors in generated scripts - DONE
4d. Generated automation scirpti is missing steps - DONE
4e. Fix the locator used by adopting playwright MCP while generating playwright MCP - Prompt - to remove the target locators from {{base_url}}/api/{{api_version}}/scripts/generate to use playwright MCP to get the correct weblocators based on the test case
4f. Fix the genretaed test case file name - it should be iterative 

=====================================


Test Cases → LLM → MCP Server → Playwright → Test Execution

==============================================

4a. [Analyse] Look into Execution api calls
5. [Dashboard] Front end scope for test report visualisation after execution

Setup meeting for weekdays and IST evenings after 6:00 PM



Option 1:
5. Create a front end to connect (Architecture.md)
    Upload test cases
    Button to generate


Option 2:
5. Front end for test report



Backend and Frontend needs to be maintained separately


Folder Structure

pw-ai-agents [1 team]
    - Automation Framework
    - [Agent] Backend
    - [Agent] Frontend


[7 Teams]
pw-ai-agents 1
    - Automation Framework

pw-ai-agents 2
    - Automation Framework

Automation Agent - 
    - [Agent] Backend
    - [Agent] Frontend

