function MoveObj(pos, mass) {
	// mass of object
	this.mass = mass || 1.0;
	// current summed acceleration
	this.acc = [.0, .0, .0];
	// velocity
	this.vel = [.0, .0, .0];
	// force, array of vectors
	this.forces = [];
	// position, external vector
	this.pos = pos;
	// callback to check constraints to limit movement
	this.constraints = this.constrains.none;
	// flag for free fall
	this.freeFall = true;
}

// ************************************************************
// Return next position
MoveObj.prototype.update = function(state) {
	// apply forces: a = F/m; dv = a*dt -> dv = F/m*dt
	var f = 1/this.mass;
	this.acc[0] = .0, this.acc[1] = .0, this.acc[2] = .0;
	for (var i=0; i<this.forces.length; i++) {
		// update acceleration
		this.acc[0] += this.forces[i][0]*f;
		this.acc[1] += this.forces[i][1]*f;
		this.acc[2] += this.forces[i][2]*f;
	}
	// update velocity
	state.vel = [
	 	this.vel[0] + this.acc[0]*state.dt,
	 	this.vel[1] + this.acc[1]*state.dt,
	 	this.vel[2] + this.acc[2]*state.dt
	];
	// calculate new position
	state.pos = [
		this.pos[0] + state.vel[0]*state.dt,
		this.pos[1] + state.vel[1]*state.dt,
		this.pos[2] + state.vel[2]*state.dt
	];
}

//************************************************************
//Calculate next position, and check constraints
MoveObj.prototype.updateAndCheck = function(state) {
	this.update(state);
	// apply constraints
	// input is the next position, that has to be checked
	// return value is the valid state
	// - pos: last position that is still allowed by the constraints
	// - dt: delta time to the valid position from the starting position
	this.constraints.call(this, state);
	this.vel = state.vel;
//	this.vel[0] = state.vel[0];
//	this.vel[1] = state.vel[1];
//	this.vel[2] = state.vel[2];

	var changed = false;
	// Update position
	if (state.pos[0] != 0) {
		this.pos[0] = state.pos[0];
		changed = true;
	}
	if (state.pos[1] != 0) {
		this.pos[1] = state.pos[1];
		changed = true;
	}
	if (state.pos[2] != 0) {
		this.pos[2] = state.pos[2];
		changed = true;
	}
	return changed;
}


//************************************************************
// Map of constraints
MoveObj.prototype.constrains = {};

//************************************************************
// default constraint: no checks
MoveObj.prototype.constrains.none = function(pos) {
	return;
}

//************************************************************
// constraint for height test using a heightmap
MoveObj.prototype.constrains.heightMap = function(map, width, height, pos) {
	var hitTest = false;
	// transform map coors into world coors
	var cx = pos[0] + width/2, cz = pos[2] + height/2;
	// get slope below object
	var ix = Math.floor(cx), iz = Math.floor(cz);
	var fx = cx - ix, fz = cz - iz;
	var i = width*iz + ix;
	// bilinear interpolation of 4 height values
	var h1 = map[i]*(1-fx) + map[i+1]*fx;
	var h2 = map[i+width]*(1-fx) + map[i+width+1]*fx;
	var dh = (h1-h2), h = h1*(1-fz) + h2*fz;

	if (pos[1] < h) {
		// object is submerged into surface
		// TODO: set the y to the valid position
		// TODO: set velocity according rebound from surface
//Dbg.prln(h);
		hitTest = true;
		pos[1] = h;
	}
	if (pos[1] == h) {
		// object is right on top of surface, disable change of y
		this.freeFall = false;
	} else {
		this.freeFall = true;
	}

	return hitTest;
	
//	g.cameraFalls = false;
//	if (pv[1] < h) {
//		// pbject is in the air
//		pv[1] += mv[1];
//		mv[1] += g.gravity;
//		changed = true;
//	} else {
//		if (pv[1] > h) {
//			// object wants to go underground
//			pv[1] = h;
//			this.moveVector[1] = 0.0;
//			changed = true;
//		}
//		// object is moving on the surface
//		// vector parallel to the surface, normalized
//		var r = Math.sqrt(1 + dh*dh + 1);
//		var sin = .0, cos = 1.0;
//		dv = [.0, .0, .0];
//		if (r != 0) {
//			dv = [1/r, dh/r, 1/r];
//			sin = dv[1], cos = Math.sqrt(1 - sin*sin);
//		}
//		// acceleration = acc from gravity - friction
//		var acc = g.gravity*sin;
//		if (acc != 0) {
//			if (acc < 0) {
//				acc += 0.001*cos;
//				if (acc > 0) acc = 0;
//			} else if (acc > 0) {
//				acc -= 0.001*cos;
//				if (acc < 0) acc = 0;
//			}
//			// update move vector
//			mv[0] -= dv[0]*acc;
//			mv[1] -= dv[1]*acc;
//			mv[2] -= dv[2]*acc;
//		}
//	}

}
//	var dv = this.input[i];
//	if (v < 0) {
//		dv += this.friction[i];
//	} else if (v > 0) {
//		dv -= this.friction[i];
//	}
//	if (dv > this.limit[i]) dv = this.limit[i];
//	else if (dv < -this.limit[i]) dv = -this.limit[i];
//}
//
//MoveObj.prototype.moveAll = function(px, py, pz, rx, ry, rz) {
//	this.move(px, 0);
//	this.move(py, 1);
//	this.move(pz, 2);
//	this.move(rx, 3);
//	this.move(ry, 4);
//	this.move(rz, 5);
//}

//MoveObj.prototype.walk = function(pos, rot) {
//	var changed = false;
//	// process rotation
//	var dv = this.rotVector;
//	var rv = null;
//	if (dv[0] != 0 || dv[1] != 0 || dv[2] != 0) {
//		// update rotation and apply rules
//		rv = [ dv[0] + rot[0],
//		       dv[1] + rot[1],
//		       dv[2] + rot[2] ];
//		if (rv[0] < -60) rv[0] = -60;
//		if (rv[0] > 60) rv[0] = 60;
//		changed = true;
//		rot = rv;
//	}
//
//	// process movement
//	var mv = this.moveVector;
//	// x-rotation does not contribute to position calculation
//	// var rx = Math.PI/180*rot[0];
//	var ry = Math.PI/180*rot[1];
//	dv = [ mv[0]*Math.cos(ry) - 2*mv[2]*Math.sin(ry),
//	       0,	// mv[1]*Math.cos(rx) + 2*mv[2]*Math.sin(rx),
//	       mv[0]*Math.sin(ry) + 2*mv[2]*Math.cos(ry) ];
//
//	// update position and apply rules
//	var pv = [ dv[0] + pos[0],
//	           dv[1] + pos[1],
//	           dv[2] + pos[2] ];
//	var s = g.size/2, s2 = g.size/16;
//	// transform map coors into world coors
//	var cx = s - pv[0], cz = s - pv[2];
//	// confine camera within the map
//	if (cx < s2) { pv[0] = s - s2; changed = true; }
//	else if (cx >= g.size-s2) { pv[0] = s2 - s; changed = true; }
//	if (cz < s2) { pv[2] = s - s2; changed = true; }
//	else if (cz >= g.size-s2) { pv[2] = s2 - s; changed = true; }
//	
//	pos = pv;
///*
//	// get slope below object
//	var ix = Math.floor(cx), iz = Math.floor(cz);
//	var fx = cx - ix, fz = cz - iz;
//	var i = g.size*iz + ix;
//	// bilinear interpolation of 4 height values
//	var h1 = g.heightMap1[i]*(1-fx) + g.heightMap1[i+1]*fx;
//	var h2 = g.heightMap1[i+g.size]*(1-fx) + g.heightMap1[i+g.size+1]*fx;
//	var dh = 8*(h1-h2), h = -(h1*(1-fz) + h2*fz + 2.0);
//
//	g.cameraFalls = false;
//	if (pv[1] < h) {
//		// pbject is in the air
//		pv[1] += mv[1];
//		mv[1] += g.gravity;
//		changed = true;
//	} else {
//		if (pv[1] > h) {
//			// object wants to go underground
//			pv[1] = h;
//			this.moveVector[1] = 0.0;
//			changed = true;
//		}
//		// object is moving on the surface
//		// vector parallel to the surface, normalized
//		var r = Math.sqrt(1 + dh*dh + 1);
//		var sin = .0, cos = 1.0;
//		dv = [.0, .0, .0];
//		if (r != 0) {
//			dv = [1/r, dh/r, 1/r];
//			sin = dv[1], cos = Math.sqrt(1 - sin*sin);
//		}
//		// acceleration = acc from gravity - friction
//		var acc = g.gravity*sin;
//		if (acc != 0) {
//			if (acc < 0) {
//				acc += 0.001*cos;
//				if (acc > 0) acc = 0;
//			} else if (acc > 0) {
//				acc -= 0.001*cos;
//				if (acc < 0) acc = 0;
//			}
//			// update move vector
//			mv[0] -= dv[0]*acc;
//			mv[1] -= dv[1]*acc;
//			mv[2] -= dv[2]*acc;
//		}
//	}
//*/
//	return changed;
//}