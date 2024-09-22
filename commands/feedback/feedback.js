const {readJson, getFiles, filepathToAiMessage} = require("../../utils/files");
const OpenAI = require('openai/index');
const path = require('path');
const os = require('os');
const shell = require('shelljs');
const {v4: uuidv4} = require('uuid');
const {Octokit} = require("octokit");
const {z} = require("zod");
const {zodResponseFormat} = require("openai/helpers/zod");

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

    let feedbackFormated = `
This is an automatic feedback, created with [gpt-professor](https://github.com/jochy/gpt-professor), powered by ChatGPT-4.

---

${formatFeedback(feedback, settings.criteria)}

---

If any questions, please add a comment and tag your teacher, otherwise, you can close this issue.

---

If you found it useful, please add a star on [gpt-professor](https://github.com/jochy/gpt-professor)
*ChatGPT can make mistakes*`;

    // Creating a github issue
    const octokit = new Octokit({
        auth: pat,
    });

    await octokit.request('POST /repos/{owner}/{repo}/issues', {
        owner: repoSettings.owner,
        repo: repoSettings.repo,
        title: '[Feedback] Feedback from gpt-professor',
        body: feedbackFormated,
        assignees: [],
        labels: ['feedback'],
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    console.log("Feedback issue created");
}

async function askAiToFeedback(settings, files, repo, minify, debug) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
    });
    const messagesToSend = [
        {
            role: "system",
            content: `Criteria list used to grade a project: ${JSON.stringify(settings.criteria)}. Each criteria has a name and a condition. A criteria is met when the condition is TRUE, otherwise it is not: there is no in between. Provide a feedback of this project, regarding the criteria table and give a small explanation for each criteria.`
        }
    ];

    const objResponse = {};
    for (let key of Object.keys(settings.criteria)) {
        objResponse[key] = z.object({
            status: z.enum(["PASS", "FAIL"]),
            explanation: z.string(),
        });
    }

    for (let file of files) {
        messagesToSend.push(await filepathToAiMessage(repo, file, minify));
    }

    if (debug) {
        console.log("Messages to send:")
        console.log(messagesToSend.map(it => it.content).join("\n"))
    }

    const chatCompletion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: messagesToSend,
        temperature: 0.3,
        top_p: 0.2,
        response_format: zodResponseFormat(z.object(objResponse), "result"),
    });

    const response = chatCompletion.choices[0]?.message;

    if (debug) {
        console.log("Response from AI:");
        console.log(response);
    }

    return response.parsed;
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

function formatFeedback(feedback, criteria) {
    let feedbacks = [];

    for (let key of Object.keys(feedback)) {
        feedbacks.push(`### ${criteria[key].name}
- **Status**: ${feedback[key].status === 'PASS' ? "✅" : "❌"} ${feedback[key].status}
- **Explanation**: ${feedback[key].explanation}`);
    }

    return feedbacks.join("\n\n");
}

module.exports = {
    feedback
}
