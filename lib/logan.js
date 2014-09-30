"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var util = require("util");

var chalk = require("chalk");
var winston = require("winston");

var Assert = require("fail-fast");
var Logger = winston.Logger;
var FileLogger = require("./file_logger");
var LoganProxy = require("./logan_proxy");

var modulePackage = require("../package.json");

/**
 * Singleton that exposes methods used in logging.
 * @type Object
 */
var Logan = {};
module.exports = Logan;


/**
 * Constant that defines the transports available.
 * @type {{CONSOLE: string, FILE: string}}
 */
Logan.TRANSPORTS = {
  CONSOLE: "console",
  FILE: "file"
};

/**
 * Instance to the Winston logging service.
 * @type {Object}
 */
Logan.logger = null;


/**
 * Initializes the Winston logging service using configuration file settings.
 * @private
 */
Logan._init = function() {

  // Set defaults from the loaded config.
  var config = {};
  config.exitOnError = Logan.config.exitOnError;
  config.levels = Logan.config.levels;
  config.colors = Logan.config.colors;
  config.transports = [];

  // Instantiate the transports and set default values.
  if (Assert.isArray(Logan.config.transports)) {
    Logan.config.transports.forEach(function(item) {
      var transport, transportConfig = {timestamp: Logan.localTimestamp};
      var levelKeys = Object.keys(Logan.config.levels);
      var minLevel = Number.MAX_VALUE;
      var minLevelName = null;
      levelKeys.forEach(function(levelKey) {
        if (Logan.config.levels[levelKey] < minLevel) {
          minLevel = Logan.config.levels[levelKey];
          minLevelName = levelKey;
        }
      });
      switch(item.name) {
        case Logan.TRANSPORTS.CONSOLE:
          transportConfig.level = Assert.setDefault(item.level, minLevelName);
          transportConfig.colorize = Assert.setDefault(item.colorize, true);
          transportConfig.handleExceptions = Assert.setDefault(item.handleExceptions, true);
          transportConfig.silent = Assert.setDefault(item.silent, false);
          transport = new winston.transports.Console(transportConfig);
          break;

        case Logan.TRANSPORTS.FILE:
          transportConfig.level = Assert.setDefault(item.level, minLevelName);
          transportConfig.handleExceptions = Assert.setDefault(item.handleExceptions, true);
          transportConfig.silent = Assert.setDefault(item.silent, false);
          transportConfig.saveCount = Assert.setDefault(item.saveCount, 3);
          transportConfig.baseName = Logan.config.baseName;
          transport = new FileLogger(transportConfig);
          break;

        default:
          console.log("Logan: Unknown transport - " + transport.name);
          break;
      }
      config.transports.push(transport);
    });
  }

  // Instantiate the logger and register the colors.
  Logan.logger = new Logger(config);
  winston.addColors(config.colors);

  // Dynamically generate message functions based on the levels defined.
  var levelKeys = Object.keys(config.levels);
  levelKeys.forEach(function(key) {

    Logan[key] = function(message, moduleId, meta) {
      if (Logan.isAllowed(moduleId, key)) {
        meta = Assert.setDefault(meta, null);
        if (Logan.logger) {
          if (Logan.config.showModule) {
            message = util.format("[%s] - %s", chalk.white(moduleId), message);
          }
          Logan.logger.log(key, message, meta);
        }
      }
    };

  });

};

/**
 * Loads the appropriate configuration file; called automatically on instantiation.
 * @private
 */
Logan._loadConfig = function() {

  var environmentConfigPath, testingConfigPath, hostConfigPath, defaultConfigPath;
  try {
    environmentConfigPath = path.resolve(__dirname, process.env.LOGAN_CONFIG);
  } catch(error) {
    environmentConfigPath = undefined;
  }
  try {
    if (modulePackage.version.match(/-alpha/g) || modulePackage.version.match(/-beta/g) || modulePackage.version.match(/-rc/)) {
      testingConfigPath = path.resolve(__dirname, "../testing.json");
    }
  } catch(error) {
    testingConfigPath = undefined;
  }
  try {
    hostConfigPath = path.resolve(__dirname, util.format("../logan.%s.json", os.hostname()));
  } catch(error) {
    hostConfigPath = undefined;
  }
  try {
    defaultConfigPath = path.resolve(__dirname, util.format("../logan.json"));
  } catch(error) {
    defaultConfigPath = undefined;
  }

  // Read from the environment variable.
  if (environmentConfigPath && fs.existsSync(environmentConfigPath)) {
    try {
      Logan.config = JSON.parse(fs.readFileSync(environmentConfigPath, "utf8"));
    } catch(error) {
      console.log("Logan: Unable to environment configuration file, will attempt to use host file or default file.");
    }
  }

  // Read from a testing file.
  if (!Logan.config && testingConfigPath && fs.existsSync(testingConfigPath)) {
    try {
      Logan.config = JSON.parse(fs.readFileSync(testingConfigPath, "utf8"));
    } catch(error) {
      console.log("Logan: Unable to read the host configuration file, will attempt to use the default file.");
    }
  }

  // Read from a host file.
  if (!Logan.config && hostConfigPath && fs.existsSync(hostConfigPath)) {
    try {
      Logan.config = JSON.parse(fs.readFileSync(hostConfigPath, "utf8"));
    } catch(error) {
      console.log("Logan: Unable to read the testing configuration file, will attempt to use the default file.");
    }
  }

  // Read from the default file.
  if (!Logan.config && defaultConfigPath && fs.existsSync(defaultConfigPath)) {
    try {
      Logan.config = JSON.parse(fs.readFileSync(defaultConfigPath, "utf8"));
    } catch(error) {
      console.log("Logan: Unable to read the default configuration file, logging disabled.");
    }
  }

  // Ensure default settings.
  Logan.config.baseName = Assert.setDefault(Logan.config.baseName, "logan");
  Logan.config.colors = Assert.setDefault(Logan.config.colors, {debug: "green", info: "green", warn: "yellow", error:"red"});
  Logan.config.excludeFilters = Assert.setDefault(Logan.config.excludeFilters, []);
  Logan.config.exitOnError = Assert.setDefault(Logan.config.exitOnError, false);
  Logan.config.includeFilters = Assert.setDefault(Logan.config.includeFilters, []);
  Logan.config.levels = Assert.setDefault(Logan.config.levels, {levels:{debug: 0, info: 1, warn: 2, error: 3}});
  Logan.config.showModule = Assert.setDefault(Logan.config.showModule, true);
  Logan.timestampSettings = Assert.setDefault(Logan.timestampSettings, {includeDate: true, includeMilliseconds: true});

  if (Logan.config) {
    Logan._init();
  }
};

/**
 * Creates a Winston proxy that manages which messages are sent.
 * @param {String} moduleId The path id of the module.
 * @returns {LoganProxy}
 */
Logan.create = function(moduleId) {
  Assert.string(moduleId);
  return new LoganProxy(moduleId);
};

/**
 * Flag that indicates whether the message should be sent to the logger.
 * @param {String} moduleId The path id of the module.
 * @param {String} level The level name.
 * @returns Boolean
 */
Logan.isAllowed = function(moduleId, level) {

  Assert.string(moduleId);

  var result = false, includeAll = false;

  Logan.config.includeFilters.some(function(filter) {
    if (filter.levels.indexOf(level) >= 0 && (filter.pattern === "*" || moduleId.match(new RegExp(filter.pattern, "g")))) {
      if (filter.pattern === "*") {
        includeAll = true;
      }
      result = true;
      return true;
    }
    return false;
  });

  if (includeAll) {
    Logan.config.excludeFilters.some(function(filter) {
      if (filter.levels.indexOf(level) >= 0 && moduleId.match(new RegExp(filter.pattern, "g"))) {
        result = false;
        return true;
      }
      return false;
    });
  }

  return result;
};

/**
 * Returns a timestamp string for the given date value, or for the current time if no date is given.
 * @param {Date} date Optional date value; defaults to now.
 * @return {String}
 */
Logan.localTimestamp = function(date) {

  date = Assert.setDefault(date, new Date());

  var result = date.toLocaleTimeString();

  if (Logan.config.timestampSettings) {
    if (Logan.config.timestampSettings.includeDate) {
      result = util.format("%s-%s-%s %s", date.getFullYear(), String("0" + (date.getMonth() + 1)).slice(-2), ("0" + date.getDate()).slice(-2), result);
    }
    if (Logan.config.timestampSettings.includeMilliseconds) {
      result = util.format("%s.%s", result, ("000" + date.getMilliseconds()).slice(-3));
    }
  }
  return result;
};

// Load the configuration
Logan._loadConfig();