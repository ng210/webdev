function MapService() {
    this.noise = new Noise(42);
    this.width = 0;
    this.height = 0;
    this.data = null;
}

MapService.prototype.create = function create(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Array(width * height);
    this.noise.transform2d = (x, y, v, buffer, ix) => { buffer[ix] = v < 1 ? Math.floor(4*v) : 4; return ix+1; };
    this.noise.createFbm2d(width, height, 8, 6, 10, 0.81, 2.07, 0.41, 3.13, this.data);
    // var ix = 0;
    // for (var j=0; j<this.height; j++) {
    //     for (var i=0; i<this.width; i++) {
    //         this.data[ix++] = j % 5;
    //     }
    // }
};
MapService.prototype.getSize = function getSize() {
    return [this.width, this.height];
};

MapService.prototype.fetch = function fetch(left, top, width, height) {
    var data = [];
    for (var j=0; j<height; j++) {
        for (var i=0; i<width; i++) {
            var x = (left + i) % this.width;
            var y = (top + j) % this.height;
            var v = this.data[x + y*this.width];
            data.push(v);
        }
    }
    return data;
};