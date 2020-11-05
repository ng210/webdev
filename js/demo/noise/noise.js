include('/math/noise.js');
include('/math/fn.js');

include('glui/glui-lib.js');
(function() {
    function NoiseDemo() {
        Demo.call(this, 'Noise', {
            width: { label: 'Width', value: 320, min:64, max:512, step: 64, type: 'int', link: null },
            height: { label: 'Height', value: 256, min:64, max:512, step: 64, type: 'int', link: null },
            scale: { label: 'Scale', value: 0.05, min:0.001, max:0.1, step: 0.001, normalized:true, type: 'float', link: null },
            harmonics: { label: 'Harmonics', value: 5, min:1, max:10, step: 1, type: 'int', link: null },
            amp0: { label: 'Amp0', value: 0.5, min:0.01, max:1, step: 0.01, type: 'float', link: null },
            fre0: { label: 'Freq0', value: 1.0, min:0.01, max:8, step: 0.01, type: 'float', link: null },
            amp: { label: 'Amp x', value: 0.49, min:0.01, max:2, step: 0.01, type: 'float', link: null },
            fre: { label: 'Freq x', value: 2.01, min:0.01, max:8, step: 0.01, type: 'float', link: null },
            motion: { label: 'Motion', value: 0.5, min:0, max:5.0, step: 0.01, normalized:true, type: 'float', link: null },
            radius: { label: 'Radius', value: 0.3, min:0.01, max:1.0, step: 0.01, type: 'float', link: null },
            color: { label: 'Color', value: 1, min:0, max:2, step: 1, type: 'int', link: null }
        });

        this.noise = null;
        this.buffer = null;
        this.z = 0;
        this.colorTables = [
            [
                [1.0, 255, 255, 255, 255],
                [0.9, 255, 255, 255, 255],
                [0.8, 255, 240, 128, 255],
                [0.6, 240,  64,  64, 128],
                [0.4,  64,  64,  64,  64],
                [0.0,   0,   0,   0,   0]
            ],
            [
                [1.0, 255, 255, 255, 255],
                [0.9, 255, 255, 255, 255],
                [0.8, 128, 160, 240, 255],
                [0.7,  64,  64, 192, 128],
                [0.5,  64,  64,  64,  64],
                [0.0,   0,   0,   0,   0]
            ],
            [
                [1.000, 255, 255, 255, 255],
                [0.901, 255, 255, 255, 255],
                [0.900, 128, 128, 128, 255],
                [0.801, 128, 128, 128, 255],
                [0.800,  80,  64,   0, 255],
                [0.701,  80,  64,   0, 255],
                [0.700,  64, 160,  80, 255],
                [0.601,  64, 160,  80, 255],
                [0.600,  80, 192,  80, 255],
                [0.401,  80, 192,  80, 255],
                [0.400, 224, 224, 160, 255],
                [0.301, 224, 224, 160, 255],
                [0.300,  64, 128, 192, 255],
                [0.201,  64, 128, 192, 255],
                [0.200,  16,  20,  80, 255],
                [0.000,  16,  20,  80, 255]
            ]
            ,
            [
                [1.000, 255, 255, 255, 255],
                [0.900, 128, 128, 128, 255],
                [0.800,  80,  64,   0, 255],
                [0.700,  64, 160,  80, 255],
                [0.600,  80, 192,  80, 255],
                [0.400, 224, 224, 160, 255],
                [0.300, 224, 224, 160, 255],
                [0.200,  64, 128, 192, 255],
                [0.000,  16,  20,  80, 255]
            ]
        ];
        this.ratio = [1, 1];
        this.cursor = [0, 0];
        this.radius = 0;
    };
    extend(Demo, NoiseDemo);

    NoiseDemo.prototype.initialize = function initialize() {
            this.noise = new Noise(0);
            this.buffer = new glui.Buffer();
            this.resizeBuffer();
            //this.settings.color.max = this.colorTables.length;
            this.settings.color.control.max = this.colorTables.length-1;
    };
    NoiseDemo.prototype.resize = function resize(e) {
        this.radius = 0.2 * this.settings.radius.value * this.buffer.width;
        this.ratio[0] = this.buffer.width/glui.canvas.clientWidth;
        this.ratio[1] = this.buffer.height/glui.canvas.clientHeight;
    };
    NoiseDemo.prototype.resizeBuffer = function resizeBuffer() {
        this.buffer.resize(this.settings.width.value, this.settings.height.value);
        this.update(0, 0);
    };
    NoiseDemo.prototype.update = function update(frame, dt) {
        var n = this.settings.harmonics.value;
        var scale = this.settings.scale.value;
        var ix = 0;
        this.z += scale*dt * this.settings.motion.value;
        for (var y=0; y<this.settings.height.value; y++) {
            var dy = y - this.cursor[1];
            for (var x=0; x<this.settings.width.value; x++) {
                var dx = x - this.cursor[0];
                var d = Math.sqrt(dx*dx + dy*dy);
                var v = 0;
                if (d < this.radius) {
                    d /= this.radius;
                    v = 0.5*(1 - 2*d*d + d*d*d);
                }
                var r = this.noise.fbm3d(scale*x, scale*y, v+this.z, n, this.settings.amp0.value, this.settings.fre0.value, this.settings.amp.value, this.settings.fre.value);
                var color = this.lookUpColor(Fn.clamp(r, 0.0, 1.0));
                this.buffer.imgData.data[ix++] = color[0];
                this.buffer.imgData.data[ix++] = color[1];
                this.buffer.imgData.data[ix++] = color[2];
                this.buffer.imgData.data[ix++] = color[3];
            }
        }
        this.buffer.update();
    };
    NoiseDemo.prototype.render = function render(frame, dt) {
        glui.frontBuffer.blit(this.buffer);
    };
    NoiseDemo.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'width':
            case 'height':
                this.resizeBuffer();
                break;
            case 'radius':
                this.resize();
                break;
            default:
                this.update(0, 0);
        }            
    };
    NoiseDemo.prototype.onmousemove = function onmousemove(x, y, e) {
        this.cursor[0] = this.ratio[0] * e.clientX;
        this.cursor[1] = this.ratio[1] * e.clientY;
    };
    // custom functions
    NoiseDemo.prototype.lookUpColor = function lookUpColor(v) {
        // var s = Math.floor(255*v);
        // return [s, s, s, 255];
        var col = [0, 0, 0, 0];
        var tab = this.colorTables[this.settings.color.value];
        var i0 = tab[0];
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
    };

    publish(new NoiseDemo(), 'NoiseDemo');
})();
