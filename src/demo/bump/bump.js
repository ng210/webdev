include('demo.js');
include('/ge/v2.js');

(function() {
	
    function Bump(canvas) {
		Demo.call(this, 'bump', canvas);
		this.lightPos = new V2(.5, .5);
		this.offsetPos = new V2();
		this.heightMap = null;
		this.constructor = Bump;
    }
	Bump.prototype = new Demo;

    Bump.prototype.prepare = async function() {
		//var res = await load('bump/bump.gif');
		//var res = await load('/demo/fire/fire.gif');
		//var res = await load('/demo/rotozoom/javascript.gif');
		var res = await load('/test/test.gif');
		this.lightPos.x *= res.node.width;
		this.lightPos.y *= res.node.height;
		this.heightMap = new GE.Buffer(res.node, true);
		this.backBuffer = new GE.Buffer();
		//this.onresize();
	};
    Bump.prototype.processInputs = function(e) {
		this.getMouseCoors(this.lightPos);
	};
	Bump.prototype.onchange = function(setting) {
		switch (setting.dataField) {
			case 'resolution':
				this.onresize();
				break;
		}
	};
    Bump.prototype.update = function(frame, dt) {
	};
    Bump.prototype.render = function(frame) {
		var wi = this.heightMap.width;
		var he = this.heightMap.height;
		var radius = 0.5 * (this.settings.radius + 0.01) * wi;
		GE.ctx.clearRect(0, 0, wi, he);
		var stride = wi*4;
		var dir = new V2();
		var nv = new V2();
		var ix = 0, ix2 = stride + 4;
		for (var y=1; y<he-1; y++) {
			//dlight.y = y - this.lightPos.y;
			ix = ix2;
			for (var x=1; x<wi-1; x++) {
				// dir.x = x - this.lightPos.x;
				// dir.y = y - this.lightPos.y;
				// dir.norm();
				// var h = this.heightMap.imgData.data[ix] * this.settings.ambient;
				// if (dir.length() < radius) {
				// 	nv.x = this.heightMap.imgData.data[ix-4] - this.heightMap.imgData.data[ix];
				// 	nv.y = this.heightMap.imgData.data[ix-stride] - this.heightMap.imgData.data[ix];
				// 	nv.norm();
				// 	h *= nv.dot(dir) * this.settings.intensity;
				// }
				var lx = x - this.lightPos.x;
				var ly = y - this.lightPos.y;
				var h = this.heightMap.imgData.data[ix] * this.settings.ambient;
				//var l = lightDir.length();
				var l = Math.sqrt(lx*lx + ly*ly);
				if (l < radius)
				{
					var nx = this.heightMap.imgData.data[ix-4] - this.heightMap.imgData.data[ix+4];
					var ny = this.heightMap.imgData.data[ix-stride] - this.heightMap.imgData.data[ix+stride];

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

					h += (nx + ny) * this.settings.intensity * Math.cos(Math.PI/2 * l/radius);
				}
				if (h > 255) h = 255;
				if (h < 0) h = 0;
				this.backBuffer.imgData.data[ix+0] = h;
				this.backBuffer.imgData.data[ix+1] = h;
				this.backBuffer.imgData.data[ix+2] = h;
				this.backBuffer.imgData.data[ix+3] = 255;
				ix += 4;
			}
			ix2 += stride;
			//ix += stride;
		}
		//GE.ctx.putImageData(this.backBuffer.imgData, 0, 0);
		GE.blitBuffer(this.backBuffer);
	};
    Bump.prototype.onresize = function(e) {
    	// handler of window resize
		GE.resizeCanvas(GE.canvas, 1);	//this.data.resolution);
//		var he = GE.canvas.height;
//		this.aspect = GE.canvas.width/he;
//		GE.ctx.setTransform(he/2, 0, 0, he/2, GE.canvas.width/2, he/2);
	};
	Bump.prototype.getMouseCoors = function(v) {
		v.x = GE.inputs.mpos[0]*GE.canvas.width/GE.canvas.clientWidth;	//2*GE.inputs.mpos[0]/this.data.resolution/GE.canvas.height - this.aspect;
		v.y = GE.inputs.mpos[1]*GE.canvas.height/GE.canvas.clientHeight;	//2*GE.inputs.mpos[1]/this.data.resolution/GE.canvas.height - 1.0;
	};

	public(Bump, 'Bump');
})();

