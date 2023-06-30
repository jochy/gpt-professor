const { default: axios } = require('axios');

async function scoreChunk(chunk) {
    const res = await axios.post('https://api.openai.com/v1/completions', {
        prompt: `${chunk}\n<|disc_score|>`,
        max_tokens: 1,
        temperature: 1,
        top_p: 1,
        n: 1,
        logprobs: 5,
        stop: "\n",
        stream: false,
        model: "model-detect-v2"
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return {
        words: chunk.split(' ').length,
        score:  (1 - _extractScore(res)) * 100
    };
}

function _extractScore(res) {
    try {
        return Math.exp(res.data.choices[0].logprobs.top_logprobs[0]['!']);
    } catch (e) {
        return 0;
    }
}

module.exports = {
    scoreChunk
}