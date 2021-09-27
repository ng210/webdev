include('./input-handler.js');
(function() {
    var Keys = {};
    function KeyboardHandler() {
        KeyboardHandler.base.constructor.call(this);
        this.shiftLeft = false;
        this.altLeft = false;
        this.ctrlLeft = false;
        this.shiftRight = false;
        this.altRight = false;
        this.ctrlRight = false;
        this.keys = new Array(512);
        for (var i=0; i<this.keys.length; i++) this.keys[i] = false;
        addEventListener('keydown', e => this.oninput(e, true));
        addEventListener('keyup', e => this.oninput(e, false));
        this.activeKeys = [];
        // TODO: populate Keys map
    }
    extend(ge.InputHandler, KeyboardHandler);

    KeyboardHandler.prototype.oninput = function oninput(e, isDown) {
        switch (e.code) {
            case 'ShiftLeft': this.shiftLeft = isDown; break;
            case 'AltLeft': this.altLeft = isDown; break;
            case 'ControlLeft': this.controlLeft = isDown; break;
            case 'ShiftRight': this.shiftRight = isDown; break;
            case 'AltRight': this.altRight = isDown; break;
            case 'ControlRight': this.controlRight = isDown; break;
            default:
                if (e.keyCode < 255) {
                    var k = 2*e.keyCode;
                    this.keys[k+1] = this.keys[k];
                    this.keys[k] = isDown;
                    this.activeKeys.push(k);
                }
                break;
        }
    };

    KeyboardHandler.prototype.update = function update() {
        while (this.activeKeys.length > 0) {
            var k = this.activeKeys.pop();
            this.keys[k+1] = this.keys[k];
        }
    };

    KeyboardHandler.prototype.isPressed = function isPressed(keyCode) {
        return this.keys[2*keyCode] && !this.keys[2*keyCode+1];
    };
    
    KeyboardHandler.prototype.isReleased = function isReleased(keyCode) {
        return !this.keys[2*keyCode] && this.keys[2*keyCode+1];
    };

    publish(KeyboardHandler, 'KeyboardHandler', ge);
    publish(Keys, 'Keys', ge);
})();