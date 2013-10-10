//////////////////////////////////
// String Utilities
//////////////////////////////////

// from http://www.codeproject.com/Tips/201899/String-Format-in-JavaScript
String.prototype.format = function (args) {
    var str = this;
    return str.replace(String.prototype.format.regex, function(item) {
        var intVal = parseInt(item.substring(1, item.length - 1));
        var replace;
        if (intVal >= 0) {
            replace = args[intVal];
        } else if (intVal === -1) {
            replace = "{";
        } else if (intVal === -2) {
            replace = "}";
        } else {
            replace = "";
        }
        return replace;
    });
};
String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

/* Sample usage.
var str = "She {1} {0}{2} by the {0}{3}. {-1}^_^{-2}";
str = str.format(["sea", "sells", "shells", "shore"]);
alert(str); */

var dateToString = function( d ) {
    var h = d.getHours();
    if ( h<10 ) {
        h = "0"+h;
    }
    var m = d.getMinutes();
    if ( m<10 ) {
        m = "0"+m;
    }
    return d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + " " + d.getDay() + " " + h + ":" + m;
}

var stripTags = function( str ) {
    return str.replace(/<(?:.|\n)*?>/gm, '');
}

// capitalize: capitalize the first letter of a string
function capitalize( string ) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function dataToString( d ) {
    var result = "";
    for ( key in d ) {
        result += key + ": " + d[key] + "; ";
    }
    result = result.slice( 0, result.length-2 );
    return result;
}

//////////////////////////////////
// Array Utilities
//////////////////////////////////

function indexInArray( el, arr ) {
    var idx = -1;
    for ( var i=0; i<arr.length; i++ ) {
        if ( arr[i]==el ) {
            idx = i;
            break;
        }
    }
    return idx;
}

function compareArrays( R, S ) {
    if ( R.length==0 ) {
        return true;
    } else if ( S.length==0 ) {
        return true;
    } else {
        return ( (R[0]==S[0]) && compareArrays( R.slice(1,R.length), S.slice(1,S.length) ) );
    }
}

var range = function(start, end) {
    var foo = [];
    for (var i = start; i <= end; i++)
        foo.push(i);
    return foo;
}

var subset = function( L, I ) {
    var foo = [];
    for (var i=0; i<I.length; i++) {
        foo.push( L[I[i]] );
    }
    return foo;
}

var repeat = function(x,n) {
    var foo = new Array( n );
    for (var i = 0; i < n; i++) {
        foo[i] = x;
    }
    return foo;
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]

function shuffle(o) { //v1.0
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

function shuffle_by(arr,ord) {
    var new_arr = arr.slice();
    for ( var i=0; i<arr.length; i++ ) {
        arr[i]=new_arr[ord[i]];
    }
    return arr;
}

improvedShuffle = function( arr ) {
    var ord = [];
    for ( var i=0; i<arr.length; i++ ) {
        ord.push( i );
    }
    shuffle( ord );
    var new_arr = shuffle_by( arr, ord );
    return { "array": new_arr, "order": ord };
}

function sum( arr ) {
    var result=0;
    for ( var i=0; i<arr.length; i++ ) {
        result += arr[i];
    }
    return result;
}


// interleave: if l and m are two equally long arrays,
// return an array containing all elements of l and m in interleaved order
var interleave = function( l, m ) {
    var result=[];
    for ( var i=0; i<l.length; i++ ) {
        result.push( l[i] );
        result.push( m[i] );
    }
    return result;
}
// field: given an array of objects, return an array of a designated property of those objects
function field( objects, property_name ) {
    var result = [];
    for ( var i=0; i<objects.length; i++ ) {
        result.push( objects[i][property_name] );
    }
    return result;
}

// nextEl: given an element in an array, return the element of the array immediately after that element
function nextEl( arr, el ) {
    var idx = arr.indexOf( el );
    var new_idx = ( idx+1 ) % arr.length;
    return arr[ new_idx ];
}


//////////////////////////////////
// Math Utilities
//////////////////////////////////

var random_choice = function( N ) {
    return Math.floor( Math.random()*N );
}


//////////////////////////////////
// Other Utilities
//////////////////////////////////

//
// This method Gets URL Parameters (GUP)
// (from Amazon's MTurk command line tools pack)
function gup( name )
{
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var tmpURL = window.location.href;
  var results = regex.exec( tmpURL );
  if( results == null )
    return "";
  else
    return results[1];
}


// functions dealing with cookies / local storage

function are_cookies_enabled() {
	var cookieEnabled = (navigator.cookieEnabled) ? true : false;

	if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled)
	{ 
		document.cookie="testcookie";
		cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
	}
	return (cookieEnabled);
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}

function checkLocalStorage( key, value ) {
    if ( localStorage ) {
    // if ( localStorage && false ) {  // testing only
        return localStorage.getItem( key )==value;
    } else if ( are_cookies_enabled() ) {
        return readCookie( key )==value;
    } else {
        return false;
    }
}

function getLocalStorage( keys ) {
    var result = {};
    if ( localStorage ) {
    // if ( localStorage && false ) {  // testing only
        console.log( "getLocalStorage retrieving information from local storage." );
        for ( var i=0; i<keys.length; i++ ) {
            result[ keys[i] ] = localStorage.getItem( keys[i] );
        }
    } else if ( are_cookies_enabled() ) {
        console.log( "getLocalStorage retrieving information from cookies." );
        for ( var i=0; i<keys.length; i++ ) {
            result[ keys[i] ] = readCookie( keys[i] );
        }
    } else {
        console.log( "getLocalStorage failed: local storage not supported." );
    }
    return result;
}

function setLocalStorage( arr ) {
    if ( localStorage ) {
    // if ( localStorage && false ) {  // testing only
        console.log( "setLocalStorage saving information to local storage." );
        for ( var key in arr ) { localStorage[ key ] = arr[ key ]; }
    } else if ( are_cookies_enabled() ) {
        console.log( "setLocalStorage saving information using cookies." );
        for ( var key in arr ) { createCookie( key, arr[ key ], 1 ); }
    } else {
        console.log( "setLocalStorage failed: local storage not supported." );
    }
}

function clearLocalStorage( keys ) {
    if ( localStorage ) {
    // if ( localStorage && false ) {  // testing only
        console.log( "clearLocalStorage clearing localStorage." );
        for ( var i=0; i<keys.length; i++ ) { localStorage.removeItem( keys[i] ); }
    } else if ( are_cookies_enabled() ) {
        console.log( "setLocalStorage clearing cookies." );
        for ( var i=0; i<keys.length; i++ ) { eraseCookie( keys[i] ); }
    } else {
        console.log( "clearLocalStorage called, but localStorage not enabled." );
    }
}

