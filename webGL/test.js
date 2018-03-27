var gl = null;
var g = g || {};
function onPageLoad() {
    //*********************************************************
	// initialize engine
	GE.init(fw.Config.app.settings, 'canvasContainer');
	if (GE.gl == null) {
		Dbg.prln('webGL not supported!');
		return;
	}
	gl = GE.gl;
	GE.canvas.lockPointer = GE.canvas.requestPointerLock || 
							GE.canvas.mozRequestPointerLock ||
							GE.canvas.webkitRequestPointerLock;
	document.exitPointerLock =  document.exitPointerLock ||
								document.mozExitPointerLock ||
								document.webkitExitPointerLock;
	
	GE.setInputCallback(readInput);

	$('canvasContainer').appendChild($('info'));
    //*********************************************************
	// set up extensions
	var ext = GE.gl_getExtension(['OES_texture_float', 'OES_standard_derivatives']);
	if (ext.length > 0) {
		Dbg.prln('Required extension(s) not supported:');
		Dbg.prln(ext.join('\n'));
		return;
	}
//	var extensions = gl.getSupportedExtensions();
//	Dbg.prln(extensions.join('\n'));

    //*********************************************************
	// set up the scene
    g.w = parseInt(fw.Config.app.settings.lx), g.h = parseInt(fw.Config.app.settings.ly);
    g.vx = 2*Math.PI*parseFloat(fw.Config.app.settings.vx), g.vy = 2*Math.PI*parseFloat(fw.Config.app.settings.vy);
    g.amp = parseFloat(fw.Config.app.settings.amp);

	createScene();
	
//	gl.viewport(0, 0, GE.canvas.clientWidth, GE.canvas.clientHeight);

    //*********************************************************
	// set up rendering
    gl.clearDepth(10000);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
	//*********************************************************
	// get UI elements
	//readEffects();
    initEffects($('config'));
	var div = $$('div');
	div.innerHTML = '<center><input type="button" value="Reset (R)" onclick="reset(true);" /><input type="button" value="Rerun (T)" onclick="reset();" /></center><br>Use the ADWSOL keys to move around.';
	$('config').appendChild(div);
	
    //*********************************************************
    // start main loop
    GE.start();
}

function readEffects() {
	g.effects.apply( function(k, args) {
		this[k].update();
	});
}

function createScene() {
	// create a model group
	g.modelGrp01 = new ModelGroup('vshader', 'fshader', ['vPosition', 'vTexCoord']);
	// set shader program parameters
	g.modelGrp01.modelMatrixLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "modelMatrix");
	GE.gl_viewProjectionMatrixLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "viewProjectionMatrix");
	g.lightDirLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "lightDir");
	g.directLight = [1, 1, -1];
	GE.gl_cameraPosLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "cameraPos");
	g.angleLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "angle");
	g.skyColorLoc = GE.gl.getUniformLocation(g.modelGrp01.prg, "skyColor");
	g.skyColor = [0.7, 0.8, 1.0];
	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "vx"), g.vx);
	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "vy"), g.vy);
//	GE.gl.uniform1f(GE.gl.getUniformLocation(g.modelGrp01.prg, "amp"), g.amp);
//	GE.gl.uniform1i(GE.gl.getUniformLocation(g.modelGrp01.prg, "colorMap"), 1);
//	GE.gl.uniform2iv(GE.gl.getUniformLocation(g.modelGrp01.prg, "heightMapSize"), new Int32Array([g.w, g.h]));

	// model #1: terrain 
	var vertices = [];
	var indices = [];
	var texCoords = [];
	g.heightMap1 = new Float32Array(new ArrayBuffer(4*g.w*g.h));
	g.heightMap2 = new Float32Array(new ArrayBuffer(4*g.w*g.h));

	var w = g.w-1, h = g.h-1;
	var ix = 0;
	for (var j=0; j<=h; j++) {
		for (var i=0; i<=w; i++) {
			var x = (i - w/2), z = (j - h/2);
			vertices.push(x, 0, z);
			texCoords.push(i/w, j/w);
			if (i < w && j < h) {
				var i1=i+j*g.w, i2=i1+1, i3=i1+g.w, i4=i3+1;
				indices.push(i1, i2, i4);
				indices.push(i1, i4, i3);
			}
			g.heightMap1[ix] = 0.0, g.heightMap2[ix++] = 0.0;
			//g.heightMap1[ix] = ((i == 0) ? w/5:0) + ((j == 0) ? w/10:0), g.heightMap2[ix++] = ix/w;
			//g.heightMap1[ix++] = 10*Math.sin(j/h)*Math.cos(i/w);
		}
	}

	g.terrain = new Model({vertices:vertices, indices:indices, texCoords:texCoords});
	g.modelGrp01.addModel(g.terrain);
	// texture #1: height map
	g.heightMap = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.w, g.h, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
	gl.uniform1i(GE.gl.getUniformLocation(g.modelGrp01.prg, "heightMap"), 0);
	gl.bindTexture(gl.TEXTURE_2D, null);
	g.modelGrp01.textures.push(g.heightMap);
	g.modelGrp01.lock();

	// add a third person camera
	var r = Math.max(w, h);
	new GE.gl_TPCamera([-0.6*r, -0.3*r, -0.6*r], [25, -45, 0]);
	GE.gl_setCamera(0);
	GE.gl.uniform3fv(g.cameraPosLoc, GE.gl_activeCamera.pos);
	//GE.gl_activeCamera.update([w/2, 0, -h/3]);

	GE.gl.uniform3fv(g.lightDirLoc, g.directLight);
}

var mouseLocked = false;

function readInput(e) {
	var oEvt = Events.getEvent(e);
	var tgt = oEvt.target;
	switch (oEvt.name) {
		case 'mousedown':
			break;
		case 'mouseup':
			if (tgt == GE.canvas) {
				 mouseLocked = !mouseLocked;
				 if (mouseLocked) {
					 GE.canvas.lockPointer();
				 } else {
					 document.exitPointerLock();
				 }
			}
			break;
//		case 'oncontextmenu'
//			GE.inputs.mlb &= 255;
//			break;
		case 'mousemove':
			if (mouseLocked) {
				var dx = e.movementX || e.mozMovementX;
				var dy = e.movementY || e.mozMovementY;
				var r = false;
				var rot = [0, 0, 0];
				if (dx > 0) { rot[1] += 0.8; r = true; }
				else if (dx < 0) { rot[1] -= 0.8; r = true; }
				if (dy > 0) { rot[0] += 0.6; r = true; }
				else if (dy < 0) { rot[0] -= 0.6; r = true; }
				if (r) {
					GE.gl_activeCamera.update(null, rot);
				}
//				if (dx > 0) { GE.gl_activeCamera.lookAt[1] += 0.8; r = true; }
//				else if (dx < 0) { GE.gl_activeCamera.rot[1] -= 0.8; r = true; }
//				if (dy > 0) { GE.gl_activeCamera.rot[0] += 0.5; r = true; }
//				if (dy < 0) { GE.gl_activeCamera.rot[0] -= 0.5; r = true; }
//				if (r) {
//					GE.gl_activeCamera.update();
//				}

			}
		break;
	}
}

function processInput() {
	var r = false;
	var dx = 0, dy = 0, dz = 0;
	if (GE.inputs.keys[65] != 0) { dx -= 0.4; r = true; }
	if (GE.inputs.keys[68] != 0) { dx += 0.4; r = true; }
	if (GE.inputs.keys[76] != 0) { dy -= 0.4; r = true; }
	if (GE.inputs.keys[79] != 0) { dy += 0.4; r = true; }
	if (GE.inputs.keys[87] != 0) { dz -= 0.4; r = true; }
	if (GE.inputs.keys[83] != 0) { dz += 0.4; r = true; }
	if (r) {
		//gl.uniform3fv(g.lightDirLoc, g.directLight);
		//var arg = Math.atan(GE.gl_activeCamera.pos[1] / GE.gl_activeCamera.pos[2]);
		var ry = Math.PI/180*GE.gl_activeCamera.rot[1];
		var rx = Math.PI/180*GE.gl_activeCamera.rot[0];
		//dz += dy*Math.cos(rx);
		var v =
			[ dx*Math.cos(ry) - dz*Math.sin(ry),
			  dy*Math.cos(rx) + dz*Math.sin(rx),
			  dx*Math.sin(ry) + dz*Math.cos(ry) ];
		GE.gl_activeCamera.update(v);
	}
	if (GE.inputs.keys[82]) {
		reset(true);
	}
	if (GE.inputs.keys[84]) {
		reset();
	}
}

function reset(erase) {
	f2 = 0;
	readEffects();
	if (erase) g.heightMap1.fill(0.0);
}

var currentAngle = 0;
var scale = new Float32Array( [0, 0] );
var f2 = 0;
function update(f) {
    currentAngle += 2*Math.PI/24/3600*60;
    if (currentAngle > 2*Math.PI) {
        currentAngle -= 2*Math.PI;
    }
    gl.uniform1f(g.angleLoc, currentAngle);
    var sunX = Math.cos(currentAngle);
    var sunY = Math.sin(currentAngle);
	gl.uniform3f(g.lightDirLoc, sunX, sunY, -0.5);
	if (sunY < 0) {
		sunY = 0; currentAngle += Math.PI;
	}
	//g.skyColor = [Math.abs(sunX)*sunY, Math.abs(sunX)*sunY, sunY];
	var skyColorR = 0.5*sunY+0.1*Math.abs(sunX), skyColorG = 0.6*sunY, skyColorB = (1 - 0.5*Math.abs(sunX))*sunY;
	gl.clearColor(skyColorR,skyColorG, skyColorB, 1);
	gl.uniform3f(g.skyColorLoc, skyColorR,skyColorG, skyColorB);

    var changed = false;
    var mod = 3;
    g.effects.apply(
    	function(k, args) {
    		if (this[k].parameters.enable) {
	    		this[k].parameters.frame = f2;
	    		changed = this[k].apply() || changed;
    		}
    	}
    );
    if (changed) {
    	setHeightMap();
    }
	f2++;

    //gl.uniform3fv(gl.getUniformLocation(g.prg, "random"), new Float32Array([Math.random(), Math.random(), Math.random()]));
   
//    var vx = g.vx*Math.sin(currentAngle);
//    var vy = g.vy*Math.sin(currentAngle);
//    gl.uniform1f(gl.getUniformLocation(g.prg, "vx"), vx);
//    gl.uniform1f(gl.getUniformLocation(g.prg, "vy"), vy);
}

function render(f) {
	// Clear the canvas
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var txt = ['pos:['];
	txt.push(GE.gl_activeCamera.pos[0].toFixed(2));
	txt.push(GE.gl_activeCamera.pos[1].toFixed(2));
	txt.push(GE.gl_activeCamera.pos[2].toFixed(2));
	txt.push('] rot:[')
	txt.push(GE.gl_activeCamera.rot[0].toFixed(2));
	txt.push(GE.gl_activeCamera.rot[1].toFixed(2));
	txt.push(GE.gl_activeCamera.rot[2].toFixed(2));
	$('info').innerHTML = txt.join(' ') + ']';
	//gl.uniform1i(gl.getUniformLocation(g.prg, "frame"), f);

	g.modelGrp01.render();
}

/*****************************************************************************/
function setHeightMap() {
    gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.w, g.h, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
    gl.bindTexture(gl.TEXTURE_2D, null);
}