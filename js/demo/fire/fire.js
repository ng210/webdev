include('ge/fn.js');
include('ge/noise.js');

(function() {
	
    var Fire = {
		name: 'Fire',
		settings: {
			images: { label: 'Image', value: 'fire.png', type: 'string', link: null },
			motion: { label: 'Motion', value: 0.4, min:0, max:1.0, step: 0.005, normalized:true, type: 'float', link: null },
			feedback: { label: 'Feedback', value: 0.7, min:0, max:2.0, step: 0.005, normalized:true, type: 'float', link: null },
			cooling: { label: 'Cooling', value: 0.1, min:0, max:0.4, step: 0.005, normalized:true, type: 'float', link: null },
			color: { label: 'Color', value: 0, min:0, max:1, step: 1,type: 'int', link: null }
		},

		fbmSize: 50,
		images: [],
		// create 2 heat maps
		heatMaps: [null, null, null],
		// this.colors = [
		// 	[0xff,0x80,0x80], [0x80,0xff,0x80], [0x80,0x80,0xff], [0xff,0xff,0x80],
		// 	[0x80,0xff,0xff], [0x80,0x80,0x80], [0xff,0x80,0xff], [0xff,0xff,0xff]
		// ];
		frontBuffer: { context:null, buffer: null },
		backBuffer: { context:null, buffer: null },
		mode: 0,
		noise: null,
		filter: new Fn.Filter([
			[ 0,  0,  0],
			[ 1,  3,  1],
			[ 3, 7,  3]
		]),

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
			// todo: change control into combobox
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
					'value': { 'type': 'Label', 'style': { 'background': '#60c0a0', 'border':'#60c0a0 1px inset' } },
				}
			}, null, null);
			combobox.dataBind(ctrl.dataSource, ctrl.dataField);
			combobox.row = ctrl.row;
			combobox.column = ctrl.column;
			ctrl.row.cells[rowColumn[0]] = combobox;
			ctrl.column.cells[rowColumn[1]] = combobox;
			DemoMgr.controls.settings.remove(ctrl);
			DemoMgr.controls.settings.add(combobox);

			this.noise = new Noise();
			//DemoMgr.controls.settings.rows["images"].cells["value"].setItems(this.images.map(v => v.alt));
			var canvas = document.createElement('canvas');
			canvas.width = Math.floor(glui.width/4);
			canvas.height = Math.floor(glui.height/4);
			canvas.style.backgroundColor = 'rgb(0, 0, 0)';
			this.frontBuffer.context = canvas.getContext('2d');
			this.frontBuffer.buffer = this.frontBuffer.context.getImageData(0, 0, canvas.width, canvas.height);
			var canvas = document.createElement('canvas');
			canvas.style.backgroundColor = 'rgb(0, 0, 0)';
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
			for (var j=0; j<source.height; j++) {
				for (var i=0; i<source.width; i++) {
					var avg = this.filter.apply(source.data, source.width, source.height, 1, i, j, 0);
					var r = this.noise.fbm3d(4*i/source.width, 4*j/source.height, 0.01*this.settings.motion.value*frame, 3, 0.5, 4.01, 1.3, 3.95) + 0.1*Math.random();
					var motion = this.settings.motion.value;
					var heat = r*(avg + Fn.lerp(this.settings.feedback.value, 0.25, motion*motion) * this.heatMaps[2].data[ix]);
					heat = cooling * heat;
					if (this.mode) {
						heat = 1 - heat;
					}
					target.data[ix] = heat;
					this.maxHeat = Math.max(this.maxHeat, heat);
					var rgba = this.heatToColor(heat);
					this.backBuffer.buffer.data[4*ix] = rgba[0];
					this.backBuffer.buffer.data[4*ix+1] = rgba[1];
					this.backBuffer.buffer.data[4*ix+2] = rgba[2];
					//this.backBuffer.buffer.data[4*ix+3] = rgba[3];
					ix++;
				}
				jx +=source.width;
			}
			this.backBuffer.context.putImageData(this.backBuffer.buffer, 0, 0);
			//this.frontBuffer.context.clearRect(0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height);
			this.frontBuffer.context.drawImage(this.backBuffer.context.canvas, 0, 0, this.backBuffer.buffer.width, this.backBuffer.buffer.height, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height);
		},
        render: function render(frame, dt) {
			glui.renderingContext2d.save();
			glui.renderingContext2d.drawImage(this.frontBuffer.context.canvas, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height, 0, 0, glui.width, glui.height);
			glui.renderingContext2d.globalAlpha = 0.3;
			glui.renderingContext2d.font = '14px Consolas';
			glui.renderingContext2d.fillStyle = "#ffe080";
			glui.renderingContext2d.textAlign = "left";
			glui.renderingContext2d.fillText("mode:" + this.mode, 0, glui.height - 2);
			glui.renderingContext2d.fillText("heat:" + this.maxHeat, 100, glui.height - 2);
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
		processInputs: function processInputs(e) {
			if ((GE.inputs.mbuttons & 2) != 0) {
				Dbg.prln('mouse: ' + GE.inputs.mpos);
				var mode = this.mode & 0x01;
				this.mode &= 0xfe;
				this.mode |= 1 - mode;
				GE.inputs.mbuttons &= 253;
			}
			this.mode &= 0xfd;
			if (GE.inputs.keys[16] != 0) {
				this.mode |= 0x02;
			}
		},
		onchange: function onchange(setting) {
			switch (setting.dataField) {
				case 'resolution':
					this.onresize();
					break;
				case 'images':
					this.setImage();
					break;
			}
		},
		heatToColor: function heatToColor(v) {
			var tix = this.settings.color.value;
			var tbl = [
				[
					[1.00, 255, 255, 255, 255],
					[0.60, 255, 255, 255, 255],
					[0.36, 255, 240, 128, 255],
					[0.22, 240,  64,  64, 192],
					[0.13, 128,  64,  64, 128],
					[0.07,  64,  64,  64,  64],
					[0.00,   0,   0,   0,   0]
				],
				[
					[1.00, 255, 255, 255, 255],
					[0.50, 255, 255, 255, 255],
					[0.25, 128, 160, 240, 255],
					[0.12,  64,  64, 192, 128],
					[0.06,  64,  64,  64,  64],
					[0.00,   0,   0,   0,   0]
				]
			];
			
			var col = [0, 0, 0, 0];
			var tab = tbl[tix];
			var i0 = tab[0];
			v /= 100;
			for (var i=1; i<tab.length; i++) {
				var i1 = tab[i];
				if (v > i1[0]) {
					var r = (v - i1[0])/(i0[0] - i1[0]);
					for (var j=0; j<4; j++) {
						col[j] = Math.floor(r*(i0[j+1] - i1[j+1]) + i1[j+1]);
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
