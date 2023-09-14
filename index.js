#!/usr/bin/env node

const { program } = require('commander');
const { measure } = require('./commands/measure/measure.js');
const { autograde } = require('./commands/autograde/autograde.js');

require('dotenv').config();

program
    .version(require('./package.json').version)
    .command('measure-generated-content')
    .description('Detect a % of use of chat gpt')
    .argument('<file>', 'File or folder to analyse')
    .option('-c, --concurrency', 'Number of concurrent requests', 4)
    .option('-o, --only [STRING]', 'Only scan using the specified engine (currently, only ZEROGPT is supported). Separate by ,', '',)
    .action((args, options, command) => measure(args, options, command));

program
    .command('autograde')
    .description('Automatically grade a student code based on criteria')
    .requiredOption('-c, --config [STRING]', 'Path to the config file')
    .requiredOption('-r, --repo [STRING]', 'Path to the student code')
    .option('-o, --output [STRING]', 'Path to the output file, console if not set')
    .action((options, command) => autograde(options, command));

program.parse(process.argv);