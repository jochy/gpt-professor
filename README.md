# teaching-gpt-tooling
Tool used to create a simple CLI around ChatGPT, in order to help any kind of teaching activity

# Tools

## Measure percentage of generated content

* Name: measure-generated-content
* Description: This tool will scan a folder (or a file) and will compute the percentage of AI generated content. Relies on zerogpt api.
* Arg: The path of the file or folder to scan
* Options:
  * -c, --concurrency: how many concurrent requests
* Example: `node index.js measure-generated-content /tmp/my-folder-to-scan`

