(function () {

    var GE = {
		// properties
		canvas: null,
		gl: null,
		ctx: null,
		frontBuffer: null,
		backBuffer: null,
		managedBuffers: [],
        frame: 0,
        lastTime: 0,
        timer: null,
        inputs: {
        	target: null,
			delta: [0, 0],
			mpos: [0, 0],
			mbuttons: 0,
			keys: []
		},
		T: 50,
		MODE_WEBGL: 'webgl',

        // callbacks
		inputHooks: [],
		processInputs: function() { },
        update: function (fm) { },
		render: function (fm) { },

		// methods
        init: function(ref, mode) {
			// get canvas and webgl context
			GE.canvas = (typeof ref === 'string') ? document.querySelector(ref) : ref;
			if (GE.canvas != null) {
				if (mode == GE.MODE_WEBGL) {
					GE.gl = GE.canvas.getContext('webGL');
				} else {
					GE.ctx = GE.canvas.getContext('2d');
				}
				GE.frontBuffer = new GE.Buffer(GE.ctx.getImageData(0,0, GE.canvas.width, GE.canvas.height));
				GE.managedBuffers.push(GE.frontBuffer);
				GE.backBuffer = new GE.Buffer(true);
			} else {
				throw new Error('Invalid canvas reference!');
			}
			// reset inputs
	        GE.inputs.target = null,
	        GE.inputs.delta[0] = 0;
			GE.inputs.delta[1] = 0;
			GE.inputs.mpos[0] = 0;
			GE.inputs.mpos[1] = 0;
	        GE.inputs.mbuttons = 0;
        	for (var k=0;k<120;k++) {
				GE.inputs.keys[k] = 0;
			}
			// add event listeners
			GE.canvas.addEventListener('mousedown', GE.readInput);
			GE.canvas.addEventListener('mouseup', GE.readInput);
			document.addEventListener('contextmenu', GE.readInput);
			document.addEventListener('mousemove', GE.readInput);
			document.addEventListener('keydown', GE.readInput);
			document.addEventListener('keyup', GE.readInput);
        },
        readInput: function(event) {
			var e = event;
			GE.inputs.target = e.target;
			switch (e.type) {
				case 'mousedown':
					// clear 'up' bit
					GE.inputs.mbuttons &= 253;
					// set 'down' bit
					GE.inputs.mbuttons |= 1;
					break;
				case 'mouseup':
					// clear 'down' bit
					GE.inputs.mbuttons &= 254;
					// set 'up' bit
					GE.inputs.mbuttons |= 2;
					break;
		//		case 'oncontextmenu'
		//			GE.inputs.mlb &= 255;
		//			break;
				case 'mousemove':
					var pos = [e.clientX, e.clientY];
					GE.inputs.delta[0] = pos[0] - GE.inputs.mpos[0];
					GE.inputs.delta[1] = pos[1] - GE.inputs.mpos[1];
					GE.inputs.mpos[0] = pos[0];
					GE.inputs.mpos[1] = pos[1];
					break;
				case 'keydown':
					var key = e.keyCode;
					GE.inputs.keys[key] = 1;
					break;
				case 'keyup':
					var key = e.keyCode;
					GE.inputs.keys[key] = 0;
					break;
			}
			GE.inputHooks.forEach( x => x(e) );
		},
		readArrows: function() {
			return [-GE.inputs.keys[37] + GE.inputs.keys[39],
					-GE.inputs.keys[38] + GE.inputs.keys[40]];
		},
        resizeCanvas: function(canvas, scale) {
        	var cnt = canvas.parentNode;
		    var width = cnt.clientWidth;
		    var height = cnt.clientHeight;
		    canvas.width = width/scale;
		    canvas.height = height/scale;
			canvas.style.width = width;
			canvas.style.height = height;
			/// todo: resize managed buffers


		    // if (GE.gl !== null) {
			// 	GE.gl = GE.canvas.getContext('webGL');
			// }
			// if (GE.ctx !== null) {
			// 	GE.ctx = GE.canvas.getContext('2d');
			// }
		},

        start: function () {
        	GE.lastTime = Date.now();
            GE.mainloop();
        },
        stop: function () {
            clearTimeout(GE.timer);
        },
        mainloop: function() {
	        try {
				var dt = - GE.lastTime;
				GE.lastTime = Date.now();
				dt += GE.lastTime;
				dt /= 1000;
				clearTimeout(GE.timer);
				GE.processInputs();
	            GE.update(GE.frame, dt);
	            GE.render(GE.frame, dt);
	            GE.frame++;
	            GE.timer = setTimeout(GE.mainloop, GE.T);
	        } catch (error) {
	            Dbg.prln(error.message);
				Dbg.prln(error.stack);
	        }
		},

		// utilities
		Buffer: function(image, managed) {
			if (managed === undefined) {
				// this.Buffer(true)
				this.imgData = GE.ctx.createImageData(GE.canvas.width, GE.canvas.height);
				this.width = GE.canvas.width;
				this.height = GE.canvas.height;
				if (image) { // = managed
					GE.managedBuffers.push(this);
				}
			} else {
				// this.Buffer(image, true)
				// create temp. canvas to get the imagedata from image
				var canvas = document.createElement('canvas');
				this.width = GE.canvas.width;
				this.height = GE.canvas.height;
				var ctx = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				this.imgData = ctx.getImageData(0, 0, this.width, this.height);
				delete canvas;
			}
		},
		blitBuffer: function(buffer) {
			GE.ctx.putImageData(buffer.imgData, 0, 0);
		}
	};
	GE.Buffer.prototype.blit = function(target) {

	}

	Boot.addToSearchPath();

	public(GE, 'GE');
	
})();

//window.onresize = e => Dbg.prln('ge.resize');
