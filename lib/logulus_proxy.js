"use strict";

var Assert = require( "assertable" );


/**
 * Proxy's requests to the Winston logging system by appending the module to the request.
 * @param {String} moduleId The module id to append to the request.
 * @param {Object} logulus The Logulus Singleton.
 * @constructor
 */
function LogulusProxy( moduleId, logulus ) {

    Assert.string( moduleId );

    var self = this;

    this.moduleId = moduleId;

    var levelKeys = Object.keys( logulus.config.levels );
    levelKeys.forEach( function ( key ) {
        self[key] = function ( message, moduleId, meta ) {
            logulus[key]( message, self.moduleId, meta );
        };
    } );

}

module.exports = LogulusProxy;