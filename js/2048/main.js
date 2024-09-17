const BLOCK_SIZE = 80;
const INIT_BLOCK_COUNT = 2;
const MOVE_SPEED = 1.1; // px/s

class Block {
    constructor(cls, v, i, j) {
        this.value = v;
        this.i = 0;
        this.j = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        var el = document.createElement('div');
        el.id = `${cls}_${i}_${j}`;
        el.className = cls + ' tile';
        el.style.width = BLOCK_SIZE;
        el.style.height = BLOCK_SIZE;
        el.innerHTML = v;
        this.elem = el;
        this.setToBlock(i, j);
    }

    setToBlock(i, j) {
        this.i = i;
        this.offsetX = 0;
        this.j = j;
        this.offsetY = 0;
        this.setPosition(i*BLOCK_SIZE, j*BLOCK_SIZE);
    }

    setPosition(x, y) {
        this.elem.style.left = x;
        this.elem.style.top = y;
    }

    moveOneBlock(dx, dy) {
        var isDone = true;

        this.offsetX += dx;
        this.offsetY += dy;

        if (this.offsetX <= -BLOCK_SIZE) this.setToBlock(this.i - 1, this.j);
        else if (this.offsetX >= BLOCK_SIZE) this.setToBlock(this.i + 1, this.j);
        else {
            this.setPosition(this.i*BLOCK_SIZE + this.offsetX, this.j*BLOCK_SIZE + this.offsetY);
            isDone = false;
        }

        return isDone;
    }
}

class Game2048 {
    constructor(size, boardId) {
        this.timeStamp = 0;
        this.isAnimationDisabled = false;
        this.rafHandler = null;

        this.size = size;
        this.container = document.getElementById(boardId);
        this.container.style.width = size*BLOCK_SIZE;
        this.container.style.height = size*BLOCK_SIZE;
    
        for (var i=0; i<size; i++) {
            for (var j=0; j<size; j++) {
                var bl = new Block('grid', '', i, j);
                this.container.appendChild(bl.elem);
            }
        }

        this.board = new Array(size);
        for (var i=0; i<size; i++) {
            this.board[i] = new Array(size);
            for (var j=0; j<size; j++) {
                this.board[i][j] = null;
            }
        }

        for (var n=0; n<INIT_BLOCK_COUNT; n++) {
            this.addRandomBlock();
        }
    }

    checkCells() {
        var freeCells = [];
        for (var i=0; i<this.size; i++) {
            for (var j=0; j<this.size; j++) {
                if (this.board[i][j] == null) {
                    freeCells.push([i,j]);
                }
            }
        }
        if (freeCells.length == 0) alert('Game over!');
        return freeCells;
    }

    addRandomBlock() {
        this.isAnimationDisabled = true;
        var freeCells = this.checkCells();
        if (freeCells.length > 0) {
            var cell = freeCells[Math.ceil(Math.random()*(freeCells.length-1))];
            var i = cell[0], j = cell[1];
            var v = Math.pow(2, Math.round(Math.random()) + 1);
            var bl = new Block('block', v, i, j);
            bl.elem.style.fontSize = 0.5*BLOCK_SIZE + 'px';
            bl.elem.className += ' anim_grow';
            this.container.appendChild(bl.elem);
            this.board[i][j] = bl;
            this.isAnimationDisabled = false;
        }
    }

    checkAndMerge(blSource, blTarget) {
        if (blSource.value == blTarget.value) {
            this.board[blSource.i][blSource.j] = null;
            blTarget.value *= 2;
            blTarget.elem.innerHTML = blTarget.value;
            this.container.removeChild(blSource.elem);
        }
    }

    async moveBlocks(cb) {
        this.isAnimationDisabled = true;
        this.timeStamp = 0;
        this.rafHandler = requestAnimationFrame(ts => this[cb](ts));
    }

    moveBlock(i, j, dx, dy) {
        var hasMoved = false;
        var bl1 = this.board[i][j];
        if (bl1) {
            var bl2 = this.board[i+dx][j+dy];
            if (bl2 != null) {
                if (bl2.value == bl1.value) {
                    this.container.removeChild(bl1.elem);
                    this.board[i][j] = null;
                    bl2.value += bl1.value;
                    bl2.elem.innerHTML = bl2.value;
                }
            } else {
                bl1.setToBlock(i+dx, j+dy);
                this.board[i+dx][j+dy] = bl1;
                this.board[i][j] = null;
                hasMoved = true;
            }
        }

        return hasMoved;
    }

    endMove(hasMovingBlock, cb) {
        if (hasMovingBlock) {
            this.rafHandler = requestAnimationFrame(t => this[cb](t));
        } else {
            this.addRandomBlock();
        }
        this.isAnimationDisabled = false;
        this.checkCells();
    }

    _moveBlocksLeft(ts) {
        //cancelAnimationFrame(this.rafHandler);
        if (this.timeStamp == 0) this.timeStamp = ts;
        var hasMovingBlock = false;
        for (var i=1; i<this.size; i++) {
            for (var j=0; j<this.size; j++) {
                hasMovingBlock = hasMovingBlock || this.moveBlock(i, j, -1, 0);
            }
        }
        
        this.endMove(hasMovingBlock, '_moveBlocksLeft');
    }

    _moveBlocksRight(ts) {
        //cancelAnimationFrame(this.rafHandler);
        if (this.timeStamp == 0) this.timeStamp = ts;
        var hasMovingBlock = false;
        for (var i=this.size-2; i>=0; i--) {
            for (var j=0; j<this.size; j++) {
                hasMovingBlock = hasMovingBlock || this.moveBlock(i, j, 1, 0);
            }
        }
        
        this.endMove(hasMovingBlock, '_moveBlocksRight');
    }

    _moveBlocksUp(ts) {
        //cancelAnimationFrame(this.rafHandler);
        if (this.timeStamp == 0) this.timeStamp = ts;
        var hasMovingBlock = false;
        for (var j=1; j<this.size; j++) {
            for (var i=0; i<this.size; i++) {
                hasMovingBlock = hasMovingBlock || this.moveBlock(i, j, 0, -1);
            }
        }
        
        this.endMove(hasMovingBlock, '_moveBlocksUp');
    }

    _moveBlocksDown(ts) {
        //cancelAnimationFrame(this.rafHandler);
        if (this.timeStamp == 0) this.timeStamp = ts;
        var hasMovingBlock = false;
        for (var j=this.size-2; j>=0; j--) {
            for (var i=0; i<this.size; i++) {
                hasMovingBlock = hasMovingBlock || this.moveBlock(i, j, 0, 1);
            }
        }
        
        this.endMove(hasMovingBlock, '_moveBlocksDown');
    }

    async onKeyHandler(e) {
        if (!this.isAnimationDisabled) {
            switch (e.key) {
                case 'ArrowUp': await this.moveBlocks('_moveBlocksUp'); break;
                case 'ArrowDown': await this.moveBlocks('_moveBlocksDown'); break;
                case 'ArrowLeft': await this.moveBlocks('_moveBlocksLeft'); break;
                case 'ArrowRight': await this.moveBlocks('_moveBlocksRight'); break;
            }
        }
    }

    main() {
        window.addEventListener('keydown', e => this.onKeyHandler(e));
    }
}

var _game = null;

window.onload = function() {
    _game = new Game2048(5, 'board');
    _game.main();
}
