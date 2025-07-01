import Demo from '../base/demo.js'
import Buffer from '../../lib/glui/buffer.js'

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
