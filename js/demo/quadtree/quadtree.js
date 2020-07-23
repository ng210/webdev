include('data/graph.js');
include('glui/glui-lib.js');
(function() {

    var QuadTree = {
        name: 'QuadTree',
        settings: {
            levels: { label: 'Levels', value: 4, min:1, max:8, step: 1, type: 'int', link: null },
            size: { label: 'Size', value: 0.06, min:0.001, max:0.2, step: 0.001, type: 'float', link: null }
        },

        buffer: null,
        quadTree: null,
        selectedQuad: null,
		cursor: [0, 0],
        backgroundColor: [16, 40, 80],
    
        initialize: function initialize() {
            this.buffer = new glui.Buffer(glui.width/2, glui.height/2);
            this.quadTree = this.buildQuadTree(this.settings.levels.value);
            //glui.canvas.style.cursor = 'none';
        },
        resize: function resize(e) {
            var w = glui.frontBuffer.width/2;
            var h = glui.frontBuffer.height/2;
            this.buffer.resize(w, h);
            this.buffer.context.setTransform(w, 0, 0, h, 0, 0);
        },
        update: function update(frame, dt) {
        },
        render: function render(frame, dt) {
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
                ctx.fillRect(v.x, v.y, v.width, v.height);
            }
            ctx.globalAlpha = 0.2;
            var v = this.selectedQuad;
            if (v) {
                //var color = [96+v.color[0], 96+v.color[1], 96+v.color[2]];
                //ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
                ctx.fillStyle = '#304080';
                ctx.fillRect(v.x, v.y, v.width, v.height);
            }
            //ctx.fillStyle = '#304080';
            ctx.fillRect(this.cursor[0], this.cursor[1], this.settings.size.value, this.settings.size.value);
            glui.frontBuffer.blit(this.buffer);
            ctx.restore();
        },

		onchange: function onchange(setting) {
			var label = setting.control.dataSource.label;
			switch (label) {
				case 'Size':
                    break;
                case 'Levels':
                    this.quadTree = this.buildQuadTree(this.settings.levels.value);
                    break;
				default:
					this.update(0, 0);
					break;
			}
		},

		onmousemove: function onmousemove(e) {
			this.cursor[0] = e.clientX/glui.canvas.clientWidth;
            this.cursor[1] = e.clientY/glui.canvas.clientHeight;
            this.selectedQuad = this.getQuadAt(this.quadTree, this.cursor[0], this.cursor[1], this.cursor[0]+this.settings.size.value, this.cursor[1]+this.settings.size.value);
		},

        // custom functions
        buildQuadTree: function buildQuadTree(levels) {
            var quadTree = Graph.createCompleteTree(4, levels, true, (vertex, level, i) => {
                vertex.items = [];
                var d = Math.pow(2, level);
                if (vertex.parent) {
                    var n = i%4;
                    vertex.x = vertex.parent.x + (n%2)/d;
                    vertex.y = vertex.parent.y + Math.floor(n/2)/d;
                } else {
                    vertex.x = 0;
                    vertex.y = 0;
                }
                vertex.width = 1/d;
                vertex.height = 1/d;
                var s = 16 + 16*((i+Math.floor(i/2))%2);
                var r = s;//Math.floor(16+32*Math.random());
                var g = s;//Math.floor(16+32*Math.random());
                var b = s;//Math.floor(16+32*Math.random());
                vertex.color = [r, g, b];
            });
            return quadTree;
        },
        getQuadAt: function getQuadAt(quadTree, x1, y1, x2, y2) {
            var v = quadTree.root;
            while (true) {
                if (v.edges.length > 0) {
                    var next = 0;
                    if (x1 < v.x+v.width/2 && x2 < v.x+v.width/2) next = 0;
                    else if (x1 > v.x+v.width/2 && x2 > v.x+v.width/2) next = 1;
                    else break;
                    if (y1 < v.y+v.height/2 && y2 < v.y+v.height/2) next += 0;
                    else if (y1 > v.y+v.height/2 && y2 > v.y+v.height/2) next += 2;
                    else break;
                    v = v.edges[next].to;
                } else {
                    break;
                }
            }
            return v;
        }
    };

    public(QuadTree, 'QuadTree');
})();