include('math/fn.js');

(function() {
	function Plasma() {
		Demo.call(this, 'Plasma', {
			zoom: { label: 'Zoom', value: 4, min:1, max:50, step: 0.1, type: 'float', link: null },
			motion: { label: 'Motion', value: 1.0, min: 0, max:10.0, step: 0.1, normalized: true, type: 'float', link: null },
			variation: { label: 'Variation', value: 1, min:0, max:10, step: 0.01, type: 'float', link: null },
			shape: { label: 'Shape', value: 0, min:0, max:3, step: 0.01, type: 'float', link: null },
			color: { label: 'Color', value: 0, min:0, max:2, step: 1, type: 'int', link: null },
			saturation: { label: 'Saturation', value: 0.5, min:0, max:1, step: 0.01, type: 'float', link: null }
		});

		this.vx = 0;
		this.vy = 0;
		this.counter = 0;
		this.buffer = null;
	};
	extend(Demo, Plasma);

	Plasma.prototype.initialize = function initialize() {
		this.buffer = new glui.Buffer(glui.width/4, glui.height/4);
	};

	Plasma.prototype.onchange = function onchange(e, setting) {
		switch (setting.parent.id) {
			case 'shape':
				this.updateVelocity();
				break;
		}
	};
	Plasma.prototype.update = function update(frame, dt) {
			this.counter += this.settings.motion.value * dt;
	};
	Plasma.prototype.render = function render(frame, dt) {
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
				var color = this.getColor(v);
				var c = 0.2989 * color[0] + 0.5870 * color[1] + 0.1140 * color[2];

				this.buffer.imgData.data[ix++] = 255 * Fn.lerp(c, color[0], this.settings.saturation.value);
				this.buffer.imgData.data[ix++] = 255 * Fn.lerp(c, color[1], this.settings.saturation.value);
				this.buffer.imgData.data[ix++] = 255 * Fn.lerp(c, color[2], this.settings.saturation.value);
				this.buffer.imgData.data[ix++] = 255;
			}
		}
		this.buffer.update();
		glui.frontBuffer.blit(this.buffer);
		//this.buffer.context.putImageData(this.buffer.imgData, 0, 0);
		//glui.renderingContext2d.drawImage(this.buffer.canvas, 0, 0, this.buffer.width, this.buffer.height, 0, 0, glui.width, glui.height);
		//glui.frontBuffer.context.drawImage(this.buffer.canvas, 0, 0);	//, this.buffer.width, this.buffer.height, 0, 0, glui.frontBuffer.width, glui.frontBuffer.height);
	};
	Plasma.prototype.updateVelocity = function updateVelocity() {
		this.vx = this.settings.shape.value;
		this.vy = this.settings.shape.value * this.buffer.height/this.buffer.width;
	};
	Plasma.prototype.resize = function resize(e) {
		this.updateVelocity();
	};
	Plasma.prototype.getColor = function getColor(v) {
		var color = [0, 0, 0];
		switch (this.settings.color.value) {
			case 0:
				color[0] = 0.5 + 0.5*Math.sin(Math.PI * v + this.counter);
				color[1] = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5) + this.counter);
				color[2] = 0.5 + 0.5*Math.cos(Math.PI * v + this.counter);
				break;
			case 1:
				color[0] = 0.5 + 0.5*Math.cos(Math.PI * v);
				color[1] = 0.5 + 0.5*Math.sin(Math.PI * v);
				color[2] = 0.5 + 0.5*Math.sin(Math.PI * (v - 0.5));
				break;
			case 2:
				color[0] = 0.2;
				color[1] = 0.2;
				color[2] = 0.6 + 0.2*Math.cos(Math.PI * v);
				break;
		}
		return color;
	};

	publish(new Plasma(), 'Plasma');
})();
