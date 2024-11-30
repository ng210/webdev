import { Bob } from './bob.js'

class Stack extends Bob {
    constructor(parent, cols, rows) {
        super('stack', parent);
        this.cols = cols;
        this.rows = rows;
        this.bobs = [];
        for (var ri=0; ri<rows; ri++) {
            var row = [];
            for (var ci=0; ci<cols; ci++) {
                row.push(null);
                // var bob = new Bob(['item', 'cell'], this.elem)
                // bob.elem.style.display = 'none';
                // bob.ci = ci;
                // bob.ri = ri;
                // row.push(bob);
            }
            this.bobs.push(row);
        }
    }

    setSize(size) {
        super.setSize(this.cols * size, this.rows * size);
        this.size = size;
        // for (var row of this.bobs) {
        //     for (var bob of row) {
        //         bob.setSize(size, size);
        //         bob.position[0] = bob.ci * size;
        //         bob.position[1] = bob.ri * size;
        //     }
        // }
        super.render();
    }

    canMove(item, delta) {
        var result = true;
        for (var bob of item.bobs) {
            var ci = item.ci + bob.ci + delta[0];
            var ri = item.ri + bob.ri + delta[1];
            if (ri == this.rows || this.bobs[ri][ci] != null) {
                result = false;
                break;
            }
        }
        return result;
    }

    removeItems(items) {
        for (var item of items) {
            for (var bob of item.bobs) {
                var ri = item.ri + bob.ri;
                var ci = item.ci + bob.ci;
                this.bobs[ri][ci] = null;
            }
        }
    }

    putItems(items) {
        for (var item of items) {
            for (var bob of item.bobs) {
                var ri = item.ri + bob.ri;
                var ci = item.ci + bob.ci;
                this.bobs[ri][ci] = bob;
            }
        }
    }

    render() {
        // for (var ri=0; ri<this.rows; ri++) {
        //     for (var ci=0; ci<this.cols; ci++) {
        //         var cell = this.bobs[ri][ci];
        //         if (cell) {
        //             cell.render();
        //         }
        //     }
        // }
    }
}

export { Stack }