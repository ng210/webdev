include('frmwrk/fw.js');
include('webgl/webgl.js');
include('ge/v2.js');
include('ge/m4.js');
include('webgl/ge.js');

var fw = require('/frmwrk/fw.js');
var webGL = require('/webgl/webgl.js');
var GE = require('/webgl/ge.js');
var V3 = require('/ge/v3.js');
var M44 = require('/ge/m4.js');

var count = 400;

var vbo = null;
var vertices = null;
var webgl = null;
var gl = null;
var prg = null;

var projectionViewMatrix = null;
var cameraPos = null;
var lookAt = null;
const upVector = new V3(0, 1, 0);

function prepareScene() {
  vertices = new Float32Array(6*count);
  for (var i = 0; i < count; i++) {
    var ix = 5*i;
    // create coordinates
    vertices[ix+0] = 2 * (Math.random() - 0.5);
    vertices[ix+1] = 2 * (Math.random() - 0.5);
    vertices[ix+2] = 2 * (Math.random() - 0.5);
    // // create velocity vectors
    var v = V3.fromPolar(2 * Math.PI * Math.random(), 2 * Math.PI * Math.random(), Math.random()*0.1);
    vertices[ix+3] = v.x;
    vertices[ix+4] = v.y;
    vertices[ix+5] = v.z + -0.2;
    // vertices[ix++] = v2.x;
    // vertices[ix++] = v2.y;
    // // create acceleration vector?
  }

  vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  //gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // create camera
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  var projectionMatrix = M44.perspective(fieldOfView, aspect, zNear, zFar);
  cameraPos = new V3(0, 0, -2);
  lookAtPos = new V3(0, 0, 0);
  var viewMatrix = M44.lookAt(cameraPos, lookAt, upVector);
  projectionViewMatrix = projectionMatrix.mul(viewMatrix);

  prg = webgl.createProgram(['vs1', 'fs1'], []);
}

function update(fm) {
  //Dbg.prln('update');
  for (var i=0; i<count; i++) {
    var ix=i*6;
    vertices[ix] += vertices[ix+3] * 0.1;
    vertices[ix+1] += vertices[ix+4] * 0.1;
    vertices[ix+2] += vertices[ix+5] * 0.1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function render(fm) {
  //Dbg.prln('render');
  //webgl.gl.viewport(0, 0, webgl.canvas.width, webgl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  var aPos = gl.getAttribLocation(prg, "aPos");
  //var aV1 = gl.getAttribLocation(prg, "aV1");
  // var aV2 = gl.getAttribLocation(prg, "aV2");
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 4*5, 0);
  gl.enableVertexAttribArray(aPos);
  // gl.vertexAttribPointer(aV1, 2, gl.FLOAT, false, 4*5, 4*3);
  // gl.enableVertexAttribArray(aV1);
  //  gl.enableVertexAttribArray(aV2);
  //  gl.vertexAttribPointer(aV2, 4, gl.FLOAT, false, 4*7, 4*5);

  gl.useProgram(prg);
  var uGlobalColor = gl.getUniformLocation(prg, "uGlobalColor");
  gl.uniform4fv(uGlobalColor, [1.0, 0.98, 0.9, 1.0]);
  var uProjectionViewMatrix = gl.getUniformLocation(prg, "uProjectionViewMatrix");
  gl.uniformMatrix4fv(uProjectionViewMatrix, false, projectionViewMatrix.toFloat32Array());
  gl.drawArrays(gl.POINTS, 0, count);
  //gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function onpageload() {
  try {

    var m1 = M4.identity();
    var m2 = new M4([
      1,2,3,4,
      2,4,6,8,
      3,6,9,12,
      4,8,12,16
    ]);
    var m3 = m1.mul(m2);
    Dbg.prln('m3='+m3);

    webgl = new webGL(document.getElementById('cvs'));
    if (webgl.gl == null) {
      throw new Error('webGL not support');
    }
    gl = webgl.gl;
    prepareScene();
    GE.update = update;
    GE.render = render;
    //GE.start();
  } catch (error) {
    Dbg.prln(error.message);
    Dbg.prln(error.stack);



  }
}
