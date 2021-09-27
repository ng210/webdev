include('./input-handler.js');
(function() {
    function MouseHandler() {
        MouseHandler.base.constructor.call(this);
        this.position = new V2();
        this.positionRelative = new V2();
        this.buttons = new Array(6);    // 3 buttons * 2 states
        this.activeButtons = [];
        for (var i=0; i<this.buttons.length; i++) this.buttons[i] = false;;
        addEventListener('mouseup', e => this.oninput(e, false));
        addEventListener('mousedown', e => this.oninput(e, true));
        addEventListener('mousemove', e => this.oninput(e));
    }
    extend(ge.InputHandler, MouseHandler);

    MouseHandler.prototype.oninput = function oninput(e, isDown) {
        if (e.type == 'mousemove') {
            this.position.set(e.clientX, e.clientY).mul(this.engine.ratio);
            this.position.y = ge.resolution.y - this.position.y;
            this.positionRelative.set(e.clientX, e.clientY).div(ge.resolution);
        } else {
            if (e.button < 3) {
                var b = 2*e.button;
                this.buttons[b] = isDown;
                this.activeButtons.push(b);
            }
        }
    };

    MouseHandler.prototype.update = function update() {
        while (this.activeButtons.length > 0) {
            var b = this.activeButtons.pop();
            this.buttons[b+1] = this.buttons[b];
        }
    };

    //#region LEFT BUTTON
    MouseHandler.prototype.isLeftPressed = function isLeftPressed() {
        return this.buttons[0] && !this.buttons[1];
    };
    MouseHandler.prototype.isLeftDown = function isLeftDown() {
        return this.buttons[0];
    };
    MouseHandler.prototype.isLeftReleased = function isLeftReleased() {
        return !this.buttons[0] && this.buttons[1];
    };
    //#endregion

    //#region RIGHT BUTTON
    MouseHandler.prototype.isRightPressed = function isRightPressed() {
        return this.buttons[2] && !this.buttons[3];
    };
    MouseHandler.prototype.isRightDown = function isRightDown() {
        return this.buttons[2];
    };
    MouseHandler.prototype.isRightReleased = function isRightReleased() {
        return !this.buttons[2] && this.buttons[3];
    };
    //#endregion

    publish(MouseHandler, 'MouseHandler', ge);
})();