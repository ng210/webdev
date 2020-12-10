include('glui/glui-lib.js');
include('glui/misc/roaming-unit.js');
include('webgl/sprite/sprite.js');
(function() {

    const MAX_EMITTER_COUNT = 10;

    function Particle(obj) {
        this.roaming = new RoamingUnit(0, 0.0);
        this.obj = obj;
        this.acc = new V3();
        this.velocity = new V3();
        this.lifeSpan = 0;
        this.initLifeSpan = 0;
        this.obj.setFrame(Math.floor(Math.random()*Emitter.sprMgr.map.frames.length));
        this.set([0,0], [0,0], [0,0]);
    }
    Particle.prototype.set = function set(p, v, a, hp) {
        this.acc.set(a);
        this.velocity.set(v);
        this.obj.position.set(p);
        this.obj.setRotationZ(2);   //1.1*(Math.random() - 0.5));
        this.lifeSpan = hp;
        this.initLifeSpan = hp;
        this.angularSpeed = 2*2*Math.PI*(Math.random() - 0.5);
    };
    Particle.prototype.update = function update(dt) {
        this.lifeSpan -= dt;
        if (this.lifeSpan > 0) {
            this.roaming.update(dt);
            this.velocity.add(this.roaming.velocity);
            this.velocity.add(this.acc.prodC(dt));
            var ds = this.velocity.prodC(dt);
            this.obj.position.add(ds);
            this.obj.isDirty = true;
            var f = this.lifeSpan/this.initLifeSpan;
            this.obj.setRotationZ(this.obj.rotationZ + this.angularSpeed*dt*f);
            f *= f;
            this.obj.color[3] = f;
            f = 40*(1 - f) + 1;
            this.obj.scale[0] = f;
            this.obj.scale[1] = f;
        } else {
            this.obj.position.x = -10000;
            this.obj.isDirty = true;
        }
    };

    function Emitter(count) {
        this.active = false;
        this.position = new V3();
        this.velocity = new V3();
        this.roaming = new RoamingUnit(0, 0);
        this.period = 1;
        this.thrust = 10;
        this.size = 1.0;
        this.lifeSpan = 100;
        this.color = [
            Math.random(), Math.random(), Math.random()
        ];
        this.count = count;
        this.particles = new Array(count);
        for (var i=0; i<this.particles.length; i++) {
            this.particles[i] = new Particle(Emitter.sprMgr.addSprite());
            this.particles[i].obj.position.x = -10000;
            this.particles[i].obj.color[0] = this.color[0];
            this.particles[i].obj.color[1] = this.color[1];
            this.particles[i].obj.color[2] = this.color[2];
        }
        this.time = 0;
        this.lastTime = 0;
        this.totalTime = 0;
        this.runningIndex = 0;
    }
    Emitter.prototype.update = function update(frame, dt, setParticle) {
        this.time += dt;
        if (this.isActive) {
            this.roaming.update(dt);
            this.position.add(this.roaming.velocity.prodC(dt));
            this.checkAndBounce();
            var t = 0;
            while (this.time > this.period) {
                this.time -= this.period;
                t += this.period;
                // emit (reset) particle
                this.runningIndex = (this.runningIndex + 1) % this.count;
                var p = this.particles[this.runningIndex];
                p.obj.setScale([this.size, this.size, 1]);
                setParticle(p, this.runningIndex, this, frame, t)
            }
        }
        this.totalTime += dt;        
        for (var i=0; i<this.count; i++) {
            this.particles[i].update(dt);
            this.particles[i].obj.scale.scale(this.size);
        }
    };
    Emitter.prototype.set = function emitter_set(updateParticles) {
        this.roaming.speed = this.speed;
        this.roaming.variance = this.variance;
        if (updateParticles) {
            for (var j=0; j<this.particles.length; j++) {
                this.particles[j].obj.setScale([this.size, this.size, 1]);
                this.particles[j].roaming.speed = this.pspeed;
                this.particles[j].roaming.variance = this.pvariance;
            }
        }
    };
    Emitter.prototype.setCount = function setCount(count) {
        for (var i=count; i<this.count; i++) {
            this.particles[i].lifeSpan = 0;
            this.particles[i].update();
        }
        this.count = count;
    };
    Emitter.prototype.checkAndBounce = function checkAndBounce() {
        if (this.position.x < -gl.canvas.width) {
            this.position.x = -gl.canvas.width;
            this.roaming.velocity1.x *= -1;
            this.roaming.velocity2.x *= -1;
        }
        else if (this.position.x > gl.canvas.width) {
            this.position.x = gl.canvas.width;
            this.roaming.velocity1.x *= -1;
            this.roaming.velocity2.x *= -1;
        }

        if (this.position.y < -gl.canvas.height) {
            this.position.y = -gl.canvas.height;
            this.roaming.velocity1.y *= -1;
            this.roaming.velocity2.y *= -1;
        }
        else if (this.position.y > gl.canvas.height) {
            this.position.y = gl.canvas.height;
            this.roaming.velocity1.y *= -1;
            this.roaming.velocity2.y *= -1;
        }
    };

    Emitter.sprMgr = null;

    function EmitterDemo() {
        Demo.call(this, 'EmitterDemo', {
            count: { label: 'Count', value: 1500, min:1, max:4000, step: 20, type: 'int' },
            //alpha: { label: 'Alpha', value: 1, min:0, max:1, step: 0.05, type: 'float' },
            //force: { label: 'Force', value: 0, min:-1, max:1, step: 0.01, type: 'float' },
            freq: { label: 'Frequency', value: 100.0, min:0.0, max:200, step: 10.0, type: 'float' },
            thrust: { label: 'Thrust', value: 40.0, min:10, max:200, normalized: true, step: 10.0, type: 'float' },
            size: { label: 'Size', value: 0.03, min:0.01, max:0.3, step: 0.01, normalized: true, type: 'float' },
            rotation: { label: 'Rotation', value: 2.0, min:0, max:100, step: 1.0, type: 'float' },
            emission: { label: 'Emission', value: 1, min:0, max:1, step: 1, type: 'int' },
            espeed: { label: 'Emit. Speed', value: 0.2, min:0, max:1, step: 0.01, type: 'float' },
            evariance: { label: 'Emit. Variance', value: 0.01, min:0, max:0.1, step: 0.01, normalized: true, type: 'float' },
            lifeSpan: { label: 'Life', value: 6.0, min:1.0, max:10, step: 1, type: 'float' },
            pspeed: { label: 'Part. Speed', value: 0.5, min:0, max:1, step: 0.01, type: 'float' },
            pvariance: { label: 'Part. Variance', value: 0.4, min:0, max:0.5, step: 0.01, normalized: true, type: 'float' }
        });
        // custom variables
        this.emitters = null;
        this.canvas = null;
        this.originalBackgroundColor = null;
        this.angularSpeed = 0;
    }
    extend(Demo, EmitterDemo);

    EmitterDemo.prototype.initialize = async function initialize() {
        this.buffer = new glui.Buffer(window.innerWidth, window.innerHeight, true);
        document.body.appendChild(this.buffer.canvas);
        this.buffer.canvas.style.position = 'absolute';
        this.buffer.canvas.style.left = '0px';
        this.buffer.canvas.style.top = '0px';
        this.buffer.canvas.style.zIndex = -1;
        gl = this.buffer.canvas.getContext('webgl');
        if (gl == null) throw new Error('webGL not supported!');
        this.originalBackgroundColor = glui.canvas.style.backgroundColor;
        glui.canvas.style.backgroundColor = 'transparent';
        if (Emitter.sprMgr == null) {
            Emitter.sprMgr = new webGL.SpriteManager();
            //await Emitter.sprMgr.initialize('/demo/data/particles.spr.json', this.settings.count.max*MAX_EMITTER_COUNT);
            await Emitter.sprMgr.initialize('/demo/data/particles.spr.json', this.settings.count.max*MAX_EMITTER_COUNT);
            M44.identity(Emitter.sprMgr.projection);
            Emitter.sprMgr.projection[0] = 1/gl.canvas.width;
            Emitter.sprMgr.projection[5] = 1/gl.canvas.height;
        }
        this.emitters = [];
        for (var i=0; i<MAX_EMITTER_COUNT; i++) {
            var e = new Emitter(this.settings.count.max);
            e.setCount(this.settings.count.value);
            e.position.set([0, 0, 0]);
            e.thrust = this.settings.thrust.value;
            e.variance = this.settings.evariance.value;
            e.speed = this.settings.espeed.value;
            e.period = 1/this.settings.freq.value;
            e.size = this.settings.size.value
            e.lifeSpan = this.settings.lifeSpan.value;
            this.emitters.push(e);
        }
        this.updateEmitters();
        this.emitters[0].isActive = true;
        this.emitters[0].position.set([0,0]);
        this.angularSpeed = 2*Math.PI*this.settings.rotation.value;
    };
    EmitterDemo.prototype.destroy = function destroy() {
        Emitter.sprMgr.destroy();
        Emitter.sprMgr = null;
        glui.canvas.style.backgroundColor = this.originalBackgroundColor;
        for (var i=0; i<MAX_EMITTER_COUNT; i++) {
            var e = this.emitters[i];
            delete e.particles;
            delete e;
        }
    };
    EmitterDemo.prototype.resize = function resize(e) {

    };
    EmitterDemo.prototype.update = function update(frame, dt) {
        for (var i=0; i<MAX_EMITTER_COUNT; i++) {
            var em = this.emitters[i];
            em.update(frame, dt, (particle, ix, emitter, frame, dt) => EmitterDemo.emissionFunctions[this.settings.emission.value].call(this, particle, ix, emitter, frame, dt));
        }
    };
    EmitterDemo.prototype.render = function render(frame, dt) {
        gl.clearColor(0.01, 0.02, 0.1, 1.0);
        Emitter.sprMgr.update();
        Emitter.sprMgr.render();
    };
    EmitterDemo.prototype.updateEmitters = function updateEmitters(setParticles) {
        for (var i=0; i<MAX_EMITTER_COUNT; i++) {
            var e = this.emitters[i];
            e.thrust = this.settings.thrust.value;
            e.variance = this.settings.evariance.value;
            e.speed = this.settings.espeed.value * (gl.canvas.width + gl.canvas.height)/4;
            e.pvariance = this.settings.pvariance.value;
            e.pspeed = this.settings.pspeed.value * (gl.canvas.width + gl.canvas.height)/400;
            e.period = 1/this.settings.freq.value;
            e.lifeSpan = this.settings.lifeSpan.value;
            e.size = this.settings.size.value;
            e.set(setParticles);
        }
    };

    EmitterDemo.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'count':
                for (var i=0; i<MAX_EMITTER_COUNT; i++) {
                    this.emitters[i].setCount(setting.value);
                }
                break;
            case 'rotation':
                this.angularSpeed = 2*Math.PI*setting.value;
                break;
            case 'pvariance':
            case 'pspeed':
            case 'size':
                this.updateEmitters(true);
                break;
            case 'freq':
            case 'thrust':
            case 'lifeSpan':
            case 'evariance':
            case 'espeed':
                this.updateEmitters(false);
                break;
        }
    };

    EmitterDemo.prototype.onclick = function onclick(x, y, e) {
        if (typeof x === 'number') {
            x = 2*x - 1;
            y = 1 - 2*y;
            var found = false;
            var inactives = [];
            for (var i=0; i<MAX_EMITTER_COUNT; i++) {
                var e = this.emitters[i];
                if (e.isActive) {
                    var dx = x - e.position.x/gl.canvas.width, dy = y - e.position.y/gl.canvas.height;
                    if (dx*dx + dy*dy < 0.1*0.1) {
                        console.log('emitter: ' + i);
                        e.isActive = false;
                        found = true;
                        break;
                    }
                } else {
                    inactives.push(e);
                }
            }
            if (!found) {
                var arr = inactives.length ? inactives : this.emitters;
                var e = arr[Math.floor(Math.random()*arr.length)];
                e.isActive = true;
                this.time = 0;
                this.totalTime = 0;
                this.runningIndex = 0;
                e.position.x = x*gl.canvas.width;
                e.position.y = y*gl.canvas.height;
                e.time = 0;
                for (var i=0; i<e.count; i++) {
                    e.particles[i].obj.position.x = -10000;
                }
            }
        }
    };

    // emission functions
    EmitterDemo.emissionFunctions = [
        function randomEmission(particle, ix, emitter, frame, dt) {
            particle.set(emitter.position, V3.fromPolar(2*Math.PI*Math.random(), 0, emitter.thrust*0.5*Math.random()+0.5), [0,0], emitter.lifeSpan);
        },
        function radialEmission(particle, ix, emitter, frame, dt) {
            particle.set(emitter.position, V3.fromPolar(this.angularSpeed*(emitter.totalTime+dt), 0, emitter.thrust), [0,0], emitter.lifeSpan);
        }
    ];

    publish(new EmitterDemo(), 'EmitterDemo');
})();