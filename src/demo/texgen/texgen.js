include('/ge/noise.js');

(function() {
    function TexGen(canvas) {
        this.id = 'TexGen';
        this.width = 128;
        this.height = 128;
        this.imgData = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.constructor = TexGen;
    }
    TexGen.prototype.prepare = function() {
        this.ctx.canvas.width = this.width;
        this.ctx.canvas.height = this.height;
        this.buffer = [this.ctx.getImageData(0, 0, this.width, this.height), this.ctx.getImageData(0, 0, this.width, this.height)];
        this.noise = new Noise(0);
    };
    TexGen.prototype.update = function(frame) {
        for (var i=0; i<this.buffer[0].data.length;) {
            this.buffer[0].data[i++] = 0; this.buffer[0].data[i++] = 0;
            this.buffer[0].data[i++] = 0; this.buffer[0].data[i++] = 255;
        }
        // noise
        if (this.settings.stack.items[0].rows[0].cells.on.getValue()) this.createNoise(this.buffer[0].data, this.settings.stack.items[0].rows[0].cells, 0);
        // filter
        this.filter(this.buffer[0], this.buffer[1], this.settings.stack.items[1]);
        // noise
        if (this.settings.stack.items[2].rows[0].cells.on.getValue()) this.createNoise(this.buffer[1].data, this.settings.stack.items[2].rows[0].cells, 0);
        // filter
        this.filter(this.buffer[1], this.buffer[0], this.settings.stack.items[3]);
    };
    TexGen.prototype.render = function(frame) {
        this.ctx.putImageData(this.buffer[0], 0, 0);
    };

    TexGen.prototype.filter = function(input, output, settings) {
        var ix = 0;
        var w = new Array(10);
        w[9] = 0;
        var wi = 0;
        for (var ri=0; ri<3; ri++) {
            for (var ci=0; ci<3; ci++) {
                w[9] += w[wi++] = parseFloat(settings.rows[ri].cells[ci].getValue()) || 0;
            }
        }
        for (var v=0; v<this.height; v++) {
            for (var u=0; u<this.width; u++) {
                var d = [0, 0, 0, 255];
                for (var ri=0; ri<3; ri++) {
                    var y = v + ri - 1;
                    if (y < 0 || y >= this.height) continue;
                    for (var ci=0; ci<3; ci++) {
                        var x = u + ci - 1;
                        if (x < 0 || x >= this.width) continue;
                        var ix2 = 4*(x + y*this.width);
                        var wij = w[ci+ri*3];
                        d[0] += wij * input.data[ix2 + 0];
                        d[1] += wij * input.data[ix2 + 1];
                        d[2] += wij * input.data[ix2 + 2];
                        //d[3] += settings.rows[i].cells[j].getValue() * input.data[ix + 4*(i + j*this.width) + 3];
                    }
                }
                output.data[ix + 0] = d[0]/w[9];
                output.data[ix + 1] = d[1]/w[9];
                output.data[ix + 2] = d[2]/w[9];
                output.data[ix + 3] = d[3];
                ix += 4;
            }
        }
    };

    TexGen.prototype.createNoise = function (imgData, settings, dt) {
    	var amp = settings.amp.getValue();
    	var fre = settings.fre.getValue();
        for (var j=0; j<this.height; j++) {
            var y = j/this.height;
            for (var i=0; i<this.width; i++) {
                var ix = 4*(i + j*this.width);
                var x = i/this.width;
                var v = this.noise.fbm2d(x, y, 4, amp, fre, amp, fre);
                v = Math.floor(255*Fn.clamp(v, 0.0, 1.0));
                imgData[ix+0] += v;
                imgData[ix+1] += v;
                imgData[ix+2] += v;
            }
        }
    }

    public(TexGen, 'TexGen');

})();