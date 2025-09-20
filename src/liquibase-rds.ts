import {
  aws_codebuild as codebuild,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_logs as logs,
  aws_rds as rds,
  aws_s3 as s3,
  aws_s3_assets as assets,
  CfnResource,
  Duration,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Properties for the LiquibaseRDS construct
 */
export interface LiquibaseRDSProps {
  /**
   * The RDS instance to run Liquibase against.
   * Can be either an RDS Instance or RDS Cluster.
   */
  readonly rdsInstance: rds.IDatabaseInstance | rds.IDatabaseCluster;

  /**
   * The Liquibase command to execute.
   * Example: "update", "rollback", "validate", etc.
   */
  readonly liquibaseCommand: string;

  /**
   * Path to the directory containing Liquibase changelog files.
   * This directory will be uploaded to S3 and made available to the CodeBuild project.
   */
  readonly changelogPath: string;

  /**
   * Database username for Liquibase connection.
   * @default 'admin'
   */
  readonly databaseUsername?: string;

  /**
   * Database password for Liquibase connection.
   * This should be stored in AWS Secrets Manager or Systems Manager Parameter Store.
   * Provide the ARN or parameter name.
   */
  readonly databasePassword?: string;

  /**
   * Database name to connect to.
   * @default - Uses the default database for the RDS instance
   */
  readonly databaseName?: string;

  /**
   * Database port to connect to.
   * @default - Uses the port from the RDS instance (5432 for PostgreSQL, 3306 for MySQL)
   */
  readonly databasePort?: number;

  /**
   * VPC where the CodeBuild project should run.
   * Must be the same VPC as the RDS instance for private connectivity.
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Subnets where the CodeBuild project should run.
   * Should be private subnets with access to the RDS instance.
   */
  readonly subnets?: ec2.SubnetSelection;

  /**
   * Security groups to attach to the CodeBuild project.
   * Should allow access to the RDS instance.
   */
  readonly securityGroups?: ec2.ISecurityGroup[];

  /**
   * Liquibase Docker image to use.
   * @default 'liquibase/liquibase:latest'
   */
  readonly liquibaseImage?: string;

  /**
   * Enable ECR pull-through cache for the Liquibase Docker image.
   * This will create a pull-through cache rule for Docker Hub and use
   * the cached image from your private ECR registry.
   * @default true
   */
  readonly enableEcrPullThroughCache?: boolean;

  /**
   * ECR repository prefix for the pull-through cache.
   * @default 'docker-hub'
   */
  readonly ecrRepositoryPrefix?: string;

  /**
   * Credentials ARN for Docker Hub authentication (if required).
   * Should be a Secrets Manager secret with ecr-pullthroughcache/ prefix.
   */
  readonly dockerHubCredentialsArn?: string;

  /**
   * Additional Liquibase command line arguments.
   * @default []
   */
  readonly additionalArgs?: string[];

  /**
   * Environment variables to pass to the Liquibase container.
   * @default {}
   */
  readonly environmentVariables?: { [key: string]: codebuild.BuildEnvironmentVariable };

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
  readonly logRetention?: logs.RetentionDays;
}

/**
 * A CDK construct that creates a CodeBuild project to run Liquibase migrations
 * against an RDS instance or cluster.
 */
export class LiquibaseRDS extends Construct {
  /**
   * The CodeBuild project that runs Liquibase
   */
  public readonly codeBuildProject: codebuild.Project;

  /**
   * The S3 bucket containing the changelog files
   */
  public readonly changelogBucket: s3.IBucket;

  /**
   * The IAM role used by the CodeBuild project
   */
  public readonly codeBuildRole: iam.Role;

  /**
   * CloudWatch Log Group for the CodeBuild project
   */
  public readonly logGroup?: logs.LogGroup;

  /**
   * ECR pull-through cache rule (if enabled)
   */
  public readonly pullThroughCacheRule?: CfnResource;

  constructor(scope: Construct, id: string, props: LiquibaseRDSProps) {
    super(scope, id);

    // Upload changelog files to S3
    const changelogAsset = new assets.Asset(this, 'ChangelogAsset', {
      path: props.changelogPath,
    });

    this.changelogBucket = changelogAsset.bucket;

    // Create IAM role for CodeBuild
    this.codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for Liquibase CodeBuild project',
    });

    // Grant permissions to access the changelog S3 bucket
    changelogAsset.grantRead(this.codeBuildRole);

    // Grant permissions to access RDS (if using IAM authentication)
    this.grantRdsAccess(props.rdsInstance);

    // Create ECR pull-through cache rule if enabled
    if (props.enableEcrPullThroughCache !== false) {
      this.pullThroughCacheRule = this.createPullThroughCacheRule(props);
      this.grantEcrAccess();
    }

    // Create CloudWatch Log Group if logging is enabled
    if (props.enableLogging !== false) {
      this.logGroup = new logs.LogGroup(this, 'LogGroup', {
        logGroupName: `/aws/codebuild/${id}-liquibase`,
        retention: props.logRetention || logs.RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      this.logGroup.grantWrite(this.codeBuildRole);
    }

    // Determine RDS endpoint and port
    const { endpoint } = this.getRdsConnectionInfo(props.rdsInstance);
    const port = props.databasePort?.toString() || '5432'; // Default to PostgreSQL port

    // Build environment variables
    const environmentVariables: { [key: string]: codebuild.BuildEnvironmentVariable } = {
      RDS_ENDPOINT: { value: endpoint },
      RDS_PORT: { value: port },
      DATABASE_USERNAME: { value: props.databaseUsername || 'admin' },
      LIQUIBASE_COMMAND: { value: props.liquibaseCommand },
      CHANGELOG_S3_BUCKET: { value: this.changelogBucket.bucketName },
      CHANGELOG_S3_KEY: { value: changelogAsset.s3ObjectKey },
      ...props.environmentVariables || {},
    };

    // Add database name if provided
    if (props.databaseName) {
      environmentVariables.DATABASE_NAME = { value: props.databaseName };
    }

    // Add database password if provided
    if (props.databasePassword) {
      environmentVariables.DATABASE_PASSWORD = { value: props.databasePassword };
    }

    // Build the buildspec
    const buildSpec = this.createBuildSpec(props);

    // Determine the Docker image to use (ECR cached or direct)
    const dockerImage = this.getDockerImage(props);

    // Create the CodeBuild project
    this.codeBuildProject = new codebuild.Project(this, 'LiquibaseProject', {
      projectName: `${id}-liquibase`,
      description: 'CodeBuild project to run Liquibase migrations',
      role: this.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromDockerRegistry(dockerImage),
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      vpc: props.vpc,
      subnetSelection: props.subnets,
      securityGroups: props.securityGroups,
      environmentVariables,
      buildSpec,
      timeout: props.timeout || Duration.hours(1),
      logging: this.logGroup ? {
        cloudWatch: {
          logGroup: this.logGroup,
        },
      } : undefined,
    });
  }

  /**
   * Grant the CodeBuild role access to the RDS instance
   */
  private grantRdsAccess(rdsInstance: rds.IDatabaseInstance | rds.IDatabaseCluster): void {
    // Grant RDS connect permission for IAM database authentication
    this.codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['rds-db:connect'],
      resources: [
        this.isRdsInstance(rdsInstance)
          ? `arn:aws:rds-db:*:*:dbuser:${rdsInstance.instanceIdentifier}/*`
          : `arn:aws:rds-db:*:*:dbuser:${rdsInstance.clusterIdentifier}/*`,
      ],
    }));

    // Grant describe permissions to get RDS information
    this.codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rds:DescribeDBInstances',
        'rds:DescribeDBClusters',
      ],
      resources: ['*'],
    }));
  }

  /**
   * Grant the CodeBuild role access to ECR for pulling images
   */
  private grantEcrAccess(): void {
    this.codeBuildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
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
  private getRdsConnectionInfo(rdsInstance: rds.IDatabaseInstance | rds.IDatabaseCluster): {
    endpoint: string;
  } {
    if (this.isRdsInstance(rdsInstance)) {
      return {
        endpoint: rdsInstance.instanceEndpoint.hostname,
      };
    } else {
      return {
        endpoint: rdsInstance.clusterEndpoint.hostname,
      };
    }
  }

  /**
   * Type guard to check if the RDS resource is an instance
   */
  private isRdsInstance(resource: rds.IDatabaseInstance | rds.IDatabaseCluster): resource is rds.IDatabaseInstance {
    return 'instanceIdentifier' in resource;
  }

  /**
   * Create the CodeBuild buildspec
   */
  private createBuildSpec(props: LiquibaseRDSProps): codebuild.BuildSpec {
    const additionalArgs = props.additionalArgs?.join(' ') || '';

    return codebuild.BuildSpec.fromObject({
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
            'if [ -n "$DATABASE_NAME" ]; then',
            '  DB_URL="jdbc:postgresql://$RDS_ENDPOINT:$RDS_PORT/$DATABASE_NAME"',
            'else',
            '  DB_URL="jdbc:postgresql://$RDS_ENDPOINT:$RDS_PORT/"',
            'fi',
            'echo "Database URL: $DB_URL"',
            // Run Liquibase command
            `liquibase \\
              --url="\$DB_URL" \\
              --username="\$DATABASE_USERNAME" \\
              --password="\$DATABASE_PASSWORD" \\
              --changeLogFile="/tmp/changelog/changelog.xml" \\
              ${additionalArgs} \\
              \$LIQUIBASE_COMMAND`,
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
   * Create ECR pull-through cache rule for Docker Hub
   */
  private createPullThroughCacheRule(props: LiquibaseRDSProps): CfnResource {
    const repositoryPrefix = props.ecrRepositoryPrefix || 'docker-hub';

    const pullThroughCacheProps: any = {
      EcrRepositoryPrefix: repositoryPrefix,
      UpstreamRegistryUrl: 'registry-1.docker.io',
    };

    // Add credentials if provided
    if (props.dockerHubCredentialsArn) {
      pullThroughCacheProps.CredentialArn = props.dockerHubCredentialsArn;
    }

    return new CfnResource(this, 'PullThroughCacheRule', {
      type: 'AWS::ECR::PullThroughCacheRule',
      properties: pullThroughCacheProps,
    });
  }

  /**
   * Determine the Docker image URI to use
   */
  private getDockerImage(props: LiquibaseRDSProps): string {
    const baseImage = props.liquibaseImage || 'liquibase/liquibase:latest';

    if (props.enableEcrPullThroughCache !== false) {
      // Use ECR pull-through cache
      const repositoryPrefix = props.ecrRepositoryPrefix || 'docker-hub';
      const region = this.node.tryGetContext('aws:region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
      const account = this.node.tryGetContext('aws:account') || process.env.CDK_DEFAULT_ACCOUNT || '123456789012';

      // Convert Docker Hub image to ECR cached format
      // e.g., liquibase/liquibase:latest -> {account}.dkr.ecr.{region}.amazonaws.com/docker-hub/liquibase/liquibase:latest
      return `${account}.dkr.ecr.${region}.amazonaws.com/${repositoryPrefix}/${baseImage}`;
    }

    return baseImage;
  }

  /**
   * Start the CodeBuild execution
   */
  public startExecution(): codebuild.Project {
    return this.codeBuildProject;
  }
}
