(function(){
    Object.defineProperty(global, 'Pot', {
        "enumerable": false,
        "configurable": false,
        "writable": false,
        "value": {
            "selectedItem": null,
            "oldOnMouseMove": null,
            "oldOnMouseUp": null,
            "dragPoint": [0, 0],
            "dragSpeed": 0.5,
        
            "onmousedown": function(e) {
                if (Pot.selectedItem != null) {
                    Pot.selectedItem.style.border = 'none';
                }
                Pot.selectedItem = e.target;
                Pot.dragPoint[0] = e.screenX;
                Pot.dragPoint[1] = e.screenY;
                Pot.selectedItem.style.border = 'solid 1px #4060a0';
                Pot.oldOnMouseMove = document.onmousemove;
                Pot.oldOnMouseUp = document.onmouseup;
                document.onmousemove = Pot.onmousemove;
                document.onmouseup = Pot.onmouseup;
                e.preventDefault();
            },
            "onmouseup": function(e) {
                document.onmousemove = Pot.oldOnMouseMove;
                document.onmouseup = Pot.oldOnMouseUp;
                e.preventDefault();
            },
            "onmousemove": function(e) {
                //var deltaX = e.screenX - Pot.dragPoint[0];
                var deltaY = e.screenY - Pot.dragPoint[1];
                var sgn = deltaY < 0 ? 1 : -1;
                //Pot.dragPoint[0] = e.screenX;
                Pot.dragPoint[1] = e.screenY;
                
                var pot = Pot.selectedItem.pot;
                var delta = Pot.dragSpeed/Pot.selectedItem.scale * sgn * deltaY*deltaY;
                var value = pot.set(pot.value + delta);
                Pot.selectedItem.innerHTML = Math.floor(value * Pot.selectedItem.scale);
            },
            "bind": function(el, synth) {
                // el.onmouseover = Pot.onmouseover;
                // el.onmouseout = Pot.onmouseout;
                // el.onclick = Pot.onclick;
                el.onmousedown = Pot.onmousedown;
                el.onmouseup = Pot.onmouseup;
            
                var min = parseFloat(el.getAttribute('min')) || 0;
                var max = parseFloat(el.getAttribute('max')) || 1;
                var value = parseFloat(el.getAttribute('value'));
                var ctrlId = el.getAttribute('bind');
                el.scale = parseFloat(el.getAttribute('scale')) || 100;
                var pot = synth.getControl(ns_synth.Ctrl[ctrlId]);
                if (pot != null) {
                    el.pot = pot;
                    pot.min = min;
                    pot.max = max;
                    if (isNaN(value)) {
                        value = pot.value;
                    } else {
                        value = pot.set(value);
                    }
                    el.innerHTML = Math.floor(value * el.scale);
                    
                } else {
                    console.log('Unknown control "' + ctrlId + '"');
                }                
            },

        }
    });
    module.exports=Pot;    
})();