"use strict";

var Assert = require( "assertable" );


/**
 * Proxy's requests to the Winston logging system by appending the module to the request.
 * @param {String} moduleId The module id to append to the request.
 * @param {Object} logulus The Logulus Singleton.
 * @param {Object} winston A reference to the Winston module.
 * @constructor
 */
function LogulusProxy( moduleId, logulus, winston ) {

    Assert.string( moduleId );
    Assert.object( logulus );
    Assert.object( winston );

    var self = this;

    this.moduleId = moduleId;
    this.winston = winston;
    this.logger = logulus.logger;

    var levelKeys = Object.keys( logulus.config.levels );
    levelKeys.forEach( function ( key ) {
        self[key] = function ( message, meta, callback ) {
            logulus[key]( message, self.moduleId, meta, callback );
        };
    } );

}

module.exports = LogulusProxy;
