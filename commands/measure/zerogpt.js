const { default: axios } = require('axios');

async function scoreChunk(chunk) {
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

    return {
        words: parseInt(res.data.data.textWords),
        aiWords: parseInt(res.data.data.aiWords),
        score: Number(res.data.data.fakePercentage)
    };
}

module.exports = {
    scoreChunk
};
