const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Promise = require("bluebird");
const { scoreChunk: zerogpt } = require('./zerogpt');

const MAX_CHUNK_SIZE = 50000;
const MIN_CHUNK_SIZE = 1000;

const ENGINES = [{ name: 'ZEROGPT', scoreChunk: zerogpt },];

async function measure(args, options, command) {
    // Retrieve all files to analyse
    const files = _listFilesRecursively(args);

    // Analyse each file
    for (let file of files) {
        await _analyseFile(file, options);
    }
}

async function _analyseFile(file, options) {
    // Extract content
    const content = (await _extractContent(file))
        .replaceAll("\n\n", "\n")
        .replaceAll("  ", " ");

    // Split the content into chunks
    let chunks = _splitContentIntoChunks(content);

    // Compute fake score for each chunk
    let chunksScores = [];
    await Promise.map(chunks, async chunk => {
        // For each supported engine, compute fake score for the chunk
        for (let engine of ENGINES) {
            if (_isEngineSupported(options, engine)) {
                chunksScores.push(await engine.scoreChunk(chunk, options));
            }
        }
    }, { concurrency: options.concurrency });

    // Now, compute fake score for the whole content
    let totalWords = chunksScores.reduce((acc, curr) => acc + curr.words, 0);
    let totalFakeScore = totalWords > 0 ? chunksScores.reduce((acc, curr) => acc + (curr.score * curr.words), 0) / totalWords : 0;

    // Print result
    console.log(`${file} => ${totalFakeScore.toFixed(2)}% AI generated content for ${totalWords} detected words`);
}

function _isEngineSupported(options, engine) {
    return options.only === "" || options.only == null || options.only.includes(engine.name);
}

function _splitContentIntoChunks(content) {
    let tmpChunks = content.split("\n").flatMap(paragraph => _splitStringByWords(paragraph, MAX_CHUNK_SIZE));

    // Re-arrange chunks : make sure all chunks are between MIN_CHUNK_SIZE and MAX_CHUNK_SIZE
    let chunks = [];
    for (let i = 0; i < tmpChunks.length; i++) {
        // If chunk matches requirements
        if (tmpChunks[i].length >= MIN_CHUNK_SIZE && tmpChunks[i].length <= MAX_CHUNK_SIZE) {
            chunks.push(tmpChunks[i]);
        }
        // If chunk is too small, try to concatenate it with the next one
        else if (tmpChunks[i].length < MIN_CHUNK_SIZE) {
            if (i + 1 < tmpChunks.length) {
                tmpChunks[i + 1] = tmpChunks[i] + '\n ' + tmpChunks[i + 1];
            } else {
                // Can't do better: chunk is still too small :'(
                chunks.push(tmpChunks[i]);
            }
        }
        // If chunk is too big
        else if (tmpChunks[i].length > MAX_CHUNK_SIZE) {
            chunks.push(...[_splitStringByWords(tmpChunks[i], MAX_CHUNK_SIZE / (tmpChunks[i].length / MAX_CHUNK_SIZE))]);
        }
    }

    return chunks;
}

function _splitStringByWords(string, maxLength) {
    const words = string.split(' ');
    const result = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length + word.length <= maxLength) {
            currentLine += (currentLine.length > 0 ? ' ' : '') + word;
        } else {
            result.push(currentLine.trim());
            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        result.push(currentLine.trim());
    }

    return result;
}

async function _extractContent(filepath) {
    if (filepath.endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filepath);
        const data = await pdf(dataBuffer, { pagerender: _render_page });
        return data.text;
    }

    // TODO : handle other file types
    return fs.readFileSync(filepath, 'utf8');
}

function _render_page(pageData) {
    //check documents https://mozilla.github.io/pdf.js/
    let render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is `false`.
        disableCombineTextItems: false,
    }

    return pageData.getTextContent(render_options)
        .then(function (textContent) {
            let text = '';
            for (let item of textContent.items) {
                text += item.str + " ";
            }
            return text;
        });
}

function _listFilesRecursively(dir, checkIfRootIsDirectory = true) {
    if (checkIfRootIsDirectory && !fs.statSync(dir).isDirectory()) {
        return [dir];
    }

    const files = [];

    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            files.push(..._listFilesRecursively(filePath, false)); // Recursively call the function for subdirectories
        } else {
            files.push(filePath);
        }
    });

    return files;
}

module.exports = {
    measure
}