const { program } = require('commander');
const { measure } = require('./commands/measure.js');

String.prototype.replaceAll = function (target, replacement) {
    return this.split(target).join(replacement);
};

String.prototype.trim = function () {
    return String(this).replace(/^\s+|\s+$/g, '');
};

program
    .command('measure-generated-content')
    .description('Detect a % of use of chat gpt')
    .argument('<file>', 'File or folder to analyse')
    .option('-c, --concurrency', 'Number of concurrent requests', 4)
    .action(async (args, options, command) => await measure(args, options, command));

program.parse();