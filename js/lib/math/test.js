include('v2.js');
include('v3.js');
include('v4.js');
include('m33.js');
include('m44.js');
include('fn.js');

(function(){

    function test_v2() {
        header('Test V2');
        var u = new V2([4.0, 5.0]);
        var v = new V2(2.0, 3.0);
        var s = new V2(8.0);
        var r = new V2(u);
        test('Should create V2 from array',    context => context.assert(u, ':=', [ 4,  5] ));
        test('Should create V2 from x,y,z,w',  context => context.assert(v, ':=', [ 2,  3] ));
        test('Should create V2 from constant', context => context.assert(s, ':=', [ 8,  8] ));
        test('Should create V2 from V2',       context => context.assert(r, ':=', u ));

        test('Should set V2 from vector', context => context.assert(r.set(v), ':=', [ 2,  3]));

        test('Should increase vector', context =>  context.assert((r = new V2(u).add(v)), ':=', [ 6,  8] ));
        test('Should add 2 vectors', context => context.assert(u.sum(v), ':=', r ));

        test('Should decrease vector', context =>  context.assert((r = new V2(u).sub(v)), ':=', [ 2,  2] ));
        test('Should sub 2 vectors', context => context.assert(u.diff(v), ':=', r ));

        test('Should multiply vector', context =>  context.assert((r = new V2(u)).mul(v), ':=', [ 8, 15] ));
        test('Should return product of 2 vectors', context => context.assert(u.prod(v), ':=', r ));

        test('Should return product of 2 vectors in a buffer', context => {
            var buffer = new Float32Array(3);
            u.prod(v, buffer);
            context.assert(buffer, ':=', buffer);
        });

        test('Should return product of 2 vectors in a buffer', context => {
            var buffer = new Float32Array(2);
            u.prod(v, buffer);
            context.assert(buffer, ':=', r);
        });

        test('Should scale vector by 2', context =>  context.assert((r = new V2(u)).scale(2), ':=', [ 8, 10] ));
        test('Should return vector multiplied by 2', context => context.assert(u.prodC(2), ':=', r ));

        test('Should return dot product', context =>  context.assert(u.dot(v), '=', 2*4 + 3*5));

        test('Should return length', context =>  context.assert(u.len, '=', Math.sqrt(4*4 + 5*5)));
        test('Should return length squared', context =>  context.assert(u.len2, '=', 4*4 + 5*5));

        test('Should return normalized vector', context =>  context.assert((r = new V2(3, 4)).norm(), ':=', [3/5, 4/5]));
    }

    function test_v3() {
        header('Test V3');
        var u = new V3([4.0, 5.0, 6.0]);
        var v = new V3(2.0, 3.0, 1.0);
        var s = new V3(8.0);
        var r = new V3(u);
        test('Should create V3 from array',    context => context.assert(u, ':=', [ 4,  5,  6] ));
        test('Should create V3 from x,y,z,w',  context => context.assert(v, ':=', [ 2,  3,  1] ));
        test('Should create V3 from constant', context => context.assert(s, ':=', [ 8,  8,  8] ));
        test('Should create V3 from V3',       context => context.assert(r, ':=', u ));

        test('Should set V3 from vector', context => context.assert(r.set(v), ':=', [ 2,  3,  1]));

        test('Should increase vector', context =>  context.assert((r = new V3(u).add(v)), ':=', [ 6,  8,  7] ));
        test('Should add 2 vectors', context => context.assert(u.sum(v), ':=', r ));

        test('Should decrease vector', context =>  context.assert((r = new V3(u).sub(v)), ':=', [ 2,  2,  5] ));
        test('Should sub 2 vectors', context => context.assert(u.diff(v), ':=', r ));

        test('Should multiply vector', context =>  context.assert((r = new V3(u)).mul(v), ':=', [ 8, 15,  6] ));
        test('Should return product of 2 vectors', context => context.assert(u.prod(v), ':=', r ));

        test('Should return product of 2 vectors in a buffer', context => {
            var buffer = new Float32Array(3);
            u.prod(v, buffer);
            context.assert(buffer, ':=', buffer);
        });

        test('Should scale vector by 2', context =>  context.assert((r = new V3(u)).scale(2), ':=', [ 8, 10, 12] ));
        test('Should return vector multiplied by 2', context => context.assert(u.prodC(2), ':=', r ));

        test('Should return dot product', context =>  context.assert(u.dot(v), '=', 2*4 + 3*5 + 6*1));

        test('Should return length', context =>  context.assert(u.len, '=', Math.sqrt(4*4 + 5*5 + 6*6)));
        test('Should return length squared', context =>  context.assert(u.len2, '=', 4*4 + 5*5 + 6*6));

        test('Should return normalized vector', context =>  context.assert((r = new V3(2, 6, 9)).norm(), ':=', [2/11, 6/11, 9/11]));
    }

    function test_v4() {
        header('Test V4');
        var u = new V4([4.0, 5.0, 6.0, 7.0]);
        var v = new V4(2.0, 3.0, 1.0, -1.0);
        var s = new V4(8.0);
        var r = new V4(u);
        test('Should create V4 from array',    context => context.assert(u, ':=', [ 4,  5,  6,  7] ));
        test('Should create V4 from x,y,z,w',  context => context.assert(v, ':=', [ 2,  3,  1, -1] ));
        test('Should create V4 from constant', context => context.assert(s, ':=', [ 8,  8,  8,  8] ));
        test('Should create V4 from V4',       context => context.assert(r, ':=', u ));

        test('Should set V4 from vector', context => context.assert(r.set(v), ':=', [ 2,  3,  1, -1]));

        test('Should increase vector', context =>  context.assert((r = new V4(u).add(v)), ':=', [ 6,  8,  7,  6] ));
        test('Should add 2 vectors', context => context.assert(u.sum(v), ':=', r ));

        test('Should decrease vector', context =>  context.assert((r = new V4(u).sub(v)), ':=', [ 2,  2,  5,  8] ));
        test('Should sub 2 vectors', context => context.assert(u.diff(v), ':=', r ));

        test('Should multiply vector', context =>  context.assert((r = new V4(u)).mul(v), ':=', [ 8, 15,  6, -7] ));
        test('Should return product of 2 vectors', context => context.assert(u.prod(v), ':=', r ));

        test('Should return product of 2 vectors in a buffer', context => {
            var buffer = new Float32Array(4);
            u.prod(v, buffer);
            context.assert(buffer, ':=', buffer);
        });

        test('Should scale vector by 2', context =>  context.assert((r = new V4(u)).scale(2), ':=', [ 8, 10, 12, 14] ));
        test('Should return vector multiplied by 2', context => context.assert(u.prodC(2), ':=', r ));

        test('Should return dot product', context =>  context.assert(u.dot(v), '=', 2*4 + 3*5 + 6*1 + 7*-1));

        test('Should return length', context =>  context.assert(u.len, '=', Math.sqrt(4*4 + 5*5 + 6*6 + 7*7)));
        test('Should return length squared', context =>  context.assert(u.len2, '=', 4*4 + 5*5 + 6*6 + 7*7));

        test('Should return normalized vector', context =>  context.assert((r = new V4(2)).norm(), ':=', [2/4, 2/4, 2/4, 2/4]));
    }

    function test_m33() {
        header('Test M33');
        var arr = [ 1,  2,  3,    2,  4,  6,    3,  6,  9 ];
        var m33 = new M33(arr);
        var n33 = new M33(new Float32Array(arr));
        var o33 = new M33(new Float64Array(arr));
        var p33 = M33.identity();
        var q33 = new M33(p33);
        var r33 = new M33([1,0,0, 0,2,0, 0,0,3]);
        var s33 = new M33([1,2,3, 4,5,6, 7,8,9]);
        test('Should create M33 from array', context => context.assert(m33, ':=', arr));
        test('Should create M33 from Float32Array', context => context.assert(n33, ':=', arr));
        test('Should create M33 from Float64Array', context => context.assert(o33, ':=', arr));
        test('Should create M33 from identity', context => context.assert(p33, ':=', [1,0,0, 0,1,0, 0,0,1]));
        test('Should create M33 from M33', context => context.assert(q33, ':=', p33));
        test('Should transpose M33', context => context.assert(s33.transpose(), ':=', [ 1,4,7, 2,5,8, 3,6,9 ]));
        test('Should multiply by identity matrix', context => context.assert(m33.mul(p33), ':=', m33));
        test('Should multiply by a matrix', context => context.assert(m33.mul(r33), ':=', [ 1,4,9, 2,8,18, 3,12,27 ]));
        test('Should multiply by a matrix', context => context.assert(r33.mul(m33), ':=', [ 1,2,3, 4,8,12, 9,18,27 ]));
        test('Should multiply by a vector', context => context.assert(n33.mulV(new V3(1, 2, 3)), ':=', [1+4+9, 2+8+18, 3+12+27]));
        var buffer = new Float32Array(9);
        test('Should multiply by a matrix into a buffer', context => {
            m33.mul(n33, buffer);
            context.assert(buffer, ':=', [
                1+ 4+ 9,  2+ 8+18,  3+12+27,
                2+ 8+18,  4+16+36,  6+24+54,
                3+12+27,  6+24+54,  9+36+81
            ]);
        });
    }

    function test_m44() {
        header('Test M44');
        var arr = [ 1,  2,  3,  4,    2,  4,  6,  8,    3,  6,  9, 12,    4,  8, 12, 16 ];
        var m44 = new M44(arr);
        var n44 = new M44(new Float32Array(arr));
        var o44 = new M44(new Float64Array(arr));
        var p44 = M44.identity();
        var q44 = new M44(p44);
        var r44 = new M44([1,0,0,0, 0,2,0,0, 0,0,3,0, 0,0,0,4]);
        var s44 = new M44([1,2,3,4, 5,6,7,8, 9,10,11,12, 13,14,15,16]);
        test('Should create M44 from array', context => context.assert(m44, ':=', arr));
        test('Should create M44 from Float32Array', context => context.assert(n44, ':=', arr));
        test('Should create M44 from Float64Array', context => context.assert(o44, ':=', arr));
        test('Should create M44 from identity', context => context.assert(p44, ':=', [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]));
        test('Should create M44 from M44', context => context.assert(q44, ':=', p44));
        test('Should transpose M44', context => context.assert(s44.transpose(), ':=', [ 1,5,9,13, 2,6,10,14, 3,7,11,15, 4,8,12,16 ]));
        test('Should multiply by identity matrix', context => context.assert(m44.mul(p44), ':=', m44));
        test('Should multiply by a matrix', context => context.assert(m44.mul(r44), ':=', [1,4,9,16, 2,8,18,32, 3,12,27,48, 4,16,36,64]));
        test('Should multiply by a matrix', context => context.assert(r44.mul(m44), ':=', [1,2,3,4, 4,8,12,16, 9,18,27,36, 16,32,48,64]));
        test('Should multiply by a vector', context => context.assert(n44.mulV(new V4(1, 2, 3, 4)), ':=', [1+4+9+16, 2+8+18+32, 3+12+27+48, 4+16+36+64]));
        var buffer = new Float32Array(16);
        test('Should multiply by a matrix into a buffer', context => {
            m44.mul(n44, buffer);
            context.assert(buffer, ':=', [
                1+ 4+ 9+16,  2+ 8+18+32,  3+12+ 27+ 48,  4+16+ 36+ 64,
                2+ 8+18+32,  4+16+36+64,  6+24+ 54+ 96,  8+32+ 72+128,
                3+12+27+48,  6+24+54+96,  9+36+ 81+144, 12+48+108+192,
                4+16+36+64, 8+32+72+128, 12+48+108+192, 16+64+144+256
            ]);
        });
    }

    async function test_performance() {
        header('Test performance of matrix calculations', 1);
        var m44 = new M44();
        var n44 = new M44();
        for (var i=0; i<16; i++) {
            m44[i] = Math.random();
            n44[i] = Math.random();
        }
        await measure('Matrix multiplication', () => m44.mul(n44), 10000);
    }

    async function test_intersect() {
        header('Test intersecting rectangles');

        var canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 300;
        canvas.style.left = '20px'; canvas.style.top = '10px';
        canvas.style.width = '300px'; canvas.style.height = '300px';
        canvas.style.backgroundColor = '#405060'
        Dbg.con.appendChild(canvas); Dbg.prln('');
        var ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'difference';

        var r1 = [100, 100, 100, 100];
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(...r1);

        var r2 = [ 10, 10, 80, 280];
        ctx.fillStyle = '#8080f0';
        ctx.fillRect(...r2);
        var r = Fn.intersectRect(r1, r2);
        test('Rects should not intersect', ctx => ctx.assert(r, 'null'));

        r2 = [10, 10, 280, 80];
        ctx.fillStyle = '#f08080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        test('Rects should not intersect', ctx => ctx.assert(r, 'null'));

        r2 = [210, 10, 80, 280];
        ctx.fillStyle = '#80f080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        test('Rects should not intersect', ctx => ctx.assert(r, 'null'));

        r2 = [10, 210, 280, 80];
        ctx.fillStyle = '#f0f080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        test('Rects should not intersect', ctx => ctx.assert(r, 'null'));

        canvas = canvas.cloneNode();
        Dbg.con.appendChild(canvas); Dbg.prln('');
        ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = '#e0f0ff';
        ctx.fillRect(...r1);

        r2 = [10, 30, 120, 240];
        ctx.fillStyle = '#8080f0';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        var e = [100, 100, 30, 100];
        test(`Rects should intersect at [${e}]`, ctx => ctx.assert(r, ':=', e));

        r2 = [30, 10, 240, 120];
        ctx.fillStyle = '#f08080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        var e = [100, 100, 100, 30];
        test(`Rects should intersect at [${e}]`, ctx => ctx.assert(r, ':=', e));

        r2 = [170, 30, 120, 240];
        ctx.fillStyle = '#80f080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        var e = [170, 100, 30, 100];
        test(`Rects should intersect at [${e}]`, ctx => ctx.assert(r, ':=', e));

        r2 = [30, 170, 240, 120];
        ctx.fillStyle = '#f0f080';
        ctx.fillRect(...r2);
        r = Fn.intersectRect(r1, r2);
        var e = [100, 170, 100, 30];
        test(`Rects should intersect at [${e}]`, ctx => ctx.assert(r, ':=', e));

        
    }

    var tests = () => [
        test_v2, test_v3, test_v4,
        test_m33,
        test_m44,
        test_performance,
        test_intersect
    ];

    publish(tests, 'Math tests');
})();