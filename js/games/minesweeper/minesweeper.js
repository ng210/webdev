import { Game } from './lib/game.js'
import { Board } from './board.js'
import { Particle } from './lib/particle.js'

class Minesweeper extends Game {
    constructor(parent, width, height) {
        super(parent);
        this.particleSpeed = 0.04;

        // board
        this.width = width;
        this.height = height;
        this.board = null;
        this.mineCount = Math.floor(width * height / 10);

        // header
        this.text = 'MINESWEEPER';
        this.header = null;
        this.fontSize = 12;
        this.letters = [];
    }

    //#region Game overrides
    async loadAssets() {
        this.audioLib.loadSamples({
            boom2:      'res/boom2.mp3',
            firework1:  'res/firework1.mp3',
            firework2:  'res/firework2.mp3',
            firework3:  'res/firework3.mp3',
            gameover:   'res/pacman_death.mp3',
            won:        'res/won.mp3'
        });
    }

    update(dt) {
        switch (this.state) {
            case 0:
                this.createHeader();
                this.state = 1;
                break;
            case 1:
                this.showMessageBox(false);
                this.createBoard();
                this.state = 2;
                this.positionMessageBox(0, 0);
                break;
            case 2:
                break;
        }
    }

    resize() {
        super.resize();
        for (var ci in this.letters) {
            var lt = this.letters[ci];
            this.calculateTargetForLetter(lt, ci);
            if (this.animatedParticles.indexOf(lt) == -1) {
                this.animatedParticles.push(lt);
            }
        }
    
        this.board.resize();
    }
    //#endregion

    //#region Event handlers
    onClickField(field) {
        if (this.state == 2) {
            if (field.value != 9) {
                this.board.reveal([field], f => this.explode(f));
                if (this.board.hiddenFields == 0) {
                    this.gameWon();
                    this.state = 3;
                }
            } else {
                this.gameOver();
                this.state = 3;
            }
            
        }
    }
    
    onRightClickField(field) {
        if (this.state == 2 && field.state == 0) {
            field.elem.classList.toggle('flagged');
        }
    }

    revealRow(ri) {
        var end = ri - 2;
        if (end < 0) end = -1;
        for (; ri>end; ri--) {
            var row = this.board.fields[ri];
            for (var field of row) {
                field.reveal();
                this.explode(field, true);
            }
        }
        if (ri > 0) {
            setTimeout(() => this.revealRow(ri), 10);
        }
    }

    gameOver() {
        this.playSound("boom2");
        this.revealRow(this.board.rows - 1);
        this.playSound("gameover");
        this.state = 3;
        this.message('Game over!', {
            'Restart': () => {
                this.state = 1;
            }
        });
    }

    gameWon() {
        this.board.revealAll();
        this.playSound("won");
        this.state = 3;
        this.message('You won!', {
            'Restart': () => {
                this.state = 1;
            }
        });
    }
    //#endregion

    //#region Misc functions
    playSound(id, field) {
        var volume = 0.5;
        var panning = 0.0;
        var detune = 0.0;
        if (field) {
            volume = 0.1 + 0.4 * Math.random()
            panning = 2 * field.position[0] / this.board.parent.offsetWidth - 1.0;
            detune = 100 * Math.round(20 * (Math.random() - 0.5));
        }
        this.audioLib.playSample(id, volume, panning, detune);
    }
    //#endregion
    
    //#region Board functions
    createBoard() {
        this.board = this.board || new Board(this.parent);
        this.board.onclick = field => this.onClickField(field);
        this.board.onrightclick = field => this.onRightClickField(field);
        this.board.initialize(this.width, this.height, this.mineCount);
        var game = this;
        this.board.forEachField(
            function() {
                this.position[0] = game.board.parent.offsetWidth / 2;
                this.position[1] = game.board.parent.offsetHeight / 2
                this.update(0);
                var arg = Math.atan2(-this.distance[1], -this.distance[0]) + 0.1 * Math.PI * (Math.random() - 0.5);
                var amp = 0.001 * Math.sqrt(this.distance[2]);   // * (0.6 + 0.2 * Math.random());
                this.velocity[0] = amp * Math.cos(arg);
                this.velocity[1] = amp * Math.sin(arg);
                if (game.animatedParticles.indexOf(this) == -1) {
                    game.animatedParticles.push(this);
                }
            });
    }

    explode(field, isMute) {
        var y = 0;
        const count = 3;
        var bw = parseInt(field.elem.computedStyleMap().get("border-width"));
        var wi = (field.width - 2*bw) / count, he = (field.height - 2*bw) / count;
        for (var j=0; j<count; j++) {
            var x = 0;
            for (var i=0; i<count; i++) {
                var frac = new Particle('fraction', this.board.parent);
                frac.maxLifeSpan = 60;
                frac.position[0] = field.position[0] + bw + Math.round(x);
                frac.position[1] = field.position[1] + bw + Math.round(y);
                var arg = -Math.PI * ( 0.25 + 0.5 * Math.random());
                var amp = 30 * (0.4 + 0.6 * Math.random());
                frac.velocity[0] = amp * Math.cos(arg);
                frac.velocity[1] = amp * Math.sin(arg);
                frac.acceleration[0] = 0;
                frac.acceleration[1] = 1.0;
                frac.setSize(wi, he);
                frac.render();
                this.animatedParticles.push(frac);
                x += wi;
            }
            y += he;
        }
    
        this.board.forEachField(
            function() {
                const maxDistance = 30000;
                if (this != field) {
                    var dx = this.position[0] - field.position[0];
                    var dy = this.position[1] - field.position[1];
                    var dist = dx*dx + dy*dy;
                    if (dist < maxDistance) {
                        var angle = Math.atan2(dy, dx);
                        var amp = 10 * (maxDistance - dist) / maxDistance;
                        this.velocity[0] = amp * Math.cos(angle);
                        this.velocity[1] = amp * Math.sin(angle);
                    }
                }
        });
    
        if (!isMute) {
            this.playSound("firework"+Math.floor(1 + 2*Math.random()), field);
        }
    }
    //#endregion

    //#region Header
    createHeader() {
        this.header = document.getElementsByClassName('header')[0];
        // calculate letter height
        var dummy = document.createElement('div');
        dummy.className = 'letter';
        dummy.innerText = 'M';
        this.header.appendChild(dummy);
        this.fontSize = dummy.offsetHeight;
        this.header.removeChild(dummy);

        this.createLetters();
    }
    
    createLetters() {
        for (var li=0; li<this.text.length; li++) {
            var lt = new Particle('letter', this.header);
            lt.elem.innerHTML = this.text[li];
            this.calculateTargetForLetter(lt, li);
    
            lt.position[0] = this.parent.offsetWidth * (0.1 + 0.8 * li/this.text.length);
            lt.position[1] = 0.1 * this.parent.offsetHeight - this.fontSize * (1 + 2 * (Math.random() - 0.5));
            lt.update(0);
            this.letters.push(lt);
            this.animatedParticles.push(lt);
            lt.updateFunction = Particle.springPhysics;
        }
    }
    
    calculateTargetForLetter(lt, ix) {
        lt.targetPosition[0] = Math.floor(0.3 * this.header.offsetWidth + ix * 0.4 * this.header.offsetWidth / this.text.length);
        lt.targetPosition[1] = Math.floor((this.header.offsetHeight - this.fontSize) / 2);
    }
    //#endregion
}

export { Minesweeper }