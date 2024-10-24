import { Field } from './field.js'

class Board {
    constructor(el) {
        this.parent = el;
        this.fields = [];
        this.onclick = e => null;
        this.onrightclick = e => null;
        this.hiddenFields = 0;
        //this.initialize(cols, rows, mineCount);
    }

    initialize(cols, rows, mineCount) {
        this.cols = cols;
        this.rows = rows;
        this.mineCount = mineCount;
        this.createFields();
        this.addMines();
        this.resize();
    }

    resize() {
        this.size = Math.min(this.parent.offsetWidth / this.cols, this.parent.offsetHeight / this.rows);
        var y = 0;
        for (var ri=0; ri<this.rows; ri++) {
            var x = 0;
            for (var ci=0; ci<this.cols; ci++) {
                var field = this.fields[ri][ci];
                field.setSize(this.size);
                field.setPosition(x, y);
                field.render();
                x += this.size;
            }
            y += this.size;
        }
    }

    createFields() {
        for (var ri=0; ri<this.rows; ri++) {
            var row = this.fields[ri];
            if (!row) {
                row = this.fields[ri] = [];
            }
            for (var ci=0; ci<this.cols; ci++) {
                var field = row[ci];
                if (!field) {
                    row[ci] = field = new Field(ci, ri, 0);
                    this.parent.appendChild(field.div);
                    field.div.addEventListener('click', e => this.onclick(e.currentTarget.field));
                    field.div.addEventListener('contextmenu', e => {
                        this.onrightclick(e.currentTarget.field);
                        e.stopPropagation();
                        e.preventDefault();
                    });
                } else {
                    field.initialize(ci, ri, 0);
                }
                this.hiddenFields++;
            }

            // remove unused fields
            for (var ci=this.cols; ci < row.length; ci++) {
                this.parent.removeChild(row[ci].div);
                delete row[ci];
            }
            row.length = this.cols;
        }

        for (var ri=this.rows; ri<this.fields.length; ri++) {
            var row = this.fields[ri];
            for (var ci=0; ci < this.cols; ci++) {
                this.parent.removeChild(row[ci].div);
                delete row[ci];
            }
            this.fields.length = this.rows;
        }
    }

    addMines() {
        for (var mi=0; mi<this.mineCount; mi++) {
            while (true) {
                var mx = Math.floor(Math.random() * (this.cols-1));
                var my = Math.floor(Math.random() * (this.rows-1));
                if (this.fields[my][mx].value != 9) {
                    this.fields[my][mx].value = 9;
                    // update neighbours
                    for (var dx=-1; dx<2; dx++) {
                        for (var dy=-1; dy<2; dy++) {
                            var fx = mx + dx;
                            var fy = my + dy;
                            if (fx >= 0 && fx < this.cols && fy >= 0 && fy < this.rows && this.fields[fy][fx].value != 9) {
                                this.fields[fy][fx].value++;
                            }                            
                        }
                    }
                    break;
                }
            }
            this.hiddenFields--;
        }

    }

    reveal(fields) {
        var nextFields = [];
        for (var field of fields) {
            if (field.value != 9 && field.state == 0) {
                field.state = 1;
                field.reveal();
                this.hiddenFields--;
                if (field.value == 0) {
                    // reveal neighbours
                    for (var dx=-1; dx<2; dx++) {
                        for (var dy=-1; dy<2; dy++) {
                            var fx = field.col + dx;
                            var fy = field.row + dy;
                            if (fx >= 0 && fx < this.cols && fy >= 0 && fy < this.rows) {
                                nextFields.push(this.fields[fy][fx]);
                            }                            
                        }
                    }
                }
            }
        }
        if (nextFields.length > 0) {
            setTimeout(() => this.reveal(nextFields), 50);
        }
    }

    revealAll() {
        for (var ri=0; ri<this.rows; ri++) {
            for (var ci=0; ci<this.cols; ci++) {
                var field = this.fields[ri][ci];
                field.reveal();
            }
        }
    }
}

export { Board }