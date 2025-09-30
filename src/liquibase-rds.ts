import * as crypto from 'crypto';
import * as fs from 'fs';
import { CfnResource, CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { BuildEnvironmentVariable, BuildEnvironmentVariableType, BuildSpec, ComputeType, LinuxBuildImage, Project } from 'aws-cdk-lib/aws-codebuild';
import { IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DatabaseInstance, DatabaseCluster } from 'aws-cdk-lib/aws-rds';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * Properties for the LiquibaseRDS construct
 */
export interface LiquibaseRDSProps {
  /**
   * The RDS instance to run Liquibase against.
   * Can be either an RDS Instance or RDS Cluster.
   */
  readonly rdsDatabase: DatabaseInstance | DatabaseCluster;

  /**
   * Credentials ARN for Docker Hub authentication (required for pull-through cache).
   * Should be a Secrets Manager secret with JSON format:
   * {
   *   "username": "your-docker-hub-username",
   *   "password": "your-docker-hub-password-or-token"
   * }
   *
   * To create this secret:
   * aws secretsmanager create-secret \
   *   --name "ecr-pullthroughcache/docker-hub" \
   *   --description "Docker Hub credentials for ECR pull-through cache" \
   *   --secret-string '{"username":"your-username","password":"your-password"}'
   */
  readonly dockerHubCredentialsArn?: string;

  /**
   * The Liquibase command to execute.
   * Example: "update", "rollback", "validate", etc.
   */
  readonly liquibaseCommands: string[];

  /**
   * Path to the directory containing Liquibase changelog files.
   * This directory will be uploaded to S3 and made available to the CodeBuild project.
   */
  readonly changelogPath: string;


  /**
   * Database name to connect to.
   * @default - Uses the default database name from the RDS instance
   */
  readonly databaseName: string;

  /**
   * VPC to connect to - required if using a cluster
   * @default - Uses the VPC from the RDS instance
   */
  readonly vpc?: IVpc;

  /**
   * Additional Liquibase command line arguments.
   * @default []
   */
  readonly additionalArgs?: string[];

  /**
   * Environment variables to pass to the Liquibase container.
   * @default {}
   */
  readonly environmentVariables?: { [key: string]: BuildEnvironmentVariable };

  /**
   * Timeout for the CodeBuild project execution.
   * @default Duration.hours(1)
   */
  readonly timeout?: Duration;

  /**
   * Whether to enable CloudWatch Logs for the CodeBuild project.
   * @default true
   */
  readonly enableLogging?: boolean;

  /**
   * Log retention period for CloudWatch Logs.
   * @default logs.RetentionDays.ONE_WEEK
   */
  readonly logRetention?: RetentionDays;

  /**
   * Whether to automatically run Liquibase during CDK deployment.
   * If enabled, the Liquibase commands will be executed every time the stack is deployed.
   * @default true
   */
  readonly autoRun?: boolean;
}

/**
 * A CDK construct that creates a CodeBuild project to run Liquibase migrations
 * against an RDS instance or cluster.
 */
export class LiquibaseRDS extends Construct {
  /**
   * The CodeBuild project that runs Liquibase
   */
  public readonly codeBuildProject: Project;

  /**
   * The S3 bucket containing the changelog files
   */
  public readonly changelogBucket: IBucket;

  /**
   * The IAM role used by the CodeBuild project
   */
  public readonly codeBuildRole: Role;

  /**
   * CloudWatch Log Group for the CodeBuild project
   */
  public readonly logGroup?: LogGroup;

  /**
   * ECR pull-through cache rule (if enabled)
   */
  public readonly pullThroughCacheRule?: CfnResource;

  constructor(scope: Construct, id: string, props: LiquibaseRDSProps) {
    super(scope, id);

    // Upload changelog files to S3
    const changelogAsset = new Asset(this, 'ChangelogAsset', {
      path: props.changelogPath,
    });

    this.changelogBucket = changelogAsset.bucket;

    // Create IAM role for CodeBuild
    this.codeBuildRole = new Role(this, 'CodeBuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for Liquibase CodeBuild project',
    });

    // Grant permissions to access the changelog S3 bucket
    changelogAsset.grantRead(this.codeBuildRole);

    // Create ECR pull-through cache rule (only once per stack)
    // Note: Docker Hub requires authentication, so dockerHubCredentialsArn should be provided
    if (props.dockerHubCredentialsArn) {
      this.pullThroughCacheRule = this.getOrCreatePullThroughCacheRule(props);
      this.grantEcrAccess();
    } else {
      // Skip pull-through cache if no credentials provided - will use Docker Hub directly
      console.warn('dockerHubCredentialsArn not provided - skipping ECR pull-through cache. Images will be pulled directly from Docker Hub.');
    }

    // Create CloudWatch Log Group if logging is enabled
    if (props.enableLogging !== false) {
      this.logGroup = new LogGroup(this, 'LogGroup', {
        logGroupName: `/aws/codebuild/${id}-liquibase`,
        retention: props.logRetention || RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      this.logGroup.grantWrite(this.codeBuildRole);
    }

    // Extract database connection information from RDS instance
    const { endpoint, port, databaseName, secretArn } = this.getRdsConnectionInfo(props.rdsDatabase);

    // Build environment variables
    const environmentVariables: { [key: string]: BuildEnvironmentVariable } = {
      RDS_ENDPOINT: { value: endpoint },
      RDS_PORT: { value: port },
      DATABASE_NAME: { value: props.databaseName || databaseName || 'postgres' },
      LIQUIBASE_COMMANDS: { value: props.liquibaseCommands.join(',') },
      CHANGELOG_S3_BUCKET: { value: this.changelogBucket.bucketName },
      CHANGELOG_S3_KEY: { value: changelogAsset.s3ObjectKey },
      ...props.environmentVariables || {},
    };

    // Add database credentials using Secrets Manager
    if (secretArn) {
      environmentVariables.DB_USER = {
        type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        value: `${secretArn}:username`,
      };
      environmentVariables.DB_PASSWORD = {
        type: BuildEnvironmentVariableType.SECRETS_MANAGER,
        value: `${secretArn}:password`,
      };
    }

    // Build the buildspec
    const buildSpec = this.createBuildSpec(props);

    // Determine the Docker image to use (ECR cached or direct)
    const dockerImage = this.getDockerImage(props);

    // Create the CodeBuild project
    this.codeBuildProject = new Project(this, 'LiquibaseProject', {
      projectName: `${id}-liquibase`,
      description: 'CodeBuild project to run Liquibase migrations',
      role: this.codeBuildRole,
      environment: {
        buildImage: LinuxBuildImage.fromDockerRegistry(dockerImage),
        computeType: ComputeType.SMALL,
        privileged: false,
      },
      vpc: props.rdsDatabase instanceof DatabaseCluster ? props.vpc : props.rdsDatabase.vpc,
      subnetSelection: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      environmentVariables,
      buildSpec,
      timeout: props.timeout || Duration.hours(1),
      logging: this.logGroup ? {
        cloudWatch: {
          logGroup: this.logGroup,
        },
      } : undefined,
    });

    // Allow CodeBuild to connect to the database
    props.rdsDatabase.connections.allowDefaultPortFrom(this.codeBuildProject, 'Allow CodeBuild to access DB');

    // Auto-run Liquibase during deployment if enabled
    if (props.autoRun !== false) {
      this.createAutoDeploymentTrigger(props);
    }
  }

  /**
   * Grant the CodeBuild role access to ECR for pulling images
   */
  private grantEcrAccess(): void {
    this.codeBuildRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:GetAuthorizationToken',
      ],
      resources: ['*'],
    }));
  }

  /**
   * Get RDS connection information
   */
  private getRdsConnectionInfo(rdsDatabase: DatabaseInstance | DatabaseCluster): {
    endpoint: string;
    port: string;
    databaseName?: string;
    secretArn?: string;
  } {
    if (rdsDatabase instanceof DatabaseInstance) {
      // RDS Instance
      return {
        endpoint: rdsDatabase.instanceEndpoint.hostname,
        port: rdsDatabase.instanceEndpoint.port.toString(),
        databaseName: (rdsDatabase as any).instanceDatabaseName || undefined,
        secretArn: rdsDatabase.secret?.secretArn,
      };
    } else {
      // RDS Cluster
      return {
        endpoint: rdsDatabase.clusterEndpoint.hostname,
        port: rdsDatabase.clusterEndpoint.port.toString(),
        databaseName: (rdsDatabase as any).defaultDatabaseName || undefined,
        secretArn: rdsDatabase.secret?.secretArn,
      };
    }
  }

  /**
   * Create the CodeBuild buildspec
   */
  private createBuildSpec(props: LiquibaseRDSProps): BuildSpec {
    const additionalArgs = props.additionalArgs?.join(' ') || '';

    return BuildSpec.fromObject({
      version: '0.2',
      phases: {
        pre_build: {
          commands: [
            'echo "Starting Liquibase migration process..."',
            'echo "RDS Endpoint: $RDS_ENDPOINT"',
            'echo "Liquibase Command: $LIQUIBASE_COMMAND"',
            // Download changelog files from S3
            'mkdir -p /tmp/changelog',
            'aws s3 cp s3://$CHANGELOG_S3_BUCKET/$CHANGELOG_S3_KEY /tmp/changelog.zip',
            'cd /tmp/changelog && unzip ../changelog.zip',
            'ls -la /tmp/changelog',
          ],
        },
        build: {
          commands: [
            // Set up database URL
            'DB_URL="jdbc:postgresql://$RDS_ENDPOINT:$RDS_PORT/$DATABASE_NAME"',
            'echo "Database URL: $DB_URL"',
            // Run multiple Liquibase commands
            'IFS="," read -ra COMMANDS <<< "$LIQUIBASE_COMMANDS"',
            'for cmd in "${COMMANDS[@]}"; do',
            '  echo "Running Liquibase command: $cmd"',
            `  liquibase \\
                --url="\$DB_URL" \\
                --username="\$DB_USER" \\
                --password="\$DB_PASSWORD" \\
                --changeLogFile="/tmp/changelog/changelog.xml" \\
                ${additionalArgs} \\
                \$cmd`,
            'done',
          ],
        },
        post_build: {
          commands: [
            'echo "Liquibase migration completed successfully"',
          ],
        },
      },
    });
  }

  /**
   * Get or create ECR pull-through cache rule for Docker Hub (only once per stack)
   */
  private getOrCreatePullThroughCacheRule(props: LiquibaseRDSProps): CfnResource | undefined {
    // Check if a pull-through cache rule already exists in this stack
    const stack = Stack.of(this);
    const existingRule = stack.node.tryFindChild('LiquibaseRDSPullThroughCacheRule') as CfnResource;

    if (existingRule) {
      // Return the existing rule
      return existingRule;
    }

    // Create the rule at the stack level with a consistent ID
    const pullThroughCacheProps: any = {
      EcrRepositoryPrefix: 'liquibase-rds-cdk-cache',
      UpstreamRegistry: 'docker-hub',
      UpstreamRegistryUrl: 'registry-1.docker.io',
    };

    // Add credentials if provided
    if (props.dockerHubCredentialsArn) {
      pullThroughCacheProps.CredentialArn = props.dockerHubCredentialsArn;
    }

    return new CfnResource(stack, 'LiquibaseRDSPullThroughCacheRule', {
      type: 'AWS::ECR::PullThroughCacheRule',
      properties: pullThroughCacheProps,
    });
  }

  /**
   * Determine the Docker image URI to use (ECR pull-through cache if credentials provided, otherwise Docker Hub)
   */
  private getDockerImage(props: LiquibaseRDSProps): string {
    const baseImage = 'liquibase/liquibase:latest';

    if (props.dockerHubCredentialsArn) {
      // Use ECR pull-through cache with 'liquibase-rds-cdk-cache' prefix
      const region = this.node.tryGetContext('aws:region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
      const account = this.node.tryGetContext('aws:account') || process.env.CDK_DEFAULT_ACCOUNT || '123456789012';

      // Convert Docker Hub image to ECR cached format with 'liquibase-rds-cdk-cache' prefix
      // e.g., liquibase/liquibase:latest -> {account}.dkr.ecr.{region}.amazonaws.com/liquibase-rds-cdk-cache/liquibase/liquibase:latest
      return `${account}.dkr.ecr.${region}.amazonaws.com/liquibase-rds-cdk-cache/${baseImage}`;
    } else {
      // Use Docker Hub directly
      return baseImage;
    }
  }

  /**
   * Create auto-deployment trigger that runs Liquibase on every CDK deployment
   */
  private createAutoDeploymentTrigger(props: LiquibaseRDSProps): void {
    // Create a hash of the changelog files to trigger re-runs when they change
    const changelogHash = this.calculateChangelogHash(props.changelogPath);

    // Create the Lambda function that triggers CodeBuild using Docker
    const buildTriggerFunction = new Function(this, 'BuildTriggerFunction', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('./src/codebuild-lambda-provider'),
      handler: 'index.handler',
      timeout: Duration.minutes(15),
    });

    // Grant permissions to the Lambda function
    buildTriggerFunction.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'codebuild:StartBuild',
          'codebuild:BatchGetBuilds',
          'logs:GetLogEvents',
          'logs:DescribeLogStreams',
          'logs:DescribeLogGroups',
        ],
        resources: ['*'],
      }),
    );

    // Create the custom resource provider
    const buildTriggerProvider = new Provider(this, 'BuildTriggerProvider', {
      onEventHandler: buildTriggerFunction,
    });

    // Create the custom resource that triggers the build
    const buildTriggerResource = new CustomResource(this, 'BuildTriggerResource', {
      serviceToken: buildTriggerProvider.serviceToken,
      properties: {
        ProjectName: this.codeBuildProject.projectName,
        Trigger: `${changelogHash}|${props.liquibaseCommands.join(',')}|${this.codeBuildProject.projectName}`,
      },
    });

    // Ensure dependencies are created before triggering
    buildTriggerResource.node.addDependency(this.codeBuildProject);
    buildTriggerResource.node.addDependency(props.rdsDatabase);
  }

  /**
   * Calculate hash of changelog files to detect changes
   */
  private calculateChangelogHash(changelogPath: string): string {
    try {
      // Read all files in the changelog directory
      const files = fs.readdirSync(changelogPath, { recursive: true });
      const hash = crypto.createHash('sha256');

      files.forEach(file => {
        if (typeof file === 'string') {
          const filePath = `${changelogPath}/${file}`;
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            hash.update(content);
          }
        }
      });

      return hash.digest('hex');
    } catch (error) {
      console.warn(`Could not calculate changelog hash: ${error}`);
      return Date.now().toString(); // Fallback to timestamp
    }
  }

  /**
   * Start the CodeBuild execution
   */
  public startExecution(): Project {
    return this.codeBuildProject;
  }
}
