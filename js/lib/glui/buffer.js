export default class Buffer {
    canvas;
    context;
    imageData;

    get width() { return this.canvas.width; }
    get height() { return this.canvas.height; }

    constructor() {
        let data = null;
        if (arguments[0] instanceof HTMLCanvasElement) {
            this.canvas = arguments[0];
        } else {
            this.canvas = document.createElement('canvas');
            let wi = 320;
            let he = 240;
            if (typeof arguments[0] === 'number') {
                if (typeof arguments[1] === 'number') {
                    wi = arguments[0];
                    he = arguments[1];
                }
            } else if (arguments[0] instanceof HTMLImageElement) {
                wi = arguments[0].width;
                he = arguments[0].height;
                data = arguments[0];
            } else if (arguments[0] instanceof Buffer) {
                wi = arguments[0].width;
                he = arguments[0].height;
                data = arguments[0].canvas;
            }

            this.canvas.width = wi;
            this.canvas.height = he;
        }

        this.context = this.canvas.getContext('2d');
        if (data) this.#blit(data);
        this.imageData = this.context.getImageData(0, 0, this.width, this.height);

        // this.canvas = document.createElement('canvas');
        // this.canvas.width = typeof width === 'number' ? width : 320;
        // this.canvas.height = typeof height === 'number' ? height : 240;

        // if (!noContext) {
        //     this.context = this.canvas.getContext('2d');
        //     this.imageData = this.context.getImageData(0, 0, this.width, this.height);
        // }
    }

    #blit(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        sx = sx || 0; sy = sy || 0;
        sWidth = sWidth || source.width; sHeight = sHeight || source.height;
        dx = dx || 0; dy = dy || 0;
        dWidth = dWidth || this.width; dHeight = dHeight || this.height;
		this.context.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

	blit(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        //source = source || glui.backBuffer;
        this.#blit(source.canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
	}

	update() {
        this.context.putImageData(this.imageData, 0, 0);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        delete this.imageData;
        this.imageData = this.context.getImageData(0, 0, this.width, this.height);
    }

    blitImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        this.#blit(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    setPixel(x, y, color) {
        var ix = 4*(Math.floor(x) + this.width*(Math.floor(this.height - y)));
        this.imageData.data[ix+0] = color[0];
        this.imageData.data[ix+1] = color[1];
        this.imageData.data[ix+2] = color[2];
    }

	clear() {
		this.context.clearRect(0, 0, this.width, this.height);
    }

//     Buffer.prototype.drawLine = function drawLine(x1, y1, x2, y2, color) {
//         var dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
//         if (dx > dy) {
//             if (x1 > x2) {
//                 var tx = x1; x1 = x2; x2 = tx;
//                 var ty = y1; y1 = y2; y2 = ty;
//             }
//             dy = y2 - y1;
//             for (var x=0; x<dx; x++) {
//                 var y = Math.floor(dy*x/dx + y1);
//                 this.setPixel(x+x1, y, color);
//             }
//         } else {
//             if (y1 > y2) {
//                 var tx = x1; x1 = x2; x2 = tx;
//                 var ty = y1; y1 = y2; y2 = ty;
//             }
//             dx = x2 - x1;
//             for (var y=0; y<dy; y++) {
//                 var x = Math.floor(dx*y/dy + x1);
//                 this.setPixel(x, y+y1, color);
//             }
//         }
//     };
//     Buffer.prototype.drawCurve = function drawCurve(points, color) {
//         var n = points.length;
//         for (var x = points[0].x; x < points[n-1].x; x++) {
//             var y = 0;
//             for (var i=0; i<n; i++) {
//                 var prod = 1;
//                 for (var j=0; j<n; j++) {
//                     if (j != i) {
//                         prod *= (x - points[j].x)/(points[i].x - points[j].x);
//                     }
//                 }
//                 y += points[i].y*prod;
//             }
//             this.setPixel(x, y, color);
//         }
//     };
//     Buffer.prototype.drawSegments = function drawSegments(points, col3) {
//         col3[3] = col3[3] != undefined ? col3[3] : 255;
//         var color = `rgb(${col3[0]}, ${col3[1]}, ${col3[2]}, ${col3[3]})`
//         this.context.strokeStyle = color;
//         var p = points[0];
//         this.context.lineWidth = 10;
//         this.context.moveTo(p.x, p.y);
//         for (var i=1; i<points.length; i++) {
//             p = points[i];
// console.log(p.x, p.y, color);
//             this.context.lineTo(p.x, p.y);
//         }
//         this.context.stroke();
//     };
}