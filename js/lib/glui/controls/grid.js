include('control.js');
include('renderer2d.js');

(function() {
    //#region GridRenderer2d
    function GridRenderer2d(control, context) {
        GridRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.Renderer2d, GridRenderer2d);

    GridRenderer2d.prototype.renderControl = function renderControl() {
        var ctrl = this.control;
        var ctx = this.context;
        var x0 = ctrl.scrollLeft;
        var y0 = ctrl.scrollTop;
        var bw = 2*this.border.width;
        var width = ctrl.width - bw, height = ctrl.height - bw;
        var stepX = ctrl.stepX;
        var stepX2 = ctrl.stepX2;
        var stepY = ctrl.stepY;
        var stepY2 = ctrl.stepY2;

        //#region draw grid
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
        //#endregion

        // draw cursor
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        var c3 = [255-this.backgroundColor[0], 255-this.backgroundColor[1], 255-this.backgroundColor[2]];
        ctx.strokeStyle = this.toCssColor(c3);  //this.calculateColor(c3, 2.0));
        ctx.moveTo(ctrl.cursor[0], 0); ctx.lineTo(ctrl.cursor[0], height);
        ctx.moveTo(0, ctrl.cursor[1]); ctx.lineTo(width, ctrl.cursor[1]);
        ctx.stroke();

        if (ctrl.points.length) {
            // draw lines
            if (ctrl.curveMode == Grid.curveModes.LINE) {
                ctx.globalAlpha = 0.5;
                var color =this.toCssColor(this.color);
                ctx.strokeStyle = color;
                var p = ctrl.points[0];
                ctx.moveTo(x0 + stepX*p.x, height + y0 - stepY*p.y);
                for (var i=1; i<ctrl.points.length; i++) {
                    var p = ctrl.convertToXY(ctrl.points[i]);
                    ctx.lineTo(x0+p.x, height + y0 - p.y);
                }
                ctx.stroke();
            }

            // draw points
            ctx.globalAlpha = 0.8;
            c1 = this.toCssColor(this.color);
            c2 = this.toCssColor(this.calculateColor(this.color, 1.4));
            var c3 = this.toCssColor(this.calculateColor(this.color, 1.8));
            var size = 0.4*Math.min(stepX, stepY);
            for (var i=0; i<ctrl.points.length; i++) {
                var p = ctrl.convertToXY(ctrl.points[i]);
                ctx.fillStyle = i != ctrl.selected ? (i != ctrl.current ? c1 : c2) : c3;
                ctx.fillRect(x0+p.x - size, height + y0 - p.y - size, 2*size, 2*size);
            }
        }
    };
    //#endregion

    //#region Grid
    function Grid(id, template, parent, context) {
        this.cursor = [0, 0];
        this.points = [];
        this.selected = -1;
        this.selectionOffset = [];
        this.lockedDirection = 0;
        this.scaleX = 0;
        this.scaleY = 0;
        this.scaleRangeX = [0, 0];
        this.scaleRangeY = [0, 0];
        this.unitX = 1;
        this.unitY = 1;
        this.insertMode = Grid.interactionModes.FREE;
        this.dragMode = Grid.interactionModes.FREE;
        this.curveMode = Grid.curveModes.LINE;

        this.convertFromXY = function convertFromXY(x, y) { return { x: x/this.stepX, y: y/this.stepY }; };
        this.convertToXY = function convertToXY(p) { return { x: p.x*this.stepX, y: p.y*this.stepY }; };
        Grid.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Control, Grid);

    Grid.prototype.getTemplate = function getTemplate() {
        var template = Grid.base.getTemplate.call(this);
        template['unit-x'] = '10px';
        template['unit-y'] = '10px';
        template['scale-x'] = 1;
        template['scale-y'] = 1;
        template['scale-x-min'] = 0.25;
        template['scale-x-max'] = 4.0;
        template['scale-y-min'] = 0.25;
        template['scale-y-max'] = 4.0;
        template['insert-mode'] = Grid.interactionModes.FREE;
        template['drag-mode'] = Grid.interactionModes.FREE;
        template['curve-mode'] = Grid.curveModes.LINE;
        return template;
    };
    Grid.prototype.applyTemplate = function applyTemplate(tmpl) {
        if (tmpl['insert-mode']) tmpl['insert-mode'] = tmpl['insert-mode'].toUpperCase();
        if (tmpl['drag-mode']) tmpl['drag-mode'] = tmpl['drag-mode'].toUpperCase();
        if (tmpl['curve-mode']) tmpl['curve-mode'] = tmpl['curve-mode'].toUpperCase();
        var template = Grid.base.applyTemplate.call(this, tmpl);
        this.scaleX = parseFloat(template['scale-x']);
        this.scaleY = parseFloat(template['scale-y']);
        this.scaleRangeX[0] = template['scale-x-min'];
        this.scaleRangeX[1] = template['scale-x-max'];
        this.scaleRangeY[0] = template['scale-y-min'];
        this.scaleRangeY[1] = template['scale-y-max'];
        this.insertMode = 0;
        var tokens = template['insert-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.interactionModes[tokens[i]];
            if (v != undefined) this.insertMode |= v;
        }
        this.dragMode = 0;
        tokens = template['drag-mode'].split(' ');
        for (var i=0; i<tokens.length; i++) {
            var v = Grid.interactionModes[tokens[i]];
            if (v != undefined) this.dragMode |= v;
        }

        this.curveMode = Grid.curveModes[template['curve-mode']];

        // if (this.dataSource && this.dataField) {
        //     this.dataBind();
		// }
        return template;
    };
    Grid.prototype.createRenderer = mode => mode == glui.Render2d ? new GridRenderer2d() : 'GridRenderer3d';
    Grid.prototype.setRenderer = function(mode, context) {
        Grid.base.setRenderer.call(this, mode, context);
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
    Grid.prototype.getPointIndexAt = function getPointIndexAt(x, y) {
        var x1 = x - 0.5, x2 = x + 0.5;
        var y1 = y - 0.5, y2 = y + 0.5;
        for (var i=0; i<this.points.length; i++) {
            var px = this.points[i].x, py = this.points[i].y;
            if (px > x1 && px < x2 && py > y1 && py < y2) {
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
        if (this.scaleX < this.scaleRangeX[0]) this.scaleX = this.scaleRangeX[0];
        else if (this.scaleX > this.scaleRangeX[1]) this.scaleX = this.scaleRangeX[1];
        if (this.scaleY < this.scaleRangeY[0]) this.scaleY = this.scaleRangeY[0];
        else if (this.scaleY < this.scaleRangeY[0]) this.scaleY = this.scaleRangeY[0];

        var unitX = this.renderer.convertToPixel(this.unitX) || 0;
        this.stepX = Math.floor(unitX*this.scaleX);
        this.stepX2 = this.unitX*this.stepX;
        var unitY = this.renderer.convertToPixel(this.unitY) || 0;
        this.stepY = Math.floor(unitY*this.scaleY);
        this.stepY2 = this.unitY*this.stepY;

        this.minScrollLeft = -this.scrollRangeX[0]*this.stepX;
        this.maxScrollLeft = this.scrollRangeX[1]*this.stepX;
        this.minScrollTop = -this.scrollRangeY[0]*this.stepY;
        this.maxScrollTop = this.scrollRangeY[1]*this.stepY;
    };
    Grid.prototype.insertPoint = function insertPoint(x, y) {
        if (this.insertMode != Grid.interactionModes.NONE) {
            var insertMode = this.insertMode;
            var insertPosition = -1;
            if ((this.insertMode & Grid.interactionModes["Y-BOUND"]) != 0) {
                insertMode -= Grid.interactionModes["Y-BOUND"];
                insertPosition = this.points.findIndex(p => p.y >= y);
            }
            if ((this.insertMode & Grid.interactionModes["X-BOUND"]) != 0) {
                insertMode -= Grid.interactionModes["X-BOUND"];
                insertPosition = this.points.findIndex(p => p.x >= x);
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
    Grid.prototype.removePoint = function removePoint(ix) {
        this.points.splice(ix, 1);
    };
    Grid.prototype.transformXY = function transformXY(cx, cy) {
        var bw = this.renderer.border.width;
        return {
            x: cx - this.scrollLeft - bw,
            y: this.height - (cy - this.scrollTop) - bw
        };
    };
    //#region Event handlers
    Grid.prototype.onmousemove = function onmousemove(e) {
        var xy = this.transformXY(e.controlX, e.controlY);
        this.cursor[0] = e.controlX;
        this.cursor[1] = e.controlY;
        var pi = this.convertFromXY(xy.x, xy.y);
        var ix = this.getPointIndexAt(pi.x, pi.y);
        this.current = ix;
        this.render();
    };
    Grid.prototype.onmousedown = function onmousedown(e) {
        var xy = this.transformXY(e.controlX, e.controlY);
        var pi = this.convertFromXY(xy.x, xy.y);
        this.selected = this.getPointIndexAt(pi.x, pi.y);
        if (this.selected == -1) {
            if (e.ctrlKey) {
                this.insertPoint(pi.x, pi.y);
            }
        } else {
            if (e.ctrlKey) {
                this.removePoint(this.selected);
                this.selected = -1;
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
        if (e.control == this && this.selected != -1 && this.dragMode != Grid.interactionModes.NONE) {
            var p = this.points[this.selected];
            var xy = this.transformXY(e.controlX, e.controlY);
            var pi = this.convertFromXY(xy.x, xy.y);
            var px = pi.x;
            var py = pi.y;
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
                if (this.scrollLeft < this.minScrollLeft) this.scrollLeft = this.minScrollLeft;
                if (this.scrollLeft > this.maxScrollLeft) this.scrollLeft = this.maxScrollLeft;

                this.scrollTop += e.deltaY;
                if (this.scrollTop < this.minScrollTop) this.scrollTop = this.minScrollTop;
                if (this.scrollTop > this.maxScrollTop) this.scrollTop = this.maxScrollTop;
            } else if (e.altKey) {
                if (e.deltaX != 0) {
                    var dx = 0.005*e.deltaX;
                    this.scaleX += dx;
                }
                if (e.deltaY != 0) {
                    var dy = 0.005*e.deltaY;
                    this.scaleY -= dy;
                }
                this.setScale();
            }
        }
        // update cursor, trigger rendering like on mouse move
        this.onmousemove(e);
    };
    //#endregion

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
    glui.schema.addType(new EnumType('GridInteractions', null, { 'values':Object.keys(Grid.interactionModes) }));
    glui.schema.addType(new EnumType('GridCurveModes', null, { 'values':Object.keys(Grid.curveModes) }));
    //#endregion

    glui.buildType({
        'name':'Grid',
        'type':'Control',
        'attributes': {
            'scale-x':          { 'type':'int', 'isRequired':false, 'default':1 },
            'scale-y':          { 'type':'int', 'isRequired':false, 'default':1 },
            'scale-range-x':    { 'type':'float2', 'isRequired':false, 'default':[0.25, 4.0] },
            'scale-range-y':    { 'type':'float2', 'isRequired':false, 'default':[0.25, 4.0] },
            'unit-x':           { 'type':'int', 'isRequired':false, 'default':10 },
            'unit-y':           { 'type':'int', 'isRequired':false, 'default':10 },
            'insert-mode':      { 'type':'GridInteractions', 'isRequired':false, 'default':Grid.interactionModes.FREE },
            'drag-mode':        { 'type':'GridInteractions', 'isRequired':false, 'default':Grid.interactionModes.FREE },
            'curve-mode':       { 'type':'GridCurveModes', 'isRequired':false, 'default':Grid.curveModes.LINE }        
        }
    });

    publish(Grid, 'Grid', glui);
    publish(GridRenderer2d, 'GridRenderer2d', glui);
})();
