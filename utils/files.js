const path = require('path');
const fs = require('fs');
const {minifyContent} = require('./minify');

async function getFiles(repo, included, excluded) {
    const {globby} = await import('globby')
    if (excluded == null) excluded = [];
    if (included == null) included = ['*'];

    const patterns = [...included, ...excluded.map(it => "!" + it)]
    return (await globby(patterns, {
        cwd: repo,
        caseSensitiveMatch: false,
    })).map(it => path.join(repo, it));
}

async function filepathToAiMessage(repo, filepath, minify) {
    return {
        role: "user",
        content: `Location: ${filepath.replaceAll(`${repo}${path.sep}`, "")}\nContent:\n${await sanitizeFile(filepath, minify)}`
    }
}

async function sanitizeFile(filepath, minify) {
    let value = fs.readFileSync(filepath, 'utf8').trim();

    if (minify) {
        value = await minifyContent(filepath, value);
    }

    return value;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
    readJson,
    sanitizeFile,
    filepathToAiMessage,
    getFiles,
}