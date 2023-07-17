# GPT-Professor
Tool used to create a simple CLI around ChatGPT, in order to help any kind of teaching activity

## Installation

You need to install Node.js
After that, you can install the tool using `npm i -g gpt-professor`
Make sure everything is working: 
```
$ gpt-professor --version
0.0.1
```

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

/tmp/my-folder-to-scan/file_test/.keep => 0.00% of potential AI generated content for 0 detected words
/tmp/my-folder-to-scan/file_test/rapport.pdf => 33.96% of potential AI generated content for 8503 detected words
/tmp/my-folder-to-scan/file_test/truc.txt => 0.00% of potential AI generated content for 187 detected words
/tmp/my-folder-to-scan/file_test/huc.pdf => 2.18% of potential AI generated content for 10010 detected words
/tmp/my-folder-to-scan/file_test/int.pdf => 12.99% of potential AI generated content for 12783 detected words
/tmp/my-folder-to-scan/file_test/lou.pdf => 9.41% of potential AI generated content for 6607 detected words
```

## Autograde a repository

* Name: autograde
* Description: This tool will send the repository content to the AI and will ask it to autograde the code based on criteria you have defined
* Options:
  * -c, --config: the autograde configuration path
  * -r, --repo: the repository filepath to autograde
  * -o, --output: where to store the autograde result (by default its output in the console)
  * -s, --shrink: does the script try to shrink files before sending them to the AI (to reduce token and billing)
* Example: 
  `autograde.json` (config file)
  ```
  {
      "files": {
          "include_patterns": [ "**/*.js", "**/*.vue" ],
          "exclude_patterns": [ "**/node_modules/**", "babel.config.js" ]
      },
      "criteria": {
          "use_vue_js": {
              "prompt": "Make sure the project is using vuejs",
              "points": 1
          },
          "use_computed_property": {
              "prompt": "Make sure there is at least 1 computed property",
              "points": 1
          },
          "use_at_least_2_components": {
              "prompt": "Make sure there is at least 2 components defined and used",
              "points": 1
          },
          "vue_router_is_used": {
              "prompt": "Make sure it is using vue-router in App.vue with a least a router-link component",
              "points": 1
          },
          "flutter": {
              "prompt": "Make sure the project is using flutter",
              "points": "1"
          },
          "is_palindrome": {
              "prompt": "Make sure there is a function used to check if a word is a palindrome",
              "points": 1
          }
      }
  }
  ```

  Command: 
  ```
  node index.js autograde -c file_test/autograde.json -r file_test/tp6 --shrink -o file_test/professorgpt.json

  Will send files to AI: [file_test/tp6/src/App.vue,file_test/tp6/src/main.js,file_test/tp6/src/router.js,file_test/tp6/src/store.js,file_test/tp6/src/components/TodoDetail.vue,file_test/tp6/src/components/home.vue,file_test/tp6/src/components/task.vue]

  Result:
  {"use_vue_js": {"status": "SUCCESS", "points": 1}, 
  "use_computed_property": {"status": "SUCCESS", "points": 1},
  "use_at_least_2_components": {"status": "SUCCESS", "points": 1},
  "vue_router_is_used": {"status": "SUCCESS", "points": 1},
  "flutter": {"status": "FAIL", "points": 0},
  "is_palindrome": {"status": "FAIL", "points": 0}}
  ```
