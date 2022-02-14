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
    this.isWrapped = isWrapped;
    this.scale = 1;
}

Map.prototype.initialize = async function initialize(url, service) {
    this.service = service;
    await this.loadTiles(url);
    this.mapSize = this.service.getSize();
    this.data = this.service.fetch(this.left, this.top, this.width, this.height);
}

Map.prototype.loadTiles = async function loadTiles(url) {
    var options = {
        url:url
    };
    var res = await ajax.send(options);
    if (res.error) alert(res.error.message);
    else {
        var img = await ajax.processContent(options);
        var tileData = [
            //0, 1, 2, 3, 4 // shades
            21,15,0,18,24  // dune2
            //  0,         // sand
            //  1, 2, 3, 14,15,16, 27,28,29,   // spice
            //  7, 8, 9, 20,21,22, 33,34,35,   // rich spice
            //  4, 5, 6, 17,18,19, 30,31,32,   // rock
            // 10,11,12, 23,24,25, 36,37,38,   // rock 2
            // 39,40       // spice bloom, small rock
        ];
        this.tiles = {
            image: img,
            width: 16, height: 16,
            rowSize: 13,
            data: []
        };
        for (var i=0; i<tileData.length; i++) {
            var col = tileData[i] % this.tiles.rowSize;
            var row = (tileData[i] - col)/this.tiles.rowSize;
            this.tiles.data.push(this.tiles.width * col, this.tiles.height * row);
        }
    }
};

Map.prototype.move = function move(dx, dy) {
    var f = 0.15;
    this.motion[0] += f*dx;
    this.motion[1] += f*dy;
    var limit = 2;
    if (this.motion[0] < -limit) this.motion[0] = -limit;
    if (this.motion[0] > limit) this.motion[0] = limit;
    if (this.motion[1] < -limit) this.motion[1] = -limit;
    if (this.motion[1] > limit) this.motion[1] = limit;

    var left = this.left + f*this.motion[0];
    var top = this.top + f*this.motion[1];
    if (left < 0) { left = 0; this.motion[0] = 0; }
    else if (left >= this.mapSize[0]-this.width) { left = this.mapSize[0]-this.width; this.motion[0] = 0; }
    if (top < 0) { top = 0; this.motion[1] = 0; }
    else if (top >= this.mapSize[1]-this.height) { top = this.mapSize[1]-this.height; this.motion[1] = 0; }
    this.left = left;
    this.top = top;
    var leftInt = Math.trunc(left);
    var topInt = Math.trunc(top);
    this.offsetLeft = Math.trunc((leftInt - left) * this.tiles.width);
    this.offsetTop = Math.trunc((topInt - top) * this.tiles.height);
    this.data = this.service.fetch(leftInt, topInt, this.width, this.height);
};

Map.prototype.zoom = function zoom(f) {
    var scale = this.scale + 0.01*Math.sign(f);
    if (scale < 0.25) scale = 0.25;
    else if (scale > 4) scale = 4;
    this.scale = scale;
    // this.move
    this.render();
};

Map.prototype.render = function render(canvas) {
    if (canvas) {
        this.ctx = canvas.getContext('2d');
    }
    var k = 0;
    var y = this.offsetTop;
    for (var j=0; j<this.height; j++) {
        var x = this.offsetLeft;
        for (var i=0; i<this.width; i++) {
            var ti = this.data[k++];
            var sx = this.tiles.data[2*ti];
            var sy = this.tiles.data[2*ti+1]
            this.ctx.drawImage(this.tiles.image, sx, sy, this.tiles.width, this.tiles.height, this.scale*x, this.scale*y, this.scale*this.tiles.width, this.scale*this.tiles.height);
            x += this.tiles.width;
        }
        y += this.tiles.height;
    }
};

Map.prototype.update = function update(delta) {
    var isMoving = false;
    var f = 0.004 * delta;
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
