import { CloudWatchLogsClient, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CodeBuildClient, StartBuildCommand, BatchGetBuildsCommand } from '@aws-sdk/client-codebuild';
import { 
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceUpdateEvent,
  CloudFormationCustomResourceDeleteEvent,
  Context 
} from 'aws-lambda';

const codebuildClient = new CodeBuildClient({});
const cloudWatchLogsClient = new CloudWatchLogsClient({});

interface CustomResourceProperties {
  ProjectName: string;
  Trigger: string;
}

interface CustomResourceResponse {
  PhysicalResourceId: string;
  Data: Record<string, any>;
  Reason?: string;
}

export const handler = async (
  event: (CloudFormationCustomResourceCreateEvent | CloudFormationCustomResourceUpdateEvent | CloudFormationCustomResourceDeleteEvent) & { ResourceProperties: CustomResourceProperties },
  context: Context,
): Promise<CustomResourceResponse> => {
  console.log('CodeBuild Lambda Provider - Event:', JSON.stringify(event, null, 2));
  console.log('Lambda Context:', {
    requestId: context.awsRequestId,
    functionName: context.functionName,
    remainingTimeInMillis: context.getRemainingTimeInMillis(),
  });

  // Set the PhysicalResourceId
  const physicalResourceId = 'PhysicalResourceId' in event ? event.PhysicalResourceId : event.LogicalResourceId;

  try {
    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      console.log(`Processing ${event.RequestType} request for project: ${event.ResourceProperties.ProjectName}`);
      
      const result = await executeCodeBuildProject(event.ResourceProperties.ProjectName, context);
      
      return {
        PhysicalResourceId: physicalResourceId,
        Data: {
          BuildId: result.buildId,
          BuildStatus: result.buildStatus,
        },
      };
    } else if (event.RequestType === 'Delete') {
      console.log('Delete request received. No action required for CodeBuild project.');
      return {
        PhysicalResourceId: physicalResourceId,
        Data: {},
      };
    } else {
      // This should never happen due to type constraints, but handle it gracefully
      const requestType = (event as any).RequestType || 'UNKNOWN';
      throw new Error(`Unknown request type: ${requestType}`);
    }
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    
    return {
      PhysicalResourceId: physicalResourceId,
      Data: {},
      Reason: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Execute a CodeBuild project and wait for completion
 */
async function executeCodeBuildProject(
  projectName: string, 
  context: Context
): Promise<{ buildId: string; buildStatus: string }> {
  console.log(`Starting CodeBuild project: ${projectName}`);
  
  const startBuildCommand = new StartBuildCommand({
    projectName: projectName,
  });
  
  const buildResponse = await codebuildClient.send(startBuildCommand);
  console.log('Build started successfully:', {
    buildId: buildResponse.build?.id,
    projectName: buildResponse.build?.projectName,
  });

  const buildId = buildResponse.build?.id;
  if (!buildId) {
    throw new Error('Failed to start build: No build ID returned from CodeBuild');
  }

  // Wait for build completion with timeout protection
  const result = await waitForBuildCompletion(buildId, context);
  
  if (result.buildStatus !== 'SUCCEEDED') {
    await logBuildFailureDetails(buildId);
    throw new Error(`Build failed with status: ${result.buildStatus}`);
  }

  console.log('Build completed successfully');
  return result;
}

/**
 * Wait for CodeBuild project to complete
 */
async function waitForBuildCompletion(
  buildId: string, 
  context: Context
): Promise<{ buildId: string; buildStatus: string }> {
  const maxWaitTime = Math.max(context.getRemainingTimeInMillis() - 30000, 60000); // Leave 30s buffer, minimum 1 minute
  const startTime = Date.now();
  
  let buildStatus = 'IN_PROGRESS';
  let attempts = 0;
  
  while (buildStatus === 'IN_PROGRESS') {
    // Check timeout
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error(`Build timeout: exceeded maximum wait time of ${maxWaitTime}ms`);
    }
    
    attempts++;
    console.log(`Checking build status (attempt ${attempts}): ${buildId}`);
    
    const batchGetBuildsCommand = new BatchGetBuildsCommand({ ids: [buildId] });
    const buildStatusResp = await codebuildClient.send(batchGetBuildsCommand);

    const build = buildStatusResp.builds?.[0];
    if (!build) {
      throw new Error(`Build not found: ${buildId}`);
    }

    buildStatus = build.buildStatus || 'FAILED';
    console.log(`Build status: ${buildStatus}`);
    
    if (buildStatus === 'IN_PROGRESS') {
      // Wait before next check, with exponential backoff (max 30s)
      const waitTime = Math.min(5000 + (attempts * 1000), 30000);
      console.log(`Waiting ${waitTime}ms before next status check...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return { buildId, buildStatus };
}

/**
 * Log detailed failure information for debugging
 */
async function logBuildFailureDetails(buildId: string): Promise<void> {
  try {
    console.log('Retrieving build failure details...');
    
    const batchGetBuildsCommand = new BatchGetBuildsCommand({ ids: [buildId] });
    const buildDetails = await codebuildClient.send(batchGetBuildsCommand);
    
    const build = buildDetails.builds?.[0];
    if (!build) {
      console.error('Could not retrieve build details');
      return;
    }

    console.log('Build failure details:', {
      buildStatus: build.buildStatus,
      buildComplete: build.buildComplete,
      currentPhase: build.currentPhase,
      endTime: build.endTime,
      phases: build.phases?.map((phase) => ({
        phaseType: phase.phaseType,
        phaseStatus: phase.phaseStatus,
        durationInSeconds: phase.durationInSeconds,
      })),
    });

    const logsInfo = build.logs;
    if (logsInfo?.deepLink) {
      console.log(`Build logs available at: ${logsInfo.deepLink}`);
    }

    // Try to fetch recent log events
    if (logsInfo?.groupName && logsInfo?.streamName) {
      await fetchRecentLogEvents(logsInfo.groupName, logsInfo.streamName);
    }
  } catch (error) {
    console.error('Failed to retrieve build failure details:', error);
  }
}

/**
 * Fetch and log recent CloudWatch log events
 */
async function fetchRecentLogEvents(logGroupName: string, logStreamName: string): Promise<void> {
  try {
    console.log(`Fetching logs from ${logGroupName}/${logStreamName}`);
    
    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName,
      logStreamName,
      startFromHead: false, // Get most recent events
      limit: 10, // Limit to recent events
    });

    const logEvents = await cloudWatchLogsClient.send(getLogEventsCommand);
    
    const logMessages = logEvents.events?.map((event) => event.message?.trim()).filter((msg): msg is string => Boolean(msg)) || [];
    
    if (logMessages.length > 0) {
      console.log('Recent build logs:');
      logMessages.forEach((message, index) => {
        console.log(`  ${index + 1}: ${message}`);
      });
    } else {
      console.log('No log events found');
    }
  } catch (error) {
    console.error('Failed to fetch log events:', error);
  }
}
