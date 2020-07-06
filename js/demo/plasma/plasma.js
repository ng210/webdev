include('ge/fn.js');

(function() {

    var Plasma = {
		name: 'Plasma',
		vx: 0,
		vy: 0,
		counter: 0,

		settings: {
			zoom: { label: 'Zoom', value: 10, min:1, max:50, step: 0.1, type: 'float', link: null },
			motion: { label: 'Motion', value: 0.01, min: 0, max:0.02, step: 0.0001, normalized: true, type: 'float', link: null },
			variation: { label: 'Variation', value: 1, min:0, max:10, step: 0.01, type: 'float', link: null },
			shape: { label: 'Shape', value: 0, min:0, max:3, step: 0.01, type: 'float', link: null },
			color: { label: 'Color', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null }
		},

		initialize: function initialize() {
			var canvas = document.createElement('canvas');
			canvas.width = Math.floor(glui.width/4);
			canvas.height = Math.floor(glui.height/4);
			this.context = canvas.getContext('2d');
			this.buffer = this.context.getImageData(0, 0, canvas.width, canvas.height);
		},

		onchange: function onchange(e, ctrl) {
			switch (ctrl.row.name) {
				case 'shape':
					this.updateVelocity();
					break;
			}
		},
		update: function update(frame, dt) {
			this.counter += this.settings.motion.value * dt;
		},
		render: function render(frame) {
			var ix = 0;
			for (var j=0; j<this.buffer.height; j++) {
				for (var i=0; i<this.buffer.width; i++) {
					var x = i/this.buffer.width - 0.5;
					var y = j/this.buffer.height - 0.5;
					var v = 0;
					var cx = x * this.settings.zoom.value;
					var cy = y * this.settings.zoom.value;
					v += this.vx * Math.cos(cx + this.counter);
					v += this.vy * Math.sin(cy + this.counter);
					v += Math.sin((cx + cy + this.counter)/2.0);
					cx += Math.sin(this.counter/3.0);
					cy += Math.cos(this.counter/2.0);
					v += Math.sin(Math.sqrt(cx*cx + cy*cy) + this.counter);
					v *= this.settings.variation.value;
					var r = 0.5 + 0.5*Math.sin(Math.PI * v + this.counter);
					var g = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5) + this.counter);
					var b = 0.5 + 0.5*Math.cos(Math.PI * v + this.counter);
					var c = 0.2989 * r + 0.5870 * g + 0.1140 * b;

					this.buffer.data[ix++] = 255 * Fn.lerp(c, r, this.settings.color.value);
					this.buffer.data[ix++] = 255 * Fn.lerp(c, g, this.settings.color.value);
					this.buffer.data[ix++] = 255 * Fn.lerp(c, b, this.settings.color.value);
					this.buffer.data[ix++] = 255;
				}
			}
			this.context.putImageData(this.buffer, 0, 0);
			glui.renderingContext2d.drawImage(this.context.canvas, 0, 0, this.buffer.width, this.buffer.height, 0, 0, glui.width, glui.height);
		},
		updateVelocity: function updateVelocity() {
			this.vx = this.settings.shape.value;
			this.vy = this.settings.shape.value * this.buffer.height/this.buffer.width;
		},
		resize: function resize(e) {
			this.updateVelocity();
		}
		// Plasma.prototype.getMouseCoors = function(v) {
		// 	v.x = GE.inputs.mpos[0] * GE.canvas.width/GE.canvas.clientWidth;
		// 	v.y = GE.inputs.mpos[1] * GE.canvas.height/GE.canvas.clientHeight;
		// };
	};

	public(Plasma, 'Plasma');
})();
