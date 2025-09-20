# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### LiquibaseRDS <a name="LiquibaseRDS" id="LiquibaseRDS.LiquibaseRDS"></a>

A CDK construct that creates a CodeBuild project to run Liquibase migrations against an RDS instance or cluster.

#### Initializers <a name="Initializers" id="LiquibaseRDS.LiquibaseRDS.Initializer"></a>

```typescript
import { LiquibaseRDS } from 'LiquibaseRDS'

new LiquibaseRDS(scope: Construct, id: string, props: LiquibaseRDSProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.Initializer.parameter.props">props</a></code> | <code><a href="#LiquibaseRDS.LiquibaseRDSProps">LiquibaseRDSProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="LiquibaseRDS.LiquibaseRDS.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="LiquibaseRDS.LiquibaseRDS.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="LiquibaseRDS.LiquibaseRDS.Initializer.parameter.props"></a>

- *Type:* <a href="#LiquibaseRDS.LiquibaseRDSProps">LiquibaseRDSProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.startExecution">startExecution</a></code> | Start the CodeBuild execution. |

---

##### `toString` <a name="toString" id="LiquibaseRDS.LiquibaseRDS.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `startExecution` <a name="startExecution" id="LiquibaseRDS.LiquibaseRDS.startExecution"></a>

```typescript
public startExecution(): Project
```

Start the CodeBuild execution.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="LiquibaseRDS.LiquibaseRDS.isConstruct"></a>

```typescript
import { LiquibaseRDS } from 'LiquibaseRDS'

LiquibaseRDS.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="LiquibaseRDS.LiquibaseRDS.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.changelogBucket">changelogBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | The S3 bucket containing the changelog files. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.codeBuildProject">codeBuildProject</a></code> | <code>aws-cdk-lib.aws_codebuild.Project</code> | The CodeBuild project that runs Liquibase. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.codeBuildRole">codeBuildRole</a></code> | <code>aws-cdk-lib.aws_iam.Role</code> | The IAM role used by the CodeBuild project. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.LogGroup</code> | CloudWatch Log Group for the CodeBuild project. |
| <code><a href="#LiquibaseRDS.LiquibaseRDS.property.pullThroughCacheRule">pullThroughCacheRule</a></code> | <code>aws-cdk-lib.CfnResource</code> | ECR pull-through cache rule (if enabled). |

---

##### `node`<sup>Required</sup> <a name="node" id="LiquibaseRDS.LiquibaseRDS.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `changelogBucket`<sup>Required</sup> <a name="changelogBucket" id="LiquibaseRDS.LiquibaseRDS.property.changelogBucket"></a>

```typescript
public readonly changelogBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

The S3 bucket containing the changelog files.

---

##### `codeBuildProject`<sup>Required</sup> <a name="codeBuildProject" id="LiquibaseRDS.LiquibaseRDS.property.codeBuildProject"></a>

```typescript
public readonly codeBuildProject: Project;
```

- *Type:* aws-cdk-lib.aws_codebuild.Project

The CodeBuild project that runs Liquibase.

---

##### `codeBuildRole`<sup>Required</sup> <a name="codeBuildRole" id="LiquibaseRDS.LiquibaseRDS.property.codeBuildRole"></a>

```typescript
public readonly codeBuildRole: Role;
```

- *Type:* aws-cdk-lib.aws_iam.Role

The IAM role used by the CodeBuild project.

---

##### `logGroup`<sup>Optional</sup> <a name="logGroup" id="LiquibaseRDS.LiquibaseRDS.property.logGroup"></a>

```typescript
public readonly logGroup: LogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.LogGroup

CloudWatch Log Group for the CodeBuild project.

---

##### `pullThroughCacheRule`<sup>Optional</sup> <a name="pullThroughCacheRule" id="LiquibaseRDS.LiquibaseRDS.property.pullThroughCacheRule"></a>

```typescript
public readonly pullThroughCacheRule: CfnResource;
```

- *Type:* aws-cdk-lib.CfnResource

ECR pull-through cache rule (if enabled).

---


## Structs <a name="Structs" id="Structs"></a>

### LiquibaseRDSProps <a name="LiquibaseRDSProps" id="LiquibaseRDS.LiquibaseRDSProps"></a>

Properties for the LiquibaseRDS construct.

#### Initializer <a name="Initializer" id="LiquibaseRDS.LiquibaseRDSProps.Initializer"></a>

```typescript
import { LiquibaseRDSProps } from 'LiquibaseRDS'

const liquibaseRDSProps: LiquibaseRDSProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.changelogPath">changelogPath</a></code> | <code>string</code> | Path to the directory containing Liquibase changelog files. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.liquibaseCommand">liquibaseCommand</a></code> | <code>string</code> | The Liquibase command to execute. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.rdsInstance">rdsInstance</a></code> | <code>aws-cdk-lib.aws_rds.IDatabaseInstance \| aws-cdk-lib.aws_rds.IDatabaseCluster</code> | The RDS instance to run Liquibase against. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.additionalArgs">additionalArgs</a></code> | <code>string[]</code> | Additional Liquibase command line arguments. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.databaseName">databaseName</a></code> | <code>string</code> | Database name to connect to. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.databasePassword">databasePassword</a></code> | <code>string</code> | Database password for Liquibase connection. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.databasePort">databasePort</a></code> | <code>number</code> | Database port to connect to. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.databaseUsername">databaseUsername</a></code> | <code>string</code> | Database username for Liquibase connection. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.dockerHubCredentialsArn">dockerHubCredentialsArn</a></code> | <code>string</code> | Credentials ARN for Docker Hub authentication (if required). |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.ecrRepositoryPrefix">ecrRepositoryPrefix</a></code> | <code>string</code> | ECR repository prefix for the pull-through cache. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.enableEcrPullThroughCache">enableEcrPullThroughCache</a></code> | <code>boolean</code> | Enable ECR pull-through cache for the Liquibase Docker image. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.enableLogging">enableLogging</a></code> | <code>boolean</code> | Whether to enable CloudWatch Logs for the CodeBuild project. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.environmentVariables">environmentVariables</a></code> | <code>{[ key: string ]: aws-cdk-lib.aws_codebuild.BuildEnvironmentVariable}</code> | Environment variables to pass to the Liquibase container. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.liquibaseImage">liquibaseImage</a></code> | <code>string</code> | Liquibase Docker image to use. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Log retention period for CloudWatch Logs. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.securityGroups">securityGroups</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup[]</code> | Security groups to attach to the CodeBuild project. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.subnets">subnets</a></code> | <code>aws-cdk-lib.aws_ec2.SubnetSelection</code> | Subnets where the CodeBuild project should run. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Timeout for the CodeBuild project execution. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | VPC where the CodeBuild project should run. |

---

##### `changelogPath`<sup>Required</sup> <a name="changelogPath" id="LiquibaseRDS.LiquibaseRDSProps.property.changelogPath"></a>

```typescript
public readonly changelogPath: string;
```

- *Type:* string

Path to the directory containing Liquibase changelog files.

This directory will be uploaded to S3 and made available to the CodeBuild project.

---

##### `liquibaseCommand`<sup>Required</sup> <a name="liquibaseCommand" id="LiquibaseRDS.LiquibaseRDSProps.property.liquibaseCommand"></a>

```typescript
public readonly liquibaseCommand: string;
```

- *Type:* string

The Liquibase command to execute.

Example: "update", "rollback", "validate", etc.

---

##### `rdsInstance`<sup>Required</sup> <a name="rdsInstance" id="LiquibaseRDS.LiquibaseRDSProps.property.rdsInstance"></a>

```typescript
public readonly rdsInstance: IDatabaseInstance | IDatabaseCluster;
```

- *Type:* aws-cdk-lib.aws_rds.IDatabaseInstance | aws-cdk-lib.aws_rds.IDatabaseCluster

The RDS instance to run Liquibase against.

Can be either an RDS Instance or RDS Cluster.

---

##### `additionalArgs`<sup>Optional</sup> <a name="additionalArgs" id="LiquibaseRDS.LiquibaseRDSProps.property.additionalArgs"></a>

```typescript
public readonly additionalArgs: string[];
```

- *Type:* string[]
- *Default:* []

Additional Liquibase command line arguments.

---

##### `databaseName`<sup>Optional</sup> <a name="databaseName" id="LiquibaseRDS.LiquibaseRDSProps.property.databaseName"></a>

```typescript
public readonly databaseName: string;
```

- *Type:* string
- *Default:* Uses the default database for the RDS instance

Database name to connect to.

---

##### `databasePassword`<sup>Optional</sup> <a name="databasePassword" id="LiquibaseRDS.LiquibaseRDSProps.property.databasePassword"></a>

```typescript
public readonly databasePassword: string;
```

- *Type:* string

Database password for Liquibase connection.

This should be stored in AWS Secrets Manager or Systems Manager Parameter Store.
Provide the ARN or parameter name.

---

##### `databasePort`<sup>Optional</sup> <a name="databasePort" id="LiquibaseRDS.LiquibaseRDSProps.property.databasePort"></a>

```typescript
public readonly databasePort: number;
```

- *Type:* number
- *Default:* Uses the port from the RDS instance (5432 for PostgreSQL, 3306 for MySQL)

Database port to connect to.

---

##### `databaseUsername`<sup>Optional</sup> <a name="databaseUsername" id="LiquibaseRDS.LiquibaseRDSProps.property.databaseUsername"></a>

```typescript
public readonly databaseUsername: string;
```

- *Type:* string
- *Default:* 'admin'

Database username for Liquibase connection.

---

##### `dockerHubCredentialsArn`<sup>Optional</sup> <a name="dockerHubCredentialsArn" id="LiquibaseRDS.LiquibaseRDSProps.property.dockerHubCredentialsArn"></a>

```typescript
public readonly dockerHubCredentialsArn: string;
```

- *Type:* string

Credentials ARN for Docker Hub authentication (if required).

Should be a Secrets Manager secret with ecr-pullthroughcache/ prefix.

---

##### `ecrRepositoryPrefix`<sup>Optional</sup> <a name="ecrRepositoryPrefix" id="LiquibaseRDS.LiquibaseRDSProps.property.ecrRepositoryPrefix"></a>

```typescript
public readonly ecrRepositoryPrefix: string;
```

- *Type:* string
- *Default:* 'docker-hub'

ECR repository prefix for the pull-through cache.

---

##### `enableEcrPullThroughCache`<sup>Optional</sup> <a name="enableEcrPullThroughCache" id="LiquibaseRDS.LiquibaseRDSProps.property.enableEcrPullThroughCache"></a>

```typescript
public readonly enableEcrPullThroughCache: boolean;
```

- *Type:* boolean
- *Default:* true

Enable ECR pull-through cache for the Liquibase Docker image.

This will create a pull-through cache rule for Docker Hub and use
the cached image from your private ECR registry.

---

##### `enableLogging`<sup>Optional</sup> <a name="enableLogging" id="LiquibaseRDS.LiquibaseRDSProps.property.enableLogging"></a>

```typescript
public readonly enableLogging: boolean;
```

- *Type:* boolean
- *Default:* true

Whether to enable CloudWatch Logs for the CodeBuild project.

---

##### `environmentVariables`<sup>Optional</sup> <a name="environmentVariables" id="LiquibaseRDS.LiquibaseRDSProps.property.environmentVariables"></a>

```typescript
public readonly environmentVariables: {[ key: string ]: BuildEnvironmentVariable};
```

- *Type:* {[ key: string ]: aws-cdk-lib.aws_codebuild.BuildEnvironmentVariable}
- *Default:* {}

Environment variables to pass to the Liquibase container.

---

##### `liquibaseImage`<sup>Optional</sup> <a name="liquibaseImage" id="LiquibaseRDS.LiquibaseRDSProps.property.liquibaseImage"></a>

```typescript
public readonly liquibaseImage: string;
```

- *Type:* string
- *Default:* 'liquibase/liquibase:latest'

Liquibase Docker image to use.

---

##### `logRetention`<sup>Optional</sup> <a name="logRetention" id="LiquibaseRDS.LiquibaseRDSProps.property.logRetention"></a>

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.ONE_WEEK

Log retention period for CloudWatch Logs.

---

##### `securityGroups`<sup>Optional</sup> <a name="securityGroups" id="LiquibaseRDS.LiquibaseRDSProps.property.securityGroups"></a>

```typescript
public readonly securityGroups: ISecurityGroup[];
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup[]

Security groups to attach to the CodeBuild project.

Should allow access to the RDS instance.

---

##### `subnets`<sup>Optional</sup> <a name="subnets" id="LiquibaseRDS.LiquibaseRDSProps.property.subnets"></a>

```typescript
public readonly subnets: SubnetSelection;
```

- *Type:* aws-cdk-lib.aws_ec2.SubnetSelection

Subnets where the CodeBuild project should run.

Should be private subnets with access to the RDS instance.

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="LiquibaseRDS.LiquibaseRDSProps.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.hours(1)

Timeout for the CodeBuild project execution.

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="LiquibaseRDS.LiquibaseRDSProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc

VPC where the CodeBuild project should run.

Must be the same VPC as the RDS instance for private connectivity.

---



