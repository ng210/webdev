import { load } from '../../lib/loader/load.js'
import Demo from '../base/demo.js'
import Buffer from '../../lib/glui/buffer.js'
import Vec2 from '../../lib/math/vec2.js'

export default class Bump extends Demo {
	#heightMap = null;
	#buffer = null;
	#heightMaps = [];
	//#cursor = [0, 0];
	#mouse = new Vec2();
	#ratio = [1, 1];

	constructor() {
		super();
		this.#buffer = new Buffer(...this.size);
		this.settings = {
			image:		{ value:   0, min:   0, max:   1, step:    1 },
			intensity:	{ value: 0.7, min: 0.0, max: 2.0, step: 0.01 },
			radius:		{ value: 0.3, min: 0.0, max: 1.0, step: 0.01 },
			ambient:	{ value:-0.4, min:-0.5, max: 0.5, step: 0.01 }
		};
	}

	async initialize() {
		super.initialize();
		this.frontBuffer = new Buffer(this.canvas);
		this.#buffer = new Buffer(this.frontBuffer.width/2, this.frontBuffer.height/2);

		// create list of images
		let urls = [
			'assets/bump.gif',
			'assets/bump2.gif',
			'assets/bump3.png',
			'assets/javascript.gif'
		];
		this.#heightMaps = [];
		let responses = [];
		let dataSource = { list:[], value: 0 };
		for (let url of urls) {
			responses.push(load(url)
				.then(
					async resp => {
						if (resp.content instanceof Error) {
							console.log(resp.content);
						} else {
							dataSource.list.push(resp.url.split('/').pop());
							const img = new Image();
							img.src = URL.createObjectURL(resp.content);
							await img.decode();
							this.#heightMaps.push(this.createHeightMap(img));
						}
					}));
		}
		await Promise.all(responses);
		this.settings.image.control.dataBind(dataSource);
		this.setImage(0);
		this.resize();
		this.update(0);

		//glui.canvas.addEventListener('mousemove', e => Bump.onmousemove(e));
	}

    get size() {
        return [600, 400];
    }

	resize(e) {
		// this.ratio[0] = this.#buffer.width/glui.canvas.clientWidth;
		// this.ratio[1] = this.#buffer.height/glui.canvas.clientHeight;
	}

	onChange(id, value) {
		switch (id) {
			case 'image':
				this.setImage(value);
				break;
		}
		return true;
	}

	update(frame, dt) {
		let wi = this.#heightMap.buffer.width;
		let he = this.#heightMap.buffer.height;
		let radius = 0.5 * (this.settings.radius.value + 0.01) * wi;
		let ix = wi + 1;
		this.#mouse.x = this.mousePos.x / this.canvas.width * wi;
		this.#mouse.y = this.mousePos.y / this.canvas.height * he;		
		//GE.ctx.clearRect(0, 0, wi, he);
		for (let y=1; y<he-1; y++) {
			for (let x=1; x<wi-1; x++) {
				// let lx = x - this.cursor[0];
				// let ly = y - this.cursor[1];
				let lx = x - this.#mouse.x;
				let ly = y - this.#mouse.y;
				let h = this.#heightMap.map[ix] * this.settings.ambient.value;
				let l = Math.sqrt(lx*lx + ly*ly);
				if (l < radius)
				{
					let nx = this.#heightMap.map[ix-1] - this.#heightMap.map[ix+1];
					let ny = this.#heightMap.map[ix-wi] - this.#heightMap.map[ix+wi];

					lx -= nx;
					if (lx < 0) lx = -lx;
					if (lx > 127) lx = 127;
					nx = 127-lx;
					if (nx < 0) nx = 1;

					ly -= ny;
					if (ly < 0) ly = -ly;
					if (ly > 127) ly = 127;
					ny = 127-ly;
					if (ny < 0) ny = 1;

					h += (nx + ny) * this.settings.intensity.value * Math.cos(Math.PI/2 * l/radius);
				}
				if (h > 255) h = 255;
				if (h < 0) h = 0;
				h /= 255;
				this.#buffer.imageData.data[4*ix+0] = h*this.#heightMap.buffer.imageData.data[4*ix];
				this.#buffer.imageData.data[4*ix+1] = h*this.#heightMap.buffer.imageData.data[4*ix+1];
				this.#buffer.imageData.data[4*ix+2] = h*this.#heightMap.buffer.imageData.data[4*ix+2];
				this.#buffer.imageData.data[4*ix+3] = 255;
				ix++;
			}
			// skip last pixel and first pixel on next row
			ix+=2;
		}
		this.#buffer.update();
	}

	render(frame, dt) {
		//this.#buffer.update();
		//this.frontBuffer.blit(this.#buffer);
		this.frontBuffer.blit(this.#buffer);
	}

	setImage(ix) {
		this.#heightMap = this.#heightMaps[ix];
		let hm = this.#heightMap;
		if (this.#buffer.width != hm.buffer.width || this.#buffer.height != hm.buffer.height) {
			this.#buffer.resize(hm.buffer.width, hm.buffer.height);
		}
		this.#heightMap = this.#heightMaps[ix];
		this.resize();
	}

	createHeightMap(img) {
		let buffer = new Buffer(img);
		//buffer.blitImage(img);
		let heightMap = {
			buffer: buffer,
			map: new Uint8Array(buffer.width * buffer.height)
		};
		let ix = 0, jx = 0;
		for (let j=0; j<buffer.height; j++) {
			for (let i=0; i<buffer.width; i++) {
				let v = 0.2989 * buffer.imageData.data[ix++];
				v += 0.5870 * buffer.imageData.data[ix++];
				v += 0.1140 * buffer.imageData.data[ix++];
				heightMap.map[jx++] = v;
				ix++;
			}
		}
		return heightMap;
	}
}
