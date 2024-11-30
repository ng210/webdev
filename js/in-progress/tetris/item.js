import { Bob } from './bob.js'

const ItemTypes = {
    'LType': [
        [1,0],
        [1,0],
        [1,1]],
    'TType': [
        [1,1,1],
        [0,1,0]],
    'IType': [
        [1],[1],[1],[1]],
    'OType': [
        [1,1],
        [1,1]],
    'RLType': [
        [0,1],
        [0,1],
        [1,1]]
};

class Item extends Bob {
    constructor(parent, type) {
        var className = ['item', type.toLowerCase()];
        super(className, parent);
        this.className = className;
        this.bobs = [];
        this.type = type;
        this.rotation = 0;
        this.createBobs();
        this.ci = 0;
        this.ri = 0;
    }

    createBobs() {
        var layout = ItemTypes[this.type];
        this.rows = layout.length;
        this.cols = layout[0].length;
        for (var ri=0; ri<layout.length; ri++) {
            var row = layout[ri];
            for (var ci=0; ci<row.length; ci++) {
                if (row[ci] == 1) {
                    var bob = new Bob(this.className, this.elem);
                    bob.ri = ri;
                    bob.ci = ci;
                    this.bobs.push(bob);
                }
            }
        }
    }

    setSize(size) {
        this.size = size;
        for (var bob of this.bobs) {
            bob.setSize(size, size);
            bob.position[0] = bob.ci * size;
            bob.position[1] = bob.ri * size;
        }
    }

    move(ci, ri) {
        this.ci = ci;
        this.ri = ri;
        this.position[0] = ci * this.size;
        this.position[1] = ri * this.size;
        // for (var bob of this.bobs) {
        //     bob.position[0] = bob.ci * this.size + x;
        //     bob.position[1] = bob.ri * this.size + y;
        // }
    }

    rotate(d) {
        d = d || 0;
        d = d % 4;
        this.rotation += d;
        // var rows = ((this.rows - 1) >> 1);
        // var cols = ((this.cols - 1) >> 1);
        while (d-- > 0) {
            for (var bob of this.bobs) {
                // translate to (0,0)
                var x = bob.ci - ((this.cols - 1) >> 1);
                var y = bob.ri - ((this.rows - 1) >> 1);
                // rotate by 90: x, y -> -y, x
                bob.ci = -y;
                bob.ri = x;
                // translate back
                bob.ci += ((this.cols - 1) >> 1);
                bob.ri += ((this.rows - 1) >> 1);
                bob.position[0] = bob.ci * this.size;
                bob.position[1] = bob.ri * this.size;
            }
        }
    }


    update(dt) {
        super.update(dt);
        this.ri = Math.floor(this.position[1] / this.size);
        for (var bob of this.bobs) {
            bob.update(dt);
        }
    }

    render() {
        super.render();
        for (var bob of this.bobs) {
            bob.render();
        }
    }
}

export { ItemTypes, Item }