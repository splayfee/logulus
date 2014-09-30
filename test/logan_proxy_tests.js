"use strict";

var chai = require("chai");
var expect = chai.expect;

var log = require("../lib/logan").create(module.id);

describe("Logan Proxy", function() {

  describe("upon instantiation", function() {

    it("dynamically creates a series of methods based on levels settings", function(done) {
      expect(log.debug).to.be.an.instanceOf(Function);
      expect(log.debug.length).to.eql(3);
      expect(log.info).to.be.an.instanceOf(Function);
      expect(log.info.length).to.eql(3);
      expect(log.warn).to.be.an.instanceOf(Function);
      expect(log.warn.length).to.eql(3);
      expect(log.error).to.be.an.instanceOf(Function);
      expect(log.error.length).to.eql(3);
      done();

    });

  });

});
