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

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();