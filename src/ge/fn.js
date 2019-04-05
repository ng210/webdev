(function() {
	var Fn = {
		'smoothstep': x => x*(3*x-2*x*x),
		'quantize': (x, s) => 2*Math.round(0.5*(x+1)*s)/s-1,
		'lerp': (x1, x2, f) => (1-f)*x1 + f*x2,
		'clamp': (x, min, max) => (x > min) ? ((x < max) ? x : max) : min,
	};

	public(Fn, 'Fn');
})();