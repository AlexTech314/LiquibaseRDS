# LiquibaseRDS

A CDK construct for running Liquibase migrations against Amazon RDS instances and clusters using AWS CodeBuild.

## Features

- ✅ **Universal RDS Support**: Works with any RDS instance or Aurora cluster
- ✅ **Flexible Commands**: Execute any Liquibase command (update, rollback, validate, etc.)
- ✅ **Secure**: Uses IAM roles and VPC security groups for secure database access
- ✅ **Configurable**: Customizable Docker images, timeouts, and environment variables
- ✅ **Monitored**: Built-in CloudWatch logging with configurable retention
- ✅ **Multi-language**: Available in TypeScript, Python, Java, and C#

## Quick Start

### Installation

> **Note**: This construct is currently in development. Publishing to package managers is disabled until the first stable release.

For now, you can use this construct by:

1. Cloning the repository
2. Building locally with `npm run build`
3. Installing as a local dependency

```bash
git clone https://github.com/alest314/LiquibaseRDS.git
cd LiquibaseRDS
npm install
npm run build
```

Then in your CDK project:
```bash
npm install /path/to/LiquibaseRDS
```

### Basic Usage

```typescript
import { LiquibaseRDS } from 'LiquibaseRDS';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// Assume you have an existing RDS instance and VPC
declare const database: rds.DatabaseInstance;
declare const vpc: ec2.Vpc;

new LiquibaseRDS(this, 'MyLiquibaseMigration', {
  rdsInstance: database,
  liquibaseCommand: 'update',
  changelogPath: './database/changelogs',
  databaseUsername: 'admin',
  databasePassword: database.secret?.secretArn,
  vpc,
});
```

## Architecture

The construct creates:

1. **CodeBuild Project**: Runs Liquibase commands using the official Docker image
2. **IAM Role**: Provides necessary permissions for RDS access and S3 operations
3. **S3 Assets**: Uploads your changelog files to S3 for CodeBuild access
4. **CloudWatch Logs**: Captures execution logs (optional)
5. **Security Groups**: Manages network access between CodeBuild and RDS

## Configuration Options

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `rdsInstance` | `rds.IDatabaseInstance \| rds.IDatabaseCluster` | The RDS instance or cluster to run migrations against |
| `liquibaseCommand` | `string` | The Liquibase command to execute (e.g., 'update', 'rollback') |
| `changelogPath` | `string` | Local path to the directory containing changelog files |

### Optional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `databaseUsername` | `string` | `'admin'` | Database username for connection |
| `databasePassword` | `string` | - | Database password (ARN for Secrets Manager) |
| `databaseName` | `string` | - | Specific database name to connect to |
| `databasePort` | `number` | `5432` | Database port number |
| `vpc` | `ec2.IVpc` | - | VPC for CodeBuild execution |
| `subnets` | `ec2.SubnetSelection` | - | Subnets for CodeBuild |
| `securityGroups` | `ec2.ISecurityGroup[]` | - | Security groups for CodeBuild |
| `liquibaseImage` | `string` | `'liquibase/liquibase:latest'` | Docker image to use |
| `additionalArgs` | `string[]` | `[]` | Additional Liquibase arguments |
| `environmentVariables` | `object` | `{}` | Custom environment variables |
| `timeout` | `Duration` | `Duration.hours(1)` | CodeBuild timeout |
| `enableLogging` | `boolean` | `true` | Enable CloudWatch logging |
| `logRetention` | `RetentionDays` | `ONE_WEEK` | Log retention period |

## Examples

### PostgreSQL with Secrets Manager

```typescript
import { LiquibaseRDS } from 'LiquibaseRDS';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Duration } from 'aws-cdk-lib';

// Create RDS instance with Secrets Manager
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_13_13,
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  vpc,
  credentials: rds.Credentials.fromGeneratedSecret('admin'),
  databaseName: 'myapp',
});

// Run Liquibase migrations
new LiquibaseRDS(this, 'DatabaseMigration', {
  rdsInstance: database,
  liquibaseCommand: 'update',
  changelogPath: './database/migrations',
  databaseUsername: 'admin',
  databasePassword: database.secret?.secretArn,
  databaseName: 'myapp',
  databasePort: 5432,
  vpc,
  subnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
  timeout: Duration.minutes(30),
  additionalArgs: ['--log-level=INFO'],
});
```

### Aurora Cluster with Custom Configuration

```typescript
// Aurora PostgreSQL cluster
const cluster = new rds.DatabaseCluster(this, 'Cluster', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_13_7,
  }),
  instanceProps: {
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    vpc,
  },
  credentials: rds.Credentials.fromGeneratedSecret('admin'),
});

// Validation run with custom Liquibase version
new LiquibaseRDS(this, 'DatabaseValidation', {
  rdsInstance: cluster,
  liquibaseCommand: 'validate',
  changelogPath: './database/changelogs',
  databaseUsername: 'admin',
  databasePassword: cluster.secret?.secretArn,
  vpc,
  liquibaseImage: 'liquibase/liquibase:4.24',
  environmentVariables: {
    LIQUIBASE_HUB_MODE: { value: 'off' },
    JAVA_OPTS: { value: '-Xmx1g' },
  },
  enableLogging: true,
});
```

### MySQL with Rollback

```typescript
const mysqlDb = new rds.DatabaseInstance(this, 'MySQLDB', {
  engine: rds.DatabaseInstanceEngine.mysql({
    version: rds.MysqlEngineVersion.VER_8_0,
  }),
  // ... other configuration
});

new LiquibaseRDS(this, 'DatabaseRollback', {
  rdsInstance: mysqlDb,
  liquibaseCommand: 'rollback-count',
  changelogPath: './database/changelogs',
  databasePort: 3306,
  additionalArgs: ['1'], // Rollback 1 changeset
  // ... other configuration
});
```

## Changelog Structure

Your changelog directory should contain Liquibase changelog files. Here's an example structure:

```
changelogs/
├── changelog.xml                 # Master changelog
├── 001-create-users-table.xml
├── 002-create-posts-table.xml
└── 003-add-foreign-keys.xml
```

Example master changelog (`changelog.xml`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                        http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.0.xsd">

    <include file="001-create-users-table.xml" relativeToChangelogFile="true"/>
    <include file="002-create-posts-table.xml" relativeToChangelogFile="true"/>
    <include file="003-add-foreign-keys.xml" relativeToChangelogFile="true"/>

</databaseChangeLog>
```

## Security Considerations

### Database Credentials

- **Recommended**: Use AWS Secrets Manager to store database credentials
- Pass the secret ARN to the `databasePassword` property
- The construct automatically grants the CodeBuild role permission to read the secret

```typescript
// Using Secrets Manager
databasePassword: database.secret?.secretArn,
```

### Network Security

- Deploy CodeBuild in private subnets with NAT Gateway access
- Use security groups to restrict database access
- The construct automatically creates security group rules for RDS connectivity

```typescript
// Create security group for CodeBuild
const codeBuildSG = new ec2.SecurityGroup(this, 'CodeBuildSG', { vpc });

// Allow CodeBuild to connect to RDS
database.connections.allowFrom(codeBuildSG, ec2.Port.tcp(5432));

new LiquibaseRDS(this, 'Migration', {
  // ... other props
  securityGroups: [codeBuildSG],
  subnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
});
```

## Monitoring and Logging

The construct provides built-in CloudWatch integration:

- **Execution Logs**: All Liquibase output is captured in CloudWatch Logs
- **Build Status**: Monitor CodeBuild execution status
- **Custom Metrics**: Add custom CloudWatch metrics as needed

```typescript
new LiquibaseRDS(this, 'Migration', {
  // ... other props
  enableLogging: true,
  logRetention: logs.RetentionDays.ONE_MONTH,
});
```

## Common Liquibase Commands

| Command | Description |
|---------|-------------|
| `update` | Apply all pending changesets |
| `validate` | Validate changelog syntax |
| `status` | Show pending changesets |
| `rollback-count` | Rollback specified number of changesets |
| `rollback-to-tag` | Rollback to a specific tag |
| `generate-changelog` | Generate changelog from existing database |

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Ensure CodeBuild can reach RDS through security groups and NACLs
2. **Permission Denied**: Verify IAM roles have necessary RDS and S3 permissions
3. **Changelog Not Found**: Check that changelog files are in the specified path
4. **Database Connection**: Verify database credentials and endpoint configuration

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
new LiquibaseRDS(this, 'Migration', {
  // ... other props
  additionalArgs: ['--log-level=DEBUG'],
  environmentVariables: {
    LIQUIBASE_LOG_LEVEL: { value: 'DEBUG' },
  },
});
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/alest314/LiquibaseRDS)
- 🐛 [Issue Tracker](https://github.com/alest314/LiquibaseRDS/issues)
- 💬 [Discussions](https://github.com/alest314/LiquibaseRDS/discussions)

---

Made with ❤️ by [AlexTech314](https://github.com/alest314)