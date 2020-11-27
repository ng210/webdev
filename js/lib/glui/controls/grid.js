include('control.js');
include('renderer2d.js');

(function() {
    function GridRenderer2d(control, context) {
        GridRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, GridRenderer2d);

    GridRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        var bw = this.border.width;
        var width = ctrl.width - 2*bw, height = ctrl.height - 2*bw;
        var buffer = new glui.Buffer(width, height);
        buffer.blit(glui, ctrl.left+bw, ctrl.top+bw, width, height);
        var ctx = buffer.context;

        var stepX = this.convertToPixel(ctrl.unitX) || 0;
        var stepX2 = stepX*stepX;
        var stepY = this.convertToPixel(ctrl.unitY, true) || 0;
        var stepY2 = stepY*stepY;

        ctx.globalAlpha = 0.8;
        var c1 = this.toCssColor(this.calculateColor(this.backgroundColor, 1.2));
        var c2 = this.toCssColor(this.calculateColor(this.backgroundColor, 1.4));
        var c3 = this.toCssColor(this.calculateColor(this.backgroundColor, 1.6));
        if (stepY) {
            var iy = 0;
            for (var y=0; y<height; y += stepY) {
                ctx.strokeStyle = iy % stepY ? c1 : iy % stepY2 ? c2 : c3;
                ctx.beginPath();
                ctx.moveTo(0, height-y); ctx.lineTo(width, height-y);
                ctx.stroke();
                iy++;
            }
        }
        if (stepX) {
            var ix = 0;
            for (var x=0; x<width; x += stepX) {
                ctx.strokeStyle = ix % stepX ? c1 : ix % stepX2 ? c2 : c3;
                ctx.beginPath();
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
                ctx.stroke();
                ix++;
            }
        }
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.strokeStyle = this.toCssColor(this.calculateColor(this.backgroundColor, 2.0));
        ctx.moveTo(ctrl.cursor[0], 0); ctx.lineTo(ctrl.cursor[0], height);
        ctx.moveTo(0, ctrl.cursor[1]); ctx.lineTo(width, ctrl.cursor[1]);
        ctx.stroke();

        c1 = this.toCssColor(this.color);
        c2 = this.toCssColor(this.calculateColor(this.color, 1.4));
        c3 = this.toCssColor(this.calculateColor(this.color, 1.8));

        buffer.update(true);
        ctx.strokeStyle = c1;
        if (ctrl.curveMode == Grid.curveModes.LINE) {
            buffer.drawCurve(ctrl.points.map(p => { return {'x': stepX*p.x, 'y': stepY*p.y};}), this.color);
            //buffer.drawSegments(ctrl.points.map(p => { return {'x': stepX*p.x, 'y': stepY*p.y};}).sort((a,b) => a.x - b.x), this.color);
        }
        buffer.update();

        var dx = Math.round(stepX/2), dy = Math.round(stepX/2);
        ctx.globalAlpha = 1.0;
        for (var i=0; i<ctrl.points.length; i++) {
            ctx.fillStyle = i != ctrl.selected ? (i != ctrl.current ? c1 : c2) : c3;
            ctx.fillRect(ctrl.points[i].x*stepX-dx, height-ctrl.points[i].y*stepY-dy, stepX, stepY);
        }

        glui.renderingContext.drawImage(buffer.canvas, 0, 0);
        glui.Buffer.dispose(buffer);
    };

    function Grid(id, template, parent, context) {
        this.cursor = [0, 0];
        this.points = [];
        this.selected = -1;
        this.selectionOffset = [];
        Grid.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, Grid);

    Grid.prototype.getTemplate = function getTemplate() {
        var template = Grid.base.getTemplate.call(this);
        template['unit-x'] = '10px';
        template['unit-x'] = '10px';
        template['insert-mode'] = Grid.insertModes.FREE;
        template['drag-mode'] = Grid.insertModes.FREE;
        template['curve-mode'] = Grid.curveModes.LINE;
        return template;
    };
    Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Grid.base.applyTemplate.call(this, tmpl);
        this.unitX = tmpl['unit-x'];
        this.unitY = tmpl['unit-y'];

        this.insertMode = 0;
        var tokens = tmpl['insert-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.insertModes[tokens[i].toUpperCase()];
            if (v != undefined) this.insertMode |= v;
        }
        this.dragMode = 0;
        tokens = tmpl['drag-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.insertModes[tokens[i].toUpperCase()];
            if (v != undefined) this.dragMode |= v;
        }

        this.curveMode = Grid.curveModes[tmpl['curve-mode'].toUpperCase()] || Grid.curveModes.NONE;

        if (this.dataSource && this.dataField) {
            this.dataBind();
		}
        return template;
    };
    Grid.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRenderer2d() : 'GridRenderer3d';
    // Grid.prototype.setRenderer = async function(mode, context) {
    //     await Grid.base.setRenderer.call(this, mode, context);
    // };
    Grid.prototype.getHandlers = function getHandlers() {
        var handlers = Grid.base.getHandlers();
        handlers.push(
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
        var source = this.dataSource[this.dataField];
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
    Grid.prototype.onmousemove = function onmousemove(e) {
        this.cursor[0] = e.controlX;
        this.cursor[1] = e.controlY;
        var bw = this.renderer.border.width;
        var pi = this.getPointIndexAt(e.controlX - bw, e.controlY + bw);
        this.current = pi;
        this.render();
    };
    Grid.prototype.getPointIndexAt = function getPointIndexAt(x, y, offset) {
        var bw = this.renderer.border.width;
        var height = this.height - 0*bw;
        var cx = x/this.unitX;
        var cy = (height - y)/this.unitY;
        var x1 = cx - 0.5, x2 = cx + 0.5;
        var y1 = cy - 0.5, y2 = cy + 0.5;
        for (var i=0; i<this.points.length; i++) {
            var px = this.points[i].x, py = this.points[i].y;
            if (px > x1 && px < x2 && py > y1 && py < y2) {
                if (offset) {
                    offset[0] = px*this.unitX - x;
                    offset[1] = height - py*this.unitY - y;
                }
                return i;
            }
        }
        return -1;
    };
    Grid.prototype.onmousedown = function onmousedown(e) {
        var bw = this.renderer.border.width;
        var x = e.controlX - bw, y = e.controlY + bw;
        this.selected = this.getPointIndexAt(x, y, this.selectionOffset);
        if (e.ctrlKey) {
            this.insertPoint((e.controlX - bw)/this.unitX, (this.height - (e.controlY + bw))/this.unitY);
        }
        this.render();
    };
    Grid.prototype.ondragging = function ondragging(e) {
        var bw = this.renderer.border.width;
        if (e.control == this && this.selected != -1) {
            var p = this.points[this.selected];
            p.x = (e.controlX - bw + this.selectionOffset[0])/this.unitX;
            p.y = (this.height - (e.controlY + bw) - this.selectionOffset[1])/this.unitY;
            this.validate(this.selected, p);
            this.cursor[0] = e.controlX;
            this.cursor[1] = e.controlY;
            this.render();
        }
    };

    Grid.prototype.validate = function validate(ix, p) {
        if ((this.dragMode & Grid.insertModes["X-BOUND"]) != 0) {
            var x1 = ix > 0 ? this.points[ix-1].x : 0;
            var x2 = ix < this.points.length-1 ? this.points[ix+1].x : 0;
            if (p.x < x1) p.x = x1;
            if (p.x > x2) p.x = x2;
        }
        if ((this.dragMode & Grid.insertModes["Y-BOUND"]) != 0) {
            var y1 = ix > 0 ? this.points[ix-1].y : 0;
            var y2 = ix < this.points.length-1 ? this.points[ix+1].y : 0;
            if (p.y < y1) p.y = y1;
            if (p.y > y2) p.y = y2;
        }
    };

    Grid.prototype.insertPoint = function insertPoint(x, y) {
        if (this.insertMode != Grid.insertModes.NONE) {
            var insertMode = this.insertMode;
            var insertPosition = -1;
            if ((this.insertMode & Grid.insertModes["Y-BOUND"]) != 0) {
                insertMode -= Grid.insertModes["Y-BOUND"];
                var pi = this.points.findIndex(p => p.y >= y);
                insertPosition = pi;
            }
            if ((this.insertMode & Grid.insertModes["X-BOUND"]) != 0) {
                insertMode -= Grid.insertModes["X-BOUND"];
                var pi = this.points.findIndex(p => p.x >= x);
                insertPosition = pi;
            }
            if ((this.insertMode & Grid.insertModes.FREE) != 0) {
                insertMode -= Grid.insertModes["FREE"];
            }
            if (insertMode != 0) {
                console.warn(`Invalid insert mode '${this.insertMode}'`);
            }
            var point = { x: x, y: y, value: 1.0 };
            insertPosition == -1 ? this.points.push(point) : this.points.splice(insertPosition, 0, point);
        }
    };

    Grid.insertModes = {
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
