# Logulus

*Logulus adds many features to the Winston logging system. It provides advanced logging services for your modules, allows for easy configuration using a JSON file, can log to the console and/or the file system, supports rotating log files, allows for inclusion or exclusion of messages by module and/or level, and provides customizable levels of messaging. Configuration is by hostname, environment variable, or default therefore each PC may have its own configuration.*

## Features

- Log to the console, the file system, or both.
- Provides customizable levels of logging, defaults to `debug`, `info`, `warn`, and `error`.
- Configuration via JSON, attempts to load the config in the following order, it stops once one of the methods is successful:
	- Check for a LOGULUS_CONFIG environment variable, if it exists then load the config file indicated by the variable.
	- Check the `package.json` version, if it includes `-alpha`, `beta`, or `-rc` then use the included `testing.json` config found in the application directory.
	- Check for a configuration file named after the host, if it exists then load it.
	- Check for the default `defaults.json` config file in the application directory, if it exists load it.
	- If no config files are found the application defaults to full logging.
- You can optionally filter module messages based on partial path matching and levels matching (includeFilters, excludeFilters).
- Messages can optionally include JSON metadata.
- You can configure the number of log files to save while rotating.

## Installation

`npm install -g logulus`

## Usage

### Programmatic Interface

You begin by instantiating the module.

```javascript
    // The create method takes in the current module id.
    var log = require("logulus").create(module.id);

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
        {"name":"file", "saveCount": 5, "level": "debug", "handleExceptions": true, "silent": false}
      ],
      "includeFilters": [
        {"pattern": "*", "levels": ["debug", "info", "warn", "error"]}
      ],
      "timestampSettings": {"includeDate": true, "includeMilliseconds": true},
      "showModule": true,
      "colors": {
        "debug": "green",
        "info": "yellow",
        "warn": "red",
        "error": "red"
      },
      "levels": {
        "debug": 0,
        "info": 1,
        "warn": 2,
        "error": 3
      },
      "exitOnError": false
    }
```

#### Options

*Results take the form of*

```shell
    2014-09-26 10:02:35.458 - debug: [/logulus/lib/test.js] - Debugging with test
    2014-09-26 10:02:35.460 - debug: [/logulus/lib/test.js] - Executing test
```

## License