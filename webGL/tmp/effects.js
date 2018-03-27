	var g = g || {};
g.effects = [];

/*****************************************************************************/
function initEffects(el) {
//	var bufferInfo = {
//		ref: 'heightMap1',
//		width:g.size, height:,
//		stride: 4
//	};
	new Noise('noise1', 'Noise1', {
		bufferIn:null, bufferOut:'heightMap1',
		enable:true,
		flatness:3, octaves:4
	});
	
	new Shift('shift1', 'Shift1', {
		bufferIn:null, bufferOut:'heightMap1',
		enable:false, start: 0, stop: g.size>>4, step: 8,
		strength:8
	});
	
	new Tile('tile1', 'Tile1', {
		bufferIn:null, bufferOut:'heightMap1',
		enable:false, start: 0, stop: 16, step: 1,
		flatness:3, wave:'pulse'
	});
	
	new Filter('smoothen', 'Smoothen', {
		bufferIn:'heightMap1', bufferOut:'heightMap2',
		enable:false, start: 3*(g.size>>2), stop: 15*(g.size>>4), step: 8,
		matrix: [
			[ 0.7, 1.0, 0.7 ],
			[ 1.0, 1.0, 1.0 ],
			[ 0.7, 1.0, 0.7 ]		         
		],
		factor: 0
	});

	g.effects.apply(
		function(k, args) {
			this[k].initUI(el);
		}
	);
}
/*****************************************************************************/
function Effect(id, title, parameters) {
	this.id = id;
	this.title = title;
	this.count = 0;
	this.parameters = parameters;
	g.effects.push(this);
	this.controls = {};
}
/*****************************************************************************/
Effect.controls = {
	enable: 'bool',
	title: 'label',
	start: 'text',
	stop: 'text',
	step: 'text'
};
/*****************************************************************************/
Effect.createControl = function(type, value) {
	var el = null;
	switch (type) {
		case 'bool':
			el = $$('input');
			el.type = 'checkbox';
			el.checked = value;
			break;
		case 'text':
			el = $$('input');
			el.type = 'text';
			el.size = 2;
			el.value = value;
			break;
		case 'list':
			el = $$('select');
			for (var i=0; i<value.length; i++) {
				var opt = $$('option');
				opt.innerHTML = value[i];
				opt.value = value[i];
				el.appendChild(opt);
			}
			break;
		case 'label':
			el = $$('span');
			el.innerHTML = value;
			break;
	}
	return el;
}
/*****************************************************************************/
Effect.prototype.createCell = function(id, type) {
	var td = $$('td');
	td.id = id;
	td.className = 'effect';
	var value = id;
	if (type != 'label') value = this.parameters[id];
//	if (id == 'title') value = this.title;
	var el = Effect.createControl(type, value);
	if (el != null) {
		el.name = this.id+'_'+id;
		el.id = this.id+'_'+id;
		this.controls[id] = el;
		td.appendChild(el);
	} else {
		td.innerHTML = '&nbsp;';
	}
	return td;
}

/*****************************************************************************/
Effect.prototype.initUI = function(parent, noctrl) {
	var el = $$('div');
	el.id = this.id;
	var tab = $$('table');
	tab.setAttribute('border', 1);
	tab.id = this.id+'_tab';
	tab.className = 'effect';
	tab.width = '100%';
	var tr = $$('tr');
	tr.appendChild(this.createCell('enable', 'bool'));
	tr.appendChild(this.createCell(this.title, 'label'));
	tab.appendChild(tr);
	el.appendChild(tab);
	tab = $$('table');
	tab.setAttribute('border', 1);
	tab.id = this.id+'_tab';
	tab.className = 'effect';
	tab.width = '100%';
	if (!noctrl) {
		tr = $$('tr');
		tr.appendChild(this.createCell('Start', 'label'));
		tr.appendChild(this.createCell('Stop', 'label'));
		tr.appendChild(this.createCell('Step', 'label'));
		tab.appendChild(tr);
		tr = $$('tr');
		tr.appendChild(this.createCell('start', 'text'));
		tr.appendChild(this.createCell('stop', 'text'));
		tr.appendChild(this.createCell('step', 'text'));
		tab.appendChild(tr);
		tab.appendChild(tr);
	}
	tr = $$('tr');
	td = $$('td');
	td.setAttribute('colspan', 3);
	td.id = this.id+'_body';
	td.className = 'effect';
	this.body = td;
	tr.appendChild(td);
	tab.appendChild(tr);

	el.appendChild(tab);
	parent.appendChild(el);
}
/*****************************************************************************/
Effect.prototype.update = function() {
	this.controls.apply( function(k, fx) {
		var value = null;
		if (this[k].tagName == 'INPUT') {
			switch (this[k].type) {
				case 'text': value = parseFloat(this[k].value); break;
				case 'checkbox': value = this[k].checked; break;
			}
		} else if (this[k].tagName == 'SELECT') {
			value = this[k].options[this[k].selectedIndex].value;
		}
		if (value != null && fx.parameters[k] != undefined) {
			fx.parameters[k] = value;
		};
	}, this);
}
/*****************************************************************************/
Effect.normalize = function() {
	var min = 1000.0, max = -1000.0, ix = 0;
	for (var j=0; j<g.size; j++) {
		for (var i=0; i<g.size; i++) {
			if (g.heightMap1[ix] > max) max = g.heightMap1[ix];
			if (g.heightMap1[ix] < min) min = g.heightMap1[ix];
			ix++;
		}	
	}
	var r = (max - min);
	var s = g.size/4/r;
	Dbg.prln('min: '+min.toPrecision(2)+', max: '+max.toPrecision(2)+', range: '+r.toPrecision(2)+', scale: '+s.toPrecision(2));
	ix = 0;
	for (var j=0; j<g.size; j++) {
		for (var i=0; i<g.size; i++) {
			var h = s*(g.heightMap1[ix] - min);
			g.heightMap1[ix] = h;
			ix++;
		}
	}
};
/*****************************************************************************/
Effect.apply = function(arr, frame) {
	frame++;
	var changed = false;
	arr.apply( function(k, args) {
		var fx = this[k];
		if (fx.parameters.enable) {
			var p = fx.parameters;
			if (frame >= p.start && frame < p.stop) {
				if (fx.count-- <= 0) {
					fx.count = p.step;
					changed = fx.apply(frame) || changed;
				}
			}
			if (!p.start && !p.stop) {
				changed = fx.apply(frame) || changed;
			}
		}
	}, null);

	// normalize
	if (frame == 256) {
		Effect.normalize();
		changed = true;
	}
	return changed;
}
/*****************************************************************************/
function Tile(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}	
Tile.prototype = Object.create(Effect.prototype);
// 
Tile.prototype.initUI = function(el) {
	Effect.prototype.initUI.call(this, el);

	var lbl = Effect.createControl('label', 'Flatness');
	this.body.appendChild(lbl);
	var tb = Effect.createControl('text', this.parameters.flatness);
	tb.id = this.id+'flatness';
	this.controls.flatness = tb;
	this.body.appendChild(tb);
	var waves = [];
	for (var w in Tile.waveFunc) {
		if (Tile.waveFunc.hasOwnProperty(w) &&
			typeof Tile.waveFunc[w] === 'function') {
			waves.push(w);
		}
	}
	var sb = Effect.createControl('list', waves );
	sb.options[waves.indexOf(this.parameters.wave)].selected = true;
	sb.id = this.id+'wave';
	this.controls.wave = sb;
	this.body.appendChild(sb);
}

Tile.waveFunc = {
      sin: function(x, y) {
    	  return Math.sin(Math.PI*y)*Math.sin(Math.PI*x);
      },
      saw: function(x, y) {
    	  return x*y;
      },
      pulse: function(x, y) {
    	  return 1;
      }
};


Tile.prototype.apply = function(frame) {
	var p = this.parameters;
	var jm = Math.ceil(g.size/frame);
	var buffer= [], row;
	var im = Math.ceil(g.size/frame);
	for (var j=0; j<frame; j++) {
		row = [];
		for (var i=0; i<frame; i++) {
			var s = Math.pow((1.0 - .005*p.flatness), this.count);
			row.push(s*(Math.random()-0.5));
		}
		buffer.push(row);
	}
	
	var ji= -1, jc = 0, v, ix1 = 0, ix2 = 0;
	for (var j=0; j<g.size; j++) {
		if (j % jm == 0) { ji++; jc=0; }
		var ii = -1, ic = 0;
		for (var i=0; i<g.size; i++) {
			if (i % im == 0) { ii++; ic=0; }
			v = buffer[ji][ii];
			g[p.bufferOut][ix1++] += v*Tile.waveFunc[p.wave](jc/jm, ic/im);
			//g[p.bufferOut][ix1++] += 2*v*Math.sin(2*Math.PI*jc/jm)*Math.cos(2*Math.PI*ic/im)
			//g[p.bufferOut][ix1++] += 2*v*(jc/jm*ic/im);
			ic++;
		}
		jc++;
	}
	return true;
}

Tile.prototype.update = function() {
	Effect.prototype.update.call(this);
	var v = parseFloat(this.controls.flatness.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		else if (v >= 10) v = 9.9;
		this.parameters.flatness = v;
		this.controls.flatness.value = v;
		
	}
}
/*****************************************************************************/
function Noise(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}	
Noise.prototype = Object.create(Effect.prototype);
//Noise.prototype.constructor = Noise; 
Noise.prototype.initUI = function(el) {
	Effect.prototype.initUI.call(this, el, true);

	var lbl = Effect.createControl('label', 'Flatness');
	this.body.appendChild(lbl);
	var tb = Effect.createControl('text', this.parameters.flatness);
	tb.id = this.id+'flatness';
	this.controls.flatness = tb;
	this.body.appendChild(tb);
	var lbl = Effect.createControl('label', 'Octaves');
	this.body.appendChild(lbl);
	tb = Effect.createControl('text', this.parameters.octaves);
	tb.id = this.id+'octaves';
	this.controls.octaves = tb;
	this.body.appendChild(tb);
}

Noise.prototype.apply = function(frame) {
	var changed = false;
	if (frame == 1) {
//	for (var i=0; i<g.size*g.size; i++) {
//		g.heightMap1[i] = .0;
//	}
		var p = this.parameters;
		var cnt = 0;
		while (cnt <= p.octaves) {
			var d = Math.pow(2, cnt);
			//if (frame == d) {
				var s = Math.pow((.6 - .01*p.flatness), cnt-1);
				var ix = 0;
				for (var j=0; j<g.size; j++) {
					for (var i=0; i<g.size; i++) {
						//var h = 10*s*Noise.noise3f(d*i/g.size, d*j/g.size, Noise.noise1f(0.01*frame));
						var h = s*Noise.noise2f(d*i/g.size, d*j/g.size);
						g[p.bufferOut][ix++] += h;
					}
				}
				this.count++;
				changed = true;
			//}
			cnt++;
		}
	}
	return changed;
}

Noise.prototype.update = function() {
	Effect.prototype.update.call(this);
	var v = parseFloat(this.controls.flatness.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		else if (v >= 10) v = 9.9;
		this.parameters.flatness = v;
		this.controls.flatness.value = v;
	}
	v = parseFloat(this.controls.octaves.value);
	if (!isNaN(v)) {
		if (v < 1) v = 1;
		else if (v >= 6) v = 6;
		this.parameters.octaves = v;
		this.controls.octaves.value = v;
	}
}
/*****************************************************************************/
function Filter(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}
Filter.prototype = Object.create(Effect.prototype);
//Filter.prototype.constructor = Filter; 
Filter.prototype.initUI = function(el) {
	Effect.prototype.initUI.call(this, el);
	//create input matrix for parameter.matrix
	var tab = $$('table');
	for (var j=0; j<this.parameters.matrix.length; j++) {
		var tr = $$('tr');
		for (var i=0; i<this.parameters.matrix[0].length; i++) {
			var td = $$('td');
			var tb = $$('input');
			var id = this.id+'_'+i+'_'+j;
			this.controls[id] = tb;
			tb.id = id;
			tb.name = id;
			tb.type = 'text';
			tb.size = 2;
			tb.value = this.parameters.matrix[j][i];
			td.appendChild(tb);
			tr.appendChild(td);
		}
		tab.appendChild(tr);
	}
	this.body.appendChild(tab);

	var sp = $$('sp');
	sp.innerHTML = 'Factor:';
	this.body.appendChild(sp);
	var tb = $$('input');
	var id = this.id+'_factor';
	this.controls.factor = tb;
	tb.id = id;
	tb.name = id;
	tb.type = 'text';
	tb.size = 2;
	tb.value = this.parameters.factor;
	this.body.appendChild(tb);
}
Filter.prototype.apply = function(frame) {
	var changed = true;
	var p = this.parameters;
	var rows = p.matrix.length;
	var cols = p.matrix[0].length;
	var st1 = Math.floor(rows/2), st2 = Math.floor(cols/2);
	for (var i=0; i<g.size; i++) {
		for (var j=0; j<g.size; j++) {
			var h = 0, q = 0;
			for (var k=-st1; k<=st1; k++) {
				var y = j+k;
				if (y < 0 || y >= g.size) continue;
				for (var l=-st2; l<=st2; l++) {
					var x = i+l;
					if (x < 0 || x >= g.size) continue;
					var f = p.matrix[l+1][k+1];
					h += f * g[p.bufferIn][x + y*g.size];
					q += f;	//Math.abs(f);
				}
			}
			var f = p.factor;
			if (!f) f = q;
			g[p.bufferOut][i + j*g.size] = h/f;
		}
	}
	// swap buffers
	var tmp = g[p.bufferOut];
	g[p.bufferOut] = g[p.bufferIn];
	g[p.bufferIn] = tmp;
	
	return changed;
}

Filter.prototype.update = function() {
	Effect.prototype.update.call(this);
	
	for (var j=0; j<this.parameters.matrix.length; j++) {
		for (var i=0; i<this.parameters.matrix[0].length; i++) {
			var el = this.controls[this.id+'_'+i+'_'+j];
			var v = parseFloat(el.value);
			if (!isNaN(v)) {
				if (v < -1) v = -1;
				else if (v >= 1) v = 1;
				this.parameters.matrix[j][i] = v;
				el.value = v;
				
			}
		}
	}
}
/*****************************************************************************/
function Shift(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}
Shift.prototype = Object.create(Effect.prototype);
Shift.prototype.constructor = Shift; 

Shift.prototype.initUI = function(el) {
	Effect.prototype.initUI.call(this, el);
	var lbl = Effect.createControl('label', 'Strength');
	this.body.appendChild(lbl);
	var tb = Effect.createControl('text', this.parameters.strength);
	tb.id = 'strength';
	this.controls.strength = tb;
	this.body.appendChild(tb);

}
Shift.prototype.apply = function(frame) {
	var changed = true;
	var p = this.parameters;
	var x1 = Math.floor(Math.random()*g.size);
	var y1 = Math.floor(Math.random()*g.size);
	var m = 2*Math.random() - 1;
	var s = (1 - 0.03*p.strength)*Math.pow((1.0-0.005*p.strength), frame);
	var ix = 0;
	for (var j=0; j<g.size; j++) {
		for (var i=0; i<g.size; i++) {
			var y = m*(i-x1) + y1;
			var h = g[p.bufferOut][ix];
			if (j - y < 0) {
				 h = h - s;
			} else {
				h = h + s;
			}
			g[p.bufferOut][ix] = h;
			ix++;
		}
	}
	return changed;
}
Shift.prototype.update = function() {
	Effect.prototype.update.call(this);
	var v = parseFloat(this.controls.strength.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		else if (v >= 10) v = 9.9;
		this.parameters.strength = v;
		this.controls.strength.value = v;
	}
}


Noise.seed = (function(s){
		var arr=new Array(256);
		for (var i=0;i<512;i++){arr[i]=-1;}
		var j=s; for (var i=0;i<512;i++){
			while (arr[j] != -1) {
				j = (j+Math.floor(Math.random()*65536))%512;
			}
			arr[j] = i%256;
		}
		return arr;
	})(new Date().getTime());


Noise.lerp = function(a, b, x) {
	var x2 = x*x;
	var f = 3*x2-2*x*x2;	// smoothstep
	return a*(1-f) + b*f;
}
Noise.smoothstep = function(x) {
	var x2 = x*x;
	return 3*x2-2*x*x2;
}

Noise.grad1=function(h, x) {
    switch(h & 0x01) {
        case 0x0: return  x;
        case 0x1: return -x;
    }
}

Noise.grad2=function(h, x, y) {
    switch(h & 0x03) {
        case 0x0: return  x + y;
        case 0x1: return -x + y;
        case 0x2: return  x - y;
        case 0x3: return -x - y;
        default: return 0;
    }
}

Noise.grad3=function(h, x, y, z) {
    switch(h & 0x0f) {
        case 0x0: return  x + y;
        case 0x1: return -x + y;
        case 0x2: return  x - y;
        case 0x3: return -x - y;
        case 0x4: return  x + z;
        case 0x5: return -x + z;
        case 0x6: return  x - z;
        case 0x7: return -x - z;
        case 0x8: return  y + z;
        case 0x9: return -y + z;
        case 0xA: return  y - z;
        case 0xB: return -y - z;
        case 0xC: return  y + x;
        case 0xD: return -y + z;
        case 0xE: return  y - x;
        case 0xF: return -y - z;
        default: return 0;
    }
}

Noise.noise1f = function(x){
	var xi = Math.floor(x);
	var xf = x - xi; xi = xi%256;
	var u = Noise.smoothstep(xf);
	var xi2 = (xi+1)%256;
	var g1 = Noise.seed[xi], g2 = Noise.seed[xi2];
	return Noise.lerp(Noise.grad1(g1, xf), Noise.grad1(g2, xf-1), u);
}

Noise.noise2f = function(x, y){
	var xi = Math.floor(x);
	var yi = Math.floor(y);

	var xf = x - xi; xi = xi%256;
	var yf = y - yi; yi = yi%256;

	var u = Noise.smoothstep(xf);
	var v = Noise.smoothstep(yf);

	var xi2 = (xi+1)%256;
	var yi2 = (yi+1)%256;

	var n = Noise.seed;
	var g1 = n[n[xi]+yi], g2 = n[n[xi2]+yi], g3 = n[n[xi]+yi2], g4 = n[n[xi2]+yi2];
	var n1 = Noise.lerp(Noise.grad2(g1, xf, yf), Noise.grad2(g2, xf-1, yf), u);
	var n2 = Noise.lerp(Noise.grad2(g3, xf, yf-1), Noise.grad2(g4, xf-1, yf-1), u);
	return Noise.lerp(n1, n2, v)+1;
}

Noise.noise3f = function(x, y, z){
	var xi = Math.floor(x);
	var yi = Math.floor(y);
	var zi = Math.floor(z);

	var xf = x - xi; xi = xi%256;
	var yf = y - yi; yi = yi%256;
	var zf = z - zi; zi = zi%256;

	var u = Noise.smoothstep(xf);
	var v = Noise.smoothstep(yf);
	var w = Noise.smoothstep(zf);

	var xi2 = (xi+1)%256;
	var yi2 = (yi+1)%256;
	var zi2 = (zi+1)%256;

	var n = Noise.seed;
	var nx1 = n[xi], nx2 = n[xi2];
	var g1 = n[n[nx1+yi]+zi], g2 = n[n[nx1+yi2]+zi], g3 = n[n[nx1+yi]+zi2], g4 = n[n[nx1+yi2]+zi2];
	var g5 = n[n[nx2+yi]+zi], g6 = n[n[nx2+yi2]+zi], g7 = n[n[nx2+yi]+zi2], g8 = n[n[nx2+yi2]+zi2];
	var n1 = Noise.lerp(Noise.grad3(g1, xf, yf, zf), Noise.grad3(g5, xf-1, yf, zf), u);
	var n2 = Noise.lerp(Noise.grad3(g2, xf, yf-1, zf), Noise.grad3(g6, xf-1, yf-1, zf), u);
	var y1 = Noise.lerp(n1, n2, v);
	var n3 = Noise.lerp(Noise.grad3(g3, xf, yf, zf-1), Noise.grad3(g7, xf-1, yf, zf-1), u);
	var n4 = Noise.lerp(Noise.grad3(g4, xf, yf-1, zf-1), Noise.grad3(g8, xf-1, yf-1, zf-1), u);
	var y2 = Noise.lerp(n3, n4, v);
	return (Noise.lerp(y1, y2, w)+1)/2;
}

//function shift(f) {

//}
///*****************************************************************************/
//function smoothen() {
//	filter([
//      	[  0.7,  1.0,  0.7],
//      	[  1.0,  1.0,  1.0],
//      	[  0.7,  1.0,  0.7]
//	]);
//}
///*****************************************************************************/
//function sharpen() {
//	filter([
//      	[ -1, -1, -1],
//      	[ -1,  9, -1],
//      	[ -1, -1, -1]
//	], 0.1);
//}
