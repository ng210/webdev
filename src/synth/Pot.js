(function(){
    function Pot(el, synth) {
        el.pot = this;
        // el.onmouseover = Pot.onmouseover;
        // el.onmouseout = Pot.onmouseout;
        // el.onclick = Pot.onclick;
        el.onmousedown = Pot.onmousedown;
        el.onmouseup = Pot.onmouseup;	this.min = parseFloat(el.min) || 0;
    
        this.el = el;
        var min = parseFloat(el.getAttribute('min')) || 0;
        var max = parseFloat(el.getAttribute('max')) || 1;
        var value = parseFloat(el.getAttribute('value')) || .5;
        this.scale = parseFloat(el.getAttribute('scale')) || 100;
        this.synth = synth;
        var id = this.el.id.split('_')[1];
        var pot = synth.getControl(ns_synth.Ctrl[id]);
        if (pot != null) {
            this.pot = pot;
            this.pot.min = min;
            this.pot.max = max;
            this.pot.value = value;
        } else {
            console.log('Unknown control "' + id + '"');
        }
    }
    
    Pot.prototype.set = function(value) {
        if (value < this.min) {
            value = this.min;
        }
        if (value > this.max) {
            value = this.max;
        }
        this.el.innerHTML = Math.floor(value * this.scale);
        this.synth.setControl(this.ctrlId, value);
    }
    Pot.selectedItem = null;
    Pot.oldOnMouseMove = null;
    Pot.oldOnMouseUp = null;
    Pot.dragPoint = [0, 0];
    Pot.dragSpeed = 0.5;
    // Pot.onmouseover = function(e) {
    // 	e.pot.onmouseover(e);
    // };
    // Pot.onmouseout = function(e) {
    // 	e.pot.onmouseover(e);
    // };
    Pot.onmousedown = function(e) {
        if (Pot.selectedItem != null) {
            Pot.selectedItem.style.border = 'none';
        }
        Pot.selectedItem = e.target;
        Pot.dragPoint[0] = e.screenX;
        Pot.dragPoint[1] = e.screenY;
        Pot.selectedItem.style.border = 'solid 1px #4060a0';
        Pot.oldOnMouseMove = document.onmousemove;
        document.onmousemove = Pot.onmousemove;
        document.onmouseup = Pot.onmouseup;
        e.preventDefault();
    };
    Pot.onmouseup = function(e) {
        document.onmousemove = Pot.oldOnMouseMove;
        document.onmouseup = Pot.oldOnMouseUp;
        e.preventDefault();
    };
    Pot.onmousemove = function(e) {
        //var deltaX = e.screenX - Pot.dragPoint[0];
        var deltaY = e.screenY - Pot.dragPoint[1];
        var sgn = deltaY < 0 ? 1 : -1;
        //Pot.dragPoint[0] = e.screenX;
        var pot = Pot.selectedItem.pot;
        Pot.dragPoint[1] = e.screenY;
        var delta = Pot.dragSpeed/pot.scale * sgn * deltaY*deltaY;
        pot.set(pot.synth.getControl(pot.ctrlId) + delta);
    };
    module.exports=Pot;    
})();