include('psynth.js');
(function() {
    function PotBase(min, max, value) {
        this.init(min, max, (max-min)/100, value);
    }
    PotBase.prototype.set = function set(value) {
        if (value > this.min) {
            if (value < this.max) {
                this.value = value;
            } else {
                this.value = this.max;
            }
        } else {
            this.value = this.min;
        }
        return this.value;
    };
    PotBase.prototype.init = function init(min, max, step, value) {
        this.min = min;
        this.max = max;
        this.step = step;
        this.set(value);
    };
    /* ********************************************************************* */
    function Pot(min, max, value) {
        this.init(min, max, (max-min)/100, value);
    }
    extend(PotBase, Pot);

    Pot.prototype.set = function set(value) {
        return Pot.base.set.call(this, Math.round(value));
    };
    Pot.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8());
    };

    /* ********************************************************************* */
    function PotF8(min, max, value) {
        PotF8.base.constructor.call(this, min, max, value);
    }
    extend(PotBase, PotF8);
    PotF8.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readUint8()/255);
    };

    /* ********************************************************************* */
    function PotF32(min, max, value) {
        PotF32.base.constructor.call(this, min, max, value);
    }
    extend(PotBase, PotF32);
    PotF32.prototype.setFromStream = function setFromStream(stream) {
        this.set(stream.readFloat32());
    };

    publish(PotBase, 'PotBase', psynth);
    publish(Pot, 'Pot', psynth);
    publish(PotF8, 'PotF8', psynth);
    publish(PotF32, 'PotF32', psynth);
})();