include('ge/fn.js');
include('ge/noise.js');

(function() {
	
    var Fire = {
		name: 'Fire',
		settings: {
			images: { label: 'Image', value: 'fire.png', type: 'string', link: null },
			motion: { label: 'Motion', value: 0.35, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			feedback: { label: 'Feedback', value: 0.5, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			cooling: { label: 'Cooling', value: 0.02, min:0, max:1.0, step: 0.01, normalized:true, type: 'float', link: null },
			range: { label: 'Color mapping', value: 0.15, min:0, max:1, step: 0.01,type: 'float', link: null },
			color: { label: 'Color', value: 0, min:0, max:1, step: 1,type: 'int', link: null },

			color1: { label: 'Color1', value: 0.10, min:0, max:1, step: 0.01,type: 'float', link: null },
			color2: { label: 'Color2', value: 0.30, min:0, max:1, step: 0.01,type: 'float', link: null },
			color3: { label: 'Color3', value: 0.40, min:0, max:1, step: 0.01,type: 'float', link: null },
			color4: { label: 'Color4', value: 0.50, min:0, max:1, step: 0.01,type: 'float', link: null },
			color5: { label: 'Color5', value: 0.60, min:0, max:1, step: 0.01,type: 'float', link: null }
		},

		fbmSize: 50,
		images: [],
		// create 2 heat maps
		heatMaps: [null, null, null],
		frontBuffer: { context:null, buffer: null },
		backBuffer: { context:null, buffer: null },
		noise: null,
		filter: new Fn.Filter([
			[ 0,  1,  0],
			[ 0,  3,  0],
			[ 2,  5,  2]
		]),
		backgroundColor: [0.1, 0.15, 0.2],

		initialize: async function initialize() {
			// create list of images
			var urls = [
				'/demo/data/fire.png',
				'/demo/data/bump.gif',
				'/demo/data/javascript.gif'
			];
			var res = await load(urls);
			for (var i=0; i<res.length; i++) {
				if (!(res[i].error instanceof Error) && res[i].node instanceof Image) {
					var url = res[i].resolvedUrl;
					var ix = url.path.lastIndexOf('/') + 1;
					res[i].node.alt = url.path.substring(ix != 0 ? ix : 0);
					this.images.push({key:res[i].node.alt, value: res[i].node});
				}
			}
			var ctrl = DemoMgr.controls.settings.rows["images"].cells["value"];
			var rowColumn = ctrl.id.split('#');
			var combobox = glui.Control.create('images', {
				'type': 'Combobox',
				//'style': comboboxStyle,
				'readonly': true,
				'rows': 4,
				'key-field': 'key',
				'values': 'DemoMgr.demo.images',
				'row-template': {
					'key': { 'type': 'Label', 'style': { 'background': '#60c0a0', 'border':'#60c0a0 1px inset' } },
				}
			}, null, null);
			combobox.dataBind(ctrl.dataSource, ctrl.dataField);
			DemoMgr.controls.settings.replace(DemoMgr.controls.settings.rows["images"].cells["value"], combobox);
			combobox.setRenderer(glui.mode, glui.mode == glui.Render2d ? glui.renderingContext2d : glui.renderingContext3d);

			this.colors = [this.settings.color1, this.settings.color2, this.settings.color3, this.settings.color4, this.settings.color5];
			this.adjustColors();
			this.noise = new Noise();
			//DemoMgr.controls.settings.rows["images"].cells["value"].setItems(this.images.map(v => v.alt));
			var canvas = document.createElement('canvas');
			canvas.width = Math.floor(glui.width/2);
			canvas.height = Math.floor(glui.height/2);
			canvas.style.backgroundColor = 'rgb(255, 255, 255)';
			this.frontBuffer.context = canvas.getContext('2d');
			this.frontBuffer.buffer = this.frontBuffer.context.getImageData(0, 0, canvas.width, canvas.height);
			var canvas = document.createElement('canvas');
			canvas.style.backgroundColor = 'rgb(255, 255, 255)';
			this.backBuffer.context = canvas.getContext('2d');
			this.setImage();
			this.heatMaps[1] = this.createHeatMap();
			this.update(0);
        },
        resize: function resize(e) {
		},
		maxHeat: 0,
        update: function update(frame, dt) {
			var id = frame % 2;
			var source = this.heatMaps[id];
			var target = this.heatMaps[1 - id];
			var ix = 0;
			var cooling = 1 - this.settings.cooling.value;
			var jx = 0;
			this.maxR = 0;
			this.maxHeat = 0;
			for (var j=0; j<source.height; j++) {
				for (var i=0; i<source.width; i++) {
					var avg = this.filter.apply(source.data, source.width, source.height, 1, i, j, 0);
					var r = this.noise.fbm3d(4*i/source.width, 4*j/source.height, 0.01*this.settings.motion.value*frame, 3, 0.5, 8.01, 1.125, 3.95);
					this.maxR = Math.max(r, this.maxR);
					var heat = Fn.lerp(1.0, r, this.settings.motion.value)*(avg + (1+this.settings.feedback.value)*this.heatMaps[2].data[ix]);
					heat *= cooling;
					target.data[ix] = heat;
					this.maxHeat = Math.max(this.maxHeat, heat);
					var rgba = this.heatToColor(heat*this.settings.range.value);
					this.backBuffer.buffer.data[4*ix] = Math.floor(255*Fn.lerp(this.backgroundColor[0], rgba[0], rgba[3]));
					this.backBuffer.buffer.data[4*ix+1] = Math.floor(255*Fn.lerp(this.backgroundColor[1], rgba[1], rgba[3]));
					this.backBuffer.buffer.data[4*ix+2] = Math.floor(255*Fn.lerp(this.backgroundColor[2], rgba[2], rgba[3]));
					//this.backBuffer.buffer.data[4*ix+3] = rgba[3];
					ix++;
				}
				jx += source.width;
			}
			this.backBuffer.context.putImageData(this.backBuffer.buffer, 0, 0);
			this.frontBuffer.context.drawImage(this.backBuffer.context.canvas, 0, 0, this.backBuffer.buffer.width, this.backBuffer.buffer.height, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height);
			//this.frontBuffer.context.drawImage(this.backBuffer.context.canvas, 0, 0, this.backBuffer.buffer.width, this.backBuffer.buffer.height, this.frontBuffer.buffer.width/4, this.frontBuffer.buffer.height/4, this.frontBuffer.buffer.width/2, this.frontBuffer.buffer.height/2);
		},
        render: function render(frame, dt) {
			glui.renderingContext2d.save();
			glui.renderingContext2d.drawImage(this.frontBuffer.context.canvas, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height, 0, 0, glui.width, glui.height);
			glui.renderingContext2d.globalAlpha = 0.3;
			glui.renderingContext2d.font = '14px Consolas';
			glui.renderingContext2d.fillStyle = "#ffe080";
			glui.renderingContext2d.textAlign = "left";
			glui.renderingContext2d.fillText("heat:" + this.maxHeat.toFixed(2), 4, glui.height - 4);
			glui.renderingContext2d.fillText("r:" + this.maxR.toFixed(2), 100, glui.height - 4);
			glui.renderingContext2d.restore();
		},
		setImage: function setImage() {
			var ix = DemoMgr.controls.settings.rows['images'].cells['value'].getValue();
			var img = this.images[ix].value;
			if (this.backBuffer.context.canvas.width != img.width || this.backBuffer.context.canvas.height != img.height) {
				this.backBuffer.context.canvas.width = img.width;
				this.backBuffer.context.canvas.height = img.height;
				this.backBuffer.context = this.backBuffer.context.canvas.getContext('2d');
			}

			this.backBuffer.context.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
			this.backBuffer.buffer = this.backBuffer.context.getImageData(0, 0, this.backBuffer.context.canvas.width, this.backBuffer.context.canvas.height);
			this.heatMaps[0] = this.createHeatMap(this.backBuffer.buffer);
			this.heatMaps[2] = this.createHeatMap(this.backBuffer.buffer);
		},
		createHeatMap: function createHeatMap(buffer) {
			buffer = buffer || this.backBuffer.buffer;
			var heatMap = {
				width: buffer.width,
				height: buffer.height,
				data: new Float32Array(buffer.width * buffer.height)
			};
			var ix = 0;
			for (var j=0; j<buffer.height; j++) {
				for (var i=0; i<buffer.width; i++) {
					var v = 0.2989 * buffer.data[ix*4] +
							0.5870 * buffer.data[ix*4+1] +
							0.1140 * buffer.data[ix*4+2];
						v /= 255;
					heatMap.data[ix++] = v*v;
				}
			}
			return heatMap;
		},
		colors: null,
		onchange: function onchange(setting) {
			var label = setting.control.dataSource.label;
			switch (label) {
				case 'resolution':
					this.onresize();
					break;
				case 'images':
					this.setImage();
					break;
			}
			if (label && label.startsWith('Color')) {
				var ix = label.charCodeAt(5) - 48;
				if (ix) {
					this.adjustColors();
				}
			}
		},
		adjustColors: function() {
			var tab = this.colorTables[this.settings.color.value];
			var rest = 1, previous = 0;
			for (var i=0; i<this.colors.length; i++) {
				var v = rest*this.colors[i].value;
				rest -= v;
				tab[tab.length-2-i][0] = v + previous;
				previous += v;
			}
			console.log(tab.map( x => x[0]));

		},
		colorTables: [
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
		],
		heatToColor: function heatToColor(v) {
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
		}
	};
	public(Fire, 'Fire');
})();
