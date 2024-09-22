const fs = require('fs');
const OpenAI = require('openai/index');
const {zodResponseFormat} = require('openai/helpers/zod');
const {getFiles, filepathToAiMessage, sanitizeFile, readJson} = require('../../utils/files');
const {z} = require('zod');

async function autograde(options, command) {
    const {config, repo, output, minify, debug} = options;

    const settings = readJson(config);
    const filesToSend = await getFiles(repo, settings.files.include_patterns, settings.files.exclude_patterns);
    console.log("Will send files to AI: [" + filesToSend + "]");

    const autograde = await askAiToAutograde(settings, filesToSend, repo, minify, debug);
    if (output != null) {
        fs.writeFileSync(output, autograde);
    }

    console.log("\nResult:")
    console.log(autograde);
}

async function askAiToAutograde(settings, files, repo, minify, debug) {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
    });
    const messagesToSend = [
        {
            role: "system",
            content: `Criteria list to grade a project: ${JSON.stringify(settings.criteria)}. Each criteria has a name (the json key) and a condition. A criteria is met when the condition is TRUE. If the criteria's condition is met, then the status is PASS otherwise it is FAIL. If something is missing, then it is FAIL.`
        }
    ];

    const objResponse = {};
    for (let key of Object.keys(settings.criteria)) {
        objResponse[key] = z.object({
            status: z.enum(["PASS", "FAIL"]),
        });
    }

    for (let file of files) {
        messagesToSend.push(await filepathToAiMessage(repo, file, minify));
    }

    if (debug) {
        console.log("Messages to send:")
        console.log(messagesToSend.map(it => it.content).join("\n"))
    }

    const chatCompletion = await client.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: messagesToSend,
        temperature: 0.3,
        top_p: 0.2,
        response_format: zodResponseFormat(z.object(objResponse), "result"),
    });

    const response = chatCompletion.choices[0]?.message;

    if (debug) {
        console.log(response.parsed);
    }

    return JSON.stringify(response.parsed);
}

module.exports = {
    autograde
}
