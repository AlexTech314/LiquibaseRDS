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

  // Add dependencies
  deps: [
    'token-injectable-docker-builder@^1.5.19',
  ],

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

    // Ignore built JS files in lambda provider but keep source files
    'src/codebuild-lambda-provider/*.js',
    'src/codebuild-lambda-provider/*.d.ts',
    'src/codebuild-lambda-provider/node_modules',
  ],

  // Exclude codebuild-lambda-provider from main TypeScript compilation
  // It has its own build process inside Docker
  tsconfig: {
    exclude: [
      'src/codebuild-lambda-provider/**/*',
      'node_modules',
      'lib',
      '*.d.ts',
    ],
  },
});

// Ensure the lambda provider's tsconfig.json is not gitignored
// This must come after the default rules to override the general tsconfig.json ignore
project.gitignore.addPatterns('!src/codebuild-lambda-provider/tsconfig.json');

project.synth();