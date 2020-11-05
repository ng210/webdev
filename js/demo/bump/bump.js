include('math/v2.js');
include('glui/glui-lib.js');
(function() {
    function Bump() {
		Demo.call(this, 'Bump mapping', {
			image: { label: 'Image', value: 0, min:0, max:1, step: 1, type: 'int', link: null },
			intensity: { label: 'Intensity', value: 0.7, min:0, max:2, step: 0.01, type: 'float', link: null },
			radius: { label: 'Radius', value: 0.3, min:0, max:1, step: 0.01, type: 'float', link: null },
			ambient: { label: 'Ambient', value: -0.4, min:-0.5, max:0.5, step: 0.01, type: 'float', link: null }
            
        });
		
		this.heightMap = null;
		this.buffer = null;
		this.images = [];
		this.cursor = [0, 0];
		this.ratio = [1, 1];
	};
	extend(Demo, Bump);

    Bump.prototype.initialize = async function initialize() { // optional
			// create list of images
			var urls = [
				'/demo/data/bump.gif',
				'/demo/data/aliens.gif',
				'/demo/data/fire.png',
				'/demo/data/bump2.gif',
				'/demo/data/javascript.gif',
				'/lib/glui/background.png'
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
			this.buffer = new glui.Buffer();
			this.setImage();
			this.resize();
			this.update(0);

			//glui.canvas.addEventListener('mousemove', e => Bump.onmousemove(e));
	};
	Bump.prototype.resize = function resize(e) {
		this.ratio[0] = this.buffer.width/glui.canvas.clientWidth;
		this.ratio[1] = this.buffer.height/glui.canvas.clientHeight;
	};
	Bump.prototype.update = function update(frame, dt) {
		var wi = this.heightMap.buffer.width;
		var he = this.heightMap.buffer.height;
		var radius = 0.5 * (this.settings.radius.value + 0.01) * wi;
		var ix = wi + 1;
		//GE.ctx.clearRect(0, 0, wi, he);
		for (var y=1; y<he-1; y++) {
			for (var x=1; x<wi-1; x++) {
				var lx = x - this.cursor[0];
				var ly = y - this.cursor[1];
				var h = this.heightMap.map[ix] * this.settings.ambient.value;
				var l = Math.sqrt(lx*lx + ly*ly);
				if (l < radius)
				{
					var nx = this.heightMap.map[ix-1] - this.heightMap.map[ix+1];
					var ny = this.heightMap.map[ix-wi] - this.heightMap.map[ix+wi];

					lx -= nx;
					if (lx < 0) lx = -lx;
					if (lx > 127) lx = 127;
					nx = 127-lx;
					if (nx < 0) nx = 1;

					ly -= ny;
					if (ly < 0) ly = -ly;
					if (ly > 127) ly = 127;
					ny = 127-ly;
					if (ny < 0) ny = 1;

					h += (nx + ny) * this.settings.intensity.value * Math.cos(Math.PI/2 * l/radius);
				}
				if (h > 255) h = 255;
				if (h < 0) h = 0;
				h /= 255;
				this.buffer.imgData.data[4*ix+0] = h*this.heightMap.buffer.imgData.data[4*ix];
				this.buffer.imgData.data[4*ix+1] = h*this.heightMap.buffer.imgData.data[4*ix+1];
				this.buffer.imgData.data[4*ix+2] = h*this.heightMap.buffer.imgData.data[4*ix+2];
				this.buffer.imgData.data[4*ix+3] = 255;
				ix++;
			}
			// skip last pixel and first pixel on next row
			ix+=2;
		}
		this.buffer.update();
	};
	Bump.prototype.render = function render(frame, dt) {
		glui.frontBuffer.blit(this.buffer);
	};
	Bump.prototype.onchange = function onchange(e, setting) {
		switch (setting.parent.id) {
			case 'image':
				this.setImage();
				break;
			default:
				this.update(0, 0);
				break;
		}
	};
	Bump.prototype.onmousemove = function onmousemove(x, y, e) {
		this.cursor[0] = this.ratio[0] * e.clientX;
		this.cursor[1] = this.ratio[1] * e.clientY;
	};
	Bump.prototype.setImage = function setImage() {
		var ix = this.settings.image.value;
		var img = this.images[ix].value;
		if (this.buffer.width != img.width || this.buffer.height != img.height) {
			this.buffer.resize(img.width, img.height);
		}

		// create heightMap
		var buffer = new glui.Buffer(img);
		this.heightMap = {
			buffer: buffer,
			map: new Uint8Array(buffer.width * buffer.height)
		}
		var ix = 0, jx = 0;
		for (var j=0; j<buffer.height; j++) {
			for (var i=0; i<buffer.width; i++) {
				var v = 0.2989 * buffer.imgData.data[ix++];
				v += 0.5870 * buffer.imgData.data[ix++];
				v += 0.1140 * buffer.imgData.data[ix++];
				this.heightMap.map[jx++] = v;
				ix++;
			}
		}
		this.resize();
	};

    publish(new Bump(), 'Bump');
})();
