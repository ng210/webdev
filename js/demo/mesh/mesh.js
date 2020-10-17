include('data/graph.js');
include('math/fn.js');
include('math/v2.js');
include('glui/glui-lib.js');
(function() {
    var Mesh = {
        name: 'Growing Mesh',
        settings: {
            count: { label: 'Count', value: 100, min:1, max:200, step: 1, type: 'int', link: null },
            degree: { label: 'Degree', value: 2, min:1, max:100, step: 1, type: 'int', link: null },
            size: { label: 'Size', value: 0.008, min:0.001, max:0.05, step: 0.001, normalized:true, type: 'float', link: null },
            speed: { label: 'Speed', value: 0.1, min:0.0, max:0.2, step: 0.0025, normalized:true, type: 'float', link: null },
            variance: { label: 'Variance', value: 0.6, min:0.0, max:1.0, step: 0.05, normalized:true, type: 'float', link: null },
            alpha: { label: 'Alpha', value: 0.6, min:0.0, max:1, step: 0.01, type: 'float', link: null }
        },

        tree: null,
        buffer: null,
        count: 0,
        ratio: 0,
        backgroundColor: [16, 24, 48],
        
        initialize: function initialize() {
            this.tree = new Graph();
            this.resetNodes();
            this.buffer = new glui.Buffer(glui.frontBuffer.width/2, glui.frontBuffer.height/2);
            this.resize();
        },
        resize: function resize(e) {
            var w = glui.frontBuffer.width/2;
            var h = glui.frontBuffer.height/2;
            this.ratio = w/h;
            this.buffer.resize(w, h);
            this.buffer.context.setTransform(w, 0, 0, h, 0, 0);
        },
        update: function update(frame, dt) {
            for (var i=0; i<this.count; i++) {
                var node = this.tree.vertices[i];
                if (node.timeToLive > 0) {
                    var f = node.timeToLive;    //Math.sin(0.5*Math.PI*node.timeToLive);
                    node.velocity.x = Fn.lerp(node.velocity2.x, node.velocity1.x, f);
                    node.velocity.y = Fn.lerp(node.velocity2.y, node.velocity1.y, f);
                    node.position.add(node.velocity.prodC(this.settings.speed.value*dt));
                    this.checkNodePosition(node);
                    node.timeToLive -= this.settings.variance.value*dt;
                } else {
                    node.timeToLive = 0.5 + 0.5*Math.random();
                    node.velocity1 = node.velocity2;
                    node.velocity2 = V2.fromPolar(2*Math.PI*Math.random(), 0.5 + 0.5*Math.random());
                }

                node.colorDelta -= dt;
                if (node.colorDelta > 0) {
                    node.color[0] = Fn.lerp(node.baseColor[0], node.color[0], node.colorDelta);
                    node.color[1] = Fn.lerp(node.baseColor[1], node.color[1], node.colorDelta);
                    node.color[2] = Fn.lerp(node.baseColor[2], node.color[2], node.colorDelta);
                }
            }
        },
        render: function render(frame, dt) {
            var ctx = this.buffer.context;
            ctx.fillStyle = `rgb(${this.backgroundColor})`;
            ctx.globalAlpha = this.settings.alpha.value;
            ctx.fillRect(0, 0, 1, 1);
            ctx.strokeStyle = '#ffead8';
            ctx.lineWidth = 1/glui.width;
            ctx.globalAlpha = 0.1;
            for (var i=0; i<this.tree.edges.length; i++) {
                var edge = this.tree.edges[i];
                var a = edge.from;
                var b = edge.to;
                if (a.id < this.count && b.id < this.count) {
                    ctx.beginPath();
                    ctx.moveTo(a.position.x, a.position.y);
                    ctx.lineTo(b.position.x, b.position.y);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
            for (var i=0; i<this.count; i++) {
                var node = this.tree.vertices[i];
                ctx.fillStyle = `rgb(${node.color})`;
                var size = node.size.prod([this.settings.size.value, this.ratio*this.settings.size.value]);
                ctx.fillRect(node.position.x-size.x, node.position.y-size.y, 2*size.x, 2*size.y);
            }
            glui.frontBuffer.blit(this.buffer);
        },
        onchange: function onchange(e, setting) {
            switch (setting.parent.id) {
                case 'count': this.resetNodes(); break;
            }
            this.update(0, 0);
        },

        resetNodes: function resetNodes() {
            if (1) {
                // add new nodes
                for (var i=this.tree.vertices.length; i<this.settings.count.value; i++) {
                    var node = this.tree.createVertex();
                    this.resetNode(node);
                    node.id = i;
                }
                // reset nodes
                for (var i=this.count; i<this.settings.count.value; i++) {
                    this.resetNode(this.tree.vertices[i]);
                }
                this.count = this.settings.count.value;
            } else {
                this.createTestNodes();
            }
        },
        resetNode: function resetNode(node) {
            var r = Math.floor(Math.random()*128) + 64;
            var g = Math.floor(Math.random()*128) + 64;
            var b = Math.floor(Math.random()*128) + 64;
            node.color = [this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2]];
            node.baseColor = [r, g, b];
            node.position = new V2(Math.random(), Math.random());
            node.velocity = new V2();
            node.velocity1 = new V2();
            node.velocity2 = V2.fromPolar(2*Math.PI*Math.random(), 0.5 + 0.5*Math.random());
            node.size = new V2(0.2*(1 + Math.random()), 0.2*(1 + Math.random()));
            node.delta = 0;
            node.colorDelta = 1.0;
            node.timeToLive = 0.5 + 0.5*Math.random();
        },
        checkNodePosition: function checkNodePosition(node) {
            var size = node.size.prod([this.settings.size.value, this.ratio*this.settings.size.value]);
            if (node.position.x < size.x) {
                node.position.x = size.x;
                if (node.velocity1.x < 0) node.velocity1.x *= -1;
                if (node.velocity2.x < 0) node.velocity2.x *= -1;
            } else if (node.position.x > 1 - size.x) {
                node.position.x = 1 - size.x;
                if (node.velocity1.x > 0) node.velocity1.x *= -1;
                if (node.velocity2.x > 0) node.velocity2.x *= -1;
            }
            if (node.position.y < size.y) {
                node.position.y = size.y;
                if (node.velocity1.y < 0) node.velocity1.y *= -1;
                if (node.velocity2.y < 0) node.velocity2.y *= -1;
            } else if (node.position.y > 1 - size.y) {
                node.position.y = 1 - size.y;
                if (node.velocity1.y > 0) node.velocity1.y *= -1;
                if (node.velocity2.y > 0) node.velocity2.y *= -1;
            }
            this.checkCollision(node);
        },
        checkCollision: function checkCollision(nodeA) {
            for (var i=0; i<this.count; i++) {
                var nodeB = this.tree.vertices[i];
                if (nodeA != nodeB) {
                    var isHit = 0;
                    var sizeA = nodeA.size.prod([this.settings.size.value, this.ratio*this.settings.size.value]);
                    var sizeB = nodeB.size.prod([this.settings.size.value, this.ratio*this.settings.size.value]);
                    var overlap = new V2();
                    sizeA.scale(2);
                    sizeB.scale(2);

                    if (nodeA.position.x <= nodeB.position.x && nodeB.position.x < nodeA.position.x + sizeA.x) {
                        overlap.x = nodeA.position.x + sizeA.x - nodeB.position.x;
                        isHit++;
                    } else if (nodeB.position.x <= nodeA.position.x && nodeA.position.x < nodeB.position.x + sizeB.x) {
                        overlap.x = nodeB.position.x + sizeB.x - nodeA.position.x;
                        isHit++;
                    }
                    if (nodeA.position.y <= nodeB.position.y && nodeB.position.y < nodeA.position.y + sizeA.y) {
                        overlap.y = nodeA.position.y + sizeA.y - nodeB.position.y;
                        isHit++;
                    } else if (nodeB.position.y <= nodeA.position.y && nodeA.position.y < nodeB.position.y + sizeB.y) {
                        overlap.y = nodeB.position.y + sizeB.y - nodeA.position.y;
                        isHit++;
                    }

                    if (isHit > 1) {
                        this.resolveCollision(nodeA, nodeB, overlap);
                        nodeA.colorDelta = 1.0;
                        nodeA.color = [255, 255, 255];
                        nodeB.colorDelta = 1.0;
                        nodeB.color = [255, 255, 255];
                    }
                }
            }
        },
        resolveCollision: function resolveCollision(a, b, overlap) {
            // get time of collision
            // var vx = Math.abs(a.velocity.x) + Math.abs(b.velocity.x);
            // var vy = Math.abs(a.velocity.y) + Math.abs(b.velocity.y);
            var v = a.velocity.diff(b.velocity);
            var deltaX = Math.abs(overlap.x/v.x);
            var deltaY = Math.abs(overlap.y/v.y);
            if (deltaX < deltaY) {
                a.position.sub(a.velocity.prodC(deltaX));
                a.timeToLive += deltaX;
                b.position.sub(b.velocity.prodC(deltaX));
                b.timeToLive += deltaX;
                var tmp = a.velocity1.x;
                a.velocity1.x = b.velocity1.x;
                b.velocity1.x = tmp;
                tmp = a.velocity2.x;
                a.velocity2.x = b.velocity2.x;
                b.velocity2.x = tmp;
            } else {
                a.position.sub(a.velocity.prodC(deltaY));
                a.timeToLive += deltaY;
                b.position.sub(b.velocity.prodC(deltaY));
                b.timeToLive += deltaY;
                var tmp = a.velocity1.y;
                a.velocity1.y = b.velocity1.y;
                b.velocity1.y = tmp;
                tmp = a.velocity2.y;
                a.velocity2.y = b.velocity2.y;
                b.velocity2.y = tmp;
            }
            var tmp = a.timeToLive;
            a.timeToLive = b.timeToLive;
            b.timeToLive = tmp;

            if (!a.edges.find(x => x.to == b) &&
                a.edges.length < this.settings.degree.value && b.edges.length < this.settings.degree.value) {
                this.tree.addEdge(a, b, null);
                this.tree.addEdge(b, a, null);
            }
        },

        createTestNodes: function createTestNodes() {
            var node = this.tree.createVertex();
            node.id = 0;
            this.resetNode(node);
            node.position = new V2(0.45, 0.5);
            node.baseColor = [255, 128, 128];
            node.velocity1 = new V2(0.8, 0.5);
            node.velocity2 = new V2(0.8, 0.5);
            node.size = new V2(1.0, 1.0);

            node = this.tree.createVertex();
            this.resetNode(node);
            node.id = 1;
            node.position = new V2(0.55, 0.5);
            node.baseColor = [128, 255, 128];
            node.velocity1 = new V2(-0.8, -0.5);
            node.velocity2 = new V2(-0.8, -0.5);
            node.size = new V2(1.0, 1.0);

            node = this.tree.createVertex();
            node.id = 2;
            this.resetNode(node);
            node.position = new V2(0.2, 0.4);
            node.baseColor = [128, 128, 255];
            node.velocity1 = new V2(0.5, 0.8);
            node.velocity2 = new V2(0.5, 0.8);
            node.size = new V2(1.0, 1.0);

            node = this.tree.createVertex();
            node.id = 3;
            this.resetNode(node);
            node.position = new V2(0.3, 0.5);
            node.baseColor = [255, 255, 128];
            node.velocity1 = new V2(-0.5, -0.8);
            node.velocity2 = new V2(-0.5, -0.8);
            node.size = new V2(1.0, 1.0);

            this.count = this.tree.vertices.length;
        }
    };

    publish(Mesh, 'Mesh');
})();
