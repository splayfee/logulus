#  logan

*Provides advanced logging services for your modules. Allows for easy configuration using a JSON file, can log to the console and/or the file system, supports rotating logs files, allows for inclusion or exclusion of messages by module or level, provides four levels of messaging, configuration is by computer therefore each PC may have its own configuration.*

## Features
- Log to the console, the file system, or both.
- Provides four levels of logging: debug, info, warn, and error.
- Configration via JSON, loads the config file based on the current PC's host name.
- Optionally If the LOGAN_CONFIG environment variable is set, it loads the config file based on that rather than the PC.
- If there are no config files and no environment variable it defaults to full logging.
- You can change environment variables on the fly in code using the API. Any time you make a change, Logan stores your changes to the current config file. Optionally, you can specify not to save changes.
- You can optionally include or exclude module messages based on partial path matching and levels.
- Messages can optionally include JSON metadata.
- You can configure the number of log files to save while rotating.
- The number of levels is customizable.
## Installation
`npm install -g logan`

**See [Environment Setup](https://interactive-git.apple.com/interactive-qa-fe/Environment-Setup) if you have trouble installing**

## Usage
### Programmatic Interface
You begin by instantiating the module.
```javascript
// The create method takes in the current module id.
var log = require("logan").create(module.id);

// Include all 'warn' and 'debug' messages from all modules within /qa-svn/
log.addIncludeFilter("/qa-svn/", [Level.WARN, Level.DEBUG]);

// Exclude all messages from all modules within /qa-svn/test/ but only for the file log.
log.addExcludeFilter("/qa-svn/test/", [Level.DEBUG, Level.INFO, Level.WARN, Level.ERROR], Transport.FILE);

// Set a minimum log level for a transport
log.setMinimumLevel(Level.WARN, Transport.FILE);

// Set a minimum log level for all transports
log.setMinimumLevel(Level.WARN);

// Basic usage
log.debug("This is a debug message", {name: "David", age: 46});
log.error("An error occurred");
```
Example configuration file
```json
{
  "baseName": "mylog",
  "transports": [
  	{"name":"console", "colorize": true, "level": "debug", "handleExceptions": true, "silent": false},
  	{"name":"file", "saveCount": 3, "level": "debug", "handleExceptions": true, "silent": false}
  ],
  "includeFilters": [
    {"filter": "/qa-svn/", "levels": ["warn", "debug"]}
  ],
  "excludeFilters": [
    {"filter": "/qa-svn/test/", "levels": ["warn", "debug", "error", "info"]}
  ],
  "timestamp": {"includeDate": true, "includeMilliseconds": true}
  "showModule": true,
  "colors": {
    "debug": "green",
    "info": "green",
    "warn": "red",
    "error": "red"
  },
  "levels": {
  	"debug": 0,
    "info": 1,
    "warn": 2,
    "error": 3
  },
  "exitOnError": false,
}
```
#### Options

*Results take the form of*

```shell
2014-09-26 10:02:35.458 - debug: [/interactive-qa-fe/logan/lib/test.js] - Debugging with test
2014-09-26 10:02:35.460 - debug: [/interactive-qa-fe/logan/lib/test.js] - Executing test
```

## License
Copyright © 2014 Apple Inc. All rights reserved.