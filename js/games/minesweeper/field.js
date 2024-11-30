import { Particle } from './lib/particle.js'

class Field extends Particle {
    constructor(parent, col, row, v) {
        super('board-field', parent);
        this.elem.field = this;
        this.size = 32;
        this.col = col;
        this.row = row;
        this.state = 0;
        this.initialize(col, row, v);
    }

    initialize(x, y, v) {
        this.state = 0;
        this.value = v;
        this.updateFunction = Particle.springPhysics;
        this.elem.innerText = '';
    }

    setSize(size) {
        super.setSize(size, size);
        this.size = size;
    }

    setPosition(x, y) {
        this.targetPosition[0] = x;
        this.targetPosition[1] = y;
        // this.position[0] = 0;
        // this.position[1] = 0;
        this.update(0);
    }

    reveal() {
        var colors = ['#00c000', '#80ff80', '#ffff80', '#ffc000', '#ff6000', '#ff0000', '#c00000', '#600000', '#000000'];
        this.elem.classList.add('revealed');
        this.elem.classList.remove('flagged');
        this.state = 1;        
        if (this.value != 0) {
            this.elem.innerText = this.value != 9 ? this.value : 'M';
            this.elem.style.color = colors[this.value - 1];
        }
    }

    render() {
        super.render();
        this.elem.style.lineHeight = this.size + 'px';
    }
}

export { Field }