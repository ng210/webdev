(function() {
    include('v4.js');

    function M44(data, isColumnMajor) {
        this.data = new Float32Array(16);
        if (data instanceof M44) {
            this.set(data);
        } else if (data == undefined) {
            this.set(M44.identity());
        } else if (data.constructor == Float32Array || data.constructor == Float64Array || Array.isArray(data)) {
            // m23: element of row #2 and column #3
            var k = 0;
            for (var j=0; j<4; j++) {
                for (var i=0; i<4; i++) {
                    var ix = !isColumnMajor ? 4*j+i : 4*i+j;
                    this.data[ix] = data[k++];
                }
            }
        } else if (typeof data == 'number') {
            for (var i=0; i<16; i++) this.data[i] = data;
        } else {
            throw new Error('Could not create M44 from these arguments!');
        }
    }

    M44.prototype.mul = function(m44) {
        var r44 = new M44(0);
        for (var aj=0; aj<4; aj++) {
            for (var bi=0; bi<4; bi++) {
                for (var k=0; k<4; k++) {
                    r44.data[4*aj+bi] += this.data[4*k+bi] * m44.data[4*aj+k];
                }
            }
        }
        return r44;
    }

    M44.prototype.mulV = function(v4) {
        var k = 0;
        var r4 = new V4();
        for (var i=0; i<4; i++) {
            for (var j=0; j<4; j++) {
                r4.data[i] += this.data[k++] * v4.data[j];
            }
        }
        r4.length();
        return r4;
    };

    M44.prototype.set = function(m44) {
        for (var i=0; i<16; i++) {
            this.data[i] = m44.data[i];
        }
        return this;
    };

    M44.identity = function() {
        return new M44([
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            0,  0,  0,  1
        ]);
    };

    M44.translate = function(v4) {
        return new M44([
             1,    0,    0,  0,
             0,    1,    0,  0,
             0,    0,    1,  0,
          v4.x, v4.y, v4.z,  1
        ]);
    };
     
    M44.rotateX = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        return new M44([
            1,  0,  0,  0,
            0,  c,  s,  0,
            0, -s,  c,  0,
            0,  0,  0,  1
        ]);
    };
     
    M44.rotateY = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        return new M44([
            c,  0, -s,  0,
            0,  1,  0,  0,
            s,  0,  c,  0,
            0,  0,  0,  1
        ]);
    };
     
    M44.rotateZ = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        return new M44([
            c,  s,  0,  0,
           -s,  c,  0,  0,
            0,  0,  1,  0,
            0,  0,  0,  1
        ]);
    };
     
    M44.scale = function(s4) {
        return new M44([
          s4.x,    0,    0,  0,
             0, s4.y,    0,  0,
             0,    0, s4.z,  0,
             0,    0,    0,  1
        ]);
    };

    M44.projection = function(w, h, d) {
        return new M44([
         2/w,    0,   0,  0,
           0, -2/h,   0,  0,
           0,    0, 2/d,  0,
          -1,    1,   0,  1
        ]);
    };

    M44.perspective = function(fov, aspect, near, far) {
        var f = Math.tan(0.5 * (Math.PI - fov));
        var d = near - far;
        return new M44([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) / d -1,
            0, 0, 2 * near * far / d, 0
        ]);
    };

    public(M44, 'M44');

})();