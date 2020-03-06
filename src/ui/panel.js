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
	extend(Ui.Container, Panel);
    Ui.Control.Types['panel'] = { ctor: Panel, tag: 'DIV' };

    Object.defineProperty(Panel.prototype, 'count', { get: function() { return Object.keys(this.container.items).length; }});

	Panel.prototype.getTemplate = function() {
		var template = Panel.base.getTemplate.call(this);
        template.type = 'panel';
        template.layout = Panel.Layout.horizontal;
        template.split = [];
        template.items = {};
        template.handlerSize = 4;
        if (!template.events.includes('dblclick'))  template.events.push('dblclick');
		return template;
    };
	Panel.prototype.registerHandler = function(event) {
		if (['dblclick'].indexOf(event) == -1) throw new Error('Event \''+ event +'\' not supported!');
		Ui.Control.registerHandler.call(this, event);
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
        var container = this.container.element;
        context.element = container;
        container.style.display = 'flex';
        //this.container.element.style.alignItems = 'stretch';
        container.style.height = '100%';
        container.style.flexDirection = this.layout == Panel.Layout.horizontal ? 'row' : 'column';
        if (this.container.rebuild) {
            while (container.children.length > 0) {
                container.removeChild(container.children[0]);
            }
        }

        var restWidth = container.clientWidth;
        var restHeight = container.clientHeight;
        var restSize = 100;
        var restCount = this.container.items.length;
        for (var i=0; i<this.container.items.length; i++) {
            var lastButOneItem = i == this.container.items.length-1;
            var item = this.container.items[i];
            item.render(context);
            var size = restSize/restCount;
            //var size = this.split[i] ?? restSize/restCount;
            restSize -= size;
            if (this.layout == Panel.Layout.horizontal) {
                var width = !lastButOneItem ? Math.floor(container.clientWidth*size/100) : restWidth;
                item.element.style.width = width + 'px';
                restWidth -= width;
            } else {
                var height = !lastButOneItem ? Math.floor(container.clientHeight*size/100) : restHeight;
                item.element.style.height = height + 'px';
                restHeight -= height;
            }
            if (!lastButOneItem) {
                var handler = new Ui.Label(`${this.id}#handler`, { css:'handler', value:'', events:['dragging'] }, this.container);
                handler.panel = this;
                handler.render(context);
                handler.element.style.boxSizing = 'border-box';
                if (this.layout == Ui.Panel.Layout.horizontal) {
                    handler.element.style.width = this.template.handlerSize + 'px';
                    handler.element.style.cursor = 'col-resize';
                    restWidth -= this.template.handlerSize;
                } else {
                    handler.element.style.height = this.template.handlerSize + 'px';
                    handler.element.style.cursor = 'row-resize';
                    restHeight -= this.template.handlerSize;
                }        
            }
        }
        return;
    };

    Panel.prototype.add = function(item, beforeItem) {
        return this.container.add(item, beforeItem);
    };

    Panel.prototype.addNew = function(key, template, beforeItem) {
        return this.container.addNew(key, template, beforeItem);
    };
    
    Panel.prototype.ondragging = function(e) {
        var handler = e.control.element;
        var panel = e.control.panel;
var sizes = [];
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
sizes.push(leftWidth, rightWidth);
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
sizes.push(height, topHeight, bottomHeight, topHeight + bottomHeight, panel.element.clientHeight);
        }
console.log(sizes);
        return true;
    };

    Panel.prototype.ondblclick = function(e) {
        if (this.onSplit) {
            var newItem = this.onSplit(e.target.nextSibling.control);
            e.control.add(newItem, e.target.nextSibling.nextSibling.control);
            e.control.render();
            return true;
        }
    };
    
    Panel.Layout = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    };

	Ui.Panel = Panel;
})();