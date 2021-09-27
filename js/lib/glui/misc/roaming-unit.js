(function() {
    function RoamingUnit(speed, variance) {
        this.speed = speed;
        this.variance = variance;
        this.velocity = new V3();
        this.velocity1 = new V3();
        this.velocity2 = new V3();
        this.ttl = 0;
    }

    RoamingUnit.prototype.update = function romaing_update(dt) {
        if (this.ttl > 0) {
            var f = this.ttl;    //Math.sin(0.5*Math.PI*ttl);
            this.velocity.x = Fn.lerp(this.velocity2.x, this.velocity1.x, f);
            this.velocity.y = Fn.lerp(this.velocity2.y, this.velocity1.y, f);
            this.ttl -= this.variance;
        } else {
            this.ttl = 0.5 + 0.5*Math.random();
            this.velocity1 = this.velocity2;
            this.velocity2 = V3.fromPolar(2*Math.PI*Math.random(), 0, this.speed*(1 + Math.random()));
        }

    };

    publish(RoamingUnit, 'RoamingUnit');
})();