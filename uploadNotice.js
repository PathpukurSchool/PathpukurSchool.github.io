const fetch = require('node-fetch');
const { Octokit } = require("@octokit/rest");

exports.handler = async function (event, context) {
  const { date, text, subj, link } = JSON.parse(event.body);
  const token = process.env.GITHUB_TOKEN;
  const owner = "pathpukurschool";
  const repo = "pathpukurschool.github.io";
  const filePath = "index_notice.js";

  const octokit = new Octokit({ auth: token });

  // Step 1: Get existing file content
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
  });

  const content = Buffer.from(fileData.content, 'base64').toString();

  // Step 2: Insert new notice
  const insertIndex = content.lastIndexOf("];");
  const newEntry = `  {\n    date: "${date}",\n    text: "${text}",\n    subj: "${subj}",\n    link: "${link}"\n  },\n`;
  const updatedContent = content.slice(0, insertIndex) + newEntry + content.slice(insertIndex);

  // Step 3: Commit updated content
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: `New notice added on ${date}`,
    content: Buffer.from(updatedContent).toString('base64'),
    sha: fileData.sha,
  });

  return {
    statusCode: 200,
    body: "Notice uploaded successfully!",
  };
};
