include('control.js');
include('renderer2d.js');

(function() {
    function GridRenderer2d(control, context) {
        GridRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, GridRenderer2d);

    GridRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        var ctx = this.context;
        var x0 = ctrl.scrollLeft;
        var y0 = ctrl.scrollTop;
        var bw = this.border.width;
        var width = ctrl.width - 2*bw, height = ctrl.height - 2*bw;
        var stepX = ctrl.stepX;
        var stepX2 = ctrl.stepX2;
        var stepY = ctrl.stepY;
        var stepY2 = ctrl.stepY2;

        // draw grid
        ctx.globalAlpha = 1.0;
        var c1 = this.toCssColor(this.calculateColor(this.backgroundColor, 1.5));
        var c2 = this.toCssColor(this.calculateColor(this.backgroundColor, 2.25));
        var c3 = this.toCssColor(this.calculateColor(this.backgroundColor, 5.0));
        if (stepY) {
            var y = -stepY - (y0 % stepY);
            for (; y<height; y+=stepY) {
                var dy = y + y0;
                ctx.strokeStyle = dy != 0 ? (dy % stepY2 ? c1 : c2) : c3;
                ctx.beginPath();
                ctx.moveTo(0, height-y); ctx.lineTo(width, height-y);
                ctx.stroke();
            }
        }
        if (stepX) {
            var x = x0 % stepX;
            for (; x<width; x+=stepX) {
                var dx = x - x0;
                ctx.strokeStyle = dx != 0 ? (dx % stepX2 ? c1 : c2) : c3;
                ctx.beginPath();
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
                ctx.stroke();
            }
        }

        // draw cursor
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.strokeStyle = this.toCssColor(this.calculateColor(this.backgroundColor, 2.0));;
        ctx.moveTo(ctrl.cursor[0], 0); ctx.lineTo(ctrl.cursor[0], height);
        ctx.moveTo(0, ctrl.cursor[1]); ctx.lineTo(width, ctrl.cursor[1]);
        ctx.stroke();

        // draw lines
        ctx.globalAlpha = 0.5;
        var color =this.toCssColor(this.color);
        ctx.strokeStyle = color;
        var p = ctrl.points[0];
        ctx.moveTo(x0+stepX*p.x, height + y0 - stepY*p.y);
        for (var i=1; i<ctrl.points.length; i++) {
            p = ctrl.points[i];
            ctx.lineTo(x0+stepX*p.x, height + y0 - stepY*p.y);
        }
        ctx.stroke();

        // draw points
        ctx.globalAlpha = 0.8;
        c1 = this.toCssColor(this.color);
        c2 = this.toCssColor(this.calculateColor(this.color, 1.4));
        var c3 = this.toCssColor(this.calculateColor(this.color, 1.8));
        var size = 0.4*Math.min(stepX, stepY);
        for (var i=0; i<ctrl.points.length; i++) {
            p = ctrl.points[i];
            ctx.fillStyle = i != ctrl.selected ? (i != ctrl.current ? c1 : c2) : c3;
            ctx.fillRect(x0+stepX*p.x - size, height + y0 - stepY*p.y - size, 2*size, 2*size);
        }
    };

    function Grid(id, template, parent, context) {
        this.cursor = [0, 0];
        this.points = [];
        this.selected = -1;
        this.selectionOffset = [];
        this.lockedDirection = 0;
        Grid.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, Grid);

    Grid.prototype.getTemplate = function getTemplate() {
        var template = Grid.base.getTemplate.call(this);
        template['unit-x'] = '10px';
        template['unit-x'] = '10px';
        template['scale-x'] = 1;
        template['scale-y'] = 1;
        template['insert-mode'] = Grid.interactionModes.FREE;
        template['drag-mode'] = Grid.interactionModes.FREE;
        template['curve-mode'] = Grid.curveModes.LINE;
        return template;
    };
    Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Grid.base.applyTemplate.call(this, tmpl);
        this.scaleX = parseFloat(template['scale-x']);
        this.scaleY = parseFloat(template['scale-y']);

        this.insertMode = 0;
        var tokens = tmpl['insert-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.interactionModes[tokens[i].toUpperCase()];
            if (v != undefined) this.insertMode |= v;
        }
        this.dragMode = 0;
        tokens = tmpl['drag-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.interactionModes[tokens[i].toUpperCase()];
            if (v != undefined) this.dragMode |= v;
        }

        this.curveMode = Grid.curveModes[tmpl['curve-mode'].toUpperCase()] || Grid.curveModes.NONE;

        if (this.dataSource && this.dataField) {
            this.dataBind();
		}
        return template;
    };
    Grid.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRenderer2d() : 'GridRenderer3d';
    Grid.prototype.setRenderer = async function(mode, context) {
        await Grid.base.setRenderer.call(this, mode, context);
        this.unitX = this.renderer.convertToPixel(this.template['unit-x']);
        this.unitY = this.renderer.convertToPixel(this.template['unit-y'], true);
        // set scale
        this.setScale();
    };
    Grid.prototype.getHandlers = function getHandlers() {
        var handlers = Grid.base.getHandlers();
        handlers.push(
            { name: 'keyup', topDown: false },
            { name: 'keydown', topDown: false },
            { name: 'mouseup', topDown: false },
            { name: 'mousedown', topDown: false },
            { name: 'dragging', topDown: false },
            { name: 'mousemove', topDown: false }
            );
        return handlers;
    };
    Grid.prototype.dataBind = function dataBind(dataSource, dataField) {
        Grid.base.dataBind.call(this, dataSource, dataField);
        // create points
        //this.points = [];
        var source = this.dataField ? this.dataSource[this.dataField] : dataSource;
        if (source && Array.isArray(source)) {
            for (var i=0; i<source.length;) {
                var point = { 'x': 0, 'y': 0, 'value': 0 };
                var entry = source[i++];
                if (entry) {
                    if (!Array.isArray(entry)) {
                        if (typeof entry === 'object') {
                            entry = Object.values(entry);
                        } else {
                            throw new Error('Data source is not valid!');
                        }
                    }
                }
                if (entry.length > 2) {
                    // - 2 dimensional array of items with x,y,value
                    point.x = entry[0];
                    point.y = entry[1];
                    point.value = entry[2];
                } else {
                    // - 1 dimensional array with x,y,value are serialized or
                    point.x = entry;
                    point.y = source[i++];
                    point.value = source[i++];
                }
                this.points.push(point);
            }
        }
    };
    Grid.prototype.getPointIndexAt = function getPointIndexAt(x, y, offset) {
        var bw = this.renderer.border.width;
        var height = this.height - 0*bw;
        var cx = x/this.stepX;
        var cy = (height - y)/this.stepY;
        var x1 = cx - 0.5, x2 = cx + 0.5;
        var y1 = cy - 0.5, y2 = cy + 0.5;
        for (var i=0; i<this.points.length; i++) {
            var px = this.points[i].x, py = this.points[i].y;
            if (px > x1 && px < x2 && py > y1 && py < y2) {
                if (offset) {
                    offset[0] = px*this.stepX - x;
                    offset[1] = height - py*this.stepY - y;
                }
                return i;
            }
        }
        return -1;
    };
    Grid.prototype.render = function render() {
        Grid.base.render.call(this);
    };
    Grid.prototype.validate = function validate(ix, p) {
        if ((this.dragMode & Grid.interactionModes["X-BOUND"]) != 0) {
            var x1 = ix > 0 ? this.points[ix-1].x : 0;
            var x2 = ix < this.points.length-1 ? this.points[ix+1].x : 0;
            if (p.x < x1) p.x = x1;
            if (p.x > x2) p.x = x2;
        }
        if ((this.dragMode & Grid.interactionModes["Y-BOUND"]) != 0) {
            var y1 = ix > 0 ? this.points[ix-1].y : 0;
            var y2 = ix < this.points.length-1 ? this.points[ix+1].y : 0;
            if (p.y < y1) p.y = y1;
            if (p.y > y2) p.y = y2;
        }
    };
    Grid.prototype.setScale = function setScale() {
        this.stepX = this.renderer.convertToPixel(this.unitX) || 0;
        this.stepX = Math.floor(this.stepX*this.scaleX);
        this.stepX2 = this.stepX*this.stepX;
        this.stepY = this.renderer.convertToPixel(this.unitY, true) || 0;
        this.stepY = Math.floor(this.stepY*this.scaleY);
        this.stepY2 = this.stepY*this.stepY;
    };

    Grid.prototype.insertPoint = function insertPoint(x, y) {
        if (this.insertMode != Grid.interactionModes.NONE) {
            var insertMode = this.insertMode;
            var insertPosition = -1;
            if ((this.insertMode & Grid.interactionModes["Y-BOUND"]) != 0) {
                insertMode -= Grid.interactionModes["Y-BOUND"];
                var pi = this.points.findIndex(p => p.y >= y);
                insertPosition = pi;
            }
            if ((this.insertMode & Grid.interactionModes["X-BOUND"]) != 0) {
                insertMode -= Grid.interactionModes["X-BOUND"];
                var pi = this.points.findIndex(p => p.x >= x);
                insertPosition = pi;
            }
            if ((this.insertMode & Grid.interactionModes.FREE) != 0) {
                insertMode -= Grid.interactionModes["FREE"];
            }
            if (insertMode != 0) {
                console.warn(`Invalid insert mode '${this.insertMode}'`);
            }
            var point = { x: x, y: y, value: 1.0 };
            insertPosition == -1 ? this.points.push(point) : this.points.splice(insertPosition, 0, point);
        }
    };

    Grid.prototype.onmousemove = function onmousemove(e) {
        this.cursor[0] = e.controlX;
        this.cursor[1] = e.controlY;
        var bw = this.renderer.border.width;
        var x = e.controlX-this.scrollLeft - bw, y = e.controlY - this.scrollTop + bw;
        var pi = this.getPointIndexAt(x, y);
        this.current = pi;
        this.render();
    };
    Grid.prototype.onmousedown = function onmousedown(e) {
        var bw = this.renderer.border.width;
        var x = e.controlX-this.scrollLeft - bw, y = e.controlY - this.scrollTop + bw;
        this.selected = this.getPointIndexAt(x, y, this.selectionOffset);
        if (this.selected == -1) {
            if (e.ctrlKey) {
                this.insertPoint(x/this.stepX, (this.height - y)/this.stepY);
            }
        } else {
            if (e.ctrlKey) {
                this.points.splice(this.selected, 1);
            };
        }
        this.render();
    };
    Grid.prototype.onmouseup = function onmouseup(e) {
        this.lockedDirection = 0;
    };
    Grid.prototype.onkeyup = function onkeyup(e) {
        if (e.keyCode == 18) {
            this.lockedDirection = 0;
        }
    };
    Grid.prototype.ondragging = function ondragging(e) {
        var bw = this.renderer.border.width;
        var x = e.controlX - this.scrollLeft - bw, y = e.controlY - this.scrollTop + bw;
        if (e.control == this && this.selected != -1 && this.dragMode != Grid.interactionModes.NONE) {
            var p = this.points[this.selected];
            var px = (x + this.selectionOffset[0])/this.stepX;
            var py = (this.height - y - this.selectionOffset[1])/this.stepY;
            if (e.ctrlKey) {
                // snap to grid
                px = Math.round(px);
                py = Math.round(py);
            }
            if (e.altKey) {
                // lock direction
                if (this.lockedDirection == 0) this.lockedDirection = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? 1 : 2;
                if (this.lockedDirection == 1) {
                    py = p.y;
                } else {
                    px = p.x;
                }
            }
            p.x = px; p.y = py;
            this.validate(this.selected, p);
            this.cursor[0] = e.controlX;
            this.cursor[1] = e.controlY;
        } else {
            if (e.shiftKey) {
                // scroll canvas
                this.scrollLeft += e.deltaX;
                this.scrollTop += e.deltaY;
            } else if (e.altKey) {
                if (e.deltaX < 0 && this.scaleX > 0.6 || e.deltaX > 0 && this.scaleX < 4.0) {
                    var dx = 0.005*e.deltaX;
                    this.scaleX += dx;
                }
                if (e.deltaY > 0 && this.scaleY > 0.6 || e.deltaY < 0 && this.scaleY < 4.0) {
                    var dy = 0.005*e.deltaY;
                    this.scaleY -= dy;
                }
                this.setScale();
            }
        }
        // update cursor, trigger rendering like on mouse move
        this.onmousemove(e);
    };

    Grid.interactionModes = {
        'NONE': 0,
        'FREE': 1,
        'X-BOUND': 2,
        'Y-BOUND': 4
    };
    Grid.curveModes = {
        'NONE': 0,
        'LINE': 1
    };

    publish(Grid, 'Grid', glui);
    publish(GridRenderer2d, 'GridRenderer2d', glui);
})();
