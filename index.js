const { program } = require('commander');
const { measure } = require('./commands/measure.js');

String.prototype.replaceAll = function (target, replacement) {
    return this.split(target).join(replacement);
};

String.prototype.trim = function () {
    return String(this).replace(/^\s+|\s+$/g, '');
};

program
    .command('measure')
    .description('Detect a % of use of chat gpt')
    .argument('<file>', 'File to analyze')
    .action(async (args, options, command) => await measure(args, options, command));

program.parse();