# teaching-gpt-tooling
Tool used to create a simple CLI around ChatGPT, in order to help any kind of teaching activity

# Tools

## Measure percentage of generated content

* Name: measure-generated-content
* Description: This tool will scan a folder (or a file) and will compute the percentage of AI generated content. Relies on zerogpt api.
* Arg: The path of the file or folder to scan
* Options:
  * -c, --concurrency: how many concurrent requests
* Example: 
```
node index.js measure-generated-content /tmp/my-folder-to-scan

/tmp/my-folder-to-scan/file_test/.keep => 0.00% AI generated content for 0 detected words
/tmp/my-folder-to-scan/file_test/rapport.pdf => 33.96% AI generated content for 8503 detected words
/tmp/my-folder-to-scan/file_test/truc.txt => 0.00% AI generated content for 187 detected words
```

