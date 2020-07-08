include('ge/fn.js');

(function() {
	
    var Fire = {
		name: 'Fire',
		settings: {
			images: { label: 'Image', value: 'lens.gif', type: 'string', link: null },
			motion: { label: 'Motion', value: 0.7, min:0, max:1, step: 0.01, type: 'float', link: null },
			feedback: { label: 'Feedback', value: 0.7, min:0, max:1, step: 0.01, type: 'float', link: null },
			cooling: { label: 'Cooling', value: 0.05, min:0, max:1, step: 0.01, type: 'float', link: null },
			color: { label: 'Color', value: 0, type: 'int', link: null }
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
		filter: new Fn.Filter([
			[0.00, 0.10, 0.00],
			[0.07, 0.30, 0.07],
			[0.10, 0.70, 0.10]
		]),

        initialize: async function initialize() {
			// create list of images
			var urls = [
				'/demo/lens/lens.gif', '/demo/lens/deepspace.jpg',
				'/demo/fire/fire.gif', '/demo/rotozoom/javascript.gif',
				'/test/test.gif'
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
			//DemoMgr.controls.settings.rows["images"].cells["value"].setItems(this.images.map(v => v.alt));
			var canvas = document.createElement('canvas');
			canvas.width = Math.floor(glui.width/4);
			canvas.height = Math.floor(glui.height/4);
			this.frontBuffer.context = canvas.getContext('2d');
			this.frontBuffer.buffer = this.frontBuffer.context.getImageData(0, 0, canvas.width, canvas.height);
			var canvas = document.createElement('canvas');
			this.backBuffer.context = canvas.getContext('2d');
debugger
			this.setImage();
			this.heatMaps[1] = this.createHeatMap();
			this.update(0);
        },
        resize: function resize(e) {
        },
        update: function update(frame, dt) {
			var id = frame % 2;
			var source = this.heatMaps[id];
			var target = this.heatMaps[1 - id];
			var ix = 0;
			var cooling = 1 - this.settings.cooling.value;
			for (var j=0; j<source.height; j++) {
				for (var i=0; i<source.width; i++) {
					var v = this.filter.apply(source.data, source.width, source.height, 1, i, j, 0);
					var motion = Fn.lerp(1.0, Math.random(), this.settings.motion.value);
					var heat = this.settings.feedback.value * motion * this.heatMaps[2].data[ix];
					if (this.mode) {
						heat = 1 - heat;
					}
					target.data[ix] = cooling*v + heat*heat;
					var rgba = this.heatToColor(v);
					this.backBuffer.buffer.data[4*ix] = rgba[0];
					this.backBuffer.buffer.data[4*ix+1] = rgba[1];
					this.backBuffer.buffer.data[4*ix+2] = rgba[2];
					this.backBuffer.buffer.data[4*ix+3] = rgba[3];
					ix++;
				}
			}
			this.backBuffer.context.putImageData(this.backBuffer.buffer, 0, 0);
			this.frontBuffer.context.drawImage(this.backBuffer.context.canvas, 0, 0, this.backBuffer.buffer.width, this.backBuffer.buffer.height, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height);
		},
        render: function render(frame, dt) {
			glui.renderingContext2d.save();
			glui.renderingContext2d.drawImage(this.frontBuffer.context.canvas, 0, 0, this.frontBuffer.buffer.width, this.frontBuffer.buffer.height, 0, 0, glui.width, glui.height);
			glui.renderingContext2d.globalAlpha = 0.3;
			glui.renderingContext2d.font = '8px Consolas';
			glui.renderingContext2d.fillStyle = "#ffe080";
			glui.renderingContext2d.textAlign = "left";
			glui.renderingContext2d.fillText("mode:" + this.mode, 0, glui.height - 2);
			glui.renderingContext2d.restore();
		},
		
		setImage: function setImage() {
			var ix = DemoMgr.controls.settings.rows['images'].cells['value'].getValue();
			var img = this.images[ix].value;
			if (this.backBuffer.context.canvas.width != img.width || this.backBuffer.context.canvas.height != img.height) {
				this.backBuffer.context.canvas.width = img.width;
				this.backBuffer.context.canvas.height = img.height;
			}
			this.backBuffer.context.drawImage(img, 0, 0);
			this.backBuffer.buffer = this.backBuffer.context.getImageData(0, 0, this.backBuffer.context.canvas.width, this.backBuffer.context.canvas.height);
			this.heatMaps[0] = this.createHeatMap(this.backBuffer.buffer);
			this.heatMaps[2] = this.createHeatMap(this.backBuffer.buffer);
		},
		createHeatMap: function createHeatMap(buffer) {
			buffer = buffer || this.frontBuffer.buffer;
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
					[0.95, 255, 255, 255, 255],
					[0.80, 255, 240, 128, 255],
					[0.60, 240,  64,  64, 192],
					[0.40, 128,  64,  64, 128],
					[0.10,  64,  64,  64,  64],
					[0.0,   0,   0,   0,   0]
				],
				[
					[1.0, 255, 255, 255, 255],
					[0.9, 255, 255, 255, 255],
					[0.8, 128, 160, 240, 255],
					[0.7,  64,  64, 192, 128],
					[0.5,  64,  64,  64,  64],
					[0.0,   0,   0,   0,   0]
				]
			];
			
			var col = [0, 0, 0, 0];
			var tab = tbl[tix];
			var i0 = tab[0];
			v *= v;
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
