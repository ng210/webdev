(function(){

    async function test_load() {
        message('Test load', 1);
        var res = await load('./test-file.json');
        test('Should load test-file at relative path sync', ctx => {
            ctx.assert(res, '!null');
            ctx.assert(res.error, 'null');
        });
        res = load('./test-file.json');
        test('Should load test-file at relative path async', async function(ctx) {
            res.then(r => {
                ctx.assert(r, '!null');
                ctx.assert(r.error, 'null');
             });
        });
        res = await load('http://localhost:3000/js/lib/base/test-file.json');
        test('Should load from full URL', ctx => {
            ctx.assert(res, '!null');
            ctx.assert(res.error, 'null');
        });

        res = await load('dummy.txt');
        test('Should give error for relative path', ctx => {
            ctx.assert(res.error, '!null');
            ctx.assert(res.error.message, '!null');
        });
        res = await load('http://localhost:4000/test-file.json');
        test('Should give error for full URL', ctx => {
            ctx.assert(res.error, '!null');
            ctx.assert(res.error.message, '!null');
        });
    }

    function createRandomArray(size) {
        var rnd = [];
        for (var i=0; i<size; i++) {
            rnd.push(i);
        }
        for (var i=0; i<size/2; i++) {
            var j = Math.floor(size*Math.random());
            var k = Math.floor(size*Math.random());
            var v = rnd[j];
            rnd[j] = rnd[k];
            rnd[k] = v;
        }
        return rnd;
    }

    function test_binSearch() {
        message('Test binary search', 1);
        var arr = new Array(100);
        for (var i=0; i<100; i++) {
            arr[i] = i;
        }
        test('Should find numbers', ctx => {
            message('Normal oder');
            var errors = [];
            for (var ix=0; ix<100; ix++) {
                if (arr.binSearch(ix) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');

            errors = [];
            message('Random order');
            var rnd = createRandomArray(100);
            for (var i=0; i<100; i++) {
                var ix = rnd[i];
                if (arr.binSearch(ix) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');
        });

        for (var i=0; i<100; i++) {
            arr[i] = { id:i };
        }
        test('Should find objects', ctx => {
            var errors = [];
            var cmp = (a,b) => a.id - b.id;
            var key = { id: 0 };
            message('Normal oder');
            for (var ix=0; ix<100; ix++) {
                key.id = ix;
                if (arr.binSearch(key, cmp) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');

            errors = [];
            message('Random order');
            var rnd = createRandomArray(100);
            for (var i=0; i<100; i++) {
                var ix = rnd[i];
                key.id = ix;
                if (arr.binSearch(key, cmp) != ix) errors.push(ix);
            }
            ctx.assert(errors, 'empty');
        });
    }

    var tests = () => [
        test_load,
        test_binSearch
    ];

    publish(tests, 'BaseTests');
})();