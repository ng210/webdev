include('math/fn.js');
include('math/noise.js');

(function() {
	
    function Fire() {
		Demo.call(this, 'Fire', {
			image: { label: 'Image', value: 0, min:0, max: 1, step: 1, type: 'int', link: null },
			motion: { label: 'Motion', value: 0.35, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			feedback: { label: 'Feedback', value: 0.5, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			cooling: { label: 'Cooling', value: 0.02, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			radius: { label: 'Radius', value: 0.02, min:0, max:1.0, step: 0.01, type: 'float', link: null },
			range: { label: 'Color mapping', value: 0.15, min:0, max:1, step: 0.01,type: 'float', link: null },
			color: { label: 'Color', value: 0, min:0, max:1, step: 1,type: 'int', link: null },

			color1: { label: 'Color1', value: 0.10, min:0, max:1, step: 0.01,type: 'float', link: null },
			color2: { label: 'Color2', value: 0.30, min:0, max:1, step: 0.01,type: 'float', link: null },
			color3: { label: 'Color3', value: 0.40, min:0, max:1, step: 0.01,type: 'float', link: null },
			color4: { label: 'Color4', value: 0.50, min:0, max:1, step: 0.01,type: 'float', link: null },
			color5: { label: 'Color5', value: 0.60, min:0, max:1, step: 0.01,type: 'float', link: null }
		});

		this.fbmSize = 50;
		this.images = [];
		// create 2 heat maps
		this.heatMaps = [null, null, null];
		this.buffer = null;
		this.noise = null;
		this.filter = new Fn.Filter([
			[ 0,  1,  0],
			[ 0,  3,  0],
			[ 2,  5,  2]
		]);
		this.backgroundColor = [0.1, 0.15, 0.2];
		this.cursor = [0, 0];
		this.ratio = [1, 1];

		this.maxHeat = 0;
		this.colors = null;
		this.colorTables = [
			[
				[1.00, 1.0, 1.0, 1.0, 1.0],
				[0.50, 1.0, 1.0, 0.8, 1.0],
				[0.50, 1.0, 0.8, 0.6, 1.0],
				[0.40, 0.8, 0.5, 0.4, 0.9],
				[0.30, 0.5, 0.3, 0.3, 0.8],
				[0.20, 0.3, 0.3, 0.3, 0.7],
				[0.00, 0.0, 0.0, 0.0, 0.0]
			],
			[
				[1.00, 1.0, 1.0, 1.0, 1.0],
				[0.50, 0.5, 1.0, 0.5, 1.0],
				[0.50, 1.0, 0.5, 0.5, 1.0],
				[0.40, 0.0, 0.0, 0.0, 1.0],
				[0.30, 0.0, 0.0, 1.0, 1.0],
				[0.20, 0.0, 1.0, 0.0, 1.0],
				[0.10, 1.0, 0.0, 0.0, 1.0]
			]
		];
	};
	extend(Demo, Fire);
	Fire.prototype.initialize = async function initialize() {
		// create list of images
		var urls = [
			'/demo/data/fire.png',
			'/demo/data/aliens.gif',
			'/demo/data/tilduska.png'
		];
		this.images = [];
		var res = await load(urls);
		for (var i=0; i<res.length; i++) {
			if (!(res[i].error instanceof Error) && res[i].node instanceof Image) {
				var url = res[i].resolvedUrl;
				var ix = url.path.lastIndexOf('/') + 1;
				res[i].node.alt = url.path.substring(ix != 0 ? ix : 0);
				this.images.push({key:res[i].node.alt, value: res[i].node});
			}
		}
		this.settings.image.control.max = this.images.length - 1;

		// var combobox = glui.Control.create('images', {
		// 	'type': 'Combobox',
		// 	//'style': comboboxStyle,
		// 	'readonly': true,
		// 	'rows': 4,
		// 	'key-field': 'key',
		// 	'values': 'DemoMgr.demo.images',
		// 	'row-template': {
		// 		'key': { 'type': 'Label', 'style': { 'background': '#60c0a0', 'border':'#60c0a0 1px inset' } },
		// 	}
		// }, null, null);
		// combobox.dataBind(ctrl.dataSource, ctrl.dataField);
		// DemoMgr.controls.settings.replace(DemoMgr.controls.settings.rows["images"].cells["value"], combobox);
		// combobox.setRenderer(glui.mode, glui.mode == glui.Render2d ? glui.renderingContext2d : glui.renderingContext3d);

		this.colors = [this.settings.color1, this.settings.color2, this.settings.color3, this.settings.color4, this.settings.color5];
		this.adjustColors();
		this.noise = new Noise();
		//DemoMgr.controls.settings.rows["images"].cells["value"].setItems(this.images.map(v => v.alt));
		var canvas = document.createElement('canvas');
		canvas.width = Math.floor(glui.width/2);
		canvas.height = Math.floor(glui.height/2);

		this.buffer = new glui.Buffer();
		this.buffer.canvas.style.backgroundColor = 'rgb(255, 255, 255)';
		this.setImage();
		this.heatMaps[1] = this.createHeatMap();
		this.resize();
		this.update(0, 0);
	};
	Fire.prototype.resize = function resize(e) {
		this.ratio[0] = this.buffer.width/glui.canvas.clientWidth;
		this.ratio[1] = this.buffer.height/glui.canvas.clientHeight;
	};
	Fire.prototype.update = function update(frame, dt) {
		var id = frame % 2;
		var source = this.heatMaps[id];
		var target = this.heatMaps[1 - id];
		var ix = 0;
		var cooling = 1 - this.settings.cooling.value;
		var jx = 0;
		this.maxR = 0;
		this.maxHeat = 0;
		var radius = 0.5 * this.settings.radius.value * source.width;
		for (var j=0; j<source.height; j++) {
			var ly = j - this.cursor[1];
			for (var i=0; i<source.width; i++) {
				var lx = i - this.cursor[0];
				var l = Math.sqrt(lx*lx + ly*ly);
				var d = 0;
				// if (l < radius) {
				// 	if (lx > 0 && lx < source.width && ly > 0 && ly < source.height) {
				// 		d = l/source.data[this.cursor[0] + this.cursor[1]*source.width];
				// 	}						
				// }
				var avg = this.filter.apply(source.data, source.width, source.height, 1, i, j, 0);
				var r = this.noise.fbm3d(4*i/source.width, 4*j/source.height, 0.01*this.settings.motion.value*frame, 3, 0.5, 8.01, 1.125, 3.95);
				this.maxR = Math.max(r, this.maxR);
				var heat = d + Fn.lerp(1.0, r, this.settings.motion.value)*(avg + (1+this.settings.feedback.value)*this.heatMaps[2].data[ix]);

				heat *= cooling;
				target.data[ix] = heat;
				this.maxHeat = Math.max(this.maxHeat, heat);
				var rgba = this.heatToColor(heat*this.settings.range.value);
				this.buffer.imgData.data[4*ix] = Math.floor(255*Fn.lerp(this.backgroundColor[0], rgba[0], rgba[3]));
				this.buffer.imgData.data[4*ix+1] = Math.floor(255*Fn.lerp(this.backgroundColor[1], rgba[1], rgba[3]));
				this.buffer.imgData.data[4*ix+2] = Math.floor(255*Fn.lerp(this.backgroundColor[2], rgba[2], rgba[3]));
				//this.buffer.buffer.data[4*ix+3] = rgba[3];
				ix++;
			}
			jx += source.width;
		}
		this.buffer.update();
	};
	Fire.prototype.render = function render(frame, dt) {
		glui.renderingContext2d.save();
		glui.frontBuffer.blit(this.buffer);
		glui.renderingContext2d.globalAlpha = 0.3;
		glui.renderingContext2d.font = '14px Consolas';
		glui.renderingContext2d.fillStyle = "#ffe080";
		glui.renderingContext2d.textAlign = "left";
		glui.renderingContext2d.fillText("heat:" + this.maxHeat.toFixed(2), 4, glui.height - 4);
		glui.renderingContext2d.fillText("r:" + this.maxR.toFixed(2), 100, glui.height - 4);
		glui.renderingContext2d.restore();
	};
	Fire.prototype.setImage = function setImage() {
		var ix = this.settings.image.value;
		var img = this.images[ix].value;
		if (this.buffer.width != img.width || this.buffer.height != img.height) {
			this.buffer.resize(img.width, img.height);
		}
		this.buffer.blitImage(img);
		this.buffer.update(true);
		
		this.heatMaps[0] = this.createHeatMap(this.buffer);
		this.heatMaps[2] = this.createHeatMap(this.buffer);
	};
	Fire.prototype.createHeatMap = function createHeatMap(buffer) {
		buffer = buffer || this.buffer;
		var heatMap = {
			width: buffer.width,
			height: buffer.height,
			data: new Float32Array(buffer.width * buffer.height)
		};
		var ix = 0;
		for (var j=0; j<buffer.height; j++) {
			for (var i=0; i<buffer.width; i++) {
				var v = 0.2989 * buffer.imgData.data[ix*4] +
						0.5870 * buffer.imgData.data[ix*4+1] +
						0.1140 * buffer.imgData.data[ix*4+2];
					v /= 255;
				heatMap.data[ix++] = v*v;
			}
		}
		return heatMap;
	};
	Fire.prototype.onmousemove = function onmousemove(e) {
		this.cursor[0] = e.clientX*this.ratio[0];
		this.cursor[1] = e.clientY*this.ratio[1];
	};	
	Fire.prototype.onchange = function onchange(e, setting) {
		var id = setting.parent.id;
		switch (id) {
			case 'image':
				this.setImage();
				break;
		}
		if (id && id.startsWith('Color')) {
			var ix = id.charCodeAt(5) - 48;
			if (ix) {
				this.adjustColors();
			}
		}
	};
	Fire.prototype.adjustColors = function() {
		var tab = this.colorTables[this.settings.color.value];
		var rest = 1, previous = 0;
		for (var i=0; i<this.colors.length; i++) {
			var v = rest*this.colors[i].value;
			rest -= v;
			tab[tab.length-2-i][0] = v + previous;
			previous += v;
		}
	};
	Fire.prototype.heatToColor = function heatToColor(v) {
		var tix = this.settings.color.value;
		var col = [0, 0, 0, 0];
		var tab = this.colorTables[tix];
		var i0 = tab[0];
		for (var i=1; i<tab.length; i++) {
			var i1 = tab[i];
			if (v > i1[0]) {
				var r = (v - i1[0])/(i0[0] - i1[0]);
				for (var j=0; j<4; j++) {
					col[j] = r*(i0[j+1] - i1[j+1]) + i1[j+1];
				}
				break;
			}
			i0 = i1;
		}
		return col;
	};

	publish(new Fire(), 'Fire');
})();
