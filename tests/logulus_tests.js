"use strict";

var fs = require( "fs-extra" );
var path = require( "path" );
var os = require( "os" );

var chai = require( "chai" );
var expect = chai.expect;

var Logulus = require( "../lib/logulus" );
var LogulusProxy = require( "../lib/logulus_proxy" );

describe( "Logulus", function () {

    describe( "logging", function () {


        var logFilePath = path.resolve( ".", "default.log" );

        afterEach( function () {
            fs.removeSync( logFilePath );
        } );

        it( "creates a log file and logs four messages", function ( done ) {
            var log = Logulus.create( module.id );
            log.debug( "This is a 'debug' message." );
            log.info( "This is an 'info' message." );
            log.warn( "This is a 'warn' message." );
            log.error( "This is an 'error' message." );

            var intervalObj = setInterval( onInterval, 1000 );

            var counter = 0;

            function onInterval() {
                counter++;
                if (fs.existsSync( logFilePath ) || counter >= 5) {
                    clearInterval( intervalObj );
                    fs.readFile( logFilePath, "utf8", function ( error, data ) {
                        expect( data ).to.include( "debug" );
                        expect( data ).to.include( "info" );
                        expect( data ).to.include( "warn" );
                        expect( data ).to.include( "error" );
                        done();
                    } );
                }
            }

        } );

    } );

    describe( "logulus proxy", function () {
        it( "creates a proxy", function ( done ) {
            var log = Logulus.create( module.id );
            expect( log ).to.be.an.instanceOf( LogulusProxy );
            expect( log.moduleId ).to.contain( "/logulus/tests/logulus_tests.js" );
            expect( log.debug ).to.be.instanceOf( Function );
            expect( log.info ).to.be.instanceOf( Function );
            expect( log.warn ).to.be.instanceOf( Function );
            expect( log.error ).to.be.instanceOf( Function );
            done();
        } );
    } );

    describe( "local timestamp", function () {
        it( "creates a default timestamp", function ( done ) {
            Logulus.config.timestampSettings.includeDate = true;
            Logulus.config.timestampSettings.includeMilliseconds = true;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).to.eql( "1968-08-31 17:45:00.000" );
            done();
        } );

        it( "creates timestamp without date", function ( done ) {
            Logulus.config.timestampSettings.includeDate = false;
            Logulus.config.timestampSettings.includeMilliseconds = true;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).to.eql( "17:45:00.000" );
            done();
        } );

        it( "creates timestamp without milliseconds", function ( done ) {
            Logulus.config.timestampSettings.includeDate = true;
            Logulus.config.timestampSettings.includeMilliseconds = false;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).to.eql( "1968-08-31 17:45:00" );
            done();
        } );

        it( "creates timestamp without date and milliseconds", function ( done ) {
            Logulus.config.timestampSettings.includeDate = false;
            Logulus.config.timestampSettings.includeMilliseconds = false;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).to.eql( "17:45:00" );
            done();
        } );

    } );

    describe( "message filtering", function () {

        beforeEach( function () {
            Logulus.config.includeFilters = [];
            Logulus.config.excludeFilters = [];
        } );

        it( "prevents all modules from messaging by default", function ( done ) {
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).to.eql( false );
            done();
        } );

        it( "allows all modules to message", function ( done ) {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).to.eql( true );
            done();
        } );

        it( "allows no modules with '/tests/' in the path to message", function ( done ) {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            Logulus.config.excludeFilters.push( {pattern: "/tests/", levels: ["debug", "info", "warn", "error"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).to.eql( false );
            done();
        } );

        it( "allows an excluded module to message with the correct level", function ( done ) {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            Logulus.config.excludeFilters.push( {pattern: "/tests/", levels: ["debug", "info"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).to.eql( false );
            isAllowed = Logulus.isAllowed( module.id, "error" );
            expect( isAllowed ).to.eql( true );
            done();
        } );

        it( "allows an included module to message with the correct level", function ( done ) {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["warn", "error"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).to.eql( false );
            isAllowed = Logulus.isAllowed( module.id, "error" );
            expect( isAllowed ).to.eql( true );
            done();
        } );

    } );

    describe( "configuration", function () {

        it( "loads from an environment variable", function ( done ) {
            process.env.LOGULUS_CONFIG = "tests/fixtures/environment.json";
            Logulus.config = null;
            Logulus._loadConfig();
            expect( Logulus.config ).to.be.an.instanceOf( Object );
            expect( Logulus.config.baseName ).to.eql( "environment" );
            done();
        } );

        it( "loads from a host file in the application directory", function ( done ) {
            delete process.env.LOGULUS_CONFIG;
            Logulus.config = null;
            var hostnameFunction = os.hostname;
            os.hostname = function () {
                return "testhost.local";
            };
            Logulus._loadConfig();
            expect( Logulus.config ).to.be.an.instanceOf( Object );
            expect( Logulus.config.baseName ).to.eql( "development" );
            os.hostname = hostnameFunction;
            done();
        } );


    } );

} );