# Logulus

*Logulus adds many features to the Winston logging system. It provides advanced logging services for your modules, allows for easy configuration using a JSON file, can log to the console and/or the file system, supports rotating log files, allows for inclusion or exclusion of messages by module and/or level, and provides customizable levels of messaging. Configuration is by hostname, environment variable, or default therefore each PC may have its own configuration.*

## Features

- Log to the console, the file system, or both.
- Provides customizable levels of logging, defaults to `debug`, `info`, `warn`, and `error`.
- Configuration via JSON, attempts to load the config in the following order, it stops once one of the methods is successful:
	- Check for a LOGULUS_CONFIG environment variable, if it exists then load the config file indicated by the variable.
	- Check for a configuration file named after the host, if it exists then load it (ex., `logulus.myhost.json`).
	- Check the `package.json` version, if it includes `-alpha`, `beta`, or `-rc` then use the included `testing.json` config found in the application directory.
	- If no config files are found the application defaults to full logging.
- You can optionally filter module messages based on partial path matching and levels matching (includeFilters, excludeFilters).
- Messages can optionally include JSON metadata.
- You can configure the number of log files to save while rotating.
- You can specify a directory in the file transport config as well (ex., `logs`).
- If you specify 0 for saveCount then the file logger will continue to use the same file.

## Installation

`npm install -g logulus`

## Usage

### Programmatic Interface

You begin by instantiating the module.

```javascript
    // This allows access to the FileLogger class and the create method.
    var Logulus = require( "logulus" );
    // The create method takes in the current module id.
    var log = Logulus.create(module.id);

    // Basic usage
    log.debug("This is a debug message", {name: "David", age: 46});
    log.error("An error occurred");
```

Winston can be accessed from the logulus instance:

```javascript
    // The create method takes in the current module id.
    var log = require("logulus").create(module.id);
    log.winston.remove('console');
```

Similarly, the active logger can be access as well:

```javascript
    // The create method takes in the current module id.
    var log = require("logulus").create(module.id);
    var fileLogger = log.logger.transports['logulus-file']; 
```

Example configuration file

```json
    {
      "baseName": "mylog",
      "transports": [
        {"type":"console", "name":"logulus-console", "colorize": true, "level": "debug", "handleExceptions": true, "silent": false},
        {"type":"file", "name":"logulus-file", "saveCount": 5, "level": "debug", "handleExceptions": true, "silent": false}
      ],
      "includeFilters": [
        {"pattern": "*", "levels": ["debug", "info", "warn", "error"]}
      ],
      "timestampSettings": {"includeDate": true, "includeMilliseconds": true},
      "showModule": true,
      "colors": {
        "debug": "white",
        "info": "blue",
        "warn": "yellow",
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

MIT