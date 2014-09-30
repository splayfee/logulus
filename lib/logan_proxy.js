"use strict";

var Assert = require("fail-fast");
var Logan = require("./Logan");


/**
 * Proxy's requests to the Winston logging system by appending the module to the request.
 * @param {String} moduleId The module id to append to the request.
 * @constructor
 */
function LoganProxy(moduleId) {

  Assert.string(moduleId);

  var self = this;

  this.moduleId = moduleId;

  var levelKeys = Object.keys(Logan.config.levels);
  levelKeys.forEach(function(key) {
    self[key] = function(message, moduleId, meta) {
      Logan[key](message, self.moduleId, meta);
    };
  });

}

module.exports = LoganProxy;
