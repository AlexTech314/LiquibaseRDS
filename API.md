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
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.databaseName">databaseName</a></code> | <code>string</code> | Database name to connect to. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.liquibaseCommands">liquibaseCommands</a></code> | <code>string[]</code> | The Liquibase command to execute. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.rdsDatabase">rdsDatabase</a></code> | <code>aws-cdk-lib.aws_rds.DatabaseInstance \| aws-cdk-lib.aws_rds.DatabaseCluster</code> | The RDS instance to run Liquibase against. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.additionalArgs">additionalArgs</a></code> | <code>string[]</code> | Additional Liquibase command line arguments. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.autoRun">autoRun</a></code> | <code>boolean</code> | Whether to automatically run Liquibase during CDK deployment. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.dockerHubCredentialsArn">dockerHubCredentialsArn</a></code> | <code>string</code> | Credentials ARN for Docker Hub authentication (required for pull-through cache). |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.enableLogging">enableLogging</a></code> | <code>boolean</code> | Whether to enable CloudWatch Logs for the CodeBuild project. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.environmentVariables">environmentVariables</a></code> | <code>{[ key: string ]: aws-cdk-lib.aws_codebuild.BuildEnvironmentVariable}</code> | Environment variables to pass to the Liquibase container. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Log retention period for CloudWatch Logs. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | Timeout for the CodeBuild project execution. |
| <code><a href="#LiquibaseRDS.LiquibaseRDSProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | VPC to connect to - required if using a cluster. |

---

##### `changelogPath`<sup>Required</sup> <a name="changelogPath" id="LiquibaseRDS.LiquibaseRDSProps.property.changelogPath"></a>

```typescript
public readonly changelogPath: string;
```

- *Type:* string

Path to the directory containing Liquibase changelog files.

This directory will be uploaded to S3 and made available to the CodeBuild project.

---

##### `databaseName`<sup>Required</sup> <a name="databaseName" id="LiquibaseRDS.LiquibaseRDSProps.property.databaseName"></a>

```typescript
public readonly databaseName: string;
```

- *Type:* string
- *Default:* Uses the default database name from the RDS instance

Database name to connect to.

---

##### `liquibaseCommands`<sup>Required</sup> <a name="liquibaseCommands" id="LiquibaseRDS.LiquibaseRDSProps.property.liquibaseCommands"></a>

```typescript
public readonly liquibaseCommands: string[];
```

- *Type:* string[]

The Liquibase command to execute.

Example: "update", "rollback", "validate", etc.

---

##### `rdsDatabase`<sup>Required</sup> <a name="rdsDatabase" id="LiquibaseRDS.LiquibaseRDSProps.property.rdsDatabase"></a>

```typescript
public readonly rdsDatabase: DatabaseInstance | DatabaseCluster;
```

- *Type:* aws-cdk-lib.aws_rds.DatabaseInstance | aws-cdk-lib.aws_rds.DatabaseCluster

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

##### `autoRun`<sup>Optional</sup> <a name="autoRun" id="LiquibaseRDS.LiquibaseRDSProps.property.autoRun"></a>

```typescript
public readonly autoRun: boolean;
```

- *Type:* boolean
- *Default:* true

Whether to automatically run Liquibase during CDK deployment.

If enabled, the Liquibase commands will be executed every time the stack is deployed.

---

##### `dockerHubCredentialsArn`<sup>Optional</sup> <a name="dockerHubCredentialsArn" id="LiquibaseRDS.LiquibaseRDSProps.property.dockerHubCredentialsArn"></a>

```typescript
public readonly dockerHubCredentialsArn: string;
```

- *Type:* string

Credentials ARN for Docker Hub authentication (required for pull-through cache).

Should be a Secrets Manager secret with JSON format:
{
  "username": "your-docker-hub-username",
  "password": "your-docker-hub-password-or-token"
}

To create this secret:
aws secretsmanager create-secret \
  --name "ecr-pullthroughcache/docker-hub" \
  --description "Docker Hub credentials for ECR pull-through cache" \
  --secret-string '{"username":"your-username","password":"your-password"}'

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

##### `logRetention`<sup>Optional</sup> <a name="logRetention" id="LiquibaseRDS.LiquibaseRDSProps.property.logRetention"></a>

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.ONE_WEEK

Log retention period for CloudWatch Logs.

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
- *Default:* Uses the VPC from the RDS instance

VPC to connect to - required if using a cluster.

---



