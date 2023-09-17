const fs = require('fs');
const path = require('path');
const { minifyContent } = require('../../utils/minify');
const { v4: uuidv4 } = require('uuid');

async function bardAutograde(options, command) {
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
    const { Bard } = await import("googlebard");

    let myBard = new Bard(`__Secure-1PSID=${process.env.BARD_API_KEY}`);

    const conversationId = uuidv4();

    // First, submit files
    await myBard.ask("I will send you project files, then I will ask you to grade them according to some criteria. Say nothing until I ask you to grade it.", conversationId)
    for (let file of files) {
        const content = await filepathToAiMessage(repo, file, minify);
        let resp = await myBard.ask(content, conversationId);
        if (debug) {
            console.log("Sent message: " + content);
            console.log("Response from AI:" + resp);
        }
    }
    
    // Ask to autograde
    const response = await myBard.ask(askGradeMessage(settings, debug), conversationId);

    if (debug) {
        console.log("Response from AI:");
        console.log(response);
    }

    let json = response.substring(response.indexOf("{"), response.lastIndexOf("}") + 1);
    return json;
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
    return `File location: ${filepath.replaceAll(`${repo}${path.sep}`, "")}\nContent:\n${await sanitizeFile(filepath, minify)}\n\nSay nothing and keep this one for later.`;
}

async function sanitizeFile(filepath, minify) {
    let value = fs.readFileSync(filepath, 'utf8').trim();

    if (minify) {
        value = await minifyContent(filepath, value);
    }

    return value;
}

function askGradeMessage(settings, debug) {
    let criteriaTab = JSON.stringify(settings.criteria);

    if (debug) {
        console.log("Criteria tab: " + criteriaTab);
    }

    return `Grade this project based on the criteria conditions table:\n${criteriaTab}.\n\nYour answer will be ONLY a valid JSON using this schema: { NAME: { "status": STATUS } }, where NAME is the criteria name and status is PASS if the condition is met, FAIL otherwise.`;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
    bardAutograde
}
