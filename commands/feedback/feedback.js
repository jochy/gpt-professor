const {readJson, getFiles, filepathToAiMessage} = require("../../utils/files");
const {Configuration, OpenAIApi} = require("openai");
const fs = require('fs');
const path = require('path');
const os = require('os');
const shell = require('shelljs');
const {v4: uuidv4} = require('uuid');
const {Octokit} = require("octokit");

async function feedback(options, command) {
    const {config, repo, minify, debug} = options;
    const pat = process.env.GIT_PAT;
    if (pat == null) {
        throw 'No GIT_PAT env var. GIT Personal Access Token is required';
    }

    const settings = readJson(config);
    let repoSettings = extractOwnerAndRepo(repo);

    const folderPath = path.join(os.tmpdir(), uuidv4());
    cloneRepo(folderPath, repo, pat, debug);

    const filesToSend = await getFiles(folderPath, settings.files.include_patterns, settings.files.exclude_patterns);
    if (debug) {
        console.log("Will send files to AI: [" + filesToSend + "]");
    }

    const feedback = await askAiToFeedback(settings, filesToSend, folderPath, minify, debug);

    if (debug) {
        console.log("\nFeedback:")
        console.log(feedback);
    }

    // Creating a github issue
    const octokit = new Octokit({
        auth: pat,
    });

    await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: repoSettings.owner,
        repo: repoSettings.repo,
        title: '[Feedback] Automatic feedback from gpt-professor',
        body: `
This is an automatic feedback, created with [gpt-professor](https://github.com/jochy/gpt-professor), powered by ChatGPT-4.
---
${feedback}
---
If any questions, please add a comment and tag your teacher, otherwise, you can close this issue.
---
If you found it useful, please add a star on [gpt-professor](https://github.com/jochy/gpt-professor)
*ChatGPT can make mistakes*`,
        assignees: [],
        labels: ['feedback'],
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    console.log("Feedback issue created");
}

async function askAiToFeedback(settings, files, repo, minify, debug) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,

    });
    const openai = new OpenAIApi(configuration, process.env.OPENAI_BASE_URL);
    const messagesToSend = [
        {
            role: "system",
            content: `This is a criteria list used to grade a project: ${JSON.stringify(settings.criteria)}. Each criteria has a name (name field) and a condition (condition field). A criteria is met when the condition is TRUE. I'll send you all the relevant files to grade this project. Can you provide a feedback of this project, regarding the criteria table (without printing the condition)?`
        }
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

    return response;
}

function repoUrlWithPAT(repo, pat) {
    if (repo.includes("git@")) {
        // replace to https
        repo = repo.replace(":", "/").replace("git@", "https://")
    }
    if (!repo.includes(".git")) {
        repo = repo + ".git";
    }
    // Append PAT
    return repo.replace("https://", `https://${pat}@`);
}

function extractOwnerAndRepo(url) {
    let owner, repoName;

    const regex = /(?:https:\/\/.*\.com\/|git@.*:)([^/]+)\/([^/]+)(?:\.git)?/;

    const match = url.match(regex);

    if (match) {
        owner = match[1];
        repoName = match[2].replace(".git", "");
    } else {
        throw "Invalid address";
    }

    return {owner: owner, repo: repoName};
}

function cloneRepo(folderPath, repo, pat, debug) {
    shell.exec(`mkdir -p ${folderPath}`);
    shell.cd(folderPath);
    shell.exec(`git clone ${repoUrlWithPAT(repo, pat)} .`);
    if (debug) {
        console.log("Repository cloned in " + folderPath);
    }
}

module.exports = {
    feedback
}
