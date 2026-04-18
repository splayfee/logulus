"use strict";

var os = require( "os" );

var Logulus = require( "../lib/logulus" );

describe( "Logulus", function () {

    describe( "local timestamp", function () {
        it( "creates a default timestamp", function () {
            Logulus.config.timestampSettings.includeDate = true;
            Logulus.config.timestampSettings.includeMilliseconds = true;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).toEqual( "1968-08-31 17:45:00.000" );
        } );

        it( "creates timestamp without date", function () {
            Logulus.config.timestampSettings.includeDate = false;
            Logulus.config.timestampSettings.includeMilliseconds = true;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).toEqual( "17:45:00.000" );
        } );

        it( "creates timestamp without milliseconds", function () {
            Logulus.config.timestampSettings.includeDate = true;
            Logulus.config.timestampSettings.includeMilliseconds = false;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).toEqual( "1968-08-31 17:45:00" );
        } );

        it( "creates timestamp without date and milliseconds", function () {
            Logulus.config.timestampSettings.includeDate = false;
            Logulus.config.timestampSettings.includeMilliseconds = false;
            var timestamp = Logulus.localTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).toEqual( "17:45:00" );
        } );

    } );

    describe( "message filtering", function () {

        beforeEach( function () {
            Logulus.config.includeFilters = [];
            Logulus.config.excludeFilters = [];
        } );

        it( "prevents all modules from messaging by default", function () {
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).toEqual( false );
        } );

        it( "allows all modules to message", function () {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).toEqual( true );
        } );

        it( "allows an included module to message with the correct level", function () {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["warn", "error"]} );
            var isAllowed = Logulus.isAllowed( module.id, "debug" );
            expect( isAllowed ).toEqual( false );
            isAllowed = Logulus.isAllowed( module.id, "error" );
            expect( isAllowed ).toEqual( true );
        } );

        it( "denies messages when no include filters are defined", function () {
            // No include filters set
            var isAllowed = Logulus.isAllowed( "test-module", "debug" );
            expect( isAllowed ).toEqual( false );
        } );

        it( "allows all levels when include filter has level '*'", function () {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            var isAllowed = Logulus.isAllowed( "test-module", "debug" );
            expect( isAllowed ).toEqual( true );
            isAllowed = Logulus.isAllowed( "test-module", "info" );
            expect( isAllowed ).toEqual( true );
        } );

        it( "respects exclude filter that overrides include filter", function () {
            Logulus.config.includeFilters.push( {pattern: "*", levels: ["debug", "info", "warn", "error"]} );
            Logulus.config.excludeFilters.push( {pattern: "admin", levels: ["debug", "info"]} );
            var isAllowed = Logulus.isAllowed( "admin-panel", "debug" );
            expect( isAllowed ).toEqual( false );
            isAllowed = Logulus.isAllowed( "admin-panel", "error" );
            expect( isAllowed ).toEqual( true );
        } );

    } );

    describe( "configuration", function () {

        it( "loads from an environment variable", function () {
            process.env.LOGULUS_CONFIG = "tests/fixtures/environment.json";
            Logulus.config = null;
            Logulus._loadConfig();
            expect( Logulus.config ).toBeInstanceOf( Object );
            expect( Logulus.config.baseName ).toEqual( "environment" );
        } );

        it( "loads from a host file in the application directory", function () {
            delete process.env.LOGULUS_CONFIG;
            Logulus.config = null;
            var hostnameFunction = os.hostname;
            os.hostname = function () {
                return "testhost.local";
            };
            Logulus._loadConfig();
            expect( Logulus.config ).toBeInstanceOf( Object );
            expect( Logulus.config.baseName ).toEqual( "development" );
            os.hostname = hostnameFunction;
        } );

        it( "handles invalid environment config file gracefully", function () {
            process.env.LOGULUS_CONFIG = "tests/fixtures/invalid.json";
            Logulus.config = null;
            Logulus._loadConfig();
            // Should have loaded default config since invalid file couldn't be parsed
            expect( Logulus.config ).toBeInstanceOf( Object );
        } );

        it( "handles non-existent environment config path gracefully", function () {
            process.env.LOGULUS_CONFIG = "/path/that/does/not/exist/config.json";
            Logulus.config = null;
            Logulus._loadConfig();
            // Should have loaded default config since file doesn't exist
            expect( Logulus.config ).toBeInstanceOf( Object );
        } );

    } );

} );
