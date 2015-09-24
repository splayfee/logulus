"use strict";

var fs = require( "fs-extra" );
var path = require( "path" );

var chai = require( "chai" );
var expect = chai.expect;

var FileLogger = require( "../lib/file_logger" );


describe( "File Logger", function () {

    describe( "instantiation", function () {

        it( "creates a new file logger", function ( done ) {
            var logger = new FileLogger();
            expect( logger ).to.be.an.instanceOf( FileLogger );
            done();
        } );

    } );

    describe( "default timestamp", function () {
        it( "creates a default timestamp", function ( done ) {
            var timestamp = FileLogger._defaultTimestamp( new Date( "8/31/1968 5:45 pm" ) );
            expect( timestamp ).to.eql( "17:45:00" );
            done();
        } );

        it( "creates a timestamp base on current time", function ( done ) {
            var timestamp = FileLogger._defaultTimestamp();
            expect( typeof timestamp ).to.eql( "string" );
            expect( timestamp ).to.have.length( 8 );
            done();
        } );

    } );

    describe( "logging", function () {

        var logPath = path.resolve( ".", "logulus.log" );
        beforeEach( function () {
            fs.deleteSync( logPath );
        } );

        afterEach( function () {
            fs.deleteSync( logPath );
        } );

        it( "doesn't log a message using the transport", function ( done ) {
            var logger = new FileLogger();
            logger.silent = true;
            logger.log( "debug", "This is a test", {name: "David", age: 46}, function ( error ) {
                expect( error ).to.eql( null );
                done();
            } );
        } );

        it( "logs a message using the transport", function ( done ) {
            var logger = new FileLogger();
            logger.log( "debug", "This is a test", {name: "David", age: 46}, function ( error ) {
                expect( error ).to.eql( null );
                done();
            } );
        } );
    } );

    describe( "get file path", function () {
        it( "returns a fully qualified file path", function ( done ) {
            var logger = new FileLogger();
            var filePath = logger._getFilePath( 6 );
            expect( filePath ).to.contain( "/logulus-6.log" );
            done();
        } );
    } );

    describe( "log rotation", function () {

        it( "rotates the logs by changing the name of the current files", function ( done ) {
            var logger = new FileLogger();
            logger.log( "debug", "This is a test", {name: "David", age: 46}, function ( error ) {
                expect( error ).to.eql( null );
                logger.nextFile( function ( error ) {
                    expect( error ).to.eql( null );
                    fs.deleteSync( path.resolve( ".", "logulus-1.log" ) );
                    done();
                } );
            } );
        } );

    } );

    describe( "get file path", function () {
        it( "returns a fully qualified file path", function ( done ) {
            var logger = new FileLogger();
            var filePath = logger._getFilePath( 6 );
            expect( filePath ).to.contain( "/logulus/logulus-6.log" );
            done();
        } );
    } );

} );