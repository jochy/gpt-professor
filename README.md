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

* Name: measure-generated-conterfiçk,fffvç,çv,ç,fçfçr!trdf                fvpmù^nt
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

## Autograde a repository with ChatGPT

**DISCLAMER: chatgpt 3 is not good at grading code. Please, use bard-autograde instead.**

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

## Autograde a repository with Bard

* Name: bard-autograde
* Description: This tool will send the repository content to the AI and will ask it to autograde the code based on criteria you have defined
* Options:
  * -c, --config: the autograde configuration path
  * -r, --repo: the repository filepath to autograde
  * -o, --output: where to store the autograde result (by default its output in the console)
  * -s, --minify: does the script try to shrink files before sending them to the AI (to reduce token and billing)
* Required env var: `BARD_API_KEY` (see [https://github.com/PawanOsman/GoogleBard#prerequisite---how-to-get-cookies](https://github.com/PawanOsman/GoogleBard#prerequisite---how-to-get-cookies))
* Example: 
  `autograde.json` (config file)
  ```
  {
    "files": {
      "include_patterns": [
        "GameServiceTest.java"
      ],
      "exclude_patterns": [
        ".gradle/**",
        ".idea/**",
        "**/build/**"
      ]
    },
    "criteria": {
      "ex1_use_mock_ThrowRepository": {
        "condition": "Test method named should_return_a_score_with_all_players_when_computing_score is using a mock of ThrowRepository"
      },
      "ex1_use_mock_GameRepository": {
        "condition": "Test method named should_return_a_score_with_all_players_when_computing_score is using a mock of GameRepository"
      },
      "ex1_use_mock_with_2_returns": {
        "condition": "Test method named should_return_a_score_with_all_players_when_computing_score is using a mock of ThrowRepository and the mocked function findAllByGame returns a list with 2 elements"
      },
      "ex1_assertions": {
        "condition": "Test method named should_return_a_score_with_all_players_when_computing_score is calling a method starting with assert"
      },
      "ex2_use_spy": {
        "condition": "Test method named should_return_a_fixed_score_with_all_players_when_computing_score_is_called is calling a variable which is a spy of 'Game Service'"
      },
      "ex2_no_use_mock": {
        "condition": "Test method named should_return_a_fixed_score_with_all_players_when_computing_score_is_called is not using a mock but only a spy of GameService"
      },
      "ex2_assertions": {
        "condition": "Test method should_return_a_fixed_score_with_all_players_when_computing_score_is_called is calling a method starting with assert"
      },
      "ex3_test_on_all_0_pin_down": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 0"
      },
      "ex3_test_on_all_1_pin_down": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 20"
      },
      "ex3_test_on_all_1_then_2_pin_down": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 30"
      },
      "ex4_test_with_2_players": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 20 and and also that another result is 40"
      },
      "ex5_test_on_2_frames": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 18"
      },
      "ex5_test_on_full_game": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 150"
      },
      "ex6_test_on_full_strikes": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 300"
      },
      "ex6_test_on_scenario": {
        "condition": "There is a test on GameServiceTest which verifies that a result is 125"
      }
    }
  }
  ```

  Command: 
  ```
gpt-professor bard-autograde -c file_test/autograde.json -r file_test -o file_test/professorgpt.json --minify

Will send files to AI: [file_test/GameServiceTest.java]

Result:
{
  "ex1_use_mock_ThrowRepository": {
    "status": "FAIL"
  },
  "ex1_use_mock_GameRepository": {
    "status": "FAIL"
  },
  "ex1_use_mock_with_2_returns": {
    "status": "FAIL"
  },
  "ex1_assertions": {
    "status": "PASS"
  },
  "ex2_use_spy": {
    "status": "PASS"
  },
  "ex2_no_use_mock": {
    "status": "PASS"
  },
  "ex2_assertions": {
    "status": "PASS"
  },
  "ex3_test_on_all_0_pin_down": {
    "status": "PASS"
  },
  "ex3_test_on_all_1_pin_down": {
    "status": "FAIL"
  },
  "ex3_test_on_all_1_then_2_pin_down": {
    "status": "FAIL"
  },
  "ex4_test_with_2_players": {
    "status": "FAIL"
  },
  "ex5_test_on_2_frames": {
    "status": "FAIL"
  },
  "ex5_test_on_full_game": {
    "status": "FAIL"
  },
  "ex6_test_on_full_strikes": {
    "status": "FAIL"
  },
  "ex6_test_on_scenario": {
    "status": "FAIL"
  }
}
```
