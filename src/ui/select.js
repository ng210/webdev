include('/ui/board.js');

(function() {
    var _supportedEvents = ['mousedown', 'mouseup', 'keydown', 'keyup', 'mouseover', 'mouseout', 'change'];

    Ui.Select = function(id, tmpl, parent) {
        Ui.Board.call(this, id, tmpl, parent);
        this.options = new Ui.Board(`${id}#options`, null, this);
        this.isFlag = this.template.flag;
        this.value = 0;
        this.registerHandler('change');
    };
    extend(Ui.Board, Ui.Select);

    Ui.Control.Types['select'] = { ctor: Ui.Select, tag: 'DIV' };

    Ui.Select.prototype.getTemplate = function() {
        var template = Ui.Select.base.getTemplate();
        template.flag = false;
        template.type = 'select';
        return template;
    };
    Ui.Select.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };

    Ui.Select.prototype.addOption = function(ctrl, key) {
        ctrl.css.push('option');
        Ui.Select.base.add.call(this, ctrl, key);
        ctrl.registerHandler('click');
    };
    Ui.Select.prototype.add = undefined;

    Ui.Select.prototype.render = function(ctx) {
        Ui.Select.base.render.call(this, ctx);
    };

    Ui.Select.prototype.onclick = function(e) {
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

    Ui.Select.prototype.setValue = function(value) {
        this.value = value;
        this.element.dispatchEvent(new CustomEvent('change'));
    };

    Ui.Select.prototype.getValue = function() {
        return this.value;
    };


})();