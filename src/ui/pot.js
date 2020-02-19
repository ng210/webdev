include('/ui/valuecontrol.js');

(function() {
    var _supportedEvents = ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'dragging'];

    Ui.Pot = function(id, tmpl, parent) {
        Ui.ValueControl.call(this, id, tmpl, parent);
        this.scale = 1.0;
        this.offset = 0.0;
        this.registerHandler('dragging');
    };
    extend(Ui.ValueControl, Ui.Pot);

    Ui.Control.Types['pot'] = { ctor: Ui.Pot, tag: 'DIV' };

    Ui.Pot.prototype.getTemplate = function() {
        var template = Ui.Pot.base.getTemplate();
        template.numeric = true;
        template.type = 'pot';
        return template;
    };
    Ui.Pot.prototype.registerHandler = function(event) {
        if (_supportedEvents.indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
        Ui.Control.registerHandler.call(this, event);
    };
    Ui.Pot.prototype.dataBind = function(dataSource, dataField) {
        this.dataSource = dataSource;
        this.dataField = dataField;
        var scale = (dataSource.max - dataSource.min)/(this.max - this.min);
        if (scale) this.scale = scale;
        this.offset = dataSource.min || 0;
        // if (typeof dataSource.min === 'number') this.min = dataSource.min;
        // if (typeof dataSource.max === 'number') this.max = dataSource.max;
        // if (typeof dataSource.step === 'number') this.step = dataSource.step;
        return this.dataSource;
    };
    // Ui.Pot.prototype.render = function(ctx) {
    //     Ui.Pot.base.render.call(this, ctx);
    // };

    Ui.Pot.prototype.setValue = function(value) {
        if (value < this.min) value = this.min;
        if (value > this.max) value = this.max;
        this.value = value;
        this.element.innerHTML = value;
        value = this.offset + this.value * this.scale;
        if (this.dataType == Ui.Control.DataTypes.Int) {
            value = Math.floor(value);
        }
        this.dataSource[this.dataField] = Math.floor(1000*value)/1000;
    };
    Ui.Pot.prototype.ondragging = function(e) {
        var value = Math.floor(this.getValue() + -e.deltaY);
        this.setValue(value);
        return false;
    };
    Ui.Pot.prototype.onkeyup = function(e) {
        console.log(e.type);
    };

})();