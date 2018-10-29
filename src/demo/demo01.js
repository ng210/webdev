include('/ge/noise.js');
include('/ge/fn.js');
include('demo.js');

(function() {
    function Demo01(canvas) {
        Demo.call(this, 'demo01', canvas);
        this.noise = new Noise(0);
        this.constructor = Demo01;
        this.imgData = null;
        this.ctx = canvas.getContext('2d');
    }
    Demo01.prototype = new Demo;


    Demo01.prototype.initialize = function() {
        var width = this.settings.width.getValue();
        var height = this.settings.height.getValue();
        this.ctx.canvas.width = width;
        this.ctx.canvas.height = height;
        this.imgData = this.ctx.getImageData(0, 0, width, height);
    };

    Demo01.prototype.update = function(frame) {
        this.createNoise(this.imgData.data, this.imgData.width, this.imgData.height, 256, 0.2*frame);
    };

    Demo01.prototype.render = function(frame) {
        this.ctx.putImageData(this.imgData, 0, 0);
    };

    Demo01.prototype.createNoise = function (imgData, width, height, depth, dt) {
        var z = (dt % depth)/depth;
        for (var j=0; j<height; j+=2) {
            var y = j/height;
            var cy = y - 0.5;
            y += 3*dt/depth;
            for (var i=0; i<width; i+=2) {
                var ix = 4*(i + j*width);
                var x = i/width;
                var cx = x - 0.5;// if (cx == 0) cx = 2.000001;
                var r = Math.sqrt(cx*cx + cy*cy);
                //var v = ns.fbm1d(x, 6, 0.67, 4.3, .52, 3.98);
                //var v = ns_.fbm2d(x, y, 3, 0.67, 4.3, .52, 2.98);
                var v = 1.16*this.noise.fbm3d(x, y, z, 7, 0.77, 2.02, .48, 2.92);
                //var fd = 1.0 - Math.sqrt(cx*cx + cy*cy);
                var fd = 1.0;	//Math.sqrt(cx*cx + cy*cy);
                fd = Fn.smoothstep(fd*fd);
                v = v * fd;
                var col = lookUpColor(1, Fn.clamp(v, 0.0, 1.0));
                imgData[ix+0] = col[0];
                imgData[ix+1] = col[1];
                imgData[ix+2] = col[2];
                imgData[ix+3] = col[3]/2;
            }
        }
    }

    function lookUpColor(tix, v) {
        var tbl = [
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
            ]
        ];
    
        
        var col = [0, 0, 0, 0];
        var tab = tbl[tix];
        var i0 = tab[0];
        for (var i=1; i<tab.length; i++) {
            var i1 = tab[i];
            if (v > i1[0]) {
                var r = (v - i1[0])/(i0[0] - i1[0]);
                for (var j=0; j<4; j++) {
                    col[j] = Math.floor(r*(i0[j+1] - i1[j+1]) + i1[j+1]);
                    //col[j] = i1[j+1];
                }
                break;
            }
            i0 = i1;
        }
        return col;
    }

    public(Demo01, 'Demo01');
})();