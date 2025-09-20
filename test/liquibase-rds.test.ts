import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { LiquibaseRDS } from '../src';

describe('LiquibaseRDS', () => {
  let app: App;
  let stack: Stack;
  let vpc: ec2.Vpc;
  let rdsInstance: rds.DatabaseInstance;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');

    // Create VPC for testing
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
    });

    // Create RDS instance for testing
    rdsInstance = new rds.DatabaseInstance(stack, 'TestRds', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
    });
  });

  test('creates CodeBuild project with correct configuration', () => {
    // Create the construct with ECR pull-through cache disabled
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
      enableEcrPullThroughCache: false,
    });

    // Get the CloudFormation template
    const template = Template.fromStack(stack);

    // Verify CodeBuild project is created
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Type: 'LINUX_CONTAINER',
        Image: 'liquibase/liquibase:latest',
      },
      Description: 'CodeBuild project to run Liquibase migrations',
    });
  });

  test('creates IAM role with correct permissions', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'validate',
      changelogPath: './test/fixtures',
      vpc,
    });

    const template = Template.fromStack(stack);

    // Verify IAM role is created
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'codebuild.amazonaws.com',
          },
        }],
      },
    });
  });

  test('supports RDS cluster', () => {
    // Create RDS cluster for testing
    const rdsCluster = new rds.DatabaseCluster(stack, 'TestRdsCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_4,
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpc,
      },
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
    });

    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance: rdsCluster,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
    });

    const template = Template.fromStack(stack);

    // Verify CodeBuild project is created
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Type: 'LINUX_CONTAINER',
      },
    });
  });

  test('configures environment variables correctly', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      databaseName: 'mydb',
      databaseUsername: 'testuser',
      databasePort: 5432,
      vpc,
    });

    const template = Template.fromStack(stack);

    // Verify specific environment variables are set
    const codeBuildProjects = template.findResources('AWS::CodeBuild::Project');
    const project = Object.values(codeBuildProjects)[0];
    const envVars = project.Properties.Environment.EnvironmentVariables;

    // Check for specific environment variables
    expect(envVars).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Name: 'LIQUIBASE_COMMAND',
        Type: 'PLAINTEXT',
        Value: 'update',
      }),
      expect.objectContaining({
        Name: 'DATABASE_NAME',
        Type: 'PLAINTEXT',
        Value: 'mydb',
      }),
      expect.objectContaining({
        Name: 'DATABASE_USERNAME',
        Type: 'PLAINTEXT',
        Value: 'testuser',
      }),
      expect.objectContaining({
        Name: 'RDS_PORT',
        Type: 'PLAINTEXT',
        Value: '5432',
      }),
    ]));
  });

  test('creates CloudWatch log group by default', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
    });

    const template = Template.fromStack(stack);

    // Verify log group is created
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/codebuild/TestLiquibaseRDS-liquibase',
      RetentionInDays: 7,
    });
  });

  test('allows disabling logging', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
      enableLogging: false,
    });

    const template = Template.fromStack(stack);

    // Verify no log group is created
    template.resourceCountIs('AWS::Logs::LogGroup', 0);
  });

  test('creates ECR pull-through cache rule by default', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
    });

    const template = Template.fromStack(stack);

    // Verify ECR pull-through cache rule is created
    template.hasResourceProperties('AWS::ECR::PullThroughCacheRule', {
      EcrRepositoryPrefix: 'docker-hub',
      UpstreamRegistryUrl: 'registry-1.docker.io',
    });

    // Verify CodeBuild uses ECR cached image
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/docker-hub/liquibase/liquibase:latest',
      },
    });
  });

  test('allows disabling ECR pull-through cache', () => {
    new LiquibaseRDS(stack, 'TestLiquibaseRDS', {
      rdsInstance,
      liquibaseCommand: 'update',
      changelogPath: './test/fixtures',
      vpc,
      enableEcrPullThroughCache: false,
    });

    const template = Template.fromStack(stack);

    // Verify no ECR pull-through cache rule is created
    template.resourceCountIs('AWS::ECR::PullThroughCacheRule', 0);

    // Verify CodeBuild uses direct Docker Hub image
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: {
        Image: 'liquibase/liquibase:latest',
      },
    });
  });
});