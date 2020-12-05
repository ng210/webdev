include('glui/glui-lib.js');
include('glui/misc/roaming-unit.js');
include('webgl/sprite/sprite.js');
(function() {

    function Particle(obj) {
        this.roaming = new RoamingUnit(1, 0.5);
        this.obj = obj;
        this.acc = new V3();
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
    Particle.prototype.update = function update(dt) {
        this.lifeSpan -= dt;
        if (this.lifeSpan > 0) {
            this.roaming.update(dt);
            this.velocity.add(this.roaming.velocity);
            this.velocity.add(this.acc.prodC(dt));
            var ds = this.velocity.prodC(dt);
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
            size: { label: 'Size', value: 0.3, min:0.1, max:0.9, step: 0.01, normalized: true, type: 'float' },
            //rotation: { label: 'Rotation', value: 8.0, min:0, max:100, step: 1.0, type: 'float' },
            speed: { label: 'Speed', value: 5.0, min:0, max:10, step: 0.1, type: 'float' },
            variance: { label: 'Variance', value: 0.4, min:0, max:0.5, step: 0.01, normalized: true, type: 'float' },
            lifeSpan: { label: 'Life', value: 10.0, min:1.0, max:10, step: 1, type: 'float' },
            delta: { label: 'Delta', value: 5.0, min:1.0, max:8, step: 0.1, type: 'float' }
        });
        // custom variables
        this.originalBackgroundColor = null;
        this.period = 0;
        this.count = 2;
        this.scale = 4;
    }
    extend(Demo, MosaicDemo);

    MosaicDemo.sprMgr = null;

    MosaicDemo.prototype.initialize = async function initialize() {
        // create 3D buffer
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
        if (MosaicDemo.sprMgr == null) {
            MosaicDemo.sprMgr = new webGL.SpriteManager();
            await MosaicDemo.sprMgr.initialize('/demo/data/pixel.spr.json', 320*200);
            M44.identity(MosaicDemo.sprMgr.projection);
            MosaicDemo.sprMgr.projection[0] = 1/gl.canvas.width;
            MosaicDemo.sprMgr.projection[5] = 1/gl.canvas.height;
        }
        this.settings.pixel.control.max = MosaicDemo.sprMgr.map.frames.length-1;
        this.settings.pixel.control.setValue(3);

        // create particles
        this.particles = [];
        for (var i=0; i<320*200; i+=this.count*this.count) {
            var spr = MosaicDemo.sprMgr.addSprite();
            spr.setPosition([-10000, 0, 0]);
            this.particles.push(new Particle(spr));
        }

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
        this.settings.image.control.setValue(this.images.length-1);
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
        this.updateParticles( p => {
            p.update(t);
            p.obj.scale.scale(this.settings.size.value);
        });
    };
    MosaicDemo.prototype.render = function render(frame, dt) {
        //gl.clearColor(0.01, 0.02, 0.1, 1.0);
        MosaicDemo.sprMgr.update();
        MosaicDemo.sprMgr.render();
    };
    MosaicDemo.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'image':
                this.setImage(setting.value);
                break;
            case 'variance':
            case 'speed':
            case 'size':
            case 'pixel':
                this.updateParticles( (p, i,j,k) => {
                    var size = this.settings.size.value;
                    p.obj.setScale([size, size, 1]);
                    p.obj.setFrame(this.settings.pixel.value);
                    p.roaming.speed = this.settings.speed.value;
                    p.roaming.variance = this.settings.variance.value;
                });
                break;
            case 'freq':
                this.period = 1/setting.value;
            // case 'thrust':
            // case 'lifeSpan':
                 break;
        }
    };
    // MosaicDemo.prototype.onmousemove = function onmousemove(x, y, e) {
    //     if (typeof(x) === 'number') {
    //         var m = new V2(2*x - 1, 2*y - 1).prod([gl.canvas.width, gl.canvas.height]);
    //         this.updateParticles( p => {
    //             var d = [m.x - p.obj.position.x, m.y - p.obj.position.y];
    //             new V2(m.diff(p.obj.position));
    //             var l = Math.sqrt(d[0]*d[0] + d[1]*d[1]);
    //             p.acc.x = 10*d[0]/l;
    //             p.acc.y = 10*d[1]/l;
    //         });
    //         console.log(m, this.particles[0].obj.position);
    //         //console.log(this.particles[0].acc.x.toFixed(2), this.particles[0].acc.y.toFixed(2));
    //     }
    // };
    MosaicDemo.prototype.setImage = function setImage(ix) {
        var buffer = this.images[ix];
        var size = this.settings.size.value;
        var x = -160, y = -100;
        this.updateParticles( (p, pi, i,j) => {
            var ix = 4*(i + (199 - j)*320);
            var col = buffer.imgData.data[ix+0] + buffer.imgData.data[ix+1] + buffer.imgData.data[ix+2] + buffer.imgData.data[ix+3];
            if (col) {
                p.obj.setScale([this.settings.size.value, this.settings.size.value, 1]);
                p.set([this.scale*(x + i), this.scale*(y + j), 1], [0,0,0], [0,0], this.settings.lifeSpan.value);
                p.obj.setScale([size, size, 1]);
                p.obj.setFrame(this.settings.pixel.value);
                p.obj.color[0] = buffer.imgData.data[ix+0]/255;
                p.obj.color[1] = buffer.imgData.data[ix+1]/255;
                p.obj.color[2] = buffer.imgData.data[ix+2]/255;
                p.obj.color[3] = buffer.imgData.data[ix+3]/255;
                p.roaming.speed = this.settings.speed.value;
                p.roaming.variance = this.settings.variance.value;
            }
        });
    };
    MosaicDemo.prototype.updateParticles = function(updater) {
        var pi = 0;
        var count = this.count;
        for (var j=0; j<200; j+=count) {
            for (var i=0; i<320; i+=count) {
                updater.call(this, this.particles[pi], pi, i, j);
                pi++;
            }
        }
    };

    publish(new MosaicDemo(), 'MosaicDemo');
})();