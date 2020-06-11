include('value-control.js');
include('renderer2d.js');

(function() {
    function TextboxRenderer2d(control, context) {
        control.style.backgroundColor = control.style.backgroundColor || [255, 255, 255];
        TextboxRenderer2d.base.constructor.call(this, control, context);
        this.cursorColor = this.color;
        this.box = [0, 0, 0, 0];
    }
    extend(glui.Renderer2d, TextboxRenderer2d);

    TextboxRenderer2d.prototype.renderControl = function renderControl() {
        var lines = this.control.getLines();
        var boxes = this.getTextBoundingBoxes(lines);
        var color = this.control.isBlank ? this.color : this.mixColors(this.color, this.backgroundColor, 0.5);
        if (lines.length > 0) {
            for (var i=0; i<lines.length; i++) {
                this.drawText(lines[i], boxes[i][0], boxes[i][1], boxes[i][2], color);
            }
        }

        if (this.cursorVisible) {
            var cursor = this.control.cursorPos;
            var text = null;
            var dx = 0, y = 0;
            if (lines.length > 0) {
                var line = lines[cursor[1]];
                text = cursor[0] != -1 ? line.substr(0, cursor[0]) : line;
                dx = boxes[cursor[1]][0];
                y = boxes[cursor[1]][1];
            } else {
                text = '';
                dx = boxes[0][0];
                y = boxes[0][1];
            }
            var x = this.context.measureText(text).width + dx;
            this.drawRect(x, y, this.font.size/2, this.font.size, this.color);
        }
    };

    TextboxRenderer2d.prototype.animateCursor = function animateCursor() {
        this.cursorVisible = !this.cursorVisible;
        this.render();
    };
    TextboxRenderer2d.prototype.cursorToXY = function cursorToXY(cursor) {
        var value = this.control.getValue().toString();
        var y = cursor[1] * this.font.size;
        var x = 0;
        if (value) {
            var lines = value.split('\\n');
            var line = lines[cursor[1]];
            var text = cursor[0] != -1 ? line.substr(0, cursor[0]) : line;
            x = this.context.measureText(text).width;
        }
        return [x, y];
    };
    TextboxRenderer2d.prototype.xyToCursor = function cursorToXY(xy) {
        var cx = x - this.control.left;
        var cy = y - this.control.top;
    };

    function Textbox(id, template, parent) {
        Textbox.base.constructor.call(this, id, template, parent);
        this.cursorPos = [0, 0];
        this.isFocused = false;
        //this.renderer3d = new TextboxRenderer3d()
    }
    extend(glui.ValueControl, Textbox);

    Textbox.prototype.getTemplate = function getTemplate() {
        var template = Textbox.base.getTemplate.call(this);
        template.value = '';
        return template;
    };

    Textbox.prototype.setValue = function setValue(v) {
        //Textbox.base.setValue.call(this, v);
        //var value = this.getValue();
        if (v != undefined && v != null && v != '') {
            this.lines = v.split('\\n');
        } else {
            this.lines = [];
            v = '';
        }
        this.value = v;
    };
    Textbox.prototype.isEmpty = function isEmpty() {
        return this.lines.length == 0;
    };

    Textbox.prototype.getLines = function getLines() {
        return !this.isEmpty() ? this.lines : (this.isFocused ? [''] : [this.blankValue]);
    };

    Textbox.prototype.getHandlers = function getHandlers() {
        var handlers = Textbox.base.getHandlers.call(this);
        handlers.push('focus', 'blur', 'mousedown', 'mouseup', 'keydown', 'keyup');
        return handlers;
    };
    
    Textbox.prototype.onfocus = function onmouseover() {
        //Textbox.base.onmouseover.call(this);
        // set cursor
        this.cursorAnimation = glui.addAnimation(this.renderer.animateCursor, this.renderer, 500);
        this.isFocused = true;
    };

    Textbox.prototype.onblur = function onblur() {
        if (glui.Control.atCursor != this) {
            Textbox.base.onmouseout.call(this);
        }
        // remove cursor
        glui.removeAnimation(this.cursorAnimation);
        this.renderer.cursorVisible = false;
        this.isFocused = false;
        this.renderer.render();
        // save value into datasource
    };

    Textbox.prototype.onkeydown = function onkeydown(e) {
        var char = e.which;
        var col = this.cursorPos[0];
        var row = this.cursorPos[1];
        var isChanged = false;
        // control characters
        switch (char) {
            case 13:    // ENTER
                if (!this.isNumeric) {
                    this.cursorPos[1]++;
                    if (this.lines.length == 0) {
                        this.lines.push('');
                    }
                    if (this.cursorPos[0] < this.lines[row].length) {
                        var line = this.lines[row];
                        this.lines[row] = line.substr(0, this.cursorPos[0]);
                        this.lines.push(line.substr(this.cursorPos[0]));
                    } else {
                        this.lines.push('');
                    }
                    this.cursorPos[0] = 0;
                    isChanged = true;
                }
                break;
            case  8:    // BACKSPACE
                if (this.lines.length > 0) {
                    var line = this.lines[row];
                    if (col > 0) {
                        this.cursorPos[0]--;
                        if (col == line.length) {
                            this.lines[row] = line.substr(0, line.length-1);
                        } else {
                            this.lines[row] = line.substr(0, col-1) + line.substr(col);
                        }
                    } else {
                        if (row > 0) {
                            this.cursorPos[0] = this.lines[row-1].length;
                            this.cursorPos[1]--;
                            this.lines[row-1] += this.lines[row];
                            this.lines.splice(row, 1);
                        } else {
                            ;
                        }
                    }
                }
                isChanged = true;
                break;
            case 27:    // ESCAPE
                this.onblur();
                glui.Control.focused = null;
                break;
            case 35:    // END
                this.cursorPos[0] = this.lines[row].length;
                isChanged = true;
                break;
            case 36:    // HOME
                this.cursorPos[0] = 0;
                isChanged = true;
                break;
            case 37:    // ARROW LEFT
                if (col > 0) {
                    this.cursorPos[0]--;
                } else if (row > 0) {
                    this.cursorPos[0] = this.lines[row-1].length;
                    this.cursorPos[1]--;
                }
                isChanged = true;
                break;
            case 38:    // ARROW UP
                if (row > 0) {
                    this.cursorPos[1]--;
                    if (this.lines[row-1].length < this.cursorPos[0]) {
                        this.cursorPos[0] = this.lines[row-1].length;
                    }
                }
                isChanged = true;
                break;
            case 39:    // ARROW RIGHT
                if (col == this.lines[row].length && row < this.lines.length-1) {
                    this.cursorPos[0] = 0;
                    this.cursorPos[1]++;
                } else {
                    this.cursorPos[0]++;
                }
                isChanged = true;
                break;
            case 40:    // ARROW DOWN
                if (row < this.lines.length-1) {
                    this.cursorPos[1]++;
                    if (col > this.lines[row+1].length) {
                        this.cursorPos[0] = this.lines[row+1].length;
                    }
                }
                isChanged = true;
                break;
            case 46:    // DELETE
                var line = this.lines[row];
                if (col < line.length) this.lines[row] = line.substr(0, col) + line.substr(col+1);
                isChanged = true;
                break;
            case 220:
            case 221:
                break;
            default:
                if (char >= 32 && char <= 255) {
                    var key = e.key;
                    if (this.validateKey(key)) {
                        if (this.isNumeric) {
                            if (char == 189 && col > 0) break;
                            else if (char == 190 && this.lines.length > 0 && this.lines[row].indexOf('.') != -1) break;
                        }
                        if (this.lines.length > 0) {
                            var line = this.lines[row];
                            if (col == line.length) {
                                this.lines[row] = line + key;
                            } else {
                                this.lines[row] = line.substr(0, col) + key + line.substr(col);
                            }
                        } else {
                            this.lines.push(key);
                        }
                        isChanged = true;
                        this.cursorPos[0]++;
                    }
                }
                break;
        }
        if (isChanged) {
            this.renderer.cursorVisible = true;
            glui.resetAnimation(this.cursorAnimation);
            this.renderer.render();
        }
    };

    Textbox.prototype.onmouseup = function onmouseup(e) {
        // get cursor position
        this.isFocused = true;
        this.renderer.render();
    };

    Textbox.prototype.setRenderer = function(mode, context) {
        if (mode == glui.Render2d) {
            if (this.renderer2d == null) {
                this.renderer2d = new TextboxRenderer2d(this, context);
            }
            this.renderer = this.renderer2d;
        } else if (mode == glui.Render3d) {
            if (this.renderer3d == null) {
                this.renderer3d = new TextboxRenderer3d(this, context);
            }
            this.renderer = this.renderer3d;
        }
    };

    public(Textbox, 'Textbox', glui);
})();