include('/base/dbg.js');
include('/ge/ge.js');
include('/webgl/webgl.js');

function App() {
	this.cvs = document.querySelector('#cvs');
	this.cvs.width = 1536;
	this.cvs.height = 640;
	this.cnt = document.querySelector('#cvs-container');
	this.con = document.querySelector('#con');
	this.menu = document.querySelector('#menu');
	this.the2triangles = null;
	this.program = null;
	this.uniforms = {
		uFontSize: { type:webGL.FLOAT3V, value: new Float32Array(3) },
		//uFontData: { type:webGL.FLOAT3V, value: new Float32Array(3*64) },

		uText: { type:webGL.FLOAT4V, value: new Float32Array(4*255) },
		uTextLength: { type:webGL.INT, value: 1 },
		uColor: { type:webGL.FLOAT4V, value: new Float32Array([1.0, 1.0, 1.0, 1.0]) },
		uBgColor: { type:webGL.FLOAT4V, value: new Float32Array([0.05, 0.1, 0.2, 1.0]) },

		uFrame: { type:webGL.INT, value: 0 },
		uSize: { type:webGL.FLOAT2V, value: new Float32Array([this.cvs.width, this.cvs.height]) },
		uDuration: { type:webGL.FLOAT, value: 200.0 },

		uMousePos: { type:webGL.FLOAT2V, value: new Float32Array([0.0, 0.0]) }
	};
	this.fontData = null;
	this.texts = [];
	// [
	// 	'The Hobbit',
	// 	'Szia Tilduska!',
	// 	'Szia kisfiacska!',
	// 	'Szia bundás!'
	// ];
	this.currentText = 0;

	GE.init('#cvs', GE.MODE_WEBGL);
	GE.T = 25;

	if (gl == null) throw new Error('webGL not supported!');
}

App.prototype.processInputs = function processInputs() {

};
App.prototype.update = function update(f) {
	if (f % this.uniforms.uDuration.value == 0) {
		var text = this.texts[this.currentText++];
		this.setText(text);
		if (this.currentText == this.texts.length) this.currentText = 0;
	}
};
App.prototype.render = function render(f) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	this.uniforms.uFrame.value = f;
	this.program.updateUniform('uFrame');
	//gl.colorMask(true, true, true, false);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	// gl.clearColor(1, 1, 1, 1);
	// gl.colorMask(false, false, false, true);
	// gl.clear(gl.COLOR_BUFFER_BIT);
};
App.prototype.resize = function resize() {
	this.menu.width = '16em';
	this.menu.height = '24em';
	var left = this.menu.clientWidth;
	var width = window.innerWidth;
	var height = window.innerHeight;
	this.cvs.style.width = (width - left) + 'px';
	this.cvs.style.height = height + 'px';
	this.con.style.top = '75vh';
	this.con.style.width = '100vw';
};

App.prototype.setText = function setText(text) {
	this.uniforms.uTextLength.value = text.length;
	var ix = 0;
	for (var i=0; i<text.length; i++) {
		var char = text.charAt(i);
		var font = this.fontData.map[char] || this.fontData.map[''];
		this.uniforms.uText.value[ix++] = font.x;
		this.uniforms.uText.value[ix++] = font.y;
		this.uniforms.uText.value[ix++]	= font.w;
		this.uniforms.uText.value[ix++]	= font.h;
	}
	this.program.setUniforms();
}

App.prototype.prepareScene = async function prepareScene() {
	// create "canvas" of 2 triangles
	const positions = [-1.0,  1.0,  1.0,  1.0,  -1.0, -1.0,  1.0, -1.0];
	this.the2triangles = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.the2triangles);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(0);
	gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	var resources = await load([
		{ url: `/webgl/default.vs`, contentType: 'x-shader/x-vertex', shaderType: gl.VERTEX_SHADER },
		{ url: `/webgl/fonts.fs`, contentType: 'x-shader/x-fragment', shaderType: gl.FRAGMENT_SHADER },
		{ url: `/webgl/verdana.json` },
		{ url: `/webgl/verdana.png` }
	]);
	if (resources.find(x => x.error != null) != null) {
		throw new Error('Error loading shaders!');
	}
	var texts = resources[1].data.split('\n');
	for (var i=0; i<texts.length; i++) {
		if (texts[i].length != 0 && texts[i] != '\r') {
			this.texts.push(texts[i]);
		}
	}

	// create texure
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resources[3].node);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	this.uniforms.uFontSize.value[0] = resources[2].data.width;
	this.uniforms.uFontSize.value[1] = resources[2].data.height;
	this.uniforms.uFontSize.value[2] = resources[2].data.size;

	this.fontData = resources[2].data;

	var shaders = {};
	shaders[gl.VERTEX_SHADER] = resources[0].data;
	shaders[gl.FRAGMENT_SHADER] = resources[1].data;
	this.program = webGL.createProgram(gl, shaders, { position:{type:gl.FLOAT, size:4} }, this.uniforms);
	gl.useProgram(this.program.prg);
	// set initial uniforms
	this.program.setUniforms();
};
	
async function onpageload() {
	try {
		Dbg.init('con');

		var app = new App();
		await app.prepareScene(gl);
		Dbg.prln('Initialized.');

		app.resize();

		GE.processInputs = f => app.processInputs(f);
		GE.update = f => app.update(f);
		GE.render = f => app.render(f);

		window.onresize = e => app.resize(e);

		GE.start();

	} catch (error) {
		Dbg.prln(error.message);
		Dbg.prln(error.stack);
	}
};
