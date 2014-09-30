"use strict";

var Assert = require("fail-fast");


/**
 * Proxy's requests to the Winston logging system by appending the module to the request.
 * @param {String} moduleId The module id to append to the request.
 * @param {Object} logan The Logan Singleton.
 * @constructor
 */
function LoganProxy(moduleId, logan) {

  Assert.string(moduleId);

  var self = this;

  this.moduleId = moduleId;

  var levelKeys = Object.keys(logan.config.levels);
  levelKeys.forEach(function(key) {
    self[key] = function(message, moduleId, meta) {
      logan[key](message, self.moduleId, meta);
    };
  });

}

module.exports = LoganProxy;
