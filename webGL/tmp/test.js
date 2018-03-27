var DELTATIME = 0.05;
var BALLUNIT = 64;
var gl = null;
var g = g || {};
function onPageLoad() {
    //*********************************************************
	// initialize engine
	
	var txt = '';

	g.cameraUploads = 0;
	g.gravity = [.0, -9.987, .0];

	fw.Config.app.settings.width = window.innerWidth;
	fw.Config.app.settings.height = window.innerHeight-4;
	$('config').style.visibility = 'hidden';
	var el = $('info');
	el.style.left = (window.innerWidth - el.offsetWidth - 16)+'px';
	el = $('dbgConsole');
	el.style.top = (window.innerHeight - el.offsetHeight - 16)+'px';
	el.style.left = (window.innerWidth - el.offsetWidth - 16)+'px';

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
	
	$('canvasContainer').appendChild($('info'));
    //*********************************************************
	// set up extensions
	var ext = GE.gl_getExtension(['OES_texture_float', 'OES_standard_derivatives', 'OES_element_index_uint']);
	if (ext.length > 0) {
		Dbg.prln('Required extension(s) not supported:');
		Dbg.prln(ext.join('\n'));
		return;
	}
//	var extensions = gl.getSupportedExtensions();
//	Dbg.prln(extensions.join('\n'));

    //*********************************************************
	// set up the scene
	g.size = parseInt(fw.Config.app.settings.size);
	g.move = { max:0.3, delta:0.004, f:0.01 }
	g.rotY = { max:1.2, delta:0.10, f:0.08 }
	g.rotX = { max:0.8, delta:0.06, f:0.10 }
	g.sunSpeed = parseFloat(fw.Config.app.settings.sunspeed);
	g.viewDistance = parseFloat(fw.Config.app.settings.viewdistance);
    //g.vx = 2*Math.PI*parseFloat(fw.Config.app.settings.vx), g.vy = 2*Math.PI*parseFloat(fw.Config.app.settings.vy);
    //g.amp = parseFloat(fw.Config.app.settings.amp);

	createScene();
	reset();
	
//	gl.viewport(0, 0, GE.canvas.clientWidth, GE.canvas.clientHeight);

	//*********************************************************
	// set up rendering
	gl.clearDepth(1);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.frontFace(gl.CW);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	//*********************************************************
	// get UI elements
	//readEffects();
 	initEffects($('config'));
	var div = $$('div');
	var txt = '<br/>';
	txt += 'Speed of sun <input id="sunSpeed" type="text" size="2" onchange="setSunSpeed()" value="'+g.sunSpeed+'" title="Value is between 0 and 24."/><br/>';
	txt += 'View distance <input id="viewDistance" type="text" size="2" onchange="setViewDistance()" value="'+g.viewDistance+'" title="Value is between 0.0 and 1.0.\n 0 -> 50% of map size,\n 1.0 -> 100% of map size"/><br/>';
	txt += 'Gravity <input id="gravity" type="text" size="2" onchange="setGravity()" value="'+g.gravity[1]+'" title="Value is between 0.0 and 1.0."/><br/>';
	txt += '<input type="button" value="Reset (R)" onclick="reset(true);" /><br/>';
	txt += '<input type="button" value="Rerun (T)" onclick="reset();" /><br/>';
	div.innerHTML = '<center>' + txt + '</center>';
	$('config').appendChild(div);
	
	Dbg.prln('Use the ADWSOL keys to move around.');

//	g.effects[0].apply(1);
//	Effect.normalize();
	setHeightMap();

	setSunSpeed();
	setViewDistance();

	//GE.canvas.requestFullScreen();
	GE.setInputCallback(readInput);

	update(0);
	render(0);
	GE.gl = GE.glstd;
	gl = GE.glstd;

//	Dbg.prln('*********************************************************');
//	exportHeightMap();
//	Dbg.prln('*********************************************************');
	//*********************************************************
    // start main loop
    GE.start();
}

function setSunSpeed() {
	var tb = $('sunSpeed');
	var v = parseFloat(tb.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		if (v > 24) v = 24;
		tb.value = v;
		g.sunSpeed = v;
		g.sunAngularSpeed = 2*Math.PI/10/60/24*v;
	}
}

function setViewDistance() {
	var tb = $('viewDistance');
	var v = parseFloat(tb.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		if (v > 1) v = 1;
		tb.value = v;
		g.viewDistance = (0.5 + v/2) * g.size;
	}
}

function setGravity() {
	var tb = $('gravity');
	var v = parseFloat(tb.value);
	if (!isNaN(v)) {
		if (v < -10) v = -10;
		if (v > 10) v = 10;
		tb.value = v;
		g.gravity[1] = v;
	}
}

function readEffects() {
	g.effects.apply( function(k, args) {
		this[k].update();
	});
}

function createScene() {
	// set uniforms
	var ld = [0.0, 1.0, .0];
	var l = Math.sqrt(ld[0]*ld[0]+ld[1]*ld[1]+ld[2]*ld[2]);
	ld[0] /= l, ld[1] /= l, ld[2] /= l;
	g.uniforms = {
		iModelMatrix: null,
		iNormalMatrix: null,
		iViewProjectionMatrix: null,
		iSkyColor: [0.5, 0.8, 1.0],
		iLightDir: ld,
		iViewDistance:null,
		iCameraPos: null,
		iMousePos: null,
		iSize:g.size,
		iResolution:[GE.canvas.width, GE.canvas.height]
	};

	gl.clearColor(1, 0, 1, 1);

	g.modelGroups = [];

	//createTerrain();

	// create box
	var grp1 = new ModelGroup(['vs2', 'fs2'], ['aPosition', 'aNormal'], g.uniforms);
	g.modelGroups.push(grp1);
	grp1.addModel(new Cube(g.size/2, 1));
	grp1.lock();	
	
	// add balls
	var grp = new ModelGroup(['vs2', 'fs3'], ['aPosition', 'aNormal'], g.uniforms);
	g.modelGroups.push(grp);
	g.balls = [];
	var ct = g.size/BALLUNIT;
	for (var j=0; j<ct; j++) {
		for (var i=0; i<ct; i++) {
			for (var k=0; k<ct; k++) {
				var r = 0.5;	//Math.random()+1.0;
				var ball = new Sphere(r, 20);
				ball.pos[0] = -g.size/2 + BALLUNIT*(.5 + i);	//*g.size/2*(Math.random()-0.5);
				ball.pos[1] = -g.size/2 + BALLUNIT*(.5 + k);	//30.0*(0.8 + 0.2*Math.random());
				ball.pos[2] = -g.size/2 + BALLUNIT*(.5 + j);	//g.size*(Math.random()-0.5);
				ball.update();
				var mo = new MoveObj(ball.pos, 4/3*r*r*r*Math.PI);
				mo.forces.push(g.gravity);
				var d = 10.0;	//5.0*Math.random()+5.0;
				var arg1 = 2*Math.PI*Math.random();
				var arg2 = 2*Math.PI*Math.random();
				var c1 = Math.tan(arg1), c2 = 1/Math.tan(arg2);
				var c0 = c1*c1 + 1 + c2*c2;
				var b = Math.sqrt(d*d/c0);
				//mo.vel[0] = b*c1;
				//mo.vel[1] = b;
				//mo.vel[2] = b*c2;
				mo.constraints = boxHittest;
				//mo.constraints = terrainHittest;
				g.balls.push(ball);
				g.balls.push(mo);
				grp.addModel(ball);
			}
		}
	}
	grp.lock();


	// add a third person camera
	//new GE.gl_TPCamera([-.5*g.size, -.5*g.size, -.5*g.size], [33, -45, 0]);
	new GE.gl_TPCamera([-.7*g.size, -.7*g.size, -1.0*g.size], [30, -30, 0]);
	GE.gl_setCamera(0);
	g.cameraMovement = new MoveObj(GE.gl_activeCamera.pos);
	g.userForce = [.0, .0, .0];
	g.cameraMovement.forces.push(g.userForce/*, g.gravity*/);
	//g.cameraMovement.constraints = terrainHittest;

	return;
}

function boxCheck(state, i, limit) {
	var a = Math.abs(this.acc[i]);
	var v0 = Math.abs(this.vel[i]);
	var hit = false;
	if (state.pos[i] <= -limit) {
		var s = this.pos[i] - -limit;
		// s = v0*dt + .5*a*dt*dt
		// a*dt^2 + 2*v0*dt - 2*s = 0
		// dt1 = (-2*v0+sqrt(4*v0^2 + 8*a*s))/(2*a)
		var dt = (a == 0) ? s/v0 : (-2*v0 + Math.sqrt(4*v0*v0 + 8*a*s))/(2*a);
		if (dt < state.dt) {
			state.dt = dt;
			hit = true;
		}
		//this.pos[i] = -limit;
	}
	if (state.pos[i] >= limit) {
		s = this.pos[i] - limit;
		// s = v0*dt + .5*a*dt*dt
		// a*dt^2 + 2*v0*dt - 2*s = 0
		// dt1 = (-2*v0+sqrt(4*v0^2 + 8*a*s))/(2*a)
		var dt = (a == 0) ? s/v0 : (-2*v0 + Math.sqrt(4*v0*v0 + 8*a*s))/(2*a);
		if (dt < state.dt) {
			state.dt = dt;
			hit = true;
		}
		//this.pos[i] = limit;
	}
	return hit;
}

function boxHittest(state) {
	var hit = -1;
	if (boxCheck.call(this, state, 0, g.size/2)) hit = 0;
	if (boxCheck.call(this, state, 1, g.size/2)) hit = 1;
	if (boxCheck.call(this, state, 2, g.size/2)) hit = 2;
	// state.dt: duration of free movement
	// update acceleration, velocity, position
	this.update(state);
	state.dt = DELTATIME - state.dt;
	var txt = '';
	if (hit > -1) {
		this.vel[hit] *= -1;
		txt += this.pos[0].toPrecision(3)+','+this.pos[1].toPrecision(3)+','+this.pos[2].toPrecision(3);
	}
	if (state.dt > 0) {
		this.update(state);
		txt += ', '+this.pos[0].toPrecision(3)+','+this.pos[1].toPrecision(3)+','+this.pos[2].toPrecision(3);
	}
//	if (txt.length > 0) {
//		Dbg.prln(txt);
//	}
}

function terrainHittest(pos) {
	var h0 = pos[1];
	if (this.constrains.heightMap.call(this, g.heightMap1, g.size, g.size, pos)) {
		// using the height value calculate the new velocity vector
		//var dh = h0 - pos[1];
		//var dt = dh/this.vel[1];
		//this.update(dt - 0.001);
		//pos[1] = h0;
		this.vel[1] *= -1.0;
	}
	return;
}

var mouseLocked = false;
g.moveVector = [0, 0, 0];
g.rotVector = [0, 0, 0];
g.mouseLocked = false;

function delta(v, i, d, m, t, fr) {
	var r = false;
	if (d < 0) { if (v[i] > -m) v[i] -= t; r = true; }
	else if (d > 0) { if (v[i] < m) v[i] += t; r = true; }
	if (!r) {
		if (v[i] > fr) v[i] -= fr;
		else {
			if (v[i] < -fr) v[i] += fr;
			else v[i] = 0;
		}
	}
}

function readInput(e) {
	var oEvt = Events.getEvent(e);
	var tgt = oEvt.target;
	switch (oEvt.name) {
		case 'mousedown':
			break;
		case 'mouseup':
			if (tgt == GE.canvas) {
				g.mouseLocked = !g.mouseLocked;
				 if (g.mouseLocked) {
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
			// Upload mouse relevant common uniforms
			if (!g.mouseLocked) {
				for (var i=0; i<g.modelGroups.length; i++) {
					var grp = g.modelGroups[i];
					if (grp.uniforms.iMousePos)
						gl.useProgram(grp.prg);
						gl.uniform2fv(grp.uniforms.iMousePos, GE.inputs.pos);
				}
			}
		break;
	}
}

function processInput() {
	var v = g.moveVector;
	var d = 0;
	if (!g.cameraFalls) {
		if (GE.inputs.keys[65] != 0) { d = 1; }
		if (GE.inputs.keys[68] != 0) { d = -1; }
		g.userForce[0] = d;
	}
	//delta(v, 0, d, g.move.max, g.move.delta, .0);
	d = 0;
	if (GE.inputs.keys[76] != 0) { d = 1; }
	if (GE.inputs.keys[79] != 0/* && !g.cameraMovement.freeFall*/) {
		d = -1; //g.cameraMovement.vel[1] = -5.0;
	}
	g.userForce[1] = d;
	d = 0;
	if (!g.cameraFalls) {
		if (GE.inputs.keys[87] != 0) { d = 1; }
		if (GE.inputs.keys[83] != 0) { d = -1; }
		g.userForce[2] = d;
	}
	//delta(v, 2, d, g.move.max, g.move.delta, .0);

	if (GE.inputs.keys[82]) {
		reset(true);
	}
	if (GE.inputs.keys[84]) {	
		reset();
	}
	d = [0, 0];
	var r = g.rotVector;
	if (g.mouseLocked) {
		d = GE.inputs.delta;
	}
	delta(r, 0, d[1], g.rotX.max, g.rotX.delta, g.rotX.f);
	delta(r, 1, d[0], g.rotY.max, g.rotY.delta, g.rotY.f);
}

function reset(erase) {
	f2 = 0;
	readEffects();
	for (var i=0; i<g.effects.length; i++) {
		var fx = g.effects[i];
		fx.count = 0;
	}
	if (erase) {
		g.heightMap1.fill(0.0);
		g.heightMap2.fill(0.0);
	}
	g.generating = true;
}

function moveCamera() {
	var state = {dt:DELTATIME};
	if (g.cameraMovement.updateAndCheck(state)) {
		GE.gl_activeCamera.update(true);
		g.cameraUploads++;
	}
}

var currentAngle = 0;
var f2 = 0;
function update(f) {
//	for (var i=0; i<g.modelGroups.length; i++) {
//		var grp = g.modelGroups[i];
//		for (var j=0; j<grp.models.length; j++) {
//			grp.models[j].matrix.rotate(.5, 1, 1, 1);
//			grp.models[j].normalMatrix.rotate(.5, 1, 1, 1);
//		}
//	}
//	moveCamera();
//	return;

	// move to fshader ****************************************
	var sc = g.uniforms.iSkyColor;
	var sx = 0.6, sy = 0.7;
	if (g.sunSpeed != 0) {
	    currentAngle += g.sunAngularSpeed;
	    if (currentAngle > 2*Math.PI) {
	        currentAngle -= 2*Math.PI;
	    }
	    //gl.uniform1f(g.angleLoc, currentAngle);
	    sx = Math.cos(currentAngle); sy = Math.sin(currentAngle);
	    sc = getSunColor(currentAngle, sx, sy);
	    if (sy < 0) sy = 0;
	}
	//*********************************************************
	//gl.clearColor(sc[0], sc[1], sc[2], 1);
	for (var i=0; i<g.modelGroups.length; i++) {
		var grp = g.modelGroups[i];
		gl.useProgram(grp.prg);
		gl.uniform1f(grp.uniforms.iViewDistance, g.viewDistance);
		gl.uniform3fv(grp.uniforms.iSkyColor, sc);
		gl.uniform3f(grp.uniforms.iLightDir, sx, sy, 0.0);
	}

//	var changed = Effect.apply(g.effects, f2);

    // update camera
    moveCamera();
    
    // update balls
    var state = {dt:DELTATIME};
	for (var i=0; i<g.balls.length; i+=2) {
		state.dt = DELTATIME;
		g.balls[i+1].updateAndCheck(state);
		g.balls[i].update();
	}

//    g.balls[0].matrix.rotate(g.sunAngularSpeed, 0, 1, 0);

	g.generating = false;	//(f2 < g.size);
//	if (changed) {
//		setHeightMap();
//	}
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
	txt.push(']\nmove:[')
	txt.push(g.userForce[0].toFixed(2));
	txt.push(g.userForce[1].toFixed(2));
	txt.push(g.userForce[2].toFixed(2));
	txt.push('] cu: ' + g.cameraUploads);
	if (g.generating) {
		var p = f2/g.size*100;
		txt.push('<br/>Generating ' + p.toPrecision(2)+'%');
	}
	$('info').innerHTML = txt.join(' ') + ']';
	//gl.uniform1i(gl.getUniformLocation(g.prg, "frame"), f);

	for (var i=0; i<g.modelGroups.length; i++) {
		g.modelGroups[i].render(f);
	}
//	glBlitFramebuffer() can do the job
//	glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0); // default FBO, the real screen
//	glBindFramebuffer(GL_READ_FRAMEBUFFER, FBO1);
//	glBlitFramebuffer(..... GL_COLOR_BUFFER_BIT, GL_NEAREST)
}

/*****************************************************************************/
function setHeightMap() {
    // update normals
	//var s = -2*this.hScale;
//	var ix1 = 0, ix2 = g.size, y1 = 0, y2 = 0, y3 = 0, y4 = 0;
//	for (var j=0; j<g.size-1; j++) {
//		for (var i=0; i<g.size-1; i++) {
//			y1 = g.heightMap1[ix1];		// + this.elevation;
//			y2 = g.heightMap1[ix1+1];	// + this.elevation;
//			y3 = g.heightMap1[ix2];		// + this.elevation;
//			y4 = g.heightMap1[ix2+1];	// + this.elevation;
/*
			var h = (y1+y2+y3+y4)/4;
			if (h < this.waterLevel) {
				y1 = y2 = y3 = y4 = this.waterLevel;
			}
//*/
//			if (y1 < this.waterLevel) y1 = this.waterLevel;
//			if (y2 < this.waterLevel) y2 = this.waterLevel;
//			if (y3 < this.waterLevel) y3 = this.waterLevel;
//			if (y4 < this.waterLevel) y4 = this.waterLevel;
//			var d1 = y2 - y1;
//			var d2 = y3 - y4;
//			var d3 = y3 - y2;
//			var u = new J3DIVector3(1, d1, 0),
//				v = new J3DIVector3(1, d2, 0),
//				w = new J3DIVector3(1, d3, 1);
//			u.cross(v);
//			u.divide(u.length());
//			g.heightMap1[2*ix1 + 1]
//		}
//	}
	gl.bindTexture(gl.TEXTURE_2D, g.heightMap);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, g.size, g.size, 0, gl.LUMINANCE, gl.FLOAT, g.heightMap1);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function exportHeightMap() {
	var w = g.size-1;
	var ix = 0;
	var txt = [];
	for (var j=0; j<=w; j++) {
		for (var i=0; i<=w; i++) {
			var h = g.heightMap1[ix++];
			txt.push(i+','+j+','+h.toPrecision(6));
		}
	}
	Dbg.prln(txt.join('\n'));
}

//function testModelGroups(){
//	var grp = null;
//	// create model group #1
//	grp = new ModelGroup(
//		// shaders
//			['vs2', 'fs3'],
//		// attributes
//			['aPosition', 'aNormal'],
//		// uniforms
//			g.uniforms
//	);
//	grp.addModel(new Cube(0.5));
//	grp.lock();
//	grp.models[0].matrix.translate(0, 1, -2);
//	g.modelGroups.push(grp);
//
//	// create model group #2
//	grp = new ModelGroup(
//		// shaders
//			['vs2', 'fs2'],
//		// attributes
//			['aPosition', 'aNormal'],
//		// uniforms
//			g.uniforms
//	);
//	grp.addModel(new Sphere(.5, 45));
//	grp.addModel(new Sphere(.5, 10));
//	grp.lock();
//	grp.models[0].matrix.translate(-1, -.5, 0);
//	grp.models[1].matrix.translate(1, -.5, 0);
//	g.modelGroups.push(grp);
//}