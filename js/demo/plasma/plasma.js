import Demo from '../base/demo.js'
import Buffer from '../../lib/glui/buffer.js'
import { lerp } from '../../lib/fn.js'

export default class Plasma extends Demo {
    #counter;
    #vx;
    #vy;
    #buffer;

    get size() {
        return [400, 300];
    }

    constructor() {
        super();
        this.#counter = 0;
        this.#vx = 0;
        this.#vy = 0;

        this.settings = {
			zoom:       { value: 2,   min:1,  max:50,   step: 0.1 },
			motion:     { value: 1,   min:-10,max:10,   step: 0.1 },
			variation:  { value: 4,   min:0,  max:10,   step: 0.01 },
			shape:      { value: 0,   min:0,  max:3,    step: 0.01 },
			color:      { value: 0,   min:0,  max:2,    step: 1 },
			saturation: { value: 0.6, min:0,  max:1,    step: 0.01 }
        };
    }

	async initialize() {
		super.initialize();
		this.frontBuffer = new Buffer(this.canvas);
		this.#buffer = new Buffer(this.frontBuffer.width/2, this.frontBuffer.height/2);
	}

	onChange(id, value) {
		if (id == 'shape') this.updateVelocity(value);
		return true;
	}

    update(frame, dt) {
        this.#counter += this.settings.motion.value * dt / 1000;
    }

    render(frame, dt) {
		var ix = 0;
		for (var j=0; j<this.#buffer.height; j++) {
			for (var i=0; i<this.#buffer.width; i++) {
				var x = i/this.#buffer.width - 0.5;
				var y = j/this.#buffer.height - 0.5;
				var v = 0;
				var cx = x * this.settings.zoom.value;
				var cy = y * this.settings.zoom.value;
				v += this.#vx * Math.cos(cx + this.#counter);
				v += this.#vy * Math.sin(cy + this.#counter);
				v += Math.sin((cx + cy + this.#counter)/2.0);
				cx += Math.sin(this.#counter/3.0);
				cy += Math.cos(this.#counter/2.0);
				v += Math.sin(Math.sqrt(cx*cx + cy*cy) + this.#counter);
				v *= this.settings.variation.value;
				var color = this.getColor(v);
				var c = 0.2989 * color[0] + 0.5870 * color[1] + 0.1140 * color[2];

				this.#buffer.imageData.data[ix++] = 255 * lerp(c, color[0], this.settings.saturation.value);
				this.#buffer.imageData.data[ix++] = 255 * lerp(c, color[1], this.settings.saturation.value);
				this.#buffer.imageData.data[ix++] = 255 * lerp(c, color[2], this.settings.saturation.value);
				this.#buffer.imageData.data[ix++] = 255;
			}
		}
		this.#buffer.update();
		this.frontBuffer.blit(this.#buffer);
    }

    updateVelocity(value) {
		this.#vx = value;
		this.#vy = value * this.#buffer.height/this.#buffer.width;
	};

    getColor(v) {
		var color = [0, 0, 0];
		switch (this.settings.color.value+'') {
			case '0':
				color[0] = 0.5 + 0.5*Math.sin(Math.PI * v + this.#counter);
				color[1] = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5) + this.#counter);
				color[2] = 0.5 + 0.5*Math.cos(Math.PI * v + this.#counter);
				break;
			case '1':
				color[0] = 0.5 + 0.5*Math.cos(Math.PI * v);
				color[1] = 0.5 + 0.5*Math.sin(Math.PI * v);
				color[2] = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5));
				break;
			case '2':
				color[0] = 0.2;
				color[1] = 0.2;
				color[2] = 0.6 + 0.2*Math.cos(Math.PI * v);
				break;
		}
		return color;
	};

}
