include('/ui/board.js');

// unstructured container of controls
(function() {
	function Panel(id, template, parent) {
        Ui.Container.call(this, id, template, parent);
        this.container = new Ui.Board(`${this.id}#container`, {titlebar:false, css:'content'}, this);
        if (this.template.items) {
            for (var key in this.template.items) {
				if (this.template.items.hasOwnProperty(key)) {
                    this.container.addNew(this.id + '#' + (this.template.items[key].id || key), this.template.items[key]);
					// var itemId = this.template.items[key].id || key;	//('00'+i).slice(-3);
					// this.items[key] = Ui.Control.create(`${id}_${itemId}`, this.template.items[key], this.container);
				}
            }
        }	
        this.layout = this.template.layout;
        this.split = this.template.split;
	};
	extend(Ui.Board, Panel);

	Ui.Control.Types['panel'] = { ctor: Panel, tag: 'DIV' };
	Panel.prototype.getTemplate = function() {
		var template = Panel.base.getTemplate.call(this);
        template.type = 'panel';
        template.layout = Panel.Layout.horizontal;
        template.split = [];
		return template;
    };
	Panel.prototype.render = function(ctx) {
        if (!this.css.includes('panel') && !(this.parent instanceof Ui.Panel)) {
            this.css.push('panel');
        }
        Ui.Panel.base.render.call(this, ctx);
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';

        var context = ctx ? Object.create(ctx) : {};
        context.element = this.element;
        Ui.Board.base.render.call(this.container, context);
        this.container.element.style.display = 'flex';
        this.container.element.style.alignItems = 'stretch';
        this.container.element.style.height = '100%';
        this.container.element.style.flexDirection = this.layout == Panel.Layout.horizontal ? 'row' : 'column';

        context.element = this.container.element;
        var keys = Object.keys(this.container.items);
		for (var ix=0; ix<keys.length; ix++) {
            var key = keys[ix];
			var item = this.container.items[key];
            item.render(context);
            var size = this.split[ix];
            size = size < 1 ? Math.floor(100*size) : size
            item.element.style[this.layout == Panel.Layout.horizontal ? 'width' : 'height'] = size + '%';
            if (ix < keys.length-1) {
                var handler = new Ui.Label(`${this.id}#handler${ix}`, { css:'handler', value:'', events:['dragging'] }, this.container);
                handler.panel = this;
                handler.render(context);
                // var handler = document.createElement('div');
                // handler.id = `${this.id}#handler${ix}`;
                // handler.className = this.cssText + 'handler';
                //Ui.Control.addHandler();
                if (this.layout == Panel.Layout.horizontal) {
                    //handler.style.height = '100vh';
                    handler.element.style.width = '4px';
                } else {
                    //handler.style.width = '100vw';
                    handler.element.style.height = '4px';
                }
                //this.container.appendChild(handler);
            }
		}
    };
    
    Panel.prototype.ondragging = function(e) {
        console.log([e.clientX, e.clientY, e.deltaX, e.deltaY]);
        var handler = e.control.element;
        var panel = e.control.panel;
        if (panel.layout == Panel.Layout.horizontal) {
            var left = handler.previousSibling;
            var right = handler.nextSibling;
            left.style.width = Math.floor(left.offsetWidth + e.deltaX) + 'px';
            right.style.width = Math.floor(right.offsetWidth - e.deltaX) + 'px';
            handler.style.left = Math.floor(handler.offsetLeft + e.deltaX) + 'px';
        } else {
            var top = handler.previousSibling;
            var bottom = handler.nextSibling;
            top.style.height = Math.floor(top.offsetHeight + e.deltaY) + 'px';
            bottom.style.height = Math.floor(bottom.offsetHeight - e.deltaY) + 'px';
            handler.style.top = Math.floor(handler.offsetLeft + e.deltaY) + 'px';
        }
    }
    
    Panel.Layout = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    };

	Ui.Panel = Panel;
})();