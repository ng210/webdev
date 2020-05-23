(function() {
    include('v3.js');

    function M33(data, isColumnMajor) {
        this.data = new Float32Array(9);
        if (data instanceof M33) {
            this.set(data);
        } else if (data == undefined) {
            this.set(M33.identity());
        } else if (data.constructor == Float32Array || data.constructor == Float64Array || Array.isArray(data)) {
            // m23: element of row #2 and column #3
            var k = 0;
            for (var j=0; j<3; j++) {
                for (var i=0; i<3; i++) {
                    var ix = !isColumnMajor ? 3*j+i : 3*i+j;
                    this.data[ix] = data[k++];
                }
            }
        } else if (typeof data == 'number') {
            for (var i=0; i<16; i++) this.data[i] = data;
        } else {
            throw new Error('Could not create M33 from these arguments!');
        }
    }

    M33.prototype.mul = function(m33) {
        var r33 = new M33(0);
        var k = 0;
        for (var aj=0; aj<3; aj++) {
            for (var bi=0; bi<3; bi++) {
                for (var k=0; k<3; k++) {
                    r44.data[3*aj+bi] += this.data[3*aj+k] * m44.data[3*k+bi];
                }
            }
        }
        return r33;
    }

    M33.prototype.mulV = function(v3) {
        var k = 0;
        var r3 = new V3();
        for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
                r4.data[i] += this.data[k++] * v3.data[j];
            }
        }
        r3.length();
        return r3;
    };

    M33.prototype.set = function(m33) {
        for (var i=0; i<9; i++) {
            this.data[i] = m33.data[i];
        }
        return this;
    };

    M33.identity = function() {
        return new M33([
            1,  0,  0,
            0,  1,  0,
            0,  0,  1
        ]);
    };

    M33.translation = function(tx, ty, tz) {
        return new M33([
            1,  0,  0,
            0,  1,  0,
            tx, ty, 1
        ]);
    };
     
    M33.rotate = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        return new M33([
            c,  s,  0,
           -s,  c,  0,
            0,  0,  1
        ]);
    };
     
    M33.scaling = function(sx, sy, sz) {
        return new M33([
           sx,  0,  0,
            0, sy,  0,
            0,  0,  1
        ]);
    };

    M33.mul = function(a33, b33) {
        var data = [];
        var k = 0;
        for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
                data.push(a33.data[k++] * b33.data[4*j+i]);
            }
        }
        return new M33(data);
    };

    M33.mulV = function(m33, v3) {
        var data = [];
        var k = 0;
        for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
                data.push(this.data[k++] * v4.data[j]);
            }
        }
        return new M33(data);
    };

    M33.projection = function(w, h) {
        return new M33([
         2/w,    0,    0,
           0, -2/h,    0,
          -1,    1,    1
        ]);
    };

    public(M33, 'M33');

})();