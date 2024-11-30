include('/lib/data/quadtree.js');
include('/lib/glui/glui-lib.js');
(function() {

    function QuadTreeDemo() {
        Demo.call(this, 'QuadTree', {
            levels: { label: 'Levels', value: 2, min:1, max:8, step: 1, type: 'int', link: null },
            size: { label: 'Size', value: 0.06, min:0.001, max:0.2, step: 0.001, type: 'float', link: null }
        });

        this.buffer = null;
        this.quadTree = null;
        this.selectedQuad = null;
		this.cursor = [0, 0];
        this.backgroundColor = [16, 40, 80];
    };
    extend(Demo, QuadTreeDemo);
    
    QuadTreeDemo.prototype.initialize = function initialize() {
        this.buffer = new glui.Buffer(glui.width/2, glui.height/2);
        this.quadTree = this.createQuadtree();
        //glui.canvas.style.cursor = 'none';
    };
    QuadTreeDemo.prototype.resize = function resize(e) {
        var w = glui.frontBuffer.width/2;
        var h = glui.frontBuffer.height/2;
        this.buffer.resize(w, h);
        this.buffer.context.setTransform(w, 0, 0, h, 0, 0);
    };
    QuadTreeDemo.prototype.update = function update(frame, dt) {
    };
    QuadTreeDemo.prototype.render = function render(frame, dt) {
        var ctx = this.buffer.context;
        ctx.save();
        ctx.fillStyle = `rgb(${this.backgroundColor})`;
        ctx.fillRect(0, 0, 1, 1);
        var color = 0;
        var n = this.quadTree.vertices.length - Math.pow(4, this.settings.levels.value-1);
        for (var i=n; i<this.quadTree.vertices.length; i++) {
            var v = this.quadTree.vertices[i];
            var color = [v.color[0], v.color[1], v.color[2]];
            ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
            ctx.fillRect(v.p1.x, v.p1.y, v.size.x, v.size.y);
        }
        ctx.globalAlpha = 0.2;
        var v = this.selectedQuad;
        if (v) {
            //var color = [96+v.color[0], 96+v.color[1], 96+v.color[2]];
            //ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
            ctx.fillStyle = '#304080';
            ctx.fillRect(v.p1.x, v.p1.y, v.size.x, v.size.y);
        }
        //ctx.fillStyle = '#304080';
        ctx.fillRect(this.cursor[0], this.cursor[1], this.settings.size.value, this.settings.size.value);
        glui.frontBuffer.blit(this.buffer);
        ctx.restore();
    };
    QuadTreeDemo.prototype.onchange = function onchange(e, setting) {
        switch (setting.parent.id) {
            case 'size':
                break;
            case 'levels':
                this.quadTree = this.createQuadtree();
                break;
            default:
                this.update(0, 0);
                break;
        }
    };
    QuadTreeDemo.prototype.onmousemove = function onmousemove(x, y, e) {
        this.cursor[0] = x/glui.canvas.clientWidth;
        this.cursor[1] = y/glui.canvas.clientHeight;
        this.selectedQuad = this.quadTree.getQuadAt(this.quadTree, this.cursor[0], this.cursor[1], this.cursor[0]+this.settings.size.value, this.cursor[1]+this.settings.size.value);
    };

    QuadTreeDemo.prototype.createQuadtree = function createQuadtree() {
        return new Quadtree(this.settings.levels.value, (vertex, level, i) => {
            var s = 16 + 16*((i+Math.floor(i/2))%2);
            var r = s + Math.floor(8*Math.random());
            var g = s + Math.floor(8*Math.random());
            var b = s + Math.floor(8*Math.random());
            vertex.color = [r, g, b];
        });
    };

    publish(new QuadTreeDemo(), 'QuadTreeDemo');
})();