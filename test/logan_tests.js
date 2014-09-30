"use strict";

var fs = require("fs-extra");
var path = require("path");
var os = require("os");

var chai = require("chai");
var expect = chai.expect;

var Logan = require("../lib/logan");
var LoganProxy = require("../lib/logan_proxy");

describe("Logan", function() {

  describe("logging", function() {


    var logFilePath = path.resolve(".", "logan.log");

    afterEach(function() {
      fs.deleteSync(logFilePath);
    });

    it("creates a log file and logs four messages", function(done) {
      var log = Logan.create(module.id);
      log.debug("This is a 'debug' message.");
      log.info("This is an 'info' message.");
      log.warn("This is a 'warn' message.");
      log.error("This is an 'error' message.");

      var intervalObj = setInterval(onInterval, 1000);

      var counter = 0;

      function onInterval() {
        counter++;
        if (fs.existsSync(logFilePath) || counter >= 5) {
          clearInterval(intervalObj);
          fs.readFile(logFilePath, "utf8", function(error, data) {
            expect(data).to.include("debug");
            expect(data).to.include("info");
            expect(data).to.include("warn");
            expect(data).to.include("error");
            done();
          });
        }
      }

    });

  });

  describe("logan proxy", function() {
    it("creates a proxy", function(done) {
      var log = Logan.create(module.id);
      expect(log).to.be.an.instanceOf(LoganProxy);
      expect(log.moduleId).to.eql("/interactive-qa-fe/logan/test/logan_tests.js");
      expect(log.debug).to.be.instanceOf(Function);
      expect(log.info).to.be.instanceOf(Function);
      expect(log.warn).to.be.instanceOf(Function);
      expect(log.error).to.be.instanceOf(Function);
      done();
    });
  });

  describe("local timestamp", function() {
    it("creates a default timestamp", function(done) {
      Logan.config.timestampSettings.includeDate = true;
      Logan.config.timestampSettings.includeMilliseconds = true;
      var timestamp = Logan.localTimestamp(new Date("8/31/1968 5:45 pm"));
      expect(timestamp).to.eql("1968-08-31 17:45:00.000");
      done();
    });

    it("creates timestamp without date", function(done) {
      Logan.config.timestampSettings.includeDate = false;
      Logan.config.timestampSettings.includeMilliseconds = true;
      var timestamp = Logan.localTimestamp(new Date("8/31/1968 5:45 pm"));
      expect(timestamp).to.eql("17:45:00.000");
      done();
    });

    it("creates timestamp without milliseconds", function(done) {
      Logan.config.timestampSettings.includeDate = true;
      Logan.config.timestampSettings.includeMilliseconds = false;
      var timestamp = Logan.localTimestamp(new Date("8/31/1968 5:45 pm"));
      expect(timestamp).to.eql("1968-08-31 17:45:00");
      done();
    });

    it("creates timestamp without date and milliseconds", function(done) {
      Logan.config.timestampSettings.includeDate = false;
      Logan.config.timestampSettings.includeMilliseconds = false;
      var timestamp = Logan.localTimestamp(new Date("8/31/1968 5:45 pm"));
      expect(timestamp).to.eql("17:45:00");
      done();
    });

  });

  describe("message filtering", function() {

    beforeEach(function() {
      Logan.config.includeFilters = [];
      Logan.config.excludeFilters = [];
    });

    it("prevents all modules from messaging by default", function(done) {
      var isAllowed = Logan.isAllowed(module.id, "debug");
      expect(isAllowed).to.eql(false);
        done();
    });

    it("allows all modules to message", function(done) {
      Logan.config.includeFilters.push({pattern:"*", levels: ["debug", "info", "warn", "error"]});
      var isAllowed = Logan.isAllowed(module.id, "debug");
      expect(isAllowed).to.eql(true);
      done();
    });

    it("allows no modules with '/test/' in the path to message", function(done) {
      Logan.config.includeFilters.push({pattern:"*", levels: ["debug", "info", "warn", "error"]});
      Logan.config.excludeFilters.push({pattern:"/test/", levels: ["debug", "info", "warn", "error"]});
      var isAllowed = Logan.isAllowed(module.id, "debug");
      expect(isAllowed).to.eql(false);
      done();
    });

    it("allows an excluded module to message with the correct level", function(done) {
      Logan.config.includeFilters.push({pattern:"*", levels: ["debug", "info", "warn", "error"]});
      Logan.config.excludeFilters.push({pattern:"/test/", levels: ["debug", "info"]});
      var isAllowed = Logan.isAllowed(module.id, "debug");
      expect(isAllowed).to.eql(false);
      isAllowed = Logan.isAllowed(module.id, "error");
      expect(isAllowed).to.eql(true);
      done();
    });

    it("allows an included module to message with the correct level", function(done) {
      Logan.config.includeFilters.push({pattern:"*", levels: ["warn", "error"]});
      var isAllowed = Logan.isAllowed(module.id, "debug");
      expect(isAllowed).to.eql(false);
      isAllowed = Logan.isAllowed(module.id, "error");
      expect(isAllowed).to.eql(true);
      done();
    });

  });

  describe("configuration", function() {

    it("loads from an environment variable", function(done) {
      process.env.LOGAN_CONFIG = "test/fixtures/environment.json";
      Logan.config = null;
      Logan._loadConfig();
      expect(Logan.config).to.be.an.instanceOf(Object);
      expect(Logan.config.baseName).to.eql("environment");
      done();
    });

    it("loads from a host file in the application directory", function(done) {
      delete process.env.LOGAN_CONFIG;
      Logan.config = null;
      var hostnameFunction = os.hostname;
      os.hostname = function() {
        return "testhost.local";
      }
      Logan._loadConfig();
      expect(Logan.config).to.be.an.instanceOf(Object);
      expect(Logan.config.baseName).to.eql("development");
      os.hostname = hostnameFunction;
      done();
    });

    it("loads the default configuration in the application directory", function(done) {
      var loadHostConfig = Logan._loadHostConfig;
      Logan._loadHostConfig = function() {
        return false;
      };
      Logan.config = null;
      Logan._loadConfig();
      expect(Logan.config).to.be.an.instanceOf(Object);
      expect(Logan.config.baseName).to.eql("logan");
      Logan._loadHostConfig = loadHostConfig;
      done();

    });

  });

});