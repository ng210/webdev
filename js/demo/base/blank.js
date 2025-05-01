import Demo from '/js/demo/base/demo.js'
import Buffer from '/js/lib/glui/buffer.js'

export default class Blank extends Demo {
    #buffer;

    constructor() {
        super();
        this.#buffer = new Buffer(this.frontBuffer.width, this.frontBuffer.height);
        this.settings = {
        };
    }

	onChange(id, value) {
        return true;
	}

    update(frame, dt) {
    }

    render(frame, dt) {
		this.#buffer.update();
		this.frontBuffer.blit(this.#buffer);
    }
}
