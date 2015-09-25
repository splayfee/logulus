"use strict";

var fs = require( "fs" );
var os = require( "os" );
var path = require( "path" );
var util = require( "util" );

var winston = require( "winston" );

var Assert = require( "assertable" );
var Logger = winston.Logger;
var FileLogger = require( "./file_logger" );
var LogulusProxy = require( "./logulus_proxy" );

var modulePackage = require( "../package.json" );

/**
 * Singleton that exposes methods used in logging.
 * @type Object
 */
var Logulus = {};
module.exports = Logulus;


/**
 * Constant that defines the transports available.
 * @type {{CONSOLE: string, FILE: string}}
 */
Logulus.TRANSPORTS = {
    CONSOLE: "console",
    FILE: "file"
};

/**
 * Instance to the Winston logging service.
 * @type {Object}
 */
Logulus.logger = null;


/**
 * Initializes the Winston logging service using configuration file settings.
 * @private
 */
Logulus._init = function () {

    var transportDefinitions = Assert.setDefault(Logulus.config.transports,
        [
            {"type":"console", "name": "logulus-console", "colorize": true, "level": "debug", "handleExceptions": true, "silent": false},
            {"type":"file", "name": "logulus-file", "saveCount": 5, "level": "debug", "handleExceptions": true, "silent": false}
        ]
    );
    Logulus.config.transports = [];

    Logulus.config.configFilePath = Assert.setDefault(Logulus.configFilePath, path.resolve('.'));
    Logulus.config.baseName = Assert.setDefault( Logulus.config.baseName, "default" );
    Logulus.config.colors = Assert.setDefault( Logulus.config.colors, {debug: "white", info: "blue", warn: "yellow", error: "red"} );
    Logulus.config.excludeFilters = Assert.setDefault( Logulus.config.excludeFilters, [] );
    Logulus.config.exitOnError = Assert.setDefault( Logulus.config.exitOnError, true );
    Logulus.config.includeFilters = Assert.setDefault( Logulus.config.includeFilters, [{
        "pattern": "*",
        "levels": ["debug", "info", "warn", "error"]
    }] );
    Logulus.config.levels = Assert.setDefault( Logulus.config.levels, {debug: 0, info: 1, warn: 2, error: 3} );
    Logulus.config.showModule = Assert.setDefault( Logulus.config.showModule, true );
    Logulus.config.timestampSettings = Assert.setDefault( Logulus.timestampSettings, {
        includeDate: true,
        includeMilliseconds: true
    } );

    // Set defaults from the loaded config.

    // Instantiate the transports and set default values.
    if (Assert.isArray( transportDefinitions )) {

        transportDefinitions.forEach( function ( item ) {
            var transport = null;
            var transportConfig = {timestamp: Logulus.localTimestamp};
            var levelKeys = Object.keys( Logulus.config.levels );
            var minLevel = Number.MAX_VALUE;
            var minLevelName = null;
            levelKeys.forEach( function ( levelKey ) {
                if (Logulus.config.levels[levelKey] < minLevel) {
                    minLevel = Logulus.config.levels[levelKey];
                    minLevelName = levelKey;
                }
            } );

            switch (item.type) {
                case Logulus.TRANSPORTS.CONSOLE:
                    transportConfig.name = Assert.setDefault( item.name, 'logulus-console' );
                    transportConfig.level = Assert.setDefault( item.level, minLevelName );
                    transportConfig.levels =  Assert.setDefault( Logulus.config.levels, {debug: 0, info: 1, warn: 2, error: 3} );
                    transportConfig.colorize = Assert.setDefault( item.colorize, true );
                    transportConfig.handleExceptions = Assert.setDefault( item.handleExceptions, true );
                    transportConfig.silent = Assert.setDefault( item.silent, false );
                    transport = new winston.transports.Console( transportConfig );
                    break;

                case Logulus.TRANSPORTS.FILE:
                    transportConfig.name = Assert.setDefault( item.name, 'logulus-file' );;
                    if (Assert.isString(item.directory)) {
                        transportConfig.directory = path.resolve('.', item.directory);
                    } else {
                        transportConfig.directory = path.resolve('.');
                    }
                    transportConfig.level = Assert.setDefault( item.level, minLevelName );
                    transportConfig.levels =  Assert.setDefault( Logulus.config.levels, {debug: 0, info: 1, warn: 2, error: 3} );
                    transportConfig.handleExceptions = Assert.setDefault( item.handleExceptions, true );
                    transportConfig.silent = Assert.setDefault( item.silent, false );
                    transportConfig.saveCount = Assert.setDefault( item.saveCount, 3 );
                    transportConfig.baseName = Assert.setDefault(Logulus.config.baseName, 'logulus');
                    transport = new FileLogger( transportConfig );
                    break;

                default:
                    console.log( "" );
                    console.log( "Logulus: Unknown transport - " + item.type );
                    console.log( "" );
                    break;
            }
            Logulus.config.transports.push( transport );
        } );
    }

    Logulus.logger = new Logger( Logulus.config );

    // Dynamically generate message functions based on the levels defined.
    var levelKeys = Object.keys( Logulus.config.levels );
    levelKeys.forEach( function ( key ) {

        Logulus[key] = function ( message, moduleId, meta ) {
            if (Logulus.isAllowed( moduleId, key )) {
                meta = Assert.setDefault( meta, null );
                if (Logulus.logger) {
                    if (Logulus.config.showModule) {
                        message = util.format( "[%s] - %s", moduleId, message );
                    }
                    Logulus.logger.log( key, message, meta );
                }
            }
        };

    } );

};

/**
 * Loads the config file based on environment variable.
 * @returns {String}
 * @private
 */
Logulus._loadEnvironmentConfig = function () {

    var result = null;
    var configPath;

    try {
        configPath = path.resolve( ".", process.env.LOGULUS_CONFIG );
    } catch (error) {
        configPath = undefined;
    }

    // Read from the environment variable.
    if (configPath && fs.existsSync( configPath )) {
        try {
            Logulus.config = JSON.parse( fs.readFileSync( configPath, "utf8" ) );
            result = configPath;
        } catch (error) {
            console.log( "" );
            console.log( "Logulus: Unable to read environment configuration file." );
            console.log( "" );
        }
    }
    return result;
};

/**
 * Loads the config file based on the package version (looks for -alpha, -beta, and -rc).
 * @returns {String}
 * @private
 */
Logulus._loadTestingConfig = function () {

    var result = null;
    var configPath;

    try {
        if (modulePackage.version.match( /-alpha/g ) || modulePackage.version.match( /-beta/g ) || modulePackage.version.match( /-rc/ )) {
            configPath = path.resolve( ".", "testing.json" );
        }
    } catch (error) {
        configPath = undefined;
    }

    // Read from a testing file.
    if (configPath && fs.existsSync( configPath )) {
        try {
            Logulus.config = JSON.parse( fs.readFileSync( configPath, "utf8" ) );
            result = configPath;
        } catch (error) {
            console.log( "" );
            console.log( "Logulus: Unable to read the testing configuration file." );
            console.log( "" );
        }
    }
    return result;
};

/**
 * Loads the config file based on the host name.
 * @returns {String}
 * @private
 */
Logulus._loadHostConfig = function () {

    var result = null;
    var configPath;

    try {
        configPath = path.resolve( ".", util.format( "logulus.%s.json", os.hostname() ) );
    } catch (error) {
        configPath = null;
    }

    // Read from a host file.
    if (configPath && fs.existsSync( configPath )) {
        try {
            Logulus.config = JSON.parse( fs.readFileSync( configPath, "utf8" ) );
            result = configPath;
        } catch (error) {
            console.log( "" );
            console.log( "Logulus: Unable to read the host configuration file." );
            console.log( "" );
        }
    }

    return result;

};

/**
 * Loads the default config file.
 * @returns {String}
 * @private
 */
Logulus._loadDefaultConfig = function () {

    var result = null;
    var configPath;

    try {
        configPath = path.resolve( __dirname, util.format( "../defaults.json" ) );
    } catch (error) {
        configPath = undefined;
    }

    // Read from the default file.
    if (configPath && fs.existsSync( configPath )) {
        try {
            Logulus.config = JSON.parse( fs.readFileSync( configPath, "utf8" ) );
            result = configPath;
        } catch (error) {
            console.log( "" );
            console.log( "Logulus: Unable to read the default configuration file." );
            console.log( "" );
        }
    }
    return result;

};

/**
 * Loads the appropriate configuration file; called automatically on instantiation.
 * @private
 */
Logulus._loadConfig = function () {

    var configFilePath = null;

    configFilePath = Logulus._loadEnvironmentConfig();
    if (configFilePath) {
        console.log( "" );
        console.log('Logulus is using LOGULUS_CONFIG environment config: ' + configFilePath);
        console.log( "" );
    }
    if (!configFilePath) {
        configFilePath = Logulus._loadHostConfig();
        if (configFilePath) {
            console.log( "" );
            console.log('Logulus is using host file config: ' + configFilePath);
            console.log( "" );
        }
    }
    if (!configFilePath) {
        configFilePath = Logulus._loadTestingConfig();
        if (configFilePath) {
            console.log( "" );
            console.log('Logulus is using testing file config: ' + configFilePath);
            console.log( "" );
        }
    }
    if (!configFilePath) {
        Logulus.config = {};
        console.log( "" );
        console.log('Logulus is using default settings.');
        console.log( "" );
    }

    // Ensure default settings.
    Logulus._init();
};

/**
 * Creates a Winston proxy that manages which messages are sent.
 * @param {String} moduleId The path id of the module.
 * @returns {LogulusProxy}
 */
Logulus.create = function ( moduleId ) {
    Assert.string( moduleId );
    return new LogulusProxy( moduleId, Logulus, winston );
};

/**
 * Flag that indicates whether the message should be sent to the logger.
 * @param {String} moduleId The path id of the module.
 * @param {String} level The level name.
 * @returns Boolean
 */
Logulus.isAllowed = function ( moduleId, level ) {

    Assert.string( moduleId );

    var result = false, includeAll = false;

    Logulus.config.includeFilters.some( function ( filter ) {
        if (filter.levels.indexOf( level ) >= 0 && (filter.pattern === "*" || moduleId.match( new RegExp( filter.pattern, "g" ) ))) {
            if (filter.pattern === "*") {
                includeAll = true;
            }
            result = true;
            return true;
        }
        return false;
    } );

    if (includeAll) {
        Logulus.config.excludeFilters.some( function ( filter ) {
            if (filter.levels.indexOf( level ) >= 0 && moduleId.match( new RegExp( filter.pattern, "g" ) )) {
                result = false;
                return true;
            }
            return false;
        } );
    }

    return result;
};

/**
 * Returns a timestamp string for the given date value, or for the current time if no date is given.
 * @param {Date} date Optional date value; defaults to now.
 * @return {String}
 */
Logulus.localTimestamp = function ( date ) {

    date = Assert.setDefault( date, new Date() );

    var result = date.toLocaleTimeString( 'en-US', {hour12: false} );

    if (Logulus.config.timestampSettings) {
        if (Logulus.config.timestampSettings.includeDate) {
            result = util.format( "%s-%s-%s %s", date.getFullYear(), String( "0" + (date.getMonth() + 1) ).slice( -2 ), ("0" + date.getDate()).slice( -2 ), result );
        }
        if (Logulus.config.timestampSettings.includeMilliseconds) {
            result = util.format( "%s.%s", result, ("000" + date.getMilliseconds()).slice( -3 ) );
        }
    }
    return result;
};

// Load the configuration
Logulus._loadConfig();