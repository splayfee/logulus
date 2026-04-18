"use strict";

var log = require( "../lib/logulus" ).create( module.id );

describe( "Logulus Proxy", function () {

    describe( "upon instantiation", function () {

        it( "dynamically creates a series of methods based on levels settings", function () {
            expect( log.debug ).toBeInstanceOf( Function );
            expect( log.debug.length ).toEqual( 3 );
            expect( log.info ).toBeInstanceOf( Function );
            expect( log.info.length ).toEqual( 3 );
            expect( log.warn ).toBeInstanceOf( Function );
            expect( log.warn.length ).toEqual( 3 );
            expect( log.error ).toBeInstanceOf( Function );
            expect( log.error.length ).toEqual( 3 );

        } );

    } );

} );
