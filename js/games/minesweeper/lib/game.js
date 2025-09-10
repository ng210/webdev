import { AudioLib } from './audio-lib.js'

class Game {
    constructor(parent) {
        this.parent = parent || document.body;

        this.particles = [];
        this.animatedParticles = [];
        this.particleSpeed = 0.1;

        this.audioLib = new AudioLib();

        this.state = 0;
        this.messageBox = document.getElementById('message');

        window.addEventListener('keydown', e => this.keyDown(e));
        window.addEventListener('keyup', e => this.keyUp(e));

        this.currentTime = Date.now();
    }

    keyDown(e) {
        // if (e.key == ' ') {
        //     if (_isRunning) {
        //         _isRunning = false;
        //     } else {
        //         _isRunning = true;
        //         _t1 = Date.now();
        //         mainLoop();
        //     }
        // }
    }

    keyUp(e) {
    }

    async loadAssets() {

    }

    mainLoop() {
        var ts = Date.now();
        var dt = (ts - this.currentTime);

        this.animatedParticles.forEach(p => {
            if (!p.update(this.particleSpeed * dt)) {
                var ix = this.animatedParticles.indexOf(p);
                this.animatedParticles.splice(ix, 1);    
            }
        });
        this.update(dt);

        this.animatedParticles.forEach(p => p.render());
        this.render(dt);
    
        this.currentTime = ts;
        if (this.state != -1) {
            requestAnimationFrame(() => this.mainLoop());
        }
    }

    update(dt) {
        switch (state) {
        }
    }

    render(dt) {

    }

    resize() {
        if (this.messageBox) {
            this.positionMessageBox();
        }
    }

    message(text, buttons) {
        this.messageBox.children[0].innerHTML = text;
        this.messageBox.children[1].innerHTML = '';
        if (buttons) {
            for (var bi in buttons) {
                var btn = document.createElement('button');
                btn.innerText = bi;
                btn.addEventListener('click', buttons[bi]);
                this.messageBox.children[1].appendChild(btn);
            }
        }
        this.messageBox.style.display = 'block';
        this.positionMessageBox();
        this.showMessageBox();
    }

    positionMessageBox(x, y) {
        if (x == undefined || x == 'center') x = this.parent.offsetLeft + (this.parent.offsetWidth - this.messageBox.offsetWidth) / 2 + 'px';
        if (y == undefined || y == 'center') y = this.parent.offsetTop + (this.parent.offsetHeight - this.messageBox.offsetHeight) / 2 + 'px';
        this.messageBox.style.left = x;
        this.messageBox.style.top = y;
    }

    showMessageBox(show) {
        this.messageBox.style.display = show == true || show === undefined ? 'block' : 'none';
    }
}

export { Game }