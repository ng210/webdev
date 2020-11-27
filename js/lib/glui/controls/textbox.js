include('value-control.js');
include('renderer2d.js');

(function() {
    function TextboxRenderer2d() {
        TextboxRenderer2d.base.constructor.call(this);
        this.cursorColor = this.color;
        this.box = [0, 0, 0, 0];
    }
    extend(glui.Renderer2d, TextboxRenderer2d);

    TextboxRenderer2d.prototype.initialize = function initialize(control, context) {
        control.style.backgroundColor = control.style.backgroundColor || [255, 255, 255];
        TextboxRenderer2d.base.initialize.call(this, control, context);
    };   

    TextboxRenderer2d.prototype.renderCursor = function renderCursor(lines, boxes) {
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
            this.drawRect(x, y, 2, this.font.size, this.color);
        }
    };
    TextboxRenderer2d.prototype.renderTextbox = function renderTextbox() {
        var lines = this.control.getLines();
        var boxes = this.getTextBoundingBoxes(lines);
        var color = !this.control.isBlank ? this.color : this.mixColors(this.color, this.backgroundColor, 0.5);
        if (lines.length > 0) {
            for (var i=0; i<lines.length; i++) {
                this.drawText(lines[i], boxes[i][0], boxes[i][1], boxes[i][2], color);
            }
        }

        this.renderCursor(lines, boxes);
    };
    TextboxRenderer2d.prototype.renderPotmeter = function renderPotmeter() {
        var bgColor = this.backgroundColor || [0, 0, 0];
        var fillColor = this.mixColors(this.color, bgColor, 0.5);
        var bw = this.border.width;
        var width = (this.control.value - this.control.min)*(this.control.width - 2*bw)/(this.control.max - this.control.min);
        this.drawRect(0, 0, width, this.control.height, fillColor);
        var lines = this.control.getLines();
        var line = lines[0];
        var boxes = this.getTextBoundingBoxes(lines);
        var box = boxes[0];
        var color = !this.control.isBlank ? this.color : this.mixColors(this.color, bgColor, 0.5);
        this.drawText(line, box[0], box[1], box[2], color);
        this.renderCursor(lines, boxes);
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
        var lines = this.control.getLines();
        var boxes = this.getTextBoundingBoxes(lines);
        var cx = x - this.control.left;
        var cy = y - this.control.top;
    };

    function Textbox(id, template, parent, context) {
        this.lines = [];
        Textbox.base.constructor.call(this, id, template, parent, context);
        this.cursorPos = [0, 0];
        this.isFocused = false;
        //this.renderer3d = new TextboxRenderer3d()
    }
    extend(glui.ValueControl, Textbox);

    Textbox.prototype.getTemplate = function getTemplate() {
        var template = Textbox.base.getTemplate.call(this);
        template.value = '';
        template.look = Textbox.Look.Textbox;
        template.isMultiline = true;
        return template;
    };

    Textbox.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Textbox.base.applyTemplate.call(this, tmpl);
        if (template.normalize) {
            this.normalize();
        }
        this.isMultiline = template.isMultiline;
        this.look = template.look;
        return template;
    };

    Textbox.prototype.advanceValue = function advanceValue(n) {
        var delta = n*this.step;
        var oldValue = this.value;  //getValue();
        var value = oldValue + delta;
        // validate and adjust value
        oldValue = this.setValue(value);
        if (value != oldValue) {
            this.callHandler('change', {'type':'change','oldValue': oldValue, 'value':value, 'control':this});
        }
    }
    Textbox.prototype.setValue = function setValue(value) {
        var results = this.validate('value', value);
        if (results.length > 0) {
            value = results[0].value;
        }
        var oldValue = Textbox.base.setValue.call(this, value);
        var v = !this.isNumeric ? value.toString() : value.toFixed(this.decimalDigits);
        if (v != undefined && v != null && v != '') {
            this.lines = v.split('\\n');
        } else {
            this.lines = [];
            v = '';
        }
        return oldValue;
    };
    Textbox.prototype.isEmpty = function isEmpty() {
        return this.lines.length == 0;
    };
    Textbox.prototype.getLines = function getLines() {
        var lines = this.lines;
        if (this.isEmpty()) {
            lines = this.isFocused ? [''] : [this.blankValue];
        }
        return lines;
    };
    Textbox.prototype.getHandlers = function getHandlers() {
        var handlers = Textbox.base.getHandlers.call(this);
        handlers.push(
            { name: 'mousedown', topDown: true },
            { name: 'mouseup', topDown: false },
            { name: 'keydown', topDown: true },
            { name: 'keyup', topDown: false },
            { name: 'dragging', topDown: false }
        );
        return handlers;
    };
    Textbox.prototype.onfocus = function onfocus() {
        //Textbox.base.onmouseover.call(this);
        // set cursor
        this.cursorAnimation = glui.addAnimation(this.renderer.animateCursor, this.renderer, 500);
        this.isFocused = true;
    };
    Textbox.prototype.onblur = function onblur(e) {
        Textbox.base.onblur.call(this, e);
        // if (glui.Control.atCursor != this) {
        //     e.control = this;
        //     Textbox.base.onmouseout.call(this, e);
        // }
        // remove cursor
        glui.removeAnimation(this.cursorAnimation);
        this.renderer.cursorVisible = false;
        this.isFocused = false;
        // save value into datasource
        var value = this.isNumeric ? parseFloat(this.lines[0]) : this.lines.join('\n');
        //var oldValue = Textbox.base.setValue.call(this, value)
        // todo: allow empty?
        var oldValue = this.setValue(value);
        if (this.value === '') {
            if (this.lines.length > 0) this.lines.splice(0, this.lines.length);
        }
        this.render();
        if (this.value != oldValue) {
            this.callHandler('change', {'type':'change','oldValue': oldValue, 'value':value, 'control':this});
        }
        //return true;
    };
    Textbox.prototype.ondragging = function ondragging(e) {
        if (this.isNumeric && this.look == glui.Textbox.Look.Potmeter) {
            var delta = this.step * e.deltaX;
            var oldValue = this.value;
            var value = oldValue + delta;
            // validate and adjust value
            this.setValue(value);
            this.callHandler('change', {'type':'change','oldValue': oldValue, 'value':value, 'control':this});
        }
    };

    var _separators = [' ', ',', ';', ':', '-', '_', '!', '?', '.', '\0', '#'];
    function skipCharacters(line, cursor, toLeft) {
        if (toLeft) {
            if (cursor > 0) {
                var i = cursor-1;
                var char = line.charAt(i);
                var skipSeparators = _separators.includes(char);
                var delta = -1;
                while (true) {
                    var char = line.charAt(i);
                    var includes = _separators.includes(char);
                    if (skipSeparators && !includes || !skipSeparators && includes) {
                        i -= delta;
                        break;
                    }
                    i += delta;
                    if (i == -1) {
                        i = 0;
                        break;
                    }
                }
            }
        } else {
            if (cursor < line.length) {
                var i = cursor;
                var char = line.charAt(i);
                var skipSeparators = _separators.includes(char);
                var delta = 1;
                while (true) {
                    var char = line.charAt(i);
                    var includes = _separators.includes(char);
                    if (skipSeparators && !includes || !skipSeparators && includes) {
                        //i -= delta;
                        break;
                    }
                    i += delta;
                    if (i == line.length) {
                        break;
                    }
                }
            }
        }
        return i;
    }
    Textbox.prototype.onkeydown = function onkeydown(e) {
        var char = e.which;
        var col = this.cursorPos[0];
        var row = this.cursorPos[1];
        var isChanged = false;
        // control characters
        switch (char) {
            case 13:    // ENTER
                if (!this.isNumeric) {
                    if (this.isMultiline) {
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
                        isChanged = true;
                    } else {
                        this.setValue(this.lines[0]);
                        this.callHandler('change', {'type':'change','oldValue': oldValue, 'value':value, 'control':this});
                    }
                    this.cursorPos[0] = 0;
                } else {
                    var oldValue = this.getValue();
                    var value = parseFloat(this.lines[0]);
                    // validate and adjust value
                    this.setValue(value);
                    this.callHandler('change', {'type':'change','oldValue': oldValue, 'value':value, 'control':this});
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
            case 33:    // PGUP
                if (!this.isNumeric) {
                } else {
                    this.advanceValue(5);
                }
                break;
            case 34:    // PGDN
                if (!this.isNumeric) {
                } else {
                    this.advanceValue(-5);
                }
                break;
            case 35:    // END
                this.cursorPos[0] = this.lines[row].length;
                if (e.ctrlKey) {
                    this.cursorPos[1] = this.lines.length-1;
                }
                isChanged = true;
                break;
            case 36:    // HOME
                this.cursorPos[0] = 0;
                if (e.ctrlKey) {
                    this.cursorPos[1] = 0;
                }
                isChanged = true;
                break;
            case 37:    // ARROW LEFT
                if (col > 0) {
                    if (!e.ctrlKey) {
                        this.cursorPos[0]--;
                    } else {
                        this.cursorPos[0] = skipCharacters(this.lines[this.cursorPos[1]], this.cursorPos[0], true);
                    }
                } else if (row > 0) {
                    this.cursorPos[0] = this.lines[row-1].length;
                    this.cursorPos[1]--;
                }
                isChanged = true;
                break;
            case 38:    // ARROW UP
                if (!this.isNumeric) {
                    if (row > 0) {
                        this.cursorPos[1]--;
                        if (this.lines[row-1].length < this.cursorPos[0]) {
                            this.cursorPos[0] = this.lines[row-1].length;
                        }
                    }
                    isChanged = true;
                } else {
                    this.advanceValue(1);
                }
                break;
            case 39:    // ARROW RIGHT
                if (col < this.lines[row].length) {
                    if (!e.ctrlKey) {
                        this.cursorPos[0]++;
                    } else {
                        this.cursorPos[0] = skipCharacters(this.lines[this.cursorPos[1]], this.cursorPos[0], false);
                    }
                } else if (row < this.lines.length-1) {
                    this.cursorPos[0] = 0;
                    this.cursorPos[1]++;
                }
                isChanged = true;
                break;
            case 40:    // ARROW DOWN
                if (!this.isNumeric) {
                    if (row < this.lines.length-1) {
                        this.cursorPos[1]++;
                        if (col > this.lines[row+1].length) {
                            this.cursorPos[0] = this.lines[row+1].length;
                        }
                    }
                    isChanged = true;
                } else {
                    this.advanceValue(-1);
                }
                break;
            case 46:    // DELETE
                var line = this.lines[row];
                if (col < line.length) this.lines[row] = line.substr(0, col) + line.substr(col+1);
                else if (this.lines.length-1 > row) {
                    this.lines[row] += this.lines[row+1];
                    this.lines.splice(row+1, 1);
                }
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
            this.render();
        }
    };
    Textbox.prototype.onmouseup = function onmouseup(e) {
        // get cursor position
        this.isFocused = true;
        this.render();
    };
    Textbox.prototype.createRenderer = mode => mode == glui.Render2d ? new TextboxRenderer2d() : 'TextboxRenderer3d';
    Textbox.prototype.setRenderer = async function(mode, context) {
        await Textbox.base.setRenderer.call(this, mode, context);
        this.setLook();
    };
    Textbox.prototype.setLook = function setLook(look) {
        look = look || this.look;
        switch (look) {
            case Textbox.Look.Potmeter:
                this.isNumeric = true;
                this.renderer.renderControl = TextboxRenderer2d.prototype.renderPotmeter;
                break;
            default:
                console.warn(`Invalid look '${look}' for textbox '${this.id}'!`);
            case Textbox.Look.Textbox:
                this.renderer.renderControl = TextboxRenderer2d.prototype.renderTextbox;
                break;
        }
    };

    Textbox.Look = {
        Textbox: 'textbox',
        Potmeter: 'potmeter'
    };

    publish(Textbox, 'Textbox', glui);
    publish(TextboxRenderer2d, 'TextboxRenderer2d', glui);
})();