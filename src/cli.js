#!/usr/bin/env node
const yargs = require('yargs');

const middleware = [
];

// eslint-disable-next-line no-unused-expressions
yargs
  .middleware(middleware)
  .commandDir('./cmds')
  .demandCommand()
  .wrap(yargs.terminalWidth())
  .help()
  .argv;
