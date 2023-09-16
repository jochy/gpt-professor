const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
const path = require('path');
const { minifyContent } = require('../../utils/minify');

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
        { role: "system", content: "You will be in charge to grade a student project based on some criteria (in csv format)." }
    ];

    for (let file of files) {
        messagesToSend.push(await filepathToAiMessage(repo, file, minify));
    }
    messagesToSend.push(askGradeMessage(settings, debug));
    if (debug) {
        console.log("Messages to send:")
        console.log(messagesToSend.map(it => it.content).join("\n"))
    }

    const chatCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messagesToSend,
    });

    const response = chatCompletion.data.choices[0].message.content;

    if (debug) {
        console.log("Response from AI:");
        console.log(response);
    }

    return response;
}

async function getFiles(repo, included, excluded) {
    const { globby } = await import('globby')
    if (excluded == null) excluded = [];
    if (included == null) included = ['*'];

    const patterns = [...included, ...excluded.map(it => "!" + it)]
    return (await globby(patterns, {
        cwd: repo
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

function askGradeMessage(settings, debug) {
    let criteriaTab = "id;criteria;points";
    for (let crit of Object.keys(settings.criteria)) {
        criteriaTab += `\n${crit};${settings.criteria[crit].prompt};${settings.criteria[crit].points}`;
    }

    if (debug) {
        console.log("Criteria tab:")
        console.log(criteriaTab);
    }

    return {
        role: "user",
        content: `Grade the project based on the following criteria csv table:\n${criteriaTab}\n\nOutput a json with this structure: { ID: { "status": STATUS, "points": POINTS } }, where ID is the id in the criteria tab, status is SUCCESS or FAIL and points is the number of points you give to this criteria (0 if criteria is not met)?`
    }
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
    autograde
}
