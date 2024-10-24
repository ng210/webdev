class Field {
    constructor(col, row, v) {
        this.div = document.createElement('div');
        this.div.className = 'board-field';
        this.div.field = this;
        this.size = 32;
        this.col = col;
        this.row = row;
        this.state = 0;
        this.initialize(col, row, v);
    }

    initialize(x, y, v) {
        this.setPosition(x, y);
        this.value = v;
    }

    setSize(size) {
        this.size = size;
        this.div.style.lineHeight = size + 'px';
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    reveal() {
        var colors = ['#00ff00', '#80ff80', '#ffff80', '#ffff00', '#ff8000', '#ff0000', '#800000', '#000000'];
        this.div.classList.add('revealed');
        if (this.value != 0) {
            this.div.innerText = this.value != 9 ? this.value : 'M';
            this.div.style.color = colors[this.value];
        }
    }

    render() {
        this.div.style.width = this.size + 'px';
        this.div.style.height = this.size + 'px';
        this.div.style.left = this.x + 'px';
        this.div.style.top = this.y + 'px';
    }
}

export { Field }