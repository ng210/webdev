include('glui/controls/grid.js');
include('synth/synth-adapter.js');

(function() {
    function ScoreRenderer2d(control, context) {
        ScoreRenderer2d.base.constructor.call(this, control, context);
    }
    extend(glui.GridRenderer2d, ScoreRenderer2d);

    ScoreRenderer2d.noteMap = [1,0,1,0,1,1,0,1,0,1,0,1,1];

    ScoreRenderer2d.prototype.renderControl = function renderControl() {
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
        var c2 = this.toCssColor(this.calculateColor(this.backgroundColor, 2.0));
        var c3 = this.toCssColor(this.calculateColor(this.backgroundColor, 2.75));
        ctx.lineWidth = 2;
        ctx.fillStyle = c1;
        if (stepY) {
            var n = Math.floor((ctrl.height + y0 - bw)/stepY);
            while (n >= 0) {
                var cy = Math.floor(height - n*stepY + y0 + 1);
                if (ScoreRenderer2d.noteMap[n % 12]) {
                    ctx.fillRect(0, cy-stepY, width, stepY);
                }
                ctx.beginPath();
                ctx.strokeStyle = c2;
                ctx.lineWidth = n % 12 ? 2 : 8;
                ctx.moveTo(0, cy); ctx.lineTo(width, cy);
                ctx.stroke();
                n--;
            }
        }
        if (stepX) {
            var x = x0 % stepX;
            for (; x<width; x+=stepX) {
                var dx = x - x0;
                ctx.beginPath();
                ctx.strokeStyle = dx != 0 ? c2 : c3;
                ctx.lineWidth = dx % stepX2 ? 2 : 4;
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
                ctx.stroke();
            }
        }

        // draw cursor/selection
        ctx.globalAlpha = 0.2;
        var bg = this.backgroundColor;
        ctx.fillStyle = this.toCssColor([255-bg[0], 255-bg[1], 255-bg[2]]);

        var x = Math.floor((ctrl.cursor[0] - x0 - bw)/stepX)*stepX + x0 + 1;
        var y = height - Math.floor((ctrl.height - (ctrl.cursor[1] - y0) - bw)/stepY)*stepY + y0 - stepY + 1;
        ctx.fillRect(x, y, stepX, stepY);

        // draw notes
        ctx.globalAlpha = 0.8;
        c1 = this.toCssColor(this.color);
        c2 = this.toCssColor(this.calculateColor(this.color, 1.4));
        c3 = this.toCssColor(this.calculateColor(this.color, 1.8));
        //var size = 0.4*Math.min(stepX, stepY);
        for (var i=0; i<ctrl.points.length; i++) {
            var p = ctrl.convertToXY(ctrl.points[i]);
            ctx.fillStyle = i != ctrl.selected ? (i != ctrl.current ? c1 : c2) : c3;
            var x = p.x + x0 + 1;
            var y = height - p.y + y0 - stepY + 1;
            ctx.fillRect(x, y, stepX-2, stepY-2);
        }
    };

    function Score(id, template, parent, context) {
        this.cursor = [0, 0];
        this.points = [];
        this.selected = -1;
        this.selectionOffset = [];
        this.lockedDirection = 0;
        glui.Grid.base.constructor.call(this, id, template, parent, context);
        this.convertFromXY = function convertFromXY(x, y) { return { x: Math.floor(x/this.stepX)*4, y: Math.floor(y/this.stepY)}; };
        this.convertToXY = function convertToXY(p) { return { x: p.x*this.stepX/4, y: p.y*this.stepY }; };
    }
    extend(glui.Grid, Score);

    Score.prototype.getTemplate = function getTemplate() {
        var template = Score.base.getTemplate.call(this);
        return template;
    };
    Score.prototype.applyTemplate = function applyTemplate(tmpl) {
        var template = Score.base.applyTemplate.call(this, tmpl);
        return template;
    };
    Score.prototype.getHandlers = function getHandlers() {
        var handlers = Score.base.getHandlers.call(this);
        handlers.push({ name: 'change', topDown: false });
        return handlers;
    };
    Score.prototype.createRenderer = mode => mode == glui.Render2d ? new ScoreRenderer2d() : 'ScoreRenderer3d';
    Score.prototype.setRenderer = async function(mode, context) {
        await Score.base.setRenderer.call(this, mode, context);
        this.minScrollLeft = 0;
        this.maxScrollLeft = 0;
        this.minScrollTop = 0;
        this.maxScrollTop = 0;
        // set scale
        this.setScale();
    };
    Score.prototype.assign = function assign(sequence) {
        this.setFromSequence(sequence);
    };
    Score.prototype.insertPoint = function insertPoint(x, y) {
        Score.base.insertPoint.call(this, x, y);
        this.callHandler('change');
    };
    Score.prototype.removePoint = function removePoint(ix) {
        Score.base.removePoint.call(this, ix);
        this.callHandler('change');
    };

    Score.prototype.getAsSequence = function getAsSequence(adapter) {
        var frames = new Array(2*16+1);
        frames[2*16] = new Ps.Frame();
        for (var i=0; i<this.points.length; i++) {
            var p = this.points[i];
            var fi = p.x/2;
            var frame = frames[fi];
            if (!frame) frame = frames[fi] = new Ps.Frame();
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, p.y, 240));

            frame = frames[fi + 1];
            if (!frame) frame = frames[fi + 1] = new Ps.Frame();
            frame.commands.push(adapter.makeCommand(psynth.SynthAdapter.SETNOTE, p.y, 0));
        }
        var last = 0;
        var finalFrames = [];
        for (var i=0; i<frames.length; i++) {
            var frame = frames[i];
            if (frame) {
                frame.delta = 2*(i - last);
                finalFrames.push(frame);
                last = i;
            }
        }
        return Ps.Sequence.fromFrames(finalFrames, adapter);
    };

    Score.prototype.setFromSequence = function setFromSequence(sequence) {
        var frames = sequence.toFrames();
        var points = [];
        var delta = 0;
        for (var i=0; i<frames.length; i++) {
            var frame = frames[i];
            delta += frame.delta;
            var cmd = frame.commands[0];
            if (cmd) {
                if (cmd.readUint8(0) != psynth.SynthAdapter.SETNOTE) throw new Error('Invalid sequence data!');
                if (cmd.readUint8(2) != 0) {
                    var note = cmd.readUint8(1);
                    points.push({x:delta, y:note});
                }
            }
        }
        this.points = points;
        this.render();
    };


    publish(Score, 'Score', glui);
})();
