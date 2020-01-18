include('/ui/multichart.js');
include('/synth/ui/notechart.js');
include('/ui/multichart/testdataseries.js');

(function() {

    var ctrls_ = [];
    var isDone_ = false;
    var pollTimer_ = null;

    function compare(a1, a2) {
        var a = a1, b = a2;
        if (a1.length < a2.length) { a = a2; b = a1; }
        for (var i=0; i<a.length; i++) {
            if (a[i] != b[i]) return i+1;
        }
        return 0;
    }

    function test_dataSeries(ds) {
        var errors = [];

        var contents = [];
        for (var i=0; i<ds.data.length; i++) {
            var point = ds.getAsPoint(i);
            contents.push(`(${i},${point.y != undefined ? point.y : '?'})`);
        }
        Dbg.prln('Input series: ' + contents.join(','));

        Dbg.prln(' - Each');
        var indices = ds.query(q => { q.continue = true; return q.this.getAsPoint(q.ix).y != undefined; });
        var expected = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];
        if (compare(indices, expected)) {
            errors.push(`Each: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - FindFirst');
        indices = ds.query(q => !(q.continue = q.this.getAsPoint(q.ix).y != 25));
        expected = [10];
        if (compare(indices, expected)) {
            errors.push(`FindFirst: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - FindAll');
        indices = ds.query(q => { q.continue = true; return q.this.getAsPoint(q.ix).y % 2; });
        expected = [2, 6, 10, 14, 18];
        if (compare(indices, expected)) {
            errors.push(`FindAll: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - InRange');
        indices = ds.query(q => { q.continue = q.ix < 10; return q.ix >= 4 && q.this.getAsPoint(q.ix).y != undefined; });
        expected = [4, 6, 8, 10];
        if (compare(indices, expected)) {
            errors.push(`InRange: Expected ${expected} but received ${indices}!`);
        }

        Dbg.prln(' - getInfo');
        var info = ds.getInfo();
        Dbg.prln(JSON.stringify(info));
        if (info.min.x != 0 || info.min.y != 0 || info.max.x != 18 || info.max.y != 45) {
            errors.push(`getInfo: Expected {min:{x:0, y:0}, max:{x:18, y:45}} but received ${JSON.stringify(info)}!`);
        }

        Dbg.prln(' - contains');
        if (!ds.contains(8, 20)) {
            errors.push(`contains: Expected to return true!`);
        }

        return errors.length > 0 ? errors.join('\n') : 'Tests successful!';   
    }
    function test_simpleDataSeries() {
        Dbg.prln('Test simple DataSeries');
        var arr = [];
        for (var i=0; i<10; i++) {
            arr.push(5*i, undefined);
        }
        var ds = new IDataSeries(arr);
        return test_dataSeries(ds);
    }
    function test_complexDataSeries() {
        Dbg.prln('Test complex DataSeries');
        var ds = new TestDataSeries.ComplexSeries();
        var v = 0;
        for (var i=0; i<20; i+=2) {
            ds.data.push(new TestDataSeries.TestData(i, v), new TestDataSeries.TestData(i+1, undefined));
            v += 5;
        }
        return test_dataSeries(ds);
    }

    var MultiDataSeries = {
        'ints': (function() {
            var arr = [];
            for (var i=0; i<20; i++) {
                arr.push(2*i, undefined);
            }
            return  new IDataSeries(arr);
        })(),
        'floats': (function() {
            var ds = new TestDataSeries.ComplexSeries();
            for (var i=0; i<20; i++) {
                ds.data.push(new TestDataSeries.TestData(i, Math.floor(i*i)/10));
            }
            return  ds;
        })(),
        'notes': (function() {
            var ds = new TestDataSeries.ComplexSeries();
            var n = 12;
            for (var i=0; i<24; i+=2) {
                ds.data.push(new TestDataSeries.TestNote(i, i, 1));
                if (i%2) n++;
            }
            return  ds;
        })(),
    };

    async function test_multichart() {
        var template = {
            'width': 720,
            'height': 360,
            'grid-color': [0.2, 0.4, 0.6],
            'unit': [12, 8],
            'titlebar': 'Test1',
            'render-mode': 'area',
            'line-width': 0.1
        };
        var multiChart = new Ui.MultiChart('test1', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('floats');
        multiChart.template.width = 960;
        multiChart.setMode('line');
        ctrls_.push(multiChart);

        template = {
            'titlebar': 'Test2',
            'height': 240
        };
        multiChart = new Ui.MultiChart('test2', template, null);
        multiChart.dataBind(MultiDataSeries);
        multiChart.selectChannel('ints');
        ctrls_.push(multiChart);
        //multiChart.onclick = function(ctrl) { ctrl.isRunning = false; isDone_ = true; };

        config = {
            'titlebar': 'Test3',
            'height': 240
        };
        // multiChart = new Ui.MultiChart('test3', config, null);
        // multiChart.dataBind(dataSeries);
        // multiChart.selectedChannelId = 'notes';
        // ctrls_.push(multiChart);

        for (var i=0; i<ctrls_.length; i++) {
            await ctrls_[i].render({'element': document.body});
        }
        ctrls_[0].scroll(30, 0);
        return new Promise(resolve => poll(resolve) );
    }

    function poll(resolve) {
        clearTimeout(pollTimer_);
        if (!isDone_) {
            //ctrls_[1].scroll(0.1, 0);
            pollTimer_ = setTimeout(poll, 250, resolve);
        } else {
            resolve();
        }
    }

    var tests = async function() {
        Dbg.prln(test_simpleDataSeries());
        Dbg.prln(test_complexDataSeries());
        await test_multichart();
        return 0;
    };
    public(tests, 'UI tests');
})();