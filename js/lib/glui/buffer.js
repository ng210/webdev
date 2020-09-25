include('glui.js');
(function() {
    function Buffer(width, height) {
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

        this.context = this.canvas.getContext('2d');
        if (width instanceof Image) {
            this.context.drawImage(width, 0, 0);
        }
        this.imgData = this.context.getImageData(0, 0, this.width, this.height);
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
        !getData ? this.context.putImageData(this.imgData, 0, 0) : this.imgData = this.context.getImageData(0, 0, this.width, this.height);
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
	Buffer.prototype.clear = function clear() {
		this.context.clearRect(0, 0, this.width, this.height);
	};
	// Buffer.dispose = function(buffer) {
	// 	for (var i=0; i<GE.managedBuffers.length; i++) {
	// 		if (GE.managedBuffers[i] === buffer) {
	// 			GE.managedBuffers.splice(i, 1);
	// 		}
	// 	}
	// 	delete buffer;
    // }
    publish(Buffer, 'Buffer', glui);
})();