/******************************************************************************
 * Structure for 3D Models
 *  Can contain vertex data
 *   - positions,
 *   - normals,
 *   - color,
 *   - uv0,
 *   - uv1
 * and index data.
 * Number of indices and offset in the VBO of its group.
 * Matrix to tranform from model into world space.
 *****************************************************************************/
function Model(data) {
	this.pos = [.0, .0, .0];
	this.group = null;
	this.matrix = new J3DIMatrix4();
	this.normalMatrix = new J3DIMatrix4();
	this.IBO_offset = 0;
	this.nIndices = 0;
	// data: { position:[], normal:[], color:[], uv0:[], uv1:[], index:[] }
	this.data = data;
}

Model.prototype.update = function() {
	this.matrix.makeIdentity();
	this.normalMatrix.makeIdentity();
//	this.matrix.rotate(r);
	this.matrix.translate(this.pos);
//	this.matrix.scale(s);
};

Model.prototype.render = function() {
	// upload matrices
	this.matrix.setUniform(GE.gl, this.group.uniforms.iModelMatrix, false);
	if (this.group.uniforms.iNormalMatrix) {
		this.normalMatrix.setUniform(GE.gl, this.group.uniforms.iNormalMatrix, false);
	}
	// render model
	//GE.gl.drawElements(GE.gl.LINES, this.nIndices, GE.gl.UNSIGNED_INT, this.IBO_offset);
	GE.gl.drawElements(GE.gl.TRIANGLES, this.nIndices, GE.gl.UNSIGNED_INT, this.IBO_offset);

};

/******************************************************************************
 * Group of Models
 * Member models share the shaders, textures and the vertex and index buffers.
 * VBO can contain positions, normals, color, uv0, uv1. The VBO structure is mandatory for every model.
 * Stores the program (shaders), uniforms and textures.
 * Matrix to tranform from model into world space.
 *****************************************************************************/
function ModelGroup(shaders, attributes, uniforms) {
	this.VBO = null;
	this.IBO = null;
	this.textures = [];
	this.models = [];
	this.nAttributes = 0;
	this.attributes = [];
	this.stride = 0;
	for (var i=0; i<attributes.length; i++) {
		var a = ModelGroup.validAttributes[attributes[i]];
		if (a) {
			this.attributes.push(attributes[i]);
			this.nAttributes++;
			this.stride += a.length * a.size;
		}
	}
	// create program
	this.prg = GE.gl.createProgram();
	// add shaders
	GE.gl_addShader(this.prg, shaders[0]);
	GE.gl_addShader(this.prg, shaders[1]);
	// add attributes and link shaders
	var prg = GE.gl_finalize(this.prg, this.attributes);
	if (prg == null || this.prg != prg) throw 'Shader code has errors!';
	GE.gl.useProgram(this.prg);
	// fill uniforms
	this.uniforms = {};
	
	// get uniform locations and first upload
	for (var u in uniforms) {
		if (uniforms.hasOwnProperty(u)) {
			var loc = GE.gl.getUniformLocation(this.prg, u);
			if (loc != null) {
				this.uniforms[u] = loc;
				this.setUniform(u, uniforms[u]);
			} else {
				Dbg.prln(u + ' not found!');
			}
		}
	}
	var u = 'iModelId';
	var loc = GE.gl.getUniformLocation(this.prg, u);
	if (loc != null) {
		this.uniforms[u] = loc;
	}
}

ModelGroup.validAttributes = {
/*	name, size, type, size of type in bytes */
	aPosition:	{length:3, type:'FLOAT', size:4},
	aNormal:	{length:3, type:'FLOAT', size:4},
	aColor:		{length:3, type:'FLOAT', size:4},
	aUV0:		{length:2, type:'FLOAT', size:4},
	aUV1:		{length:2, type:'FLOAT', size:4}
};

ModelGroup.prototype.setUniform = function(u, v) {
	var loc = this.uniforms[u];
	if (loc && v != undefined) {
		if (typeof v === 'number') {
			GE.gl.uniform1f(loc, v);
		} else {
			if (typeof v === 'object') {
				if (typeof v.setUniform === 'function') {
					v.setUniform(GE.gl, loc);
				} else {
					try {
						if (v.length == 2) {
							GE.gl.uniform2fv(loc, v);
						} else {
							if (v.length == 3) {
								GE.gl.uniform3fv(loc, v);
							}
						}
					} catch (e) {
						Dbg.prln('Error: ' + e);
					}
				}
			}
		}
	}
}

ModelGroup.prototype.setUniforms = function(uniforms) {
	for (var u in uniforms) {
		if (uniforms.hasOwnProperty(u)) {
			this.setUniform(u, uniforms[u]);
		}
	}
}

ModelGroup.prototype.addModel = function(m) {
	this.models.push(m);
	m.group = this;
};

ModelGroup.prototype.lock = function() {
	// create VBO and IBO and create DataViews for the models
	var nCount = 0, vCount = 0, iCount = 0;
	var dCount = [];
	for (var m=0; m<this.models.length; m++) {
		var d = this.models[m].data;
		var cnt = [];
		for (var i=0; i<this.attributes.length; i++) {
			var aid = this.attributes[i];
			if (!d[aid] || !d[aid].length) throw 'Model #'+i+' must have position data!';
			var a = ModelGroup.validAttributes[aid];
			nCount += d[aid].length;
			cnt.push({id:aid, n:d[aid].length/a.length});
		}

		for (var i=0; i<cnt.length; i++) {
			for (var j=0; j<cnt.length; j++) {
				if (i != j && cnt[i].n != cnt[j].n) {
					var txt = [];
					for (var k=0; k<cnt.length; k++) {
						txt.push(cnt[k].n + ' ' + cnt[k].id + 's');
					}
					throw 'Data inconsistent: got ' + txt.join() + '!';
				}
			}
		}
		dCount.push(cnt[0].n);

		iCount += d.index.length;
	}
	// create buffers
	var vbo = new Float32Array(nCount);
	var ibo = new Uint32Array(iCount);
	// merge buffers
	var vOffset = 0, iOffset = 0;
	for (var m=0; m<this.models.length; m++) {
		var mdl = this.models[m];
		var d = mdl.data;

		// put index data into ibo
		mdl.IBO_offset = iOffset*4;
		mdl.nIndices = d.index.length;
		for (var j=0; j<d.index.length; j++) {
			// start at iOffset, indices are shifted by count of vertices stored previously (=iOffset)
			ibo[iOffset++] = d.index[j] + vCount;
		}
		
		for (var j=0; j<dCount[m]; j++) {
			for (var i=0; i<this.attributes.length; i++) {
				var aid = this.attributes[i];
				var a = ModelGroup.validAttributes[aid];
				for (var k=0; k<a.length; k++) {
					vbo[vOffset++] = d[aid][a.length*j+k];
				}
			}
			vCount++;
		}
	}
	// create VBO
	this.VBO = GE.gl.createBuffer();
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.VBO);
	GE.gl.bufferData(GE.gl.ARRAY_BUFFER, vbo, GE.gl.STATIC_DRAW);
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, null);
//var txt = [];
//for (var i=0;i<vbo.length;i++) {
//	txt.push(vbo[i].toFixed(2));
//}
//Dbg.prln('VBO\n' + txt.join());
	// create IBO
	this.IBO = GE.gl.createBuffer();
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, this.IBO);
	GE.gl.bufferData(GE.gl.ELEMENT_ARRAY_BUFFER, ibo, GE.gl.STATIC_DRAW);
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, null);
//txt = [];
//for (var i=0;i<ibo.length;i++) {
//	txt.push(ibo[i]);
//}
//Dbg.prln('IBO\n' + txt.join());
};

ModelGroup.prototype.render = function() {
	// set shaders
	GE.gl.useProgram(this.prg);
	// set textures
    for (var i=0; i<this.textures.length; i++) {
        GE.gl.activeTexture(GE.gl.TEXTURE0+i);
        GE.gl.bindTexture(GE.gl.TEXTURE_2D, this.textures[i]);
    }
    
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, this.VBO);
	var offset = 0;
	for (var i=0; i<this.attributes.length; i++) {
		// enable vertex attributes
		GE.gl.enableVertexAttribArray(i);
		var aid = this.attributes[i];
		var a = ModelGroup.validAttributes[aid];
		// bind buffer to vertex attributes
		GE.gl.vertexAttribPointer(i, a.length, GE.gl[a.type], false, this.stride, offset);
		offset += a.length * a.size;
	}

	// set IBO
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, this.IBO);

	// render models
	for (var i=0; i<this.models.length; i++) {
		// upload model id
		if (this.uniforms.iModelId != undefined) {
			GE.gl.uniform1i(this.uniforms.iModelId, i);
		}
		this.models[i].render();
	}
	GE.gl.bindBuffer(GE.gl.ELEMENT_ARRAY_BUFFER, null);
	GE.gl.bindBuffer(GE.gl.ARRAY_BUFFER, null);
	// disable vertex attributes
	for (var i=0; i<this.nAttributes; i++) {
		GE.gl.disableVertexAttribArray(i);
	}
};

