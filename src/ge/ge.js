(function () {

    var ti_ = null;
    var GE = {
		// properties
		canvas: null,
		gl: null,
        frame: 0,
        inputs: {
        	target: null,
			delta: [0, 0],
			mpos: [0, 0],
			mbuttons: 0,
			keys: []
		},
		T: 40,

        // callbacks
		inputHooks: [],
		processInputs: function() { },
        update: function (fm) { },
		render: function (fm) { },

        // methods
        init: function(ref) {
			// get canvas and webgl context
			GE.canvas = (typeof ref === 'string') ? document.querySelector(ref) : ref;
			if (GE.canvas != null) {
				GE.gl = GE.canvas.getContext('webGL');
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
			document.addEventListener('mousedown', GE.readInput);
			document.addEventListener('mouseup', GE.readInput);
			document.addEventListener('contextmenu', GE.readInput);
			document.addEventListener('mousemove', GE.readInput);
			document.addEventListener('keydown', GE.readInput);
			document.addEventListener('keyup', GE.readInput);
			window.addEventListener('resize', GE.resize);
        },
        readInput: function(event) {
			var e = event;
			GE.inputs.target = e.target;
			switch (e.type) {
				case 'mousedown':
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
        resize: function(e) {
        	if (typeof onresize === 'function') {
	        	onresize(e);
			}
        },
        start: function () {
            mainloop();
        },
        stop: function () {
            clearTimeout(ti_);
        }
    };

    function mainloop() {
        try {
			clearTimeout(ti_);
			GE.processInputs();
            GE.update(GE.frame);
            GE.render(GE.frame);
            GE.frame++;
            ti_ = setTimeout(mainloop, GE.T);
        } catch (error) {
            Dbg.prln(error.message);
			Dbg.prln(error.stack);
        }
	}

	public(GE, 'GE');
})();


