import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'AlexTech314',
  authorAddress: 'alest314@gmail.com',
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: 'LiquibaseRDS',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/alest314/LiquibaseRDS.git',

  description: 'A CDK construct for running Liquibase migrations against RDS instances using CodeBuild',
  keywords: ['aws', 'cdk', 'liquibase', 'rds', 'database', 'migration'],

  // Enable dry run mode - this will prevent actual publishing but keep the workflows
  publishDryRun: true,

  publishToPypi: {
    distName: 'liquibase-rds-cdk',
    module: 'liquibase_rds_cdk',
  },
});

project.synth();