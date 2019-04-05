include('demo.js');
(function() {
    function TestUi(canvas) {
        Demo.call(this, 'Test-UI', canvas);
        this.config = {};
        this.constructor = TestUi;
    }
    TestUi.prototype = new Demo();
    TestUi.prototype.initialize = function() {
		Dbg.prln('TestUi initialize');
        var grid = this.ui.controls.persons;
		// custom init of color ddlist
        var col = grid.columns['color'];
        col.cells.forEach(ddl => ddl.setItems(this.config.colors));
	};
    TestUi.prototype.processInputs = function() { throw new Error('Not implemented'); };
    TestUi.prototype.update = function(frame) {
    };
    TestUi.prototype.render = function(frame) {
    };
    TestUi.prototype.onchange = function(ctrl) {
        TestUi.flash(ctrl, 8);
    };
    TestUi.prototype.onclick = function(ctrl) {
        TestUi.flash(ctrl, 4);
    };

    TestUi.flash = function(ctrl, count) {
        if (count > 0) {
            if (count % 2) {
                //ctrl.backgroundColor = ctrl.element.style.backgroundColor;
                ctrl.element.style.backgroundColor = 'lightblue';
            } else {
                ctrl.element.style.backgroundColor = 'black';
                //ctrl.element.style.backgroundColor = ctrl.backgroundColor;
            }
            ctrl.timer = setTimeout(TestUi.flash, 100, ctrl, count - 1);
        } else {
            clearTimeout(ctrl.timer);
        }
    };

    public(TestUi, 'TestUi');

})();