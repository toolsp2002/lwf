/**
 * @author sole / http://soledadpenades.com
 * @author mrdoob / http://mrdoob.com
 * @author Robert Eisele / http://www.xarg.org
 * @author Philippe / http://philippe.elsass.me
 * @author Robert Penner / http://www.robertpenner.com/easing_terms_of_use.html
 * @author Paul Lewis / http://www.aerotwist.com/
 * @author lechecacharro
 * @author Josh Faul / http://jocafa.com/
 * @author egraether / http://egraether.com/
 * @author endel / http://endel.me
 * @author GREE, Inc.
 *
 * The MIT License
 *
 * Copyright (c) 2010-2012 Tween.js authors.
 * Copyright (c) 2012 GREE, Inc.
 *
 * Easing equations
 *   Copyright (c) 2001 Robert Penner http://robertpenner.com/easing/
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function() {

var TWEENLWF = {};

TWEENLWF.REVISION = '10';

TWEENLWF.Tween = function ( movie ) {

	this.lwf = movie.lwf;
	this.object = movie;
	this.valuesStart = {};
	this.valuesEnd = {};
	this.valuesStartRepeat = {};
	this.duration = 0;
	this.repeat = 0;
	this.delayTime = 0;
	this.startTime = null;
	this.easingFunction = TWEENLWF.Easing.Linear.None;
	this.interpolationFunction = TWEENLWF.Interpolation.Linear;
	this.chainedTweens = [];
	this.onStartCallback = null;
	this.onStartCallbackFired = false;
	this.onUpdateCallback = null;
	this.onCompleteCallback = null;

	if ( this.lwf._tweens === null ) {

		this.lwf._tweens = [];

		if ( this.lwf._tweenMode === "lwf" ) {

			this.lwf.addExecHandler( TWEENLWF._tweenExecHandler );

		} else {

			this.lwf.addMovieEventHandler( "_root", {

				"enterFrame": TWEENLWF._tweenMovieHandler

			});

		}

	}

	this.to = function ( properties, duration ) {

		if ( duration !== undefined ) {

			this.duration = duration * this.lwf.tick;

		}

		this.valuesEnd = properties;

		return this;

	};

	this.start = function () {

		this.lwf._tweens.push( this );

		this.onStartCallbackFired = false;

		this.startTime = this.lwf.time;
		this.startTime += this.delayTime;

		for ( var property in this.valuesEnd ) {

			// This prevents the engine from interpolating null values
			if ( this.object[ property ] === null ) {

				continue;

			}

			// check if an Array was provided as property value
			if ( this.valuesEnd[ property ] instanceof Array ) {

				if ( this.valuesEnd[ property ].length === 0 ) {

					continue;

				}

				// create a local copy of the Array with the start value at the front
				this.valuesEnd[ property ] = [ this.object[ property ] ].concat( this.valuesEnd[ property ] );

			}

			this.valuesStart[ property ] = this.object[ property ];

			if( ( this.valuesStart[ property ] instanceof Array ) === false ) {
				this.valuesStart[ property ] *= 1.0; // Ensures we're using numbers, not strings
			}

			this.valuesStartRepeat[ property ] = this.valuesStart[ property ] || 0;

		}

		return this;

	};

	this.stop = function () {

		var i = this.lwf._tweens.indexOf( this );

		if ( i !== -1 ) {

			this.lwf._tweens.splice( i, 1 );

			if ( this.lwf._tweens.length == 0 ) {

				this.lwf.stopTweens();

			}

		}

		return this;

	};

	this.delay = function ( amount ) {

		this.delayTime = amount * this.lwf.tick;
		return this;

	};

	this.repeat = function ( times ) {

		this.repeat = times;
		return this;

	};

	this.easing = function ( easing ) {

		this.easingFunction = easing;
		return this;

	};

	this.interpolation = function ( interpolation ) {

		this.interpolationFunction = interpolation;
		return this;

	};

	this.chain = function ( chainedTween ) {

		if ( typeof chainedTween !== "undefined" && chainedTween !== null ) {

			this.chainedTweens.push( chainedTween );
			return this;

		} else {

			chainedTween = new TWEENLWF.Tween( this.object );
			this.chainedTweens.push( chainedTween );
			return chainedTween;

		}

	};

	this.onStart = function ( callback ) {

		this.onStartCallback = callback;
		return this;

	};

	this.onUpdate = function ( callback ) {

		this.onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function ( callback ) {

		this.onCompleteCallback = callback;
		return this;

	};

	this.update = function ( time ) {

		if ( time < this.startTime ) {

			return true;

		}

		if ( this.object[ "property" ] === null ) {

			return false;

		}

		if ( this.onStartCallbackFired === false ) {

			if ( this.onStartCallback !== null ) {

				this.onStartCallback.call( this.object );

			}

			this.onStartCallbackFired = true;

		}

		var duration = this.duration <= 0 ? this.lwf.tick : this.duration;

		var elapsed = ( time - this.startTime ) / duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		var value = this.easingFunction( elapsed );

		for ( var property in this.valuesEnd ) {

			var start = this.valuesStart[ property ] || 0;
			var end = this.valuesEnd[ property ];

			if ( end instanceof Array ) {

				this.object[ property ] = this.interpolationFunction( end, value );

			} else {

				if ( typeof(end) === "string" ) {
					end = start + parseFloat(end, 10);
				}

				this.object[ property ] = start + ( end - start ) * value;

			}

		}

		if ( this.onUpdateCallback !== null ) {

			this.onUpdateCallback.call( this.object, value );

		}

		if ( elapsed == 1 ) {

			if ( this.repeat > 0 ) {

				if( isFinite( this.repeat ) ) {
					this.repeat--;
				}

				// reassign starting values, restart by making startTime = now
				for( var property in this.valuesStartRepeat ) {

					if ( typeof( this.valuesEnd[ property ] ) === "string" ) {
						this.valuesStartRepeat[ property ] = this.valuesStartRepeat[ property ] + parseFloat(this.valuesEnd[ property ], 10);
					}

					this.valuesStart[ property ] = this.valuesStartRepeat[ property ];

				}

				this.startTime = time + this.delayTime;

				return true;

			} else {

				if ( this.onCompleteCallback !== null ) {

					this.onCompleteCallback.call( this.object );

				}

				for ( var i = 0, l = this.chainedTweens.length; i < l; i ++ ) {

					this.chainedTweens[ i ].start( time );

				}

				return false;

			}

		}

		return true;

	};

	this[ "to" ] = this.to;
	this[ "start" ] = this.start;
	this[ "stop" ] = this.stop;
	this[ "delay" ] = this.delay;
	this[ "easing" ] = this.easing;
	this[ "interpolation" ] = this.interpolation;
	this[ "chain" ] = this.chain;
	this[ "onStart" ] = this.onStart;
	this[ "onUpdate" ] = this.onUpdate;
	this[ "onComplete" ] = this.onComplete;
	this[ "update" ] = this.update;

};

TWEENLWF.Easing = {

	Linear: {

		None: function ( k ) {

			return k;

		}

	},

	Quadratic: {

		In: function ( k ) {

			return k * k;

		},

		Out: function ( k ) {

			return k * ( 2 - k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
			return - 0.5 * ( --k * ( k - 2 ) - 1 );

		}

	},

	Cubic: {

		In: function ( k ) {

			return k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k + 2 );

		}

	},

	Quartic: {

		In: function ( k ) {

			return k * k * k * k;

		},

		Out: function ( k ) {

			return 1 - ( --k * k * k * k );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
			return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

		}

	},

	Quintic: {

		In: function ( k ) {

			return k * k * k * k * k;

		},

		Out: function ( k ) {

			return --k * k * k * k * k + 1;

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
			return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

		}

	},

	Sinusoidal: {

		In: function ( k ) {

			return 1 - Math.cos( k * Math.PI / 2 );

		},

		Out: function ( k ) {

			return Math.sin( k * Math.PI / 2 );

		},

		InOut: function ( k ) {

			return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

		}

	},

	Exponential: {

		In: function ( k ) {

			return k === 0 ? 0 : Math.pow( 1024, k - 1 );

		},

		Out: function ( k ) {

			return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

		},

		InOut: function ( k ) {

			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
			return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

		}

	},

	Circular: {

		In: function ( k ) {

			return 1 - Math.sqrt( 1 - k * k );

		},

		Out: function ( k ) {

			return Math.sqrt( 1 - ( --k * k ) );

		},

		InOut: function ( k ) {

			if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
			return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

		},

		Out: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

		},

		InOut: function ( k ) {

			var s, a = 0.1, p = 0.4;
			if ( k === 0 ) return 0;
			if ( k === 1 ) return 1;
			if ( !a || a < 1 ) { a = 1; s = p / 4; }
			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
			if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
			return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

		}

	},

	Back: {

		In: function ( k ) {

			var s = 1.70158;
			return k * k * ( ( s + 1 ) * k - s );

		},

		Out: function ( k ) {

			var s = 1.70158;
			return --k * k * ( ( s + 1 ) * k + s ) + 1;

		},

		InOut: function ( k ) {

			var s = 1.70158 * 1.525;
			if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
			return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

		}

	},

	Bounce: {

		In: function ( k ) {

			return 1 - TWEENLWF.Easing.Bounce.Out( 1 - k );

		},

		Out: function ( k ) {

			if ( k < ( 1 / 2.75 ) ) {

				return 7.5625 * k * k;

			} else if ( k < ( 2 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

			} else if ( k < ( 2.5 / 2.75 ) ) {

				return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

			} else {

				return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

			}

		},

		InOut: function ( k ) {

			if ( k < 0.5 ) return TWEENLWF.Easing.Bounce.In( k * 2 ) * 0.5;
			return TWEENLWF.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

		}

	}

};

TWEENLWF.Interpolation = {

	Linear: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEENLWF.Interpolation.Utils.Linear;

		if ( k < 0 ) return fn( v[ 0 ], v[ 1 ], f );
		if ( k > 1 ) return fn( v[ m ], v[ m - 1 ], m - f );

		return fn( v[ i ], v[ i + 1 > m ? m : i + 1 ], f - i );

	},

	Bezier: function ( v, k ) {

		var b = 0, n = v.length - 1, pw = Math.pow, bn = TWEENLWF.Interpolation.Utils.Bernstein, i;

		for ( i = 0; i <= n; i++ ) {
			b += pw( 1 - k, n - i ) * pw( k, i ) * v[ i ] * bn( n, i );
		}

		return b;

	},

	CatmullRom: function ( v, k ) {

		var m = v.length - 1, f = m * k, i = Math.floor( f ), fn = TWEENLWF.Interpolation.Utils.CatmullRom;

		if ( v[ 0 ] === v[ m ] ) {

			if ( k < 0 ) i = Math.floor( f = m * ( 1 + k ) );

			return fn( v[ ( i - 1 + m ) % m ], v[ i ], v[ ( i + 1 ) % m ], v[ ( i + 2 ) % m ], f - i );

		} else {

			if ( k < 0 ) return v[ 0 ] - ( fn( v[ 0 ], v[ 0 ], v[ 1 ], v[ 1 ], -f ) - v[ 0 ] );
			if ( k > 1 ) return v[ m ] - ( fn( v[ m ], v[ m ], v[ m - 1 ], v[ m - 1 ], f - m ) - v[ m ] );

			return fn( v[ i ? i - 1 : 0 ], v[ i ], v[ m < i + 1 ? m : i + 1 ], v[ m < i + 2 ? m : i + 2 ], f - i );

		}

	},

	Utils: {

		Linear: function ( p0, p1, t ) {

			return ( p1 - p0 ) * t + p0;

		},

		Bernstein: function ( n , i ) {

			var fc = TWEENLWF.Interpolation.Utils.Factorial;
			return fc( n ) / fc( i ) / fc( n - i );

		},

		Factorial: ( function () {

			var a = [ 1 ];

			return function ( n ) {

				var s = 1, i;
				if ( a[ n ] ) return a[ n ];
				for ( i = n; i > 1; i-- ) s *= i;
				return a[ n ] = s;

			};

		} )(),

		CatmullRom: function ( p0, p1, p2, p3, t ) {

			var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
			return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

		}

	}

};

var lwfPrototype = global[ "LWF" ][ "LWF" ].prototype;

lwfPrototype[ "setTweenMode" ] = function( mode ) {

	this._tweenMode = mode;

};

lwfPrototype.stopTweens = function() {

	if ( this._tweens !== null ) {

		this._tweens = null;

		this.removeExecHandler( TWEENLWF._tweenExecHandler );
		this.removeMovieEventHandler( "_root", {
			
			"enterFrame": TWEENLWF._tweenMovieHandler

		});

	}

};

lwfPrototype[ "stopTweens" ] = lwfPrototype.stopTweens;

TWEENLWF._tweenUpdater = function() {

	if ( this._tweens === null )
		return;

	var i = 0;
	var num_tweens = this._tweens.length;
	var time = this.time;

	while ( i < num_tweens ) {

		if ( this._tweens[ i ].update( time ) ) {

			i ++;

		} else {

			this._tweens.splice( i, 1 );
			num_tweens --;

		}

	}

	if ( this._tweens.length == 0 ) {

		this.stopTweens();

	}

};

TWEENLWF._tweenExecHandler = function() {

	TWEENLWF._tweenUpdater.call( this );

};

TWEENLWF._tweenMovieHandler = function() {

	TWEENLWF._tweenUpdater.call( this.lwf );

};

var moviePrototype = global[ "LWF" ][ "Movie" ].prototype;

moviePrototype[ "addTween" ] = function() {

	var tween = new TWEENLWF.Tween( this );

	return tween;

};

moviePrototype[ "stopTweens" ] = function() {

	if ( typeof this.lwf === "undefined" || this.lwf === null ||
			this.lwf._tweens === null ) {

		return this;

	}

	var tweens = this.lwf._tweens;

	var i = 0;
	var num_tweens = tweens.length;

	while ( i < num_tweens ) {

		if ( tweens[ i ].object === this ) {

			tweens.splice( i, 1 );
			num_tweens --;

		} else {

			i ++;

		}

	}

	if ( tweens.length == 0 ) {

		this.lwf.stopTweens();

	}

	return this;

};

global[ "LWF" ][ "Tween" ] = TWEENLWF.Tween;
global[ "LWF" ][ "Tween" ][ "Easing" ] = TWEENLWF.Easing;
var e = global[ "LWF" ][ "Tween" ][ "Easing" ];
e[ "Linear" ] = TWEENLWF.Easing.Linear;
e[ "Linear" ][ "None" ] = TWEENLWF.Easing.Linear.None;
e[ "Quadratic" ] = TWEENLWF.Easing.Quadratic;
e[ "Quadratic" ][ "In" ] = TWEENLWF.Easing.Quadratic.In;
e[ "Quadratic" ][ "Out" ] = TWEENLWF.Easing.Quadratic.Out;
e[ "Quadratic" ][ "InOut" ] = TWEENLWF.Easing.Quadratic.InOut;
e[ "Cubic" ] = TWEENLWF.Easing.Cubic;
e[ "Cubic" ][ "In" ] = TWEENLWF.Easing.Cubic.In;
e[ "Cubic" ][ "Out" ] = TWEENLWF.Easing.Cubic.Out;
e[ "Cubic" ][ "InOut" ] = TWEENLWF.Easing.Cubic.InOut;
e[ "Quartic" ] = TWEENLWF.Easing.Quartic;
e[ "Quartic" ][ "In" ] = TWEENLWF.Easing.Quartic.In;
e[ "Quartic" ][ "Out" ] = TWEENLWF.Easing.Quartic.Out;
e[ "Quartic" ][ "InOut" ] = TWEENLWF.Easing.Quartic.InOut;
e[ "Quintic" ] = TWEENLWF.Easing.Quintic;
e[ "Quintic" ][ "In" ] = TWEENLWF.Easing.Quintic.In;
e[ "Quintic" ][ "Out" ] = TWEENLWF.Easing.Quintic.Out;
e[ "Quintic" ][ "InOut" ] = TWEENLWF.Easing.Quintic.InOut;
e[ "Sinusoidal" ] = TWEENLWF.Easing.Sinusoidal;
e[ "Sinusoidal" ][ "In" ] = TWEENLWF.Easing.Sinusoidal.In;
e[ "Sinusoidal" ][ "Out" ] = TWEENLWF.Easing.Sinusoidal.Out;
e[ "Sinusoidal" ][ "InOut" ] = TWEENLWF.Easing.Sinusoidal.InOut;
e[ "Exponential" ] = TWEENLWF.Easing.Exponential;
e[ "Exponential" ][ "In" ] = TWEENLWF.Easing.Exponential.In;
e[ "Exponential" ][ "Out" ] = TWEENLWF.Easing.Exponential.Out;
e[ "Exponential" ][ "InOut" ] = TWEENLWF.Easing.Exponential.InOut;
e[ "Circular" ] = TWEENLWF.Easing.Circular;
e[ "Circular" ][ "In" ] = TWEENLWF.Easing.Circular.In;
e[ "Circular" ][ "Out" ] = TWEENLWF.Easing.Circular.Out;
e[ "Circular" ][ "InOut" ] = TWEENLWF.Easing.Circular.InOut;
e[ "Elastic" ] = TWEENLWF.Easing.Elastic;
e[ "Elastic" ][ "In" ] = TWEENLWF.Easing.Elastic.In;
e[ "Elastic" ][ "Out" ] = TWEENLWF.Easing.Elastic.Out;
e[ "Elastic" ][ "InOut" ] = TWEENLWF.Easing.Elastic.InOut;
e[ "Back" ] = TWEENLWF.Easing.Back;
e[ "Back" ][ "In" ] = TWEENLWF.Easing.Back.In;
e[ "Back" ][ "Out" ] = TWEENLWF.Easing.Back.Out;
e[ "Back" ][ "InOut" ] = TWEENLWF.Easing.Back.InOut;
e[ "Bounce" ] = TWEENLWF.Easing.Bounce;
e[ "Bounce" ][ "In" ] = TWEENLWF.Easing.Bounce.In;
e[ "Bounce" ][ "Out" ] = TWEENLWF.Easing.Bounce.Out;
e[ "Bounce" ][ "InOut" ] = TWEENLWF.Easing.Bounce.InOut;

global[ "LWF" ][ "Tween" ][ "Interpolation" ] = TWEENLWF.Interpolation;
var i = global[ "LWF" ][ "Tween" ][ "Interpolation" ];
i[ "Linear" ] = TWEENLWF.Interpolation.Linear;
i[ "Bezier" ] = TWEENLWF.Interpolation.Bezier;
i[ "CatmullRom" ] = TWEENLWF.Interpolation.CatmullRom;
i[ "Utils" ] = TWEENLWF.Interpolation.Utils;
i[ "Utils" ][ "Linear" ] = TWEENLWF.Interpolation.Utils.Linear;
i[ "Utils" ][ "Bernstein" ] = TWEENLWF.Interpolation.Utils.Bernstein;
i[ "Utils" ][ "Factorial" ] = TWEENLWF.Interpolation.Utils.Factorial;
i[ "Utils" ][ "CatmullRom" ] = TWEENLWF.Interpolation.Utils.CatmullRom;

}).call(this);
