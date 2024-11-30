(function() {
    include('v3.js');

    function M33(data, isColumnMajor) {
        if (data != undefined) {
            if (data instanceof M33) {
                this.set(data);
            } else if (data.constructor == Float32Array || data.constructor == Float64Array || Array.isArray(data)) {
                // m23: element of row #2 and column #3
                var k = 0;
                for (var j=0; j<3; j++) {
                    for (var i=0; i<3; i++) {
                        var ix = !isColumnMajor ? 3*j+i : 3*i+j;
                        this[ix] = data[k++];
                    }
                }
            } else if (typeof data == 'number') {
                for (var i=0; i<9; i++) this[i] = data;
            } else {
                throw new Error('Could not create M33 from these arguments!');
            }
        }
    }
    M33.prototype = new Float32Array(9);

    M33.prototype.mul = function(m33, r33, o) {
        r33 = r33 || new M33(0);
        o = o || 0;
        for (var aj=0; aj<3; aj++) {
            for (var bi=0; bi<3; bi++) {
                r33[o+3*aj+bi] = 0;
                for (var k=0; k<3; k++) {
                    r33[o+3*aj+bi] += this[k+3*aj] * m33[bi+3*k];
                }
            }
        }
        return r33;
    }

    M33.prototype.mulV = function(v, r3, o) {
        var k = 0;
        r3 = r3 || new V3();
        o = o || 0;
        for (var i=0; i<3; i++) {
            r3[o+i] = 0;
            for (var j=0; j<3; j++) {
                r3[o+i] += this[k++] * v[j];
            }
        }
        return r3;
    };

    M33.prototype.set = function(m33) {
        for (var i=0; i<9; i++) {
            this[i] = m33[i];
        }
        return this;
    };
    M33.prototype.put = function put(r, o) {
        o = o || 0;
        for (var i=0; i<9; i++) {
            r[o+i] = this[i];
        }
        return r;
    };
    M33.prototype.transpose = function transpose(r33, o) {
        r33 = r33 || this;
        o = o || 0;
        for (var i=0; i<3; i++) {
            for (var j=i+1; j<3; j++) {
                var m1 = r33[i*3+j];
                var m2 = r33[j*3+i];
                r33[i*3+j] = m2;
                r33[j*3+i] = m1;
            }
        }
        return r33;
    };

    M33.identity = function(r33, o) {
        // 1, 0, 0,
        // 0, 1, 0,
        // 0, 0, 1
        r33 = r33 || new M33();
        o = o || 0;
        for (var i=0; i<9; i++) {
            r33[o+i] = 0;
        }
        r33[o+0] = 1;
        r33[o+4] = 1;
        r33[o+8] = 1;
        return r33;
    };

    M33.translate = function(t, r33, o) {
        //  1,  0,  0,
        //  0,  1,  0,
        // tx, ty,  1
        o = o || 0;
        r33 = M33.identity(r33, o);
        r33[o+6] = t[0];
        r33[o+7] = t[1];
        return r33;
    };
     
    M33.rotate = function(rad, r33, o) {
        // c, -s,  0,
        // s,  c,  0,
        // 0,  0,  1
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        o = o || 0;
        r33 = M33.identity(r33, o);
        r33[o+0] = c;
        r33[o+1] = -s;
        r33[o+3] = s;
        r33[o+4] = c;
        return r33;
    };
     
    M33.scale = function(s, r33) {
        // sx,  0,  0,
        //  0, sy,  0,
        //  0,  0,  1
        r33 = M33.identity(r33);
        r33[0] = s[0];
        r33[4] = s[1];
        return r33;
    };

    M33.projection = function(width, height, r33, o) {
        // 2/w,    0,   0,
        //   0, -2/h,   0,
        //  -1,    1,   1
        r33 = M33.identity(r33, o);
        r33[o+0] = 2/width;
        r33[o+4] = -2/height;
        r33[o+6] = -1;
        r33[o+7] = 1;
        return r33;
    }

    publish(M33, 'M33');

})();