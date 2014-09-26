"use strict";

var util = require("util");

var chalk = require("chalk");
var winston = require("winston");

var Logger = winston.Logger;

var FileLogger = require("./file_logger");

/**
 * Object that defines the colors used for each debug level.
 */
var colors = {
  debug: "green",
  info: "green",
  warn: "red",
  error: "red"
};
winston.addColors(colors);


/**
 * Singleton that exposes methods used in logging.
 * @type Object
 */
var Logan = {};
module.exports = Logan;

/**
 * Returns a timestamp string for the given date value, or for the current time if no date is given.
 * @param {Date} date Optional date value; defaults to now.
 * @return {String}
 */
Logan.localTimestamp = function(date) {
  var dt = date ? new Date(date) : new Date();
  return util.format("%d-%s-%s %s.%s", dt.getFullYear(), String("0" + (dt.getMonth() + 1)).slice(-2), ("0" + dt.getDate()).slice(-2), dt.toLocaleTimeString(), ("000" + dt.getMilliseconds()).slice(-3));
};

Logan.winston = new Logger({
  exitOnError: false,
  transports: [
    new (winston.transports.Console)({
      level: "debug",
      silent: false,
      colorize: true,
      timestamp: Logan.localTimestamp,
      handleExceptions: true
    }),
    new FileLogger({
      baseName: "logan",
      level: "debug",
      silent: false,
      timestamp: Logan.localTimestamp,
      saveCount: 3,
      handleExceptions: true
    })
  ],
  levels: {
    debug: 0,
    info: 1,
    warn: 3,
    error: 4
  },
  colors: colors
});

Logan.create = function(moduleId) {

  var LoggerProxy = function(moduleId) {
    this.moduleId = moduleId;
  };
  LoggerProxy.prototype.debug = function(message, args) {
    Logan.winston.debug(arguments.length === 1 ? util.format("[%s] - %s", chalk.yellow(this.moduleId), message) : util.format.apply(this, arguments));
  };
  LoggerProxy.prototype.info = function(message, args) {
    Logan.winston.info(arguments.length === 1 ? util.format("[%s] - %s", chalk.yellow(this.moduleId), message) : util.format.apply(this, arguments));
  };
  LoggerProxy.prototype.warn = function(message, args) {
    Logan.winston.warn(arguments.length === 1 ? util.format("[%s] - %s", chalk.yellow(this.moduleId), message) : util.format.apply(this, arguments));
  };
  LoggerProxy.prototype.error = function(message, args) {
    Logan.winston.error(arguments.length === 1 ? util.format("[%s] - %s", chalk.yellow(this.moduleId), message) : util.format.apply(this, arguments));
  };

  return new LoggerProxy(moduleId);
};