include('/lib/math/noise.js');
(function() {
    function Map(width, height, tileSet) {
        var id = 0;
        this.width = width;
        this.height = height;
        this['tiles-url'] = tileSet;
        this.data = null;

        this.parameters = {
            'sx': 20,
            'sy': 20,
            'n':  6,
            'a0': 0.84,
            'an': 0.51,
            'f0': 1.07,
            'fn': 1.17,

            'normalize': true,
            'sealevel': 0.1,
            'levels': 6,
            'shades': false
        };

        this.noise = new Noise(13);
        this.generate();
    }

    Map.prototype.generate = function generate() {
        this.data = new Array(2 * this.width * this.height);
        var data = new Array(this.data.length);
        var p = this.parameters;
        //this.noise.transform2d = (x, y, v, buffer, ix) => { buffer[ix] = v < 1 ? v : 1; return ix+1; };
        //#region generate and normalize noise
        this.noise.createFbm2d(this.width, this.height, p.sx, p.sy, p.n, p.a0, p.f0, p.an, p.fn, data);
        if (p.normalize) {
            var min = 1, max = 0;
            var ix = 0;
            for (var y=0; y<this.height; y++) {
                for (var x=0; x<this.width; x++) {
                    var v = data[ix++];
                    if (v < min) min = v;
                    if (v > max) max = v;
                }
            }
            ix = 0;
            var range = max - min;
            for (var y=0; y<this.height; y++) {
                for (var x=0; x<this.width; x++) {
                    var v = data[ix];
                    data[ix] = (v - min)/range;
                    ix++;
                }
            }
        }
        //#endregion

        //#region quantize
        ix = 0;
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                var v = data[ix];
                if (v >= 1) v = 0.99;
                else if (v < 0) v = 0;
                v = Math.trunc(v * p.levels);
                if (p.shades) {
                    v = Math.trunc(255*v/(p.levels-1));
                }
                data[ix] = v;
                ix++;
            }
        }
        //#endregion

        // data = [
        //     0,0,1,2,2,2,
        //     0,0,1,2,2,2,
        //     0,0,1,1,1,2,
        //     1,1,1,1,1,1
        // ];
        // this.height = 4;
        // this.width = 6;

        //#region adjust map
        var si1 = 0;
        var di = 0;
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                var value = data[si1];
                var value2 = value;
                var code = 0;
                var p2 = 128;
                for (var j=-1; j<2; j++) {
                    var dy = y + j;
                    for (var i=-1; i<2; i++) {
                        var dx = x + i;
                        if (i != 0 || j != 0) {
                            var v = -1;
                            if (dy < 0) dy = 0;
                            else if (dy >= this.height) dy = this.height-1;
                            if (dx < 0) dx = 0;
                            else if (dx >= this.width) dx = this.width-1;
                            v = data[dx + dy*this.width];

                            if (value != v && value >= v) {
                                code += p2; value2 = v != -1 ? v : value;
                            }
                            p2 >>= 1;
                        }
                    }
                }
                var tile = -1;
                for (var k=0; k<Map.masks.length; k++) {
                    var and = (code & Map.masks[k].and) == Map.masks[k].and;
                    var nand = (~code & Map.masks[k].nand) == Map.masks[k].nand;
                    if (and && nand) {
                        tile = Map.masks[k].code; break;
                    }                    
                }
                if (tile == -1) tile = 0;   //throw new Error('Baka!!!');
                this.data[di++] = value2*13;
                this.data[di++] = value*13 + tile;
//console.log(x,y, value, value2, code, ~code, tile)
                si1++;
            }
        }

        // ix = 0;
        // var ix2 = 0;
        // for (var y=0; y<this.height; y++) {
        //     for (var x=0; x<this.width; x++) {
        //         var code = 0;
        //         var value = data[ix];
        //         var value2 = 0;
        //         value2 = data[ix - this.width]; if (y > 0 && value != value2) code += 1;
        //         value2 = data[ix - 1]; if (x > 0 && value != value2) code += 4;
        //         value2 = data[ix + 1]; if (x < this.width-1 && value != value2) code += 2;
        //         value2 = data[ix + this.width]; if (y < this.height-1 && value != value2) code += 8;
        //         this.data[ix2++] = value2*13;
        //         this.data[ix2++] = code;
        //         ix++;
        //     }
        // }
        //#endregion
    };

    Map.prototype.readRange = function readRange(left, top, width, height) {
        var data = new Array(2*width*height);
        var di = 0, si = 0;
        for (var j=0; j<height; j++) {
            for (var i=0; i<width; i++) {
                var x = (left + i) % this.width;
                data[di++] = this.data[si + 2*x];
                data[di++] = this.data[si + 2*x + 1];
            }
            if (top + j < this.height-1) {
                si += 2*this.width;
            } else {
                si = 0;
            }
        }
        return data;
    };

    Map.prototype.updateRange = function updateRange(left, top, width, height, data) {
        var di = left + top*this.width, si = 0;
        for (var j=0; j<height; j++) {
            var y = top + j;
            var di = y * this.width;
            for (var i=0; i<width; i++) {
                if (left + i >= this.width) di -= this.width;
                this.data[di++] = this.data[si++];
            }
            if (top + j >= this.height) y -= this.height;
        }
    };

    Map.masks = [
    // fll    br     b      bl     lft    tl     top    tr     rgh    lt     tt     rt     bt     l-r    t-b    isl
    // x0x    x11    111    11x    001    001    x0x    100    100    x1x    x0x    x1x    x1x    111    101    x1x
    // 0#0    1#0    0#0    0#1    0#1    0#1    0#0    1#0    1#0    0#1    1#1    1#0    1#1    0#0    1#1    1#1
    // x0x    10x    x0x    x01    001    x1x    111    x1x    100    x1x    111    x1x    x0x    111    101    x1x
        { 'and':0b00000000,  'nand':0b01011010, 'code':  0 }, // fll - x0x 00 x0x
        { 'and':0b01010100,  'nand':0b00001010, 'code':  1 }, // br  - x1x 10 10x
        { 'and':0b11100000,  'nand':0b00011010, 'code':  2 }, // b   - 111 00 x0x
        { 'and':0b01001001,  'nand':0b00010010, 'code':  3 }, // bl  - x1x 01 x01
        { 'and':0b00001001,  'nand':0b11010110, 'code':  4 }, // lft - 00x 01 001
        { 'and':0b00001010,  'nand':0b01010000, 'code':  5 }, // tl  - x0x 01 x1x
        { 'and':0b00000111,  'nand':0b01011000, 'code':  6 }, // top - x0x 00 111
        { 'and':0b00010010,  'nand':0b01001000, 'code':  7 }, // tr  - x0x 10 x1x
        { 'and':0b00010100,  'nand':0b01101011, 'code':  8 }, // rgh - x00 10 100
        { 'and':0b11101111,  'nand':0b00010000, 'code':  9 }, // lt  - 111 01 111
        { 'and':0b10111111,  'nand':0b01000000, 'code': 10 }, // tt  - 101 11 111
        { 'and':0b11010110,  'nand':0b00001000, 'code': 11 }, // rt  - 11x 10 11x
        { 'and':0b11111101,  'nand':0b00000010, 'code': 12 }, // bt  - 111 11 101
        //{ 'and':0b11100111,  'nand':0b00011000, 'code': 13 }, // l-r - 111 00 111
        //{ 'and':0b10111101,  'nand':0b01000010, 'code': 13 }, // t-b - 101 11 101
        { 'and':0b01011010,  'nand':0b00000000, 'code': 26 }  // isl - x1x 11 x1x
    ];

    publish(Map, 'Map');
})();