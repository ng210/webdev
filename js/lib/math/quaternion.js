(function() {
    include('v4.js');
    include('m44.js');
    function Quaternion(x, y, z, w) {
        V4.call(this, x, y, z, w);
        this.constructor = Quaternion;
    };
    Quaternion.prototype = new V4();

    Quaternion.fromAxisAngle = function fromAxisAngle(axis, angle) {
        // x = axis.x*sin(angle/2)
        // y = axis.y*sin(angle/2)
        // z = axis.z*sin(angle/2)
        // w = cos(angle/2)
        var s = Math.sin(angle/2);
        return new Quaternion(axis[0]*s, axis[1]*s, axis[2]*s, Math.cos(angle/2));
    }

    Quaternion.prototype.conjugate = function conjugate(o, r) {
        r = r || new Quaternion();
        o = o || 0;
        r[o+0] = -this[0];
        r[o+1] = -this[1];
        r[o+2] = -this[2];
        r[o+3] = this[3];
        return r;
    };
    Quaternion.prototype.mul = function mul(q, r, o) {
        // r.x =  q1.x*q2.w + q1.y*q2.z - q1.z*q2.y + q1.w*q2.x
        // r.y = -q1.x*q2.z + q1.y*q2.w + q1.z*q2.x + q1.w*q2.y
        // r.z =  q1.x*q2.y - q1.y*q2.x + q1.z*q2.w + q1.w*q2.z
        // r.w = -q1.x*q2.x - q1.y*q2.y - q1.z*q2.z + q1.w*q2.w
        r = r || new Quaternion();
        o = o || 0;
        var r1 = (this[3] + this[0])*(q[3] + q[0]);
        var r2 = (this[2] - this[1])*(q[1] - q[2]);
        var r3 = (this[3] - this[0])*(q[1] + q[2]); 
        var r4 = (this[1] + this[2])*(q[3] - q[0]);
        var r5 = (this[0] + this[2])*(q[0] + q[1]);
        var r6 = (this[0] - this[2])*(q[0] - q[1]);
        var r7 = (this[3] + this[1])*(q[3] - q[2]);
        var r8 = (this[3] - this[1])*(q[3] + q[2]);
        r[o+0] = r1 - (r5 + r6 + r7 + r8)/2; 
        r[o+1] = r3 + (r5 - r6 + r7 - r8)/2; 
        r[o+2] = r4 + (r5 - r6 - r7 + r8)/2;
        r[o+3] = r2 +(-r5 - r6 + r7 + r8)/2;
        // r[o+0] =  this[0]*q[3] + this[1]*q[2] - this[2]*q[1] + this[3]*q[0];
        // r[o+1] = -this[0]*q[2] + this[1]*q[3] + this[2]*q[0] + this[3]*q[1];
        // r[o+2] =  this[0]*q[1] - this[1]*q[0] + this[2]*q[3] + this[3]*q[2];
        // r[o+3] = -this[0]*q[0] - this[1]*q[1] - this[2]*q[2] + this[3]*q[3];
        return r;
    };
    Quaternion.prototype.toMatrix = function toMatrix(r, o) {
        // 1-2(zz+yy)   2(xy-zw)    2(xz+yw)    0
        // 2(xy+zw)	    1-2(zz+xx)	2(yz-xw)    0
        // 2(xz-yw)	    2(yz+xw)	1-2(yy+xx)  0
        // 0		    0		    0		    1

        r = r || new M44();
        o = o || 0;
        var x2 = 2*this[0], y2 = 2*this[1], z2 = 2*this[2], w2 = 2*this[3];
        var xx = x2*this[0], xy = x2*this[1], xz = x2*this[2], xw = x2*this[3];
        var yy = y2*this[1], yz = y2*this[2], yw = y2*this[3];
        var zz = z2*this[2], zw = z2*this[3];
        r[o+ 0] = 1-(zz+yy);    r[o+ 1] = xy-zw;        r[o+ 2] = xz+yw;        r[o+ 3] = 0;
        r[o+ 4] = xy+zw;	    r[o+ 5] = 1-(zz+xx);    r[o+ 6] = yz-xw;        r[o+ 7] = 0;
        r[o+ 8] = xz-yw;	    r[o+ 9] = yz+xw;        r[o+10] = 1-(yy+xx);    r[o+11] = 0;
        r[o+12] = 0;		    r[o+13] = 0;		    r[o+14] = 0;		    r[o+15] = 1;
        return r;
    }

    Quaternion.prototype.toMatrix_ = function toMatrix(o, r) {
        r = r || new M44();
        o = o || 0;
        var sqw = this.w*this.w;
        var sqx = this.x*this.x;
        var sqy = this.y*this.y;
        var sqz = this.z*this.z;
        r[o+0] = sqx - sqy - sqz + sqw; // since sqw + sqx + sqy + sqz =1
        r[o+5] = -sqx + sqy - sqz + sqw;
        r[o+10] = -sqx - sqy + sqz + sqw;
        
        var tmp1 = this.x*this.y;
        var tmp2 = this.z*this.w;
        r[o+4] = 2.0 * (tmp1 + tmp2);
        r[o+1] = 2.0 * (tmp1 - tmp2);
        
        var tmp1 = this.x*this.z;
        var tmp2 = this.y*this.w;
        r[o+8] = 2.0 * (tmp1 - tmp2);
        r[o+2] = 2.0 * (tmp1 + tmp2);
        
        var tmp1 = this.y*this.z;
        var tmp2 = this.x*this.w;
        r[o+12] = 2.0 * (tmp1 + tmp2);
        r[o+3] = 2.0 * (tmp1 - tmp2);
        
        var a1,a2,a3;
        a1 = a2 = a3 = 0;
        r[o+0*4+0] = a1 - a1 * r[o+0*4+0] - a2 * r[o+0*4+0] - a3 * r[o+0*4+0];
        r[o+1*4+1] = a2 - a1 * r[o+1*4+1] - a2 * r[o+1*4+1] - a3 * r[o+1*4+1];
        r[o+2*4+2] = a3 - a1 * r[o+2*4+2] - a2 * r[o+2*4+2] - a3 * r[o+2*4+2];
        r[o+3*4+3] = r[o+3*4+3] = r[o+3*4+3] = 0.0;
        r[o+3*4+3] = 1.0;
        return r;
     }

    //  var q = Quaternion.fromAxisAngle([1,2,3,0], 2.3);
    //  var m1 = q.toMatrix();
    //  var m2 = setRotate(q);
    //  for (var i=0; i<16; i++) {
    //      if (m1[i] != m2[i]) console.log(`${i}: ${m1[i]}, ${m2[i]}`);
    //  }

    Quaternion.prototype.rotate = function rotate(v4) {
        return this.mul(v4).mul(this.conjugate());
    }
    public(Quaternion, 'Quaternion');
})();