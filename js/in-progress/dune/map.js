function Map(width, height, isWrapped) {
    this.width = width+1;
    this.height = height+1;
    this.data = new Array(width*height);
    this.mapSize = [0, 0];
    this.service = null;
    this.tiles = null;
    this.ctx = null;
    this.left = 0;
    this.top = 0;
    this.motion = [0, 0];
    this.offsetLeft = 0;
    this.offsetTop = 0;
    this.fetchLeft = 0;
    this.fetchTop = 0;
    this.isWrapped = isWrapped;
    this.elevation = 0;
    this.scale = 1;
    this.miniMap = null;
    this.colorMap = [];
}

Map.prototype.initialize = async function initialize(tilesUrl, service, canvas) {
    this.service = service;
    await this.loadTiles(tilesUrl);
    this.mapSize = this.service.getSize();
    this.data = this.service.fetch(this.left, this.top, this.width, this.height);
    this.colorMap = [[0,106,162], [127,179,197], [81,173,153], [137,169,70], [80,80,60], [76,48,4]];
    if (!this.ctx && canvas) this.ctx = canvas.getContext('2d');
    await this.createMiniMap();
}

Map.prototype.createMiniMap = async function createMiniMap() {
    var data = this.service.getMiniMap();
    this.miniMap = this.ctx.createImageData(this.mapSize[0], this.mapSize[1]);
    var ix = 0;
    for (var y=0; y<this.mapSize[1]; y++) {
        for (var x=0; x<this.mapSize[0]; x++) {
            var v = data[ix];
            var col = this.colorMap[v];
            this.miniMap.data[4*ix]   = col[0];
            this.miniMap.data[4*ix+1] = col[1];
            this.miniMap.data[4*ix+2] = col[2];
            this.miniMap.data[4*ix+3] = 255;
            ix++;
        }
    }
    this.miniMap.data = new Uint8ClampedArray(data);
};

Map.prototype.loadTiles = async function loadTiles(url) {
    var options = {
        url:url
    };
    var res = await ajax.send(options);
    if (res.error) alert(res.error.message);
    else {
        var img = await ajax.processContent(options);
        this.tiles = {
            image: img,
            width: 16, height: 16,
            rowSize: 16,
            count: 84,
            data: []
        };
        for (var i=0; i<this.tiles.count; i++) {
            var col = i % this.tiles.rowSize;
            var row = (i - col)/this.tiles.rowSize;
            this.tiles.data.push(this.tiles.width * col, this.tiles.height * row);
        }
    }
};

Map.prototype.fetch = function fetch() {
    this.data = this.service.fetch(this.fetchLeft, this.fetchTop, this.width, this.height);
};

Map.prototype.move = function move(dx, dy) {
    var f = 0.25;
    this.motion[0] += f*dx;
    this.motion[1] += f*dy;
    var limit = 2;
    if (this.motion[0] < -limit) this.motion[0] = -limit;
    if (this.motion[0] > limit) this.motion[0] = limit;
    if (this.motion[1] < -limit) this.motion[1] = -limit;
    if (this.motion[1] > limit) this.motion[1] = limit;

    var left = this.left + f*this.motion[0];
    var top = this.top + f*this.motion[1];
    var w = this.width - 1;
    var h = this.height - 1;
    if (left < 0) { left = 0; this.motion[0] = 0; }
    else if (left > this.mapSize[0]-w) { left = this.mapSize[0]-w; this.motion[0] = 0; }
    if (top < 0) { top = 0; this.motion[1] = 0; }
    else if (top > this.mapSize[1]-h) { top = this.mapSize[1]-h; this.motion[1] = 0; }
    this.left = left;
    this.top = top;
    this.fetchLeft = Math.trunc(left);
    this.fetchTop = Math.trunc(top);
    this.offsetLeft = Math.trunc((this.fetchLeft - left) * this.tiles.width);
    this.offsetTop = Math.trunc((this.fetchTop - top) * this.tiles.height);
    this.fetch();
};

Map.prototype.zoom = function zoom(f) {
    var scale = this.scale + 0.01*Math.sign(f);
    if (scale > 4) scale = 4;
    var width = Math.trunc(this.width/scale);
    var height = Math.trunc(this.height/scale);
    var scaleX = 1, scaleY = 1;
    if (width >= this.mapSize[0]) {
        width = this.mapSize[0] - 1;
        scaleX = width/this.mapSize[0];
    }

    if (height >= this.mapSize[1]) {
        height = this.mapSize[1] - 1;
        scaleY = height/this.mapSize[1];
    }

    this.width = width + 1;
    this.height = height + 1;
    this.scale = scale;
    
    this.render();
};

Map.prototype.render = function render() {
    var k = 0;
    var y = this.offsetTop;
    var w = this.tiles.width;
    var h = this.tiles.height;
    // this.ctx.font = '10px Arial';
    // this.ctx.textAlign = 'left';
    // this.ctx.strokeStyle = '#ffffff';
    for (var j=0; j<this.height; j++) {
        var x = this.offsetLeft;
        for (var i=0; i<this.width; i++) {
            var ti = this.data[k++];
            if (this.isShadeMode) {
                this.ctx.fillStyle = `rgb(${ti}, ${ti}, ${ti})`;
                this.ctx.fillRect(this.scale*x, this.scale*y, this.scale*this.tiles.width, this.scale*this.tiles.height);
                // this.ctx.strokeText(`${ti}`, this.scale*x, this.scale*y + this.scale*h, this.scale*w);
            } else {
                var sx = this.tiles.data[2*ti];
                var sy = this.tiles.data[2*ti+1];
                this.ctx.drawImage(this.tiles.image, sx, sy, w, h, this.scale*x, this.scale*y, this.scale*w, this.scale*h);
                //this.ctx.fillText(`${ti}`, this.scale*x, this.scale*y + this.scale*h, this.scale*w);
            }
            x += this.tiles.width;
        }
        y += this.tiles.height;
    }

    // draw minimap
    w = this.mapSize[0];
    h = this.mapSize[1];
    //this.ctx.putImageData(this.miniMap, this.ctx.canvas.width - w, this.ctx.canvas.height - h, 0, 0, w, h);
};

Map.prototype.update = function update(delta) {
    var isMoving = false;
    var f = 0.002 * delta;
    var m0 = this.motion[0];
    if (m0 != 0) {
        if (m0 < 0) {
            m0 += f;
            if (m0 > 0) m0 = 0;
            else isMoving = true;
        } else {
            m0 -=f;
            if (m0 < 0) m0 = 0;
            else isMoving = true;
        }
        this.motion[0] = m0;
    }
    var m1 = this.motion[1];
    if (m1 != 0) {
        if (m1 < 0) {
            m1 += f;
            if (m1 > 0) m1 = 0;
            else isMoving = true;
        } else {
            m1 -=f;
            if (m1 < 0) m1 = 0;
            else isMoving = true;
        }
        this.motion[1] = m1;
    }
    if (isMoving) {
        this.move(0, 0);
        this.render();
    }
};
