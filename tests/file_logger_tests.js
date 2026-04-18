"use strict";

var fs = require( "fs-extra" );
var path = require( "path" );

var FileLogger = require( "../lib/file_logger" );


describe( "File Logger", function () {

    describe( "instantiation", function () {

        it( "creates a new file logger", function () {
            var logger = new FileLogger();
            expect( logger ).toBeInstanceOf( FileLogger );
        } );

    } );

    describe( "default timestamp", function () {
        it( "creates a default timestamp", function () {
            var timestamp = FileLogger._defaultTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).toEqual( "17:45:00" );
        } );

        it( "creates a timestamp base on current time", function () {
            var timestamp = FileLogger._defaultTimestamp();
            expect( timestamp ).toBeTypeOf( "string" );
            expect( timestamp ).toHaveLength( 8 );
        } );

    } );

    describe( "logging", function () {

        var logPath = path.resolve( ".", "logulus.log" );
        beforeEach( function () {
            fs.removeSync( logPath );
        } );

        afterEach( function () {
            fs.removeSync( logPath );
        } );

        it( "doesn't log a message using the transport", function () {
            var logger = new FileLogger();
            logger.silent = true;
            return new Promise( function ( resolve, reject ) {
                logger.log( "debug", "This is a test", {name: "David", age: 46}, function ( error ) {
                    try {
                        expect( error ).toEqual( null );
                        resolve();
                    } catch (assertionError) {
                        reject( assertionError );
                    }
                } );
            } );
        } );

        it( "logs a message using the transport", function () {
            var logger = new FileLogger();
            return new Promise( function ( resolve, reject ) {
                logger.log( "debug", "This is a test", {name: "David", age: 46}, function ( error ) {
                    try {
                        expect( error ).toEqual( null );
                        resolve();
                    } catch (assertionError) {
                        reject( assertionError );
                    }
                } );
            } );
        } );
    } );

    describe( "get file path", function () {
        it( "returns a fully qualified file path", function () {
            var logger = new FileLogger();
            var filePath = logger._getFilePath( 6 );
            expect( filePath ).toContain( "/logulus-6.log" );
        } );
    } );

     describe( "log rotation", function () {

        it( "rotates the logs by changing the name of the current files", function () {
            var logger = new FileLogger();
            return new Promise( function ( resolve, reject ) {
                logger.log( "debug", "This is a test ", {name: "David", age: 46}, function ( error ) {
                    try {
                        expect( error ).toEqual( null );
                    } catch (assertionError) {
                        reject( assertionError );
                        return;
                    }
                    logger.nextFile( function ( nextError ) {
                        try {
                            expect( nextError ).toEqual( null );
                            fs.removeSync( path.resolve( ".", "logulus-1.log" ) );
                            resolve();
                        } catch (assertionError) {
                            reject( assertionError );
                        }
                    } );
                } );
            } );
        } );

    } );

    describe( "get file path", function () {
        it( "returns a fully qualified file path", function () {
            var logger = new FileLogger();
            var filePath = logger._getFilePath( 6 );
            expect( filePath ).toContain( "/logulus/logulus-6.log" );
        } );
    } );

} );
