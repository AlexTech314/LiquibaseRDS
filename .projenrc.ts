import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'AlexTech314',
  authorAddress: 'alest314@gmail.com',
  cdkVersion: '2.217.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '^5.9.6',
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

  // Configure ESLint to ignore codebuild-lambda-provider
  eslintOptions: {
    dirs: ['src', 'test', 'projenrc'],
    ignorePatterns: [
      'src/codebuild-lambda-provider/**/*',
    ],
  },

  // Add .env files to gitignore
  gitignore: [
    '.env',
    '.env.*',
    'cdk.out',
  ],

  // Exclude codebuild-lambda-provider from main TypeScript compilation
  // It has its own build process inside Docker
  tsconfig: {
    exclude: [
      'src/codebuild-lambda-provider/**/*',
    ],
  },
});

// Ensure the lambda provider's tsconfig.json is not gitignored
// This must come after the default rules to override the general tsconfig.json ignore
project.gitignore.addPatterns('!src/codebuild-lambda-provider/index.js');

project.synth();