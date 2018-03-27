var g = g || {};
g.effects = {};

/*****************************************************************************/
function initEffects(el) {
	new Noise('noise1', 'Noise1', {
		width:g.w, height:g.h,
		bufferIn:null, bufferOut:g.heightMap1,
		enable:true,
		count: g.w, mod: 2,
		damping:4,
		frame:0
	});
	
	new Filter('smoothen', 'Smoothen', {
		width:g.w, height:g.h,
		bufferIn:'heightMap1', bufferOut:'heightMap2',
		enable:true,
		count: g.w, mod: 15,
		matrix: [
			[ 0.7, 1.0, 0.7 ],
			[ 1.0, 1.0, 1.0 ],
			[ 0.7, 1.0, 0.7 ]		         
		],
		factor: 0,
		frame:0
	});

	new Filter('sharpen', 'Sharpen', {
		width:g.w, height:g.h,
		bufferIn:'heightMap1', bufferOut:'heightMap2',
		enable:false,
		count: g.w, mod: 11,
		matrix: [
			[-0.07, -0.10, -0.07],
			[-0.10,  1.00, -0.10],
			[-0.07, -0.10, -0.07]		         
		],
		factor: 1.68,
		frame:0
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
	this.parameters = parameters;
	g.effects[id] = this;
	this.controls = {};
}
/*****************************************************************************/
Effect.controls = {
	enable: 'bool',
	title: 'label',
	count: 'text',
	mod: 'text'
};
/*****************************************************************************/
Effect.prototype.initUI = function(parent) {
	var el = $$('div');
	el.id = this.id;

	var tab = $$('table');
	tab.setAttribute('border', 1);
	tab.id = this.id+'_tab';
	tab.className = 'effect';
	tab.width = '100%'

	Effect.controls.apply( function(k, args) {
		if (args.i == 0) {
			args.tr = $$('tr');
			args.tab.appendChild(args.tr);
		}
		var td = $$('td');
		td.className = 'effect';
		args.tr.appendChild(td);
		var el = null;
		switch (this[k]) {
			case 'bool':
				el = $$('input');
				el.type = 'checkbox';
				el.checked = args.effect.parameters[k];
				break;
			case 'text':
				el = $$('input');
				el.type = 'text';
				el.size = 2;
				el.value = args.effect.parameters[k];
				break;
			case 'label':
				el = $$('span');
				el.innerHTML = args.effect.parameters[k];
				break;
		}
		if (el != null) {
			el.name = args.effect.id+'_'+k;
			el.id = args.effect.id+'_'+k;
			td.appendChild(el);
			args.effect.controls[k] = el;
			args.i++;
			if (args.i == 2) {
				args.tab.appendChild(args.tr);
				args.i = 0;
			}
		}
	}, {tab:tab, tr:null, td:null, i:0, effect:this});
	this.controls.title.innerHTML = this.title;

	tr = $$('tr');
	td = $$('td');
	td.setAttribute('colspan', 2);
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
			if (fx.parameters[k] != undefined) {
				fx.parameters[k] = value;
			}
		}
	}, this);
}
/*****************************************************************************/
function Noise(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}	
Noise.prototype = Object.create(Effect.prototype);
Noise.prototype.constructor = Noise; 
Noise.prototype.initUI = function(el) {
	Effect.prototype.initUI.call(this, el);
	var sp = $$('span');
	sp.innerHTML = 'Flatness';
	this.body.appendChild(sp);
	var tb = $$('input');
	tb.type = 'text';
	tb.size = 3;
	tb.className = 'effect';
	tb.value = this.parameters.damping;
	tb.id = this.id+'_mod';
	this.body.appendChild(tb);
	this.controls.damping = tb;
}
Noise.prototype.apply = function() {
	var p = this.parameters;
	var changed = false;
	if (p.frame > 0 && p.frame < p.count && ((p.frame % p.mod) == 0)) {
		var jm = Math.ceil(p.width/p.frame);
		var buffer= [], row;
		var im = Math.ceil(p.height/p.frame);
		for (var j=0; j<p.frame; j++) {
			row = [];
			for (var i=0; i<p.frame; i++) {
				//var s = 4*(1 - p.damping/10)*(1 - p.frame/p.count);
				var s = (10 - 0.6*p.damping)*Math.pow((1.0-0.005*p.damping), p.frame);
				row.push(s*(Math.random()-0.5));
			}
			buffer.push(row);
		}

		var ji= -1, v, ix1 = 0, ix2 = 0;
		for (var j=0; j<p.height; j++) {
			if (j % jm == 0) ji++;
			var ii = -1;
			for (var i=0; i<p.width; i++) {
				if (i % im == 0) ii++;
				v = buffer[ji][ii];
				p.bufferOut[ix1++] += v;
			}
		}

/*
		var w = Math.floor(p.width/p.frame);
		var h = Math.floor(p.height/p.frame);
		//var s = 4*(1 - p.damping/10)*(1 - p.frame/p.count);	//*Math.pow((1-0.02*p.damping), p.frame);
		var s = 4*Math.pow((1.01-0.011*p.damping), p.frame);
		//Dbg.prln('s:'+s)
		for (var j=0; j<=p.frame; j++) {
			for (var i=0; i<=p.frame; i++) {
				var v = s*(Math.random()-0.5);
				for (var y=j*h; y<j*h+h && y < p.height; y++) {
					for (var x=i*w; x<i*w+w && x<p.width; x++) {
						p.bufferOut[x + y*p.width] += v;
					}
				}
			}
		}
*/
		changed = true;
	}
	return changed;
}
Noise.prototype.update = function() {
	Effect.prototype.update.call(this);
	var v = parseFloat(this.controls.damping.value);
	if (!isNaN(v)) {
		if (v < 0) v = 0;
		else if (v >= 10) v = 9.9;
		this.parameters.damping = v;
		this.controls.damping.value = v;
		
	}
}
/*****************************************************************************/
function Filter(id, title, parameters) {
	Effect.call(this, id, title, parameters);
}
Filter.prototype = Object.create(Effect.prototype);
Filter.prototype.constructor = Filter; 
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
	var tr = $$('tr');
	var td = $$('td');
	var sp = $$('sp');
	sp.innerHTML = 'Factor:';
	td.appendChild(sp);
	var tb = $$('input');
	var id = this.id+'_factor';
	this.controls.factor = tb;
	tb.id = id;
	tb.name = id;
	tb.type = 'text';
	tb.size = 2;
	tb.value = this.parameters.factor;
	td.appendChild(tb);
	tr.appendChild(td);
	tab.appendChild(tr);
	this.body.appendChild(tab);
}
Filter.prototype.apply = function() {
	var p = this.parameters;
	var changed = false;
	if (p.frame > 0 && p.frame < p.count && ((p.frame % p.mod) == 0)) {
		var rows = p.matrix.length;
		var cols = p.matrix[0].length;
		var st1 = Math.floor(rows/2), st2 = Math.floor(cols/2);
		for (var i=0; i<p.width; i++) {
			for (var j=0; j<p.height; j++) {
				var h = 0, q = 0;
				for (var k=-st1; k<=st1; k++) {
					var y = j+k;
					if (y < 0 || y >= p.height) continue;
					for (var l=-st2; l<=st2; l++) {
						var x = i+l;
						if (x < 0 || x >= p.width) continue;
						var f = p.matrix[l+1][k+1];
						h += f * g[p.bufferIn][x + y*p.width];
						q += Math.abs(f);
					}
				}
				var f = p.factor;
				if (!f) f = q;
				g[p.bufferOut][i + j*p.width] = h/f;
			}
		}
		// swap buffers
		var tmp = g[p.bufferOut];
		g[p.bufferOut] = g[p.bufferIn];
		g[p.bufferIn] = tmp;
		
		changed = true;
	}
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
//function shift(f) {
//	var x1 = Math.floor(Math.random()*g.w);
//	var y1 = Math.floor(Math.random()*g.h);
//	var m = 2*Math.random() - 1;
//	var s = g.effects.hills*(5*Math.random()-1)*Math.pow(g.effects.hills/10, f)/10;
//	var ix = 0;
//	for (var j=0; j<g.h; j++) {
//		for (var i=0; i<g.w; i++) {
//			var y = m*(i-x1) + y1;
//			var h = g.heightMap1[ix];
//			if (j - y < 0) {
//				 h = h - s;
//			} else {
//				h = h + s;
//			}
//			g.heightMap1[ix] = h;
//			ix++;
//		}
//	}
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
