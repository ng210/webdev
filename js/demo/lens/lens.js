include('math/v2.js');
include('glui/glui-lib.js');
(function() {
    var Lens = {
        // Member variables
        // required by the framework
        name: 'Lens',
        settings: {
			image: { label: 'Image', value: 0, min:0, max:5, step: 1, type: 'int', link: null },
			radius: { label: 'Radius', value: 0.4, min:0, max:1, step: 0.01, type: 'float', link: null },
			zoom: { label: 'Zoom', value: 0.6, min:0, max:1, step: 0.01, type: 'float', link: null },
			size:{ label: 'Size', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null },
			interpolation: { label: 'Interpolation', value: 1, min:0, max:2, step: 1, type: 'int', link: null }
        },
		
		buffer: null,
		images: [],
		cursor: [0, 0],
		interpolations: ["none", "linear", "sinusoid"],
		ratio: [1, 1],
		radius: 0,
    
        initialize: async function initialize() {
			// create list of images
			var urls = [
				'/demo/data/aliens.gif',
				'/demo/data/deepspace.jpg',
				'/demo/data/fire.png',
				'/demo/data/ninja.gif',
				'/demo/data/javascript.gif',
				'/demo/data/sidelined.gif'
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
			this.settings.image.control.max = this.images.length-1;
			this.backBuffer = new glui.Buffer();
			this.frontBuffer = new glui.Buffer();
			this.setImage();
			this.update(0);
        },
        resize: function resize(e) {
			this.radius = 0.2 * this.settings.radius.value * this.backBuffer.width;
			this.rsize = this.radius * this.settings.size.value;
			this.ratio[0] = this.backBuffer.width/glui.canvas.clientWidth;
			this.ratio[1] = this.backBuffer.height/glui.canvas.clientHeight;
        },
        update: function update(frame, dt) {
			var src = this.backBuffer.imgData;
			var dst = this.frontBuffer.imgData;
			var stride = dst.width * 4;
			var interpolation = this.settings.interpolation.value;
			var zoom = this.settings.zoom.value;
			var ix = 0, ix2;
			for (var y=0; y<dst.height-1; y++) {
				var cy = y - this.cursor[1];
				for (var x=0; x<dst.width-1; x++) {
					var dx = x - this.cursor[0];
					var dy = cy;
					var d = Math.sqrt(dx*dx + dy*dy);
					// pixels outside the radius are copied without change
					if (d > this.radius) {
						this.frontBuffer.imgData.data[ix+0] = src.data[ix+0];
						this.frontBuffer.imgData.data[ix+1] = src.data[ix+1];
						this.frontBuffer.imgData.data[ix+2] = src.data[ix+2];
						this.frontBuffer.imgData.data[ix+3] = src.data[ix+3];
					} else {
						var a = Math.atan(dy/dx);
						if (dx < 0) a += Math.PI;
						var v = 0;
						switch (interpolation) {
							case 0: //y = z
								v = 1;
								break;
							case 1: //y = (1-z)*x+z
								var v = d < this.rsize ? 1 : 1 - (d-this.rsize)/(this.radius-this.rsize);
								break;
							case 2: //y = (1-z)*cos(PI/2*x)+z
								v = d < this.rsize ? 1 : 0.5 * (Math.cos(Math.PI*(d-this.rsize)/(this.radius-this.rsize)) + 1.0);
								break;
						}
						var r = d*(1 - zoom*v);
						var rx2 = this.cursor[0] + Math.cos(a)*r;
						var ry2 = this.cursor[1] + Math.sin(a)*r;
						var nx = Math.floor(rx2);
						var ny = Math.floor(ry2);
						rx2 -= nx; ry2 -= ny;
						var rx1 = 1.0-rx2, ry1 = 1.0-ry2;
						ix2 = nx*4 + ny*stride;
						// bilinear filtering
						for (var ci=0; ci<3; ci++) {
							var c11 = src.data[ix2+ci], c12 = src.data[ix2+4+ci];
							var c21 = src.data[ix2+stride+ci], c22 = src.data[ix2+stride+4+ci];
							dst.data[ix+ci] = ry1*(c11*rx1 + c12*rx2) + ry2*(c21*rx1 + c22*rx2);
						}
						dst.data[ix+3] = 255;
					}
					ix += 4;
				}
				ix += 4;
			}
			this.frontBuffer.update();
        },
        render: function render(frame, dt) {
			glui.frontBuffer.blit(this.frontBuffer);
			//glui.frontBuffer.update(true);
		},
		onchange: function onchange(e, setting) {
			switch (setting.parent.id) {
				case 'radius':
					this.radius = 0.2 * setting.value * this.backBuffer.width;
					this.rsize = this.radius * this.settings.size.value;
					break;
				case 'size':
					this.rsize = this.radius * setting.value;
					break;
				case 'interpolation':
					this.settings.size.control.disabled = this.interpolations[setting.value] == 'none';
					break;
				case 'image':
					this.setImage();
					break;
			}
			this.update(0, 0);
		},
		onmousemove: function onmousemove(e) {
			this.cursor[0] = e.clientX*this.ratio[0];
			this.cursor[1] = e.clientY*this.ratio[1];
		},

        setImage: function setImage() {
			var ix = DemoMgr.controls.settings.rows['image'].cells['value'].getValue();
			var img = this.images[ix].value;
			if (this.backBuffer.width != img.width || this.backBuffer.height != img.height) {
				this.backBuffer.resize(img.width, img.height);
			}
			if (this.frontBuffer.width != img.width || this.frontBuffer.height != img.height) {
				this.frontBuffer.resize(img.width, img.height);
			}
			this.backBuffer.blitImage(img);
			this.backBuffer.update(true);
			this.resize();
		}
    };

    publish(Lens, 'Lens');
})();