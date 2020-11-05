include('glui/glui-lib.js');
(function() {

    function getColor(frame) {
        var ix = frame % 768;
        var r = 255, g = 255, b = 255;
        if (ix < 128) r = 255 - ix;
        else if (ix < 256) { r = 128; g = 384 - ix; }
        else if (ix < 384) { r = 128; g = ix - 128; }
        else if (ix < 512) { r = 128; g = 255; b = 768 - ix; }
        else if (ix < 640) { r = ix - 384; g = 255; b = 128; }
        else if (ix < 768) { r = 255; g = 255; b = ix - 512; }
        return [r, g, b];
    }

    function Timestable() {
        Demo.call(this, 'Times-table', {
            count: { label: 'Count (N)', value: 200, min:10, max:5000, step: 1, type: 'int' },
            times: { label: 'Times (T)', value: 2, min:0, max:199, type: 'int' },
            radius: { label: 'Radius', value: 0.4, min:0.1, max:0.5, step: 0.01, type: 'float' },
            delta: { label: 'Delta', value: 0.01, min:0.001, max:0.1, step: 0.001, type: 'float' },
            gradient: { label: 'Gradient', value: 0.2, min:0.01, max:2.0, step: 0.01, type: 'float' },
            range: { label: 'Range', value: 0.3, min:0.01, max:1.0, step: 0.01, type: 'float' }
        });
        this.min = 0;
        this.cx = 0;
        this.cy = 0;
    };
    extend(Demo, Timestable);

    Timestable.prototype.resize = function resize(e) {
        this.min = Math.min(glui.canvas.width, glui.canvas.height);
        this.cx = 0.5*glui.canvas.width, this.cy = 0.5*glui.canvas.height;
    };
    Timestable.prototype.update = function update(frame) {
        var gradient = this.settings.gradient.value + this.settings.delta.value;
        if (gradient > 2) gradient -= 2;
        this.settings.gradient.control.setValue(gradient);
        var times = this.settings.times.value + this.settings.delta.value;
        if (times > this.settings.count.value) times -= this.settings.count.value;
        this.settings.times.control.setValue(times);
    };
    Timestable.prototype.render = function render(frame) {
        var ctx = glui.renderingContext2d;
        ctx.fillStyle = '#203040';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(0,0, glui.canvas.width, glui.canvas.height);
        ctx.globalAlpha = 1;
        //glui.render();
        ctx.strokeStyle = '#408060';
        var N = this.settings.count.value;
        var T = this.settings.times.value;
        var r = this.settings.radius.value*this.min;
        var grad = this.settings.gradient.value;
        if (grad > 1) grad = 2 - grad;
        var grad1 = grad - this.settings.range.value;
        if (grad1 < 0) grad1 = 0;
        var grad2 = grad + this.settings.range.value;
        if (grad2 > 1) grad2 = 1;
        for (var i=0; i<N; i++) {
            var j = (T*i) % N;
            var a = 2*Math.PI/N*i;
            var x1 = this.cx + r*Math.cos(a), y1 = this.cy + r*Math.sin(a);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            a = 2*Math.PI/N*j;
            x2 = this.cx + r*Math.cos(a); y2 = this.cy + r*Math.sin(a);
            var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(grad1, '#203040');
            var col = `rgb(${getColor(frame)})`;
            gradient.addColorStop(grad, col);
            gradient.addColorStop(grad2, '#203040');
            ctx.strokeStyle = gradient;
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    };
    Timestable.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'count':
                this.settings.times.control.max = setting.getValue()-1;
                this.settings.times.control.setValue(this.settings.times.value);
                break;
        }
    };

    publish(new Timestable(), 'Timestable');
})();