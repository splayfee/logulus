"use strict";

var FileLogger = require( "./lib/file_logger" );
var Logulus = require( "./lib/logulus" );

module.exports = {
    FileLogger: FileLogger,
    create: Logulus.create

};