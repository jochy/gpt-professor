const fs = require('fs');
const {getFiles, filepathToAiMessage, readJson} = require('../../utils/files');

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
    const Gemini = await import("gemini-ai");
    const gemini = new Gemini.default(process.env.GEMINI_API_KEY);
    const chat = gemini.createChat({
        temperature: 0.4,
        topP: 0.4,
    });
    await chat.ask(`This is a criteria list used to grade a project: ${JSON.stringify(settings.criteria)}. Each criteria has a name (the json key) and a condition (condition field). A criteria met when the condition is TRUE. Your answer should be only a JSON structure: { NAME: { "status": STATUS } }, where NAME is the criteria name and status is SUCCESS or FAIL. If the criteria's condition is met, then the status is SUCCESS otherwise the status if FAIL. If something is missing, consider the criteria's condition as FAIL. I'll submit all the files, and then, I'll ask you to grade the project.`)

    for (let file of files) {
        let msg = await filepathToAiMessage(repo, file, minify);
        await chat.ask(msg.content);
    }

    let response = await chat.ask("Can you autograde the project now ? No explanations, just the json.");

    if (debug) {
        console.log("Response from AI:");
        console.log(response);
    }

    return response;
}

module.exports = {
    autograde
}
