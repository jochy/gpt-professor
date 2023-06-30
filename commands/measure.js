const { default: axios } = require('axios');
const fs = require('fs');
const pdf = require('pdf-parse');
var Promise = require("bluebird");

const MAX_CHUNK_SIZE = 50000;
const CONCURRENCY = 4;

async function measure(args, options, command) {
    // Extract content
    const content = (await _extractContent(args))
        .replaceAll("\n\n", "\n")
        .replaceAll("  ", " ");

    // Split the content into chunks
    let chunks = content.split("\n").flatMap(paragraph => _splitStringByWords(paragraph, MAX_CHUNK_SIZE));

    // Compute fake score for each chunk
    let chatGptSum = [];
    await Promise.map(chunks, async chunk => {
        const res = await axios.post('https://api.zerogpt.com/api/detect/detectText', {
            input_text: chunk
        }, {
            headers: {
                authority: 'api.zerogpt.com',
                origin: 'https://www.zerogpt.com',
                referer: 'https://www.zerogpt.com/',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        chatGptSum.push({
            words: parseInt(res.data.data.aiWords),
            score: Number(res.data.data.fakePercentage)
        });
    }, { concurrency: CONCURRENCY });

    // Now, compute fake score for the whole content
    let totalWords = chatGptSum.reduce((acc, curr) => acc + curr.words, 0);
    let totalFakeScore = chatGptSum.reduce((acc, curr) => acc + (curr.score * curr.words), 0) / totalWords;

    // Print result
    console.log(`${totalFakeScore.toFixed(2)}% AI for ${totalWords} detected words`);
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
    return fs.readFileSync(filepath);
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

module.exports = {
    measure
}