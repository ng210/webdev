include('actor.js');
include('webgl.js');

(function() {
	function Model(id, v, ix, fl) {
		this.id = id;
		this.vertexData = v || new Float32Array(4);
		this.indexData = ix || 0;
		this.program = null;
		this.matrix = M4.identity();
		this.position = Float32Array.from([0.0, 0.0, 0.0, 0.0]);	//new V3();
		this.scale = new V3();
		this.flags = fl;
		this.group = null;
		this.vboOffset = 0;
		this.vboLength = 0;
		this.iboOffset = 0;
		this.iboLength = 0;
		this.vertexSize = 0;
		if (fl & webGL.VERTEX_ATTRIB_POSITION) this.vertexSize += 3;
		if (fl & webGL.VERTEX_ATTRIB_NORMAL) this.vertexSize += 3;
		if (fl & webGL.VERTEX_ATTRIB_TEXTURE1) this.vertexSize += 2;
		if (fl & webGL.VERTEX_ATTRIB_TEXTURE2) this.vertexSize += 2;
		//this.vertexCount = this.vertexData.length / this.vertexSize;
		this.constructor = Model;
	}
	Model.prototype.getUniforms = function(uniforms) {
		uniforms['uModel'] = this.matrix.data;
	};
	Model.prototype.move = function(v) {
		//this.matrix
	};
	//Model.prototype = new Actor;
	Model.prototype.render = function(f) {
		//gl.drawArrays(gl.POINTS, 0, this.vertexCount);
		gl.drawElements(gl.TRIANGLES, this.iboLength, gl.UNSIGNED_SHORT, this.iboOffset);
	};
	
	
	
	function ModelGroup(id) {
		this.id = id;
		this.vbo = null;
		this.vertexCount = 0;
		this.indexCount = 0;
		this.ibo = null;
		this.textures = [];
		this.models = [];
		this.constructor = ModelGroup;
	}
	ModelGroup.prototype.add = function(mdl) {
		this.models.push(mdl);
	};
	ModelGroup.prototype.getUniforms = function(uniforms) {
		return;
	};
	ModelGroup.prototype.lock = function() {
		this.vertexCount = 0;
		// create and merge buffers
		var vi = 0, ii = 0;
		// gather size information and set offset/length for each model
		for (var mi=0; mi<this.models.length; mi++) {
			var m = this.models[mi];
			m.vboOffset = vi;
			m.vboLength = m.vertexData.length;
			vi += m.vertexData.length;
			m.vertexCount = m.vertexData.length/m.vertexSize;
			m.iboOffset = 2*ii;
			m.iboLength = m.indexData.length;
			ii += m.indexData.length;
			this.vertexCount += m.vertexCount;
		}
		// calculate vertex count from length of vertex data
		this.indexCount = ii;
		// create buffers
		var vertexData = new Float32Array(vi);
		var indexData = new Int16Array(ii);
		// merge vertex and index data of the models
		vi = 0, ii = 0;
		var offset = 0;
		for (var mi=0; mi<this.models.length; mi++) {
			var m = this.models[mi];
			for (var i=0; i<m.vertexData.length; i++) {
				vertexData[vi++] = m.vertexData[i];
			}
			for (var i=0; i<m.indexData.length; i++) {
				indexData[ii++] = m.indexData[i] + offset;
			}
			offset += m.vertexCount;
		}
		//indexData.forEach((x, i) => { Dbg.pr((i%3==0 ? i/3+': ' : '') +  ' ' + x +' '); if (i%3==2) Dbg.pr(' | '); }); Dbg.prln('');
		// create and fill VBO
		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		// create and fill IBO
		this.ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};
	ModelGroup.prototype.render = function(f) {
		// set gl state
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		var prg = null;
		// render uniforms
		var uniforms = {
			'frame': f
		};
		// general uniforms
		this.getUniforms(uniforms);
		this.models.forEach( m => {
			if (prg != m.program) {
				// set program
				prg = m.program;
				webGL.useProgram(gl, prg);
			}
			// model uniforms
			m.getUniforms(uniforms);
//Dbg.prln('uniforms'+Object.keys(uniforms).map( k => { return k+':'+uniforms[k]+'\n'; }));
			prg.setUniforms(uniforms);
			
			// render model
			m.render(f);
		});
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

	public(Model, 'Model');
	public(ModelGroup, 'ModelGroup');

})();