include('demo.js');

(function() {
	function Dot() {
		this.pos = [Math.random(), Math.random()];
		this.mass = 0.5*Math.random() + 0.5;
		var arg = 2 * Math.PI * Math.random();
		var r = 0;	//0.0001*Math.random();
		var vx = r*Math.cos(arg), vy = r*Math.sin(arg);
		this.v = [vx, vy];
		this.a = [0.0, 0.0];
		this.constructor = Dot;
	}
	Dot.prototype.update = function(frame, dt) {
		this.pos[0] += this.v[0]*dt;
		this.pos[1] += this.v[1]*dt;
		this.v[0] += this.a[0]*dt;
		this.v[1] += this.a[1]*dt;
	};
	Dot.prototype.render = function(frame, ctx) {
		ctx.fillRect(ctx.canvas.width*this.pos[0]-1, ctx.canvas.height*this.pos[1]-1, 3, 3);
	};

    function Demo02(canvas) {
	    Demo.call(this, 'demo02', canvas);
		this.dots = [];
		this.count = 0;
		this.canvas.width = 600;
		this.canvas.height = 400;
		this.lastTime = new Date().getTime();
		this.ctx = canvas.getContext('2d');
        this.constructor = Demo02;
    }
    Demo02.prototype = new Demo;

    Demo02.prototype.initialize = function() {
    	this.count = parseInt(this.settings.dots.getValue()) || 50;
    	// create dots
	    for (var i=0; i<this.count; i++) {
			this.dots.push(new Dot());
		}
	};
    Demo02.prototype.processInputs = function() { throw new Error('Not implemented'); };
    Demo02.prototype.update = function(frame) {
		var time = new Date().getTime();
		var g = parseFloat(this.settings.force.getValue())/1000;
		// update position and velocity
		for (var i=0; i<this.count; i++) {
			var dot1 = this.dots[i];
			for (var j=i+1; j<this.count; j++) {
				var dot2 = this.dots[j];
				var dx = dot2.pos[0] - dot1.pos[0], dy = dot2.pos[1] - dot1.pos[1];
// F = f*m1+m2/d^2
// a1 = f*m2/d^2*n
// a2 = f*m1/d^2*n
// n.x = dx/d
// n.y = dy/d
// a1.x = f*m2/d^2*dx/d=f*m2*dx/d^3
// a1.y = f*m2/d^2*dy/d=f*m2*dy/d^3
				var d = dx*dx + dy*dy;
				var f = g/d/Math.sqrt(d);
				dx *= f; dy *= f;
				dot1.a[0] += -dot2.mass*dx;
				dot1.a[1] += -dot2.mass*dy;
				dot2.a[0] += -dot1.mass*dx;
				dot2.a[1] += -dot1.mass*dy;
			}
		}
		for (var i=0; i<this.count; i++) {
			this.dots[i].update(frame, (time - this.lastTime)/1000);
		}
		this.lastTime = time;
	};
    Demo02.prototype.render = function(frame) {
		this.ctx.fillStyle = '#201040';
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.fillStyle = '#a0e060';
		this.ctx.strokeStyle = '#a0e060';
		this.ctx.lineWidth = 2;
	
    	for (var i=0; i<this.count; i++) {
	    	this.dots[i].render(frame, this.ctx);
    	}
	};
    Demo02.prototype.onresize = function(e) { throw new Error('Not implemented'); };
    Demo02.prototype.onsettingchanged = function(setting) {
    	if (setting.id == 'dots') {
	    	var count = parseInt(this.settings.dots.getValue());
			if (isNaN(count) || this.count == count) return;
	    	for (var i=this.count; i<count; i++) {
				this.dots.push(new Dot());
			}
			this.count = count;
    	}
	};

    public(Demo02, 'Demo02');

})();