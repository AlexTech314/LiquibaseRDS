import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { LiquibaseRDS } from '../src';

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export class LiquibaseRDSExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Create VPC with reduced NAT gateways to avoid EIP limits
    const vpc = new ec2.Vpc(this, 'ExampleVpc', {
      maxAzs: 2,
      natGateways: 1, // Keep to 1 to minimize EIP usage
      // Optionally, you can use NAT instances instead of NAT gateways
      // natGatewayProvider: ec2.NatProvider.instance({
      //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      // }),
    });

    // Create RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, 'ExampleDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'example-db-credentials',
      }),
      databaseName: 'exampledb',
      deletionProtection: false, // For demo purposes only
      removalPolicy: this.node.tryGetContext('destroy') ? 
        require('aws-cdk-lib').RemovalPolicy.DESTROY : 
        require('aws-cdk-lib').RemovalPolicy.RETAIN,
    });

    // Create security group for CodeBuild
    const codeBuildSecurityGroup = new ec2.SecurityGroup(this, 'CodeBuildSecurityGroup', {
      vpc,
      description: 'Security group for Liquibase CodeBuild project',
    });

    // Allow CodeBuild to connect to RDS
    database.connections.allowFrom(codeBuildSecurityGroup, ec2.Port.tcp(5432), 'Allow CodeBuild to connect to RDS');

    // Create LiquibaseRDS construct for running migrations
    new LiquibaseRDS(this, 'LiquibaseMigration', {
      rdsDatabase: database,
      liquibaseCommands: ['clearCheckSums', 'update'],
      changelogPath: path.resolve(__dirname, './changelogs'),
      dockerHubCredentialsArn: process.env.DOCKER_HUB_CREDENTIALS_ARN || '',
      databaseName: 'exampledb',
      additionalArgs: ['--log-level=INFO'],
      environmentVariables: {
        LIQUIBASE_HUB_MODE: { value: 'off' },
      },
      autoRun: true, // Automatically run Liquibase during CDK deployment
    });

    // Example with RDS Aurora Cluster
    const cluster = new rds.DatabaseCluster(this, 'ExampleCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_5,
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpc,
      },
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'example-cluster-credentials',
      }),
      defaultDatabaseName: 'clusterdb',
      deletionProtection: false, // For demo purposes only
      removalPolicy: this.node.tryGetContext('destroy') ? 
        require('aws-cdk-lib').RemovalPolicy.DESTROY : 
        require('aws-cdk-lib').RemovalPolicy.RETAIN,
    });

    // Allow CodeBuild to connect to Aurora Cluster
    cluster.connections.allowFrom(codeBuildSecurityGroup, ec2.Port.tcp(5432), 'Allow CodeBuild to connect to Aurora');

    // Create LiquibaseRDS construct for Aurora cluster
    new LiquibaseRDS(this, 'LiquibaseClusterMigration', {
      rdsDatabase: cluster,
      liquibaseCommands: ['validate'],
      changelogPath: path.resolve(__dirname, './changelogs'),
      dockerHubCredentialsArn: process.env.DOCKER_HUB_CREDENTIALS_ARN || 'arn:aws:secretsmanager:us-east-1:123456789012:secret:ecr-pullthroughcache/docker-hub-example',
      databaseName: 'clusterdb',
      vpc: vpc, // Required for clusters
      enableLogging: true,
      autoRun: true, // Automatically run Liquibase during CDK deployment
    });
  }
}

// Example app
const app = new App();
new LiquibaseRDSExampleStack(app, 'LiquibaseRDSExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
