include('control.js');

(function() {

    function Container(id, template, parent, context) {
        this.items = [];
        Container.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, Container);

    Container.prototype.add = function add(ctrl) {
        var ix = this.items.findIndex(x => x.zIndex < ctrl.zIndex);
        if (ix != -1) {
            this.items.splice(ix, 0, ctrl);
        } else {
            this.items.push(ctrl);
        }
        return ctrl;
    };
    Container.prototype.remove = function remove(ctrl) {
        for (var i=0; i<this.items.length; i++) {
            if (this.items[i] == control) {
                this.items.splice(i, 1);
                control.destroy();
            }
        }
    };
    Container.prototype.getControlAt = function getControlAt(cx, cy) {
        var res = null;
		for (var i=0; i<this.items.length; i++) {
			var ctrl = this.items[i];
			if (ctrl.left < cx  && cx < ctrl.left + ctrl.width && ctrl.top < cy  && cy < ctrl.top + ctrl.height) {
                res = !ctrl.items ? ctrl : ctrl.getControlAt(cx, cy);
				break;
			}
		}
		return res;
    };

    public(Container, 'Container', glui);
})();