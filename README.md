# GPT-Professor
Tool used to create a simple CLI around ChatGPT, in order to help any kind of teaching activity

## Installation

You need to install Node.js
After that, you can install the tool using `npm i -g gpt-professor`
Make sure everything is working: 
```
$ gpt-professor --version
0.0.8
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
gpt-professor measure-generated-content /tmp/my-folder-to-scan

/tmp/my-folder-to-scan/file_test/.keep => 0.00% of potential AI generated content for 0 detected words
/tmp/my-folder-to-scan/file_test/rapport.pdf => 33.96% of potential AI generated content for 8503 detected words
/tmp/my-folder-to-scan/file_test/truc.txt => 0.00% of potential AI generated content for 187 detected words
/tmp/my-folder-to-scan/file_test/huc.pdf => 2.18% of potential AI generated content for 10010 detected words
/tmp/my-folder-to-scan/file_test/int.pdf => 12.99% of potential AI generated content for 12783 detected words
/tmp/my-folder-to-scan/file_test/lou.pdf => 9.41% of potential AI generated content for 6607 detected words
```

## Autograde a repository with ChatGPT 4

* Name: autograde
* Description: This tool will send the repository content to the AI and will ask it to autograde the code based on criteria you have defined
* Options:
  * -c, --config: the autograde configuration path
  * -r, --repo: the repository filepath to autograde
  * -o, --output: where to store the autograde result (by default its output in the console)
  * -s, --minify: does the script try to shrink files before sending them to the AI (to reduce token and billing)
* Required env var: `OPENAI_API_KEY` (see [https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key))
* Optional env var: `OPENAI_BASE_URL` to set the endpoint to call (by default, its openai api production)
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
              "condition": "Make sure the project is using vuejs"
          },
          "use_computed_property": {
              "condition": "Make sure there is at least 1 computed property"
          },
          "use_at_least_2_components": {
              "condition": "Make sure there is at least 2 components defined and used"
          },
          "vue_router_is_used": {
              "condition": "Make sure it is using vue-router in App.vue with a least a router-link component"
          },
          "flutter": {
              "condition": "Make sure the project is using flutter"
          },
          "is_palindrome": {
              "condition": "Make sure there is a function used to check if a word is a palindrome"
          }
      }
  }
  ```

  Command: 
  ```
  gpt-professor autograde -c file_test/autograde.json -r file_test/tp6 -o file_test/professorgpt.json

  Will send files to AI: [file_test/tp6/src/App.vue,file_test/tp6/src/main.js,file_test/tp6/src/router.js,file_test/tp6/src/store.js,file_test/tp6/src/components/TodoDetail.vue,file_test/tp6/src/components/home.vue,file_test/tp6/src/components/task.vue]

  Result:
  {"use_vue_js": {"status": "PASS"}, 
  "use_computed_property": {"status": "PASS"},
  "use_at_least_2_components": {"status": "PASS"},
  "vue_router_is_used": {"status": "PASS"},
  "flutter": {"status": "FAIL"},
  "is_palindrome": {"status": "FAIL"}}
  ```

## Autograde a repository with Gemini

* Name: autograde-gemini
* Description: This tool will send the repository content to the AI and will ask it to autograde the code based on criteria you have defined
* Options:
  * -c, --config: the autograde configuration path
  * -r, --repo: the repository filepath to autograde
  * -o, --output: where to store the autograde result (by default its output in the console)
  * -s, --minify: does the script try to shrink files before sending them to the AI (to reduce token and billing)
* Required env var: `GEMINI_API_KEY`
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
              "condition": "Make sure the project is using vuejs"
          },
          "use_computed_property": {
              "condition": "Make sure there is at least 1 computed property"
          },
          "use_at_least_2_components": {
              "condition": "Make sure there is at least 2 components defined and used"
          },
          "vue_router_is_used": {
              "condition": "Make sure it is using vue-router in App.vue with a least a router-link component"
          },
          "flutter": {
              "condition": "Make sure the project is using flutter"
          },
          "is_palindrome": {
              "condition": "Make sure there is a function used to check if a word is a palindrome"
          }
      }
  }
  ```

  Command:
  ```
  gpt-professor autograde-gemini -c file_test/autograde.json -r file_test/tp6 -o file_test/professorgpt.json

  Will send files to AI: [file_test/tp6/src/App.vue,file_test/tp6/src/main.js,file_test/tp6/src/router.js,file_test/tp6/src/store.js,file_test/tp6/src/components/TodoDetail.vue,file_test/tp6/src/components/home.vue,file_test/tp6/src/components/task.vue]

  Result:
  {"use_vue_js": {"status": "PASS"}, 
  "use_computed_property": {"status": "PASS"},
  "use_at_least_2_components": {"status": "PASS"},
  "vue_router_is_used": {"status": "PASS"},
  "flutter": {"status": "FAIL"},
  "is_palindrome": {"status": "FAIL"}}
  ```

## Give a feedback on a repository with ChatGPT4

* Name: feedback
* Description: Automatically give a feedback to a Github repository
* Options:
  * -c, --config: the feedback configuration path
  * -r, --repo: the repository url (https or ssh) to feedback
  * -s, --minify: does the script try to shrink files before sending them to the AI (to reduce token and billing)
* Required env var: `OPENAI_API_KEY` (see [https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key))
* Required env var: `GIT_PAT` (Github Personal Access Token, with issue write, and repo read permissions)
* Optional env var: `OPENAI_BASE_URL` to set the endpoint to call (by default, its openai api production)
* Example:
  `feedback.json` (config file)
  ```
  {
      "files": {
          "include_patterns": [ "**/*.js", "**/*.vue" ],
          "exclude_patterns": [ "**/node_modules/**", "babel.config.js" ]
      },
      "criteria": {
          "use_vue_js": {
              "condition": "Make sure the project is using vuejs"
          },
          "use_computed_property": {
              "condition": "Make sure there is at least 1 computed property"
          }
      }
  }
  ```

  Command:
  ```
  gpt-professor feedback -c file_test/feedback.json -r https://github.com/jochy/gpt-professor --minify --debug

  Will send files to AI: [file_test/tp6/src/App.vue,file_test/tp6/src/main.js,file_test/tp6/src/router.js,file_test/tp6/src/store.js,file_test/tp6/src/components/TodoDetail.vue,file_test/tp6/src/components/home.vue,file_test/tp6/src/components/task.vue]
  Feedback issue created
  ```
