include('/lib/glui/glui-lib.js');
include('star.js');
(function() {

    function Gravity() {
        Demo.call(this, 'Gravity', {
            count: { label: 'Count', value: 600, min:10, max:1000, step: 1.0, type: 'int', link: null },
            sun: { label: 'Sun', value: 0.02, min:0, max:0.1, step: 0.001, type: 'float', link: null },
            force: { label: 'Force', value: 0.1, min:-0.5, max:0.5, step: 0.01, type: 'float', link: null },
            motion: { label: 'Motion', value: 2.0, min:0, max:5.0, step: 0.05, normalized:true, type: 'float', link: null },
            maxEnergy: { label: 'Max.Energy', value: 0.8, min:0, max:1.5, step: 0.01, type: 'float', link: null },
            orbit: { label: 'Orbit', value: 1, min:0, max:1, step: 1.0, type: 'bool', link: null },
            alpha: { label: 'Alpha', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null }
        });

        this.stars = [];
		this.count = 0;
        this.lastTime = new Date().getTime();
        this.sun = null;
        this.massCentre = [0, 0];
        this.totalMass = 0;
    };
    extend(Demo, Gravity);

    // required by the framework
    Gravity.prototype.initialize = function initialize() {
        var count = this.settings.count.value;
        if (this.sun == null) {
            this.sun = new Star([0, 0]);
            this.stars.push(this.sun);
        }
        this.sun.setRadius(this.settings.sun.value);
        this.sun.updateByRadius();            

        if (count < this.stars.length) {
            for (var i=count; i<this.stars.length; i++) {
                this.stars[i].energy = 0;
            }
        } else {
            for (var i=this.stars.length; i<count; i++) {
                var star = new Star();
                this.resetStar(star);
                this.stars.push(star);
            }
        }
        Star.MAX_ENERGY = Math.pow(10, this.settings.maxEnergy.value);
    };
    Gravity.prototype.resize = function resize(e) {
    };
    Gravity.prototype.update = function update(frame, dt) {
        var time = dt*this.settings.motion.value;
        var count = this.settings.count.value;
        var g = this.settings.force.value;
        // update position and velocity
        for (var i=0; i<count; i++) {
            var star1 = this.stars[i];
            for (var j=i+1; j<count; j++) {
                var star2 = this.stars[j];
                var dx = star2.pos[0] - star1.pos[0], dy = star2.pos[1] - star1.pos[1];
                // F = f*(m1+m2)/d^2
                // a1 = f*m2/d^2*n = f*n/d^2 * m2
                // a2 = f*m1/d^2*n = f*n/d^2 * m1
                // n = (dx/d, dy/d) = (dx, dy)/d
                // f*n/d^2 = f/d^3*(dx, dy)
                var d2 = dx*dx + dy*dy;
                var d = Math.sqrt(d2);
                if (d < star1.radius + star2.radius) {
                    this.resolveCollision(star1, star2, d);
                    break;
                }
                var f = g/d/d2;
                dx *= f; dy *= f;
                star1.a[0] += star2.mass*dx; star1.a[1] += star2.mass*dy;
                star2.a[0] += -star1.mass*dx; star2.a[1] += -star1.mass*dy;
            }
        }
        this.massCentre[0] = 0;
        this.massCentre[1] = 0;
        this.totalMass = 0;
        for (var i=0; i<count; i++) {
            var star = this.stars[i];
            if (!star.update(frame, time)) {
                this.resetStar(star);
            }
            this.massCentre[0] += star.pos[0]*star.mass;
            this.massCentre[1] += star.pos[1]*star.mass;
            this.totalMass += star.mass;
        }
        this.massCentre[0] /= this.totalMass;
        this.massCentre[1] /= this.totalMass;
    };
    Gravity.prototype.render = function render(frame, dt) {
        var ctx = glui.renderingContext2d;
        ctx.save();
        var count = this.settings.count.value;
        var ratio = glui.height/glui.width;

        ctx.fillStyle = '#0e1028';
        ctx.globalAlpha = this.settings.alpha.value;
        ctx.fillRect(0, 0, glui.width, glui.height);
        ctx.globalAlpha = 1;

        ctx.setTransform(glui.width, 0, 0, glui.width, glui.width*(0.5 - this.massCentre[0]), glui.height*(0.5 - this.massCentre[1]));
        ctx.lineWidth = 2;
        for (var i=0; i<count; i++) {
                var star = this.stars[i];
                star.render(frame, ctx);
        }

        //ctx.globalAlpha = 0.3;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.font = '14px Consolas';
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.fillText("Total mass: " + (this.totalMass*1000000).toFixed(3), 4, glui.height - 18);
        ctx.fillText(`Centre: ${this.massCentre[0].toFixed(3)} | ${this.massCentre[1].toFixed(3)}`, 200, glui.height - 18);
        ctx.restore();
    };
    Gravity.prototype.onchange = function onchange(e, setting) {
        this.initialize();
    };
    // custom functions
    Gravity.prototype.resolveCollision = function resolveCollision(a, b, d) {
        if (a.mass < b.mass) {
            // swap to make a the heavier one
            var c = a; a = b; b = c;
        }
        // calculate velocity from momentum
        // l = m1*v1 + m2*v2
        // v = l/(m1+m2)
        var lx = a.mass*a.v[0] + b.mass*b.v[0];
        var ly = a.mass*a.v[1] + b.mass*b.v[1];
        a.energy += b.energy;
        a.updateByEnergy();
        a.v[0] = lx/a.mass; a.v[1] = ly/a.mass;
        if (this.sun.mass < a.mass) {
            this.sun = a;
        }
        this.resetStar(b);
        //Dbg.prln(a.toString());
    };
    Gravity.prototype.resetStar = function resetStar(star) {
        star.reset();
//Dbg.prln('reset');
        if (this.settings.orbit.value) {
            var d = 2*this.sun.radius + 0.5 * Math.random();
            var a = this.settings.force.value * this.sun.mass / d / d;
            var v = Math.sqrt(a*d);
            var arg = 2*Math.PI * Math.random();
            star.v[0] = -v*Math.sin(arg);
            star.v[1] = v*Math.cos(arg);
            star.pos[0] = this.sun.pos[0] + Math.cos(arg)*d;
            star.pos[1] = this.sun.pos[1] + Math.sin(arg)*d;
            //Dbg.prln(d);
        }
    };

    publish(new Gravity(), 'Gravity');
})();