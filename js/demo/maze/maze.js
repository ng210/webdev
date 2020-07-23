include('data/graph.js');
include('math/fn.js');
include('glui/glui-lib.js');
(function() {

    var Direction = {
        'left': 0,
        'up': 1,
        'right': 2,
        'down': 3
    };
    var LinkStatus = {
        Free: 0,
        Wall: 1,
        Required: 2
    };
    var DirectionInverseMap = (function() {
        var map = {};
        map[Direction.left] = Direction.right;
        map[Direction.right] = Direction.left;
        map[Direction.up] = Direction.down;
        map[Direction.down] = Direction.up;
        return map;
    })();

    function Block(x, y) {
        this.x = x;
        this.y = y;
        this.color = [80, 80, 80];
        this.freeLinks = 0;
        this.links = {};
        this.links[Direction.left] = null;
        this.links[Direction.up] = null;
        this.links[Direction.right] = null;
        this.links[Direction.down] = null;
        this.stores = Math.random() < 0.1 ? 'bonus' : 'dot';
    }
    Block.prototype.render = function render(ctx, thickness, highlight) {
        var th2 = 2*thickness;
        var alpha = ctx.globalAlpha;
        ctx.globalAlpha = highlight;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fillRect(this.x+thickness, this.y+thickness, 1-th2, 1-th2);

        ctx.globalAlpha = alpha;
        switch (this.stores) {
            case 'dot': ctx.fillStyle = 'white'; ctx.fillRect(this.x+0.4, this.y+0.4, 0.2, 0.2); break;
            case 'bonus': ctx.fillStyle = 'lightgreen'; ctx.fillRect(this.x+0.35, this.y+0.35, 0.3, 0.3); break;
        }

        ctx.fillStyle = `rgb(${this.color})`;
        var link = this.links[Direction.left];
        if (!link) ctx.fillRect(this.x, this.y, thickness, 1);
        else if (link.data.status == LinkStatus.Wall) ctx.fillRect(this.x-thickness, this.y, th2, 1);

        link = this.links[Direction.right];
        if (!link) ctx.fillRect(this.x+1-thickness, this.y, thickness, 1);
        else if (link.data.status == LinkStatus.Wall) ctx.fillRect(this.x+1-thickness, this.y, th2, 1);

        link = this.links[Direction.up];
        if (!link) ctx.fillRect(this.x, this.y, 1, thickness);
        else if(link.data.status == LinkStatus.Wall) ctx.fillRect(this.x, this.y-thickness, 1, th2);
        
        link = this.links[Direction.down];
        if (!link) ctx.fillRect(this.x, this.y+1-thickness, 1, thickness);
        else if(link.data.status == LinkStatus.Wall) ctx.fillRect(this.x, this.y+1-thickness, 1, th2);
    };
    Block.prototype.addLink = function addLink(link) {
        this.links[link.data.direction] = link;
        this.freeLinks++;
    };
    Block.prototype.block = function block(direction, status) {
        var link = this.links[direction];
        var b = link.to.data;
        link.data.status = status;
        link.link.data.status = status;
        this.freeLinks--;
        b.freeLinks--;
    };
    Block.prototype.unblock = function unblock(direction) {
        var link = this.links[direction];
        var b = link.to.data;
        link.data.status = LinkStatus.Free;
        link.link.data.status = LinkStatus.Free;
        this.freeLinks++;
        b.freeLinks++;
    };
    Block.prototype.toString = function toString() {
        return `(${this.x},${this.y})`;
    };

    function Maze(width, height) {
        this.width = width;
        this.height = height;
        this.remaining = null;
        this.thickness = 0.1;
        this.graph = null;
        this.selected = null;
        this.timer = 0;
    }
    Maze.prototype.link = function link(a, b, direction) {
        var link1 = this.graph.addEdge(a, b, {direction: direction, status: LinkStatus.Free});
        var link2 = this.graph.addEdge(b, a, {direction: DirectionInverseMap[direction], status: LinkStatus.Free});
        link1.link = link2;
        link2.link = link1;
        a.data.addLink(link1);
        b.data.addLink(link2);
    };
    Maze.prototype.build = function build(randomness) {
        // create network of nodes
        this.graph = new Graph();
        var ix = -this.width;
        var left = null;
        for (var j=0; j<this.height; j++) {
            for (var i=0; i<this.width; i++) {
                var vertex = this.graph.createVertex(new Block(i, j));
                if (i > 0) {
                    this.link(vertex, left, Direction.left);
                }
                if (j > 0) {
                    this.link(vertex, this.graph.vertices[ix], Direction.up);
                }
                left = vertex;
                ix++;
            }
        }
        // add walls
        this.remaining = [];
        var arr = new Array(this.graph.vertices.length);
        for (var i=0; i<arr.length; i++) {
            arr[i] = i;
        }
        while (arr.length > 0) {
            var r = Fn.lerp(0, Math.random(), randomness);
            var ix = Math.floor(arr.length*r);
            this.remaining.push(arr[ix]);
            arr.splice(ix, 1);
        }
        this.addWall(randomness);
    };
    Maze.prototype.addWall = function addWall(randomness) {
        var link = null;
        while (this.remaining.length > 0) {
            var ix = this.remaining.pop();
            var vertex = this.graph.vertices[ix];
            var block = vertex.data;
            // a wall can be added if
            // - the block has at least 1 free direction
            // - the block on the other side of the wall can be reached from the source block
            if (block.freeLinks > 1) {
                // get random direction
                var di = Math.floor(block.freeLinks*Math.random());
                var lnk = null;
                for (var li=0; li<4; li++) {
                    var lnk = block.links[li];
                    if (lnk == null || lnk.status == LinkStatus.Wall || lnk.status == LinkStatus.Required) continue;
                    if (di == 0) break;
                    di--;
                }
                if (lnk && lnk.data.status != LinkStatus.Required) {
                    if (lnk.to.data.freeLinks == 1) {
                        block.block(lnk.data.direction, LinkStatus.Required);
                    } else {
                        // find path
                        block.block(lnk.data.direction, LinkStatus.Wall);
//console.log('Check wall between ' + vertex.id + ' and ' + lnk.to.id + '.' + '(' + Object.keys(LinkStatus)[block.links[lnk.data.direction].data.status] + ')');
                        if (this.graph.findPath(lnk.from, lnk.to, e => e.data.status === LinkStatus.Free) == null) {
                            lnk.data.status = LinkStatus.Required;
                            lnk.link.data.status = LinkStatus.Required;
                        } else {
                            link = lnk;
//console.log('Wall built');
                        }
                    }
                    if (block.freeLinks >= 1) {
                        this.remaining.push(ix);
                    }
                }
            }
        }
        return link;
    };
    Maze.prototype.render = function render(ctx) {
        this.timer -= 0.04;
        if (this.timer < 0) {
            this.timer = 1;
        }
        for (var i=0; i<this.graph.vertices.length; i++) {
            var vertex = this.graph.vertices[i];
            
            var highlight = vertex != this.selected ? 0.2 : 0.5+0.3*Math.sin(2*Math.PI*this.timer);
            vertex.data.render(ctx, this.thickness, highlight);
            highlight
        }
    };
    Maze.prototype.selectAt = function selectAt(x, y) {
        this.selected = this.graph.vertices[x + this.width*y];
    };

    function Sprite(x, y, color) {
        this.x = x; this.y = y;
        this.dx = 0; this.dy = 0;
        this.color = color;
        this.timer = null;
        this.destination = {x:0, y:0};
        this.next = {x:x, y:y};
        this.velocity = 0;
        this.path = null;
    }
    Sprite.prototype.render = function render(ctx) {
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fillRect(this.x+0.25, this.y+0.25, 0.5, 0.5);
    };
    Sprite.prototype.update = function update(maze, dt) {
        if (this.path) {
            this.move(dt);
        }
    };
    Sprite.prototype.setDestination = function setDestination(maze, x, y) {
        this.destination.x = x;
        this.destination.y = y;
        var source = maze.graph.vertices[this.next.x + maze.width*this.next.y];
        var destination = maze.graph.vertices[x + maze.width*y];
        this.path = maze.graph.findPath(source, destination, e => e.data.status != LinkStatus.Wall);
        //if ((this.path = maze.graph.findPath(source, destination, e => e.data.status != LinkStatus.Wall)) != null) {
        //    this.setNextMove();
        //}
    };
    Sprite.prototype.setNextMove = function setNextMove() {
        var next = this.path.shift();
        if (next) {
            this.next.x = next.to.data.x;
            this.next.y = next.to.data.y;
            next.from.data.stores = 0;
            this.dx = Math.sign(this.next.x - this.x)*this.velocity;
            this.dy = Math.sign(this.next.y - this.y)*this.velocity;
        } else {
            delete this.path;
        }
    };
    Sprite.prototype.move = function move(dt) {
        var isMoving = false;
        if (this.dx != 0) {
            this.x += this.dx*dt;
            isMoving = true;
            if (this.dx > 0) {
                if (this.x >= this.next.x) {
                    this.x = this.next.x;
                    isMoving = false;
                    //dt = (this.x - this.next.x)/this.velocity;
                }
            } else {
                if (this.x <= this.next.x) {
                    this.x = this.next.x;
                    isMoving = false;
                    //dt = (this.next.x - this.x)/this.velocity;
                }
            }
        }
        if (this.dy != 0) {
            this.y += this.dy*dt;
            isMoving = true;
            if (this.dy > 0) {
                if (this.y >= this.next.y) {
                    this.y = this.next.y;
                    isMoving = false;
                    //dt = (this.y - this.next.y)/this.velocity;
                }
            } else {
                if (this.y <= this.next.y) {
                    this.y = this.next.y;
                    isMoving = false;
                    //dt = (this.next.y - this.y)/this.velocity;
                }
            }
        }

        if (!isMoving) {
            this.setNextMove();
        }
    };

    var MazeDemo = {
        name: 'Maze',
        settings: {
            width: { label: 'Width', value: 32, min:1, max:100, step: 1, type: 'int', link: null },
            height: { label: 'Height', value: 18, min:1, max:100, step: 1, type: 'int', link: null },
            randomness: { label: 'Randomness', value: 0.5, min:0.0, max:1.0, step: 0.01, type: 'float', link: null },
            thickness: { label: 'Thickness', value: 0.1, min:0.02, max:0.4, step: 0.001, normalized: true, type: 'float', link: null },
            speed: { label: 'Speed', value: 2.0, min:1.0, max:5.0, step: 0.01, normalized:true, type: 'float', link: null },
        },

        maze: null,
        remaining: null,
        buffer: null,
        cursor: [0, 0],
        backgroundColor: [16, 40, 80],
        counter: 0,
        complete: false,
        selectedBlock: null,
    
        initialize: function initialize() {
            this.buffer = new glui.Buffer(glui.width/2, glui.height/2);
            this.maze = new Maze(this.settings.width.value, this.settings.height.value);
            this.maze.build(this.settings.randomness.value);
            this.complete = false;
            this.player = new Sprite(Math.floor(this.maze.width*Math.random()), Math.floor(this.maze.height*Math.random()), [255, 160, 144]);
            this.player.velocity = this.settings.speed.value;
            this.onclick(Math.random(), Math.random());
            this.resize();
        },
        resize: function resize(e) {
            var w = glui.frontBuffer.width/2;
            var h = glui.frontBuffer.height/2;
            this.buffer.resize(w, h);
            this.buffer.context.setTransform(w/this.settings.width.value, 0, 0, h/this.settings.height.value, 0, 0);
        },
        update: function update(frame, dt) {
            this.player.update(this.maze, dt);
        },
        render: function render(frame, dt) {
            var ctx = this.buffer.context;
            ctx.save();
            ctx.fillStyle = `rgb(${this.backgroundColor})`;
            //ctx.globalAlpha = 0.1;
            ctx.fillRect(0, 0, this.settings.width.value, this.settings.height.value);
            this.maze.render(ctx);
            //ctx.globalAlpha = 1.0;
            this.player.render(ctx);
            glui.frontBuffer.blit(this.buffer);
            ctx.restore();
        },
        onchange: function onchange(e) {
			var label = e.control.dataSource.label;
			switch (label) {
                case 'Width':
                case 'Height':
                    this.resetMaze(true);
                case 'Randomness':
                    this.resetMaze();
                    break;
                case 'Thickness':
                    this.maze.thickness = this.settings.thickness.value;
                    break;
                case 'Speed':
                    this.player.velocity = this.settings.speed.value;
                    break;
            }
        },
        onclick: function onclick(x, y) {
            if (!(y instanceof glui.Control)) {
                var bx = Math.floor(this.maze.width*x);
                var by = Math.floor(this.maze.height*y);
                this.maze.selectAt(bx, by);
                this.player.setDestination(this.maze, bx, by);
            }
        },

        resetMaze: function resetMaze(rebuild) {
            var selected = [this.maze.selected.data.x, this.maze.selected.data.y];
            if (rebuild) {
                this.maze = new Maze(this.settings.width.value, this.settings.height.value);
            }
            this.maze.build(this.settings.randomness.value);
            this.maze.selectAt(selected[0], selected[1]);
            this.maze.thickness = this.settings.thickness.value;
            this.complete = false;
            
            this.player.setDestination(this.maze, this.player.destination.x, this.player.destination.y);
            this.resize();
        }
    };

    public(MazeDemo, 'MazeDemo');
})();