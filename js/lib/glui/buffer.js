include('glui.js');
(function() {
    function Buffer(width, height, noContext) {
        if (width instanceof HTMLCanvasElement) {
            this.canvas = width;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = typeof width === 'number' ? width : 320;
            this.canvas.height = typeof height === 'number' ? height : 240;

            if (width instanceof Image) {
                this.canvas.width = width.width;
                this.canvas.height = width.height;
            }
        }
        if (!noContext) {
            this.context = this.canvas.getContext('2d');
            if (width instanceof Image) {
                this.context.drawImage(width, 0, 0);
            }
            this.imgData = this.context.getImageData(0, 0, this.width, this.height);
        }
    }
	Buffer.prototype = {
	    get width() { return this.canvas.width; },
	    get height() { return this.canvas.height; }
    };
    Buffer.prototype.blit_ = function blit_(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        sx = sx || 0; sy = sy || 0;
        sWidth = sWidth || source.width; sHeight = sHeight || source.height;
        dx = dx || 0; dy = dy || 0;
        dWidth = dWidth || this.width; dHeight = dHeight || this.height;
		this.context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    };
	Buffer.prototype.blit = function blit(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        source = source || glui.backBuffer;
        this.blit_(source.canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	};
	Buffer.prototype.update = function update(getData) {
        if (getData) {
            delete this.imageData;
            this.imgData = this.context.getImageData(0, 0, this.width, this.height);
        } else {
            this.context.putImageData(this.imgData, 0, 0);
         }
    };
    Buffer.prototype.resize = function resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        this.update(true);
    };
    Buffer.prototype.blitImage = function blitImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        this.blit_(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    };
    Buffer.prototype.setPixel = function setPixel(x, y, color) {
        var ix = 4*(Math.floor(x) + this.width*(Math.floor(this.height - y)));
        this.imgData.data[ix+0] = color[0];
        this.imgData.data[ix+1] = color[1];
        this.imgData.data[ix+2] = color[2];
        //this.imgData[] = ;
    };
    Buffer.prototype.drawLine = function drawLine(x1, y1, x2, y2, color) {
        var dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        if (dx > dy) {
            if (x1 > x2) {
                var tx = x1; x1 = x2; x2 = tx;
                var ty = y1; y1 = y2; y2 = ty;
            }
            dy = y2 - y1;
            for (var x=0; x<dx; x++) {
                var y = Math.floor(dy*x/dx + y1);
                this.setPixel(x+x1, y, color);
            }
        } else {
            if (y1 > y2) {
                var tx = x1; x1 = x2; x2 = tx;
                var ty = y1; y1 = y2; y2 = ty;
            }
            dx = x2 - x1;
            for (var y=0; y<dy; y++) {
                var x = Math.floor(dx*y/dy + x1);
                this.setPixel(x, y+y1, color);
            }
        }
    };
    Buffer.prototype.drawCurve = function drawCurve(points, color) {
        var n = points.length;
        for (var x = points[0].x; x < points[n-1].x; x++) {
            var y = 0;
            for (var i=0; i<n; i++) {
                var prod = 1;
                for (var j=0; j<n; j++) {
                    if (j != i) {
                        prod *= (x - points[j].x)/(points[i].x - points[j].x);
                    }
                }
                y += points[i].y*prod;
            }
            this.setPixel(x, y, color);
        }
    };
    Buffer.prototype.drawSegments = function drawSegments(points, color) {
        var p1 = points[0];
        for (var i=1; i<points.length; i++) {
            var p2 = points[i];
            this.drawLine(p1.x, p1.y, p2.x, p2.y, color);
            p1 = p2;
        }
    };
	Buffer.prototype.clear = function clear() {
		this.context.clearRect(0, 0, this.width, this.height);
    };
	Buffer.dispose = function(buffer) {
        delete this.imgData;
		delete this.canvas;
		delete buffer;
    }

    publish(Buffer, 'Buffer', glui);
})();