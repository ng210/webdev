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
        template.handlerSize = 4;
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
        //this.container.element.style.alignItems = 'stretch';
        this.container.element.style.height = '100%';
        this.container.element.style.flexDirection = this.layout == Panel.Layout.horizontal ? 'row' : 'column';

        context.element = this.container.element;
        var keys = Object.keys(this.container.items);
        var restSize = 100;
        var restCount = keys.length;
        var restWidth = context.element.clientWidth;
        var restHeight = context.element.clientHeight;
		for (var ix=0; ix<keys.length; ix++) {
            var key = keys[ix];
			var item = this.container.items[key];
            item.render(context);
            item.element.style.boxSizing = 'border-box';
            if (ix < keys.length-1) {
                var handler = new Ui.Label(`${this.id}#handler${ix}`, { css:'handler', value:'', events:['dragging'] }, this.container);
                handler.panel = this;
                handler.render(context);
                restWidth -= this.template.handlerSize;
                restHeight -= this.template.handlerSize;
            }
            var size = this.split[ix] || restSize/restCount;
            restSize -= size;
            restCount--;
            if (this.layout == Panel.Layout.horizontal) {
                var width = (ix < keys.length - 1) ? Math.floor(context.element.clientWidth*size/100) : restWidth;
                restWidth -= width;
                item.element.style.width = width + 'px';
                item.element.style.height = '100%';
                handler.element.style.width = this.template.handlerSize+ 'px';
            } else {
                var height = (ix < keys.length - 1) ? Math.floor(context.element.clientHeight*size/100) : restHeight;
                restHeight -= height;
                item.element.style.width = '100%';
                item.element.style.height = height + 'px';
                handler.element.style.height = this.template.handlerSize+ 'px';
            }
		}
    };
    
    Panel.prototype.ondragging = function(e) {
        var handler = e.control.element;
        var panel = e.control.panel;
        if (panel.layout == Panel.Layout.horizontal) {
            var left = handler.previousSibling;
            var right = handler.nextSibling;
            var width = left.clientWidth + right.clientWidth;
            var leftWidth = Math.floor(left.clientWidth + e.deltaX);
            if (leftWidth < 0) leftWidth = 0;
            else if (leftWidth > width) leftWidth = width;
            var rightWidth = width - leftWidth;
            left.style.width = leftWidth + 'px';
            //handler.style.left = leftWidth + 'px';
            right.style.width = rightWidth + 'px';
        } else {
            var top = handler.previousSibling;
            var bottom = handler.nextSibling;
            var height = top.clientHeight + bottom.clientHeight;
            var topHeight = Math.floor(top.clientHeight + e.deltaY);
            if (topHeight < 0) topHeight = 0;
            else if (topHeight > height) topHeight = height;
            var bottomHeight = height - topHeight;
            top.style.height = topHeight + 'px';
            //handler.style.top = topHeight + 'px';
            bottom.style.height = bottomHeight + 'px';
        }
        return true;
    }
    
    Panel.Layout = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    };

	Ui.Panel = Panel;
})();