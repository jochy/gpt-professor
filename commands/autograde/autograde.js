const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
const {getFiles, filepathToAiMessage, sanitizeFile, readJson} = require('../../utils/files');

async function autograde(options, command) {
    const { config, repo, output, minify, debug } = options;

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
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,

    });
    const openai = new OpenAIApi(configuration, process.env.OPENAI_BASE_URL);
    const messagesToSend = [
        { role: "system", content: `This is a criteria list used to grade a project: ${JSON.stringify(settings.criteria)}. Each criteria has a name (the json key) and a condition (condition field). A criteria met when the condition is TRUE. Your answer should be only a JSON structure: { NAME: { "status": STATUS } }, where NAME is the criteria name and status is SUCCESS or FAIL. If the criteria's condition is met, then the status is SUCCESS otherwise the status if FAIL. If something is missing, consider the criteria's condition as FAIL.` }
    ];

    for (let file of files) {
        messagesToSend.push(await filepathToAiMessage(repo, file, minify));
    }

    if (debug) {
        console.log("Messages to send:")
        console.log(messagesToSend.map(it => it.content).join("\n"))
    }

    const chatCompletion = await openai.createChatCompletion({
        model: "gpt-4-0125-preview",
        messages: messagesToSend,
    });

    const response = chatCompletion.data.choices[0].message.content;

    if (debug) {
        console.log("Response from AI:");
        console.log(response);
    }

    return response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
}

module.exports = {
    autograde
}
