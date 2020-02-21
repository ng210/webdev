include('/ui/board.js');

(function() {
    var _supportedEvents = ['mousedown', 'mouseup', 'keydown', 'keyup', 'mouseover', 'mouseout', 'change'];

    function Select(id, tmpl, parent) {
        Ui.Board.call(this, id, tmpl, parent);
        var template = {
            titlebar: this.template.titlebar
        };
        this.options = new Ui.Board(`${id}#options`, template, this);
        this.isFlag = this.template.flag;
        this.registerHandler('change');
    };
    extend(Ui.ValueControl, Select);

    Ui.Control.Types['select'] = { ctor: Select, tag: 'DIV' };

    Select.prototype.getTemplate = function() {
        var template = Select.base.getTemplate();
        template.titlebar = false;
        template.flag = false;
        template.type = 'select';
        return template;
    };
    Select.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };

    Select.prototype.addOption = function(ctrl, key) {
        ctrl.css.push('option');
        this.options.add(ctrl, key);
        ctrl.registerHandler('click');
    };
    Select.prototype.add = undefined;

    Select.prototype.render = function(ctx) {
        Select.base.render.call(this, ctx);
        this.options.render(ctx);
    };

    Select.prototype.onclick = function(e) {
        var value = e.control.getValue();
        if (this.isFlag) {
            var oldValue = this.dataSource[this.dataField];
            var isSet = (oldValue & value) != 0;
            if (isSet) {
                value = oldValue & ~value;
                e.control.element.style.opacity = '0.4';
            } else {
                value = oldValue | value;
                e.control.element.style.opacity = '0.1';
            }
        }
        this.setValue(value);
    };

    // Select.prototype.setValue = function(value) {
    //     this.value = value;
    //     this.element.dispatchEvent(new CustomEvent('change'));
    // };

    // Select.prototype.getValue = function() {
    //     return this.value;
    // };

    Ui.Select = Select;
})();