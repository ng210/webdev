include('/lib/glui/glui-lib.js');
include('/lib/glui/misc/roaming-unit.js');
include('/lib/webgl/sprite/sprite.js');
include('/lib/webgl/sprite/sprite-manager.js');
include('/lib/base/dbg.js');
(function() {

    function Particle(obj) {
        this.roaming = new RoamingUnit(0, 0);
        this.obj = obj;
        this.acc = new V3();
        this.damping = 1.0;
        this.velocity = new V3();
        this.lifeSpan = 0;
        this.initLifeSpan = 0;
        this.obj.setFrame(0);
        this.set([0,0], [0,0], [0,0]);
    }
    Particle.prototype.set = function set(p, v, a, hp) {
        this.acc.set(a);
        this.velocity.set(v);
        this.obj.position.set(p);
        this.obj.setRotationZ(0);
        this.lifeSpan = hp;
        this.initLifeSpan = hp;
        this.angularSpeed = 2*2*Math.PI*(Math.random() - 0.5);
    };
    Particle.prototype.update = function update(dt, dt2) {
        this.lifeSpan -= dt;
        if (this.lifeSpan > 0) {
            this.roaming.update(dt);
            this.velocity.add(this.roaming.velocity);
            this.velocity.add(this.acc.prodC(dt2));
            this.velocity.scale(this.damping);
            var ds = this.velocity.prodC(dt2);
            this.obj.position.add(ds);
            this.obj.isDirty = true;
            this.obj.setRotationZ(this.obj.rotationZ + this.angularSpeed*dt);
            var f = this.lifeSpan/this.initLifeSpan;
            this.obj.color[3] = f*f;
            this.obj.scale[0] = f;
            this.obj.scale[1] = f;
        } else {
            this.obj.position.x = -10000;
            this.obj.isDirty = true;
        }
    };

    function MosaicDemo() {
        Demo.call(this, 'MosaicDemo', {
            image: { label: 'Image', value: 0, min:0, max:1, step: 1, type: 'int', link: null },
            pixel: { label: 'Pixel', value: 0, min:0, max:0, step: 1, type: 'int' },
            //freq: { label: 'Frequency', value: 100.0, min:0.1, max:200, step: 10.0, type: 'float' },
            size: { label: 'Size', value: 0.5, min:0.1, max:1.0, step: 0.01, type: 'float' },
            scale: { label: 'Scale', value: 0.4, min:0.1, max:1.0, step: 0.01, type: 'float' },
            //rotation: { label: 'Rotation', value: 8.0, min:0, max:100, step: 1.0, type: 'float' },
            speed: { label: 'Speed', value: 0.2, min:0, max:10, step: 0.1, type: 'float' },
            variance: { label: 'Variance', value: 0.4, min:0, max:0.5, step: 0.01, normalized: true, type: 'float' },
            force: { label: 'Force', value: 0.0, min:-5000.0, max:5000, step: 100, type: 'float' },
            damping: { label: 'Damping', value: 0.1, min:0.0, max:0.2, step: 0.001, normalized: true, type: 'float' },
            radius: { label: 'Radius', value: 4.0, min:1.0, max:20, step: 0.5, normalized: false, type: 'int' },
            lifeSpan: { label: 'Life', value: 20.0, min:1.0, max:30, step: 1, type: 'float' },
            delta: { label: 'Delta', value: 1.0, min:0.0, max:10, step: 0.1, type: 'float' }
        });
        // custom variables
        this.originalBackgroundColor = null;
        this.period = 0;
        this.width = 0;
        this.height = 0;
        this.mouse = [-1000, -1000];
    }
    extend(Demo, MosaicDemo);

    MosaicDemo.sprMgr = null;

    MosaicDemo.prototype.initialize = async function initialize() {
        this.buffer = new glui.Buffer(window.innerWidth, window.innerHeight, true);
        document.body.appendChild(this.buffer.canvas);
        this.buffer.canvas.style.position = 'absolute';
        this.buffer.canvas.style.left = '0px';
        this.buffer.canvas.style.top = '0px';
        this.buffer.canvas.style.zIndex = -1;
        webGL.init(this.buffer.canvas, true);
        //gl = this.buffer.canvas.getContext('webgl');
        if (gl == null) throw new Error('webGL not supported!');
        this.originalBackgroundColor = glui.canvas.style.backgroundColor;
        glui.canvas.style.backgroundColor = 'transparent';
        if (MosaicDemo.sprMgr == null) {
            MosaicDemo.sprMgr = new webGL.SpriteManager();
            await MosaicDemo.sprMgr.initialize('/demo/data/pixel.spr.json', 320*200);
            M44.identity(MosaicDemo.sprMgr.projection);
            MosaicDemo.sprMgr.projection[0] = 1/gl.canvas.width;
            MosaicDemo.sprMgr.projection[5] = 1/gl.canvas.height;
        }
        this.settings.pixel.control.max = MosaicDemo.sprMgr.map.frames.length-1;
        this.settings.pixel.control.setValue(1);

        // create particles
        this.particles = [];
        for (var i=0; i<320*200; i++) {
            var spr = MosaicDemo.sprMgr.addSprite();
            spr.setPosition([-10000, 0, 0]);
            var p = new Particle(spr);
            spr.particle = p;
            this.particles.push(p);
        }
        this.particleCount = Math.floor(320*this.settings.scale.value)*Math.floor(200*this.settings.scale.value);
        console.log(`Particle count: ${this.particleCount}/${this.particles.length}`);

        // load images
        var urls = [
            '/demo/data/fiacska.png',
            '/demo/data/aliens.gif',
            '/demo/data/ninja.gif',
            '/demo/data/bopnrumble.gif',
            '/demo/data/sample.png'
        ];
        this.images = [];
        var res = await load(urls);
        for (var i=0; i<res.length; i++) {
            if (!(res[i].error instanceof Error) && res[i].node instanceof Image) {
                var url = res[i].resolvedUrl;
                var ix = url.path.lastIndexOf('/') + 1;
                res[i].node.alt = url.path.substring(ix != 0 ? ix : 0);
                var buffer = new glui.Buffer(320, 200);
                buffer.blitImage(res[i].node);
                buffer.update(true);
                //buffer.context.drawImage(res[i].node, 0, 0, buffer.width, buffer.height);
                this.images.push(buffer);
            }
        }
        this.settings.image.control.max = this.images.length-1;
        this.settings.image.control.setValue(1);
        this.setImage(this.settings.image.control.value);
    };
    MosaicDemo.prototype.destroy = function destroy() {
        MosaicDemo.sprMgr.destroy();
        MosaicDemo.sprMgr = null;
        for (var i=0; i<this.images; i++) {
            this.images[i].dispose();
        }
        glui.canvas.style.backgroundColor = this.originalBackgroundColor;
    };
    MosaicDemo.prototype.update = function update(frame, dt) {
        var t = dt*this.settings.delta.value;
        var r = this.settings.radius.value * this.step;
        var f = this.settings.force.value;
        MosaicDemo.sprMgr.selectRadius(this.mouse[0], this.mouse[1], r, (spr, x,y, dx, dy, args) => {
            // apply force - update acceleration
            spr.particle.acc.set([f*dx, f*dy]);
        }, r);

        this.updateParticles( p => {
            p.update(t, dt);
            p.obj.scale.scale(this.settings.size.value);
        });
    };
    MosaicDemo.prototype.render = function render(frame, dt) {
        //gl.clearColor(0.01, 0.02, 0.1, 1.0);
        MosaicDemo.sprMgr.update();
        MosaicDemo.sprMgr.render();
    };
    MosaicDemo.prototype.setParticle = function(p, pi, i,j, updatePosition) {
        var ix = 4*pi;
        if (this.buffer.imgData.data[ix+3]) {
            var frame = MosaicDemo.sprMgr.map.frames[this.settings.pixel.value];
            p.obj.setFrame(this.settings.pixel.value);
            var size = this.settings.size.value;
            if (updatePosition) {
                this.step = frame[2] - frame[0];    //*size;
                p.set([this.step*(i - this.width/2), this.step*(j - this.height/2), 1], [0,0,0], [0,0], this.settings.lifeSpan.value);
            }
            p.obj.setScale([size, size, 1]);
            p.obj.color[0] = this.buffer.imgData.data[ix+0]/255;
            p.obj.color[1] = this.buffer.imgData.data[ix+1]/255;
            p.obj.color[2] = this.buffer.imgData.data[ix+2]/255;
            p.obj.color[3] = this.buffer.imgData.data[ix+3]/255;
            p.roaming.speed = this.settings.speed.value;
            p.roaming.variance = this.settings.variance.value;
            p.damping = 1 - this.settings.damping.value;
        }
    };
    MosaicDemo.prototype.setImage = function setImage(ix) {
        var src = this.images[ix];
        var scale = this.settings.scale.value;
        this.width = Math.floor(src.width*scale);
        this.height = Math.floor(src.height*scale);        
        this.particleCount = this.width * this.height;
        console.log('w: ' + this.width);
        this.buffer = new glui.Buffer(this.width, this.height);
        this.buffer.blitImage(this.images[ix].canvas);
        this.buffer.update(true);
        //var x = -width/2, y = -height/2;
        this.updateParticles( (p,pi,i,j) => this.setParticle(p, pi, i,j, true));
        glui.Buffer.dispose(this.buffer);
    };
    MosaicDemo.prototype.updateParticles = function(updater) {
        var pi = 0;
        var src = this.images[this.settings.image.value];
        var scale = this.settings.scale.value;
        var width = Math.floor(src.width*scale), height = Math.floor(src.height*scale);
        for (var j=height-1; j>=0; j--) {
            for (var i=0; i<width; i++) {
                updater.call(this, this.particles[pi], pi++, i, j);
            }
        }
        for (var pi=this.particleCount; pi<this.particles.length; pi++) {
            this.particles[pi].lifeSpan = 0;
            this.particles[pi].update(0);
        }
    };

    MosaicDemo.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'scale':
            case 'image':
                this.setImage(this.settings.image.value);
                break;
            case 'variance':
            case 'speed':
            case 'size':
            case 'pixel':
            case 'damping':
                this.updateParticles( (p, pi, i,j) => this.setParticle(p,pi, i,j));
                break;
            case 'freq':
                this.period = 1/setting.value;
            // case 'thrust':
            // case 'lifeSpan':
                 break;
        }
    };
    MosaicDemo.prototype.onclick = function onclick(x, y, e) {
        if (typeof(x) === 'number') {
            var f = -2000;
            var r = this.settings.radius.value * this.step;
            MosaicDemo.sprMgr.selectRadius(this.mouse[0], this.mouse[1], r, (spr, x,y, dx, dy, args) => {
                // apply force - update acceleration
                var a = 0.5 + 0.5*Math.random();
                spr.particle.velocity.add([a*f*dx, a*f*dy, 0]);
            }, r);
        }
    };
    MosaicDemo.prototype.onmousemove = function onmousemove(x, y, e) {
        if (typeof(x) === 'number') {
            this.mouse[0] = 2*x - 1*gl.canvas.width;
            this.mouse[1] = gl.canvas.height - 2*y;
            //console.log(this.particles[0].acc.x.toFixed(2), this.particles[0].acc.y.toFixed(2));
        }
    };
    MosaicDemo.prototype.onkeyup = function onkeyup(keyCode, e) {
        if (keyCode == 0x20) {
            this.setImage(this.settings.image.value);
        }
    };

    publish(new MosaicDemo(), 'MosaicDemo');
})();