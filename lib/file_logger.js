"use strict";

/**
 * @fileOverview Defines a Winston-logger file transport based on 'fs' rather than 'writable stream'.
 * @author <a href="mailto:david@edium.com">David LaTour</a>
 */

/* REQUIRED MODULES */
var fs = require( "fs" );
var os = require( "os" );
var path = require( "path" );
var util = require( "util" );

var async = require( "async" );
var winston = require( "winston" );

var Assert = require( "assertable" );


/**
 * Defines a Winston-logger file transport based on 'fs' rather than 'writable stream'.
 *
 * @class {FileLogger} Defines a Winston-logger file transport based on 'fs' rather than 'writable stream'.<br/>
 * @param {{directory:String,baseName:String,silent:Boolean,level:String,timestamp:Function,saveCount:Number}} options Configuration options.
 * @constructor
 */
function FileLogger( options ) {

    options = Assert.setDefault( options, {} );

    winston.Transport.call( this, options );
    if (Assert.isString(options.directory)) {
        this.directory = path.resolve('.', options.directory);
    } else {
        this.directory = path.resolve('.');
    }
    this.baseName = Assert.setDefault( options.baseName, "logulus" );
    this.timestamp = Assert.setDefault( options.timestamp, FileLogger._defaultTimestamp );
    this.saveCount = Assert.setDefault( options.saveCount, 10 );
    this.filename = this._getFilePath();
    this.exitOnError = Assert.setDefault(options.exitOnError, true);
    this._firstTime = true;
}
util.inherits( FileLogger, winston.Transport );
module.exports = FileLogger;

/**
 * The default timestamp used if one is not provided.
 * @param {Date} [date] Optional data data.
 * @private
 */
FileLogger._defaultTimestamp = function ( date ) {
    date = Assert.setDefault( date, new Date() );
    return date.toLocaleTimeString( 'en-US', {hour12: false} );
};


/**
 * Returns the fully qualified path for the current log file:
 * <code><i>directory</i>/<i>baseName</i>[-<i>version</i>].log</code>.
 * @param {Number} [version] Filename version number suffix.
 * @returns {String} Fully qualified path.
 * @private
 */
FileLogger.prototype._getFilePath = function ( version ) {
    Assert.number( version, true );
    var fileName = (version) ? util.format( "%s-%s.log", this.baseName, version.toString() ) : util.format( "%s.log", this.baseName );
    return path.resolve( path.join( this.directory, fileName ) );
};

/**
 * Write a log entry to the current file. Not meant for use other than by the winston transport mechanism.
 * @param {String} level The message level to log.
 * @param {String} message The message to log.
 * @param {*} [meta] Optional data to log, converted to JSON format.
 * @param {Function} callback Called once the process completes: function(error)
 */
FileLogger.prototype.log = function ( level, message, meta, callback ) {

    if (Assert.isFunction( meta )) {
        callback = meta;
        meta = null;
    }
    meta = Assert.setDefault( meta, null );

    Assert.string( level );
    Assert.string( message );
    Assert.object( meta, true );
    Assert.method( callback );

    var self = this;

    if (!this.silent) {

        if (this._firstTime) {

            if (this.saveCount == 0) {
                self._firstTime = false;
                self.log( level, message, meta, callback );
            } else {
                // If first log, cycle the log file.
                this.nextFile( function () {
                    self._firstTime = false;
                    self.log( level, message, meta, callback );
                } );
            }

        } else {

            var metaString = "";
            if (Assert.isObject( meta ) && Object.keys( meta ).length > 0) {
                metaString = JSON.stringify( meta, null, 2 );
            }

            var timestamp = "";
            if (self.timestamp) {
                if (Assert.isFunction( self.timestamp )) {
                    timestamp = self.timestamp() + " - ";
                } else {
                    var date = new Date();
                    return util.format( "%s.%s", date.toLocaleTimeString( 'en-US', {hour12: false} ), ("000" + date.getMilliseconds()).slice( -3 ) );
                }
            }

            var line = util.format( "%s%s: %s%s%s", timestamp, level, message.replace( "\n", os.EOL ), metaString, os.EOL );
            fs.appendFile( self.filename, line, callback );
        }
    } else {
        callback( null );
    }

    return self;
};

/**
 * Cycle the current log file by renaming the latest log to the next numeric suffix.
 * @param {Function} callback Completion as (err).
 */
FileLogger.prototype.nextFile = function ( callback ) {

    var self = this;

    // If target file exists...
    fs.exists( self.filename, function ( exists ) {
            if (exists) {
                // ...get the files in the logging folder.
                var pattern = new RegExp( self.baseName + "-(\\d{1,3})\\.log$" );
                fs.readdir( self.directory, function ( error, files ) {
                        if (error) {
                            callback( error );
                            return;
                        }
                        files = files
                            // Change files that match to just the numeric suffix or to null.
                            .map( function ( file ) {
                                var result = pattern.exec( file );
                                return result ? parseInt( result[1], 10 ) : result;
                            } )
                            // Remove nulls.
                            .filter( function ( file ) {
                                return file;
                            } )
                            .sort( function ( a, b ) {
                                return a - b;
                            } );

                        // Find the largest suffix.
                        var max = files.length === 0 ? 0 : Math.max.apply( self, files );

                        // Rename the current log file to the next target name.
                        fs.rename( self.filename, self._getFilePath( max + 1 ), function ( error ) {
                            // If no rename error, asynchronously remove all but the most recent saveCount files (including the one just renamed).
                            if (!error) {
                                async.whilst(
                                    function () {
                                        return files.length > self.saveCount - 1;
                                    },
                                    function ( callback ) {
                                        fs.unlink( self._getFilePath( files.shift() ), callback );
                                    },
                                    function ( error ) {
                                        if (error) {
                                            console.log( error );
                                        }
                                    }
                                );
                            }
                            callback( error );
                        } );
                    }
                );
            } else {
                // ...else, target file does not yet exist.
                callback( null );
            }
        }
    );
};