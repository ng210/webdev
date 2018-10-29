(function() {
	function Actor() {
		this.velocity = new V3();
		this.acceleration = new V3();
		this.mass = 1.0;
		this.forces = [];
		this.constrains = [];
	}
	Actor.prototype.update = function(dt) {
		// sum forces
		var f = new V3();
		for (var i=0; i<this.forces.length; i++) {
			this.forces[i].call(this, f);
		}
		// calculate acceleration, velocity and position
		this.acceleration = f.scale(this.mass);
		this.velocity.inc(this.acceleration.mulC(dt));
		var dp = new V3(this.velocity).scale(dt);
		for (var i=0; i<this.constrains.length; i++) {
			this.constrains[i].call(this, dp);
		}
		this.position.inc(dp);
	};
	
	public(Actor, 'Actor');
})();