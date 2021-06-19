attribute vec4 a_position;
attribute float a_vertexId;

attribute vec3 a_translate;
attribute vec2 a_scale;
attribute float a_rotateZ;
attribute vec4 a_texcoord;
attribute vec4 a_color;

uniform mat4 u_projection;

varying vec2 v_texcoord;
varying vec4 v_color;
 
void main() {
  mat4 m = mat4(1.0);
  float c = cos(a_rotateZ);
  float s = sin(a_rotateZ);
  m[0][0] = c*a_scale.x;
  m[0][1] = s*a_scale.x;
  m[1][0] = -s*a_scale.y;
  m[1][1] = c*a_scale.y;
  m[2][2] = 1.0;  //a_scale.z
  m[2][3] = 1.0;
  m[3][0] = a_translate.x;
  m[3][1] = a_translate.y;
  m[3][2] = a_translate.z;
  m[3][3] = 1.0;
  gl_Position = u_projection*m*a_position;
  
  if (a_vertexId == 0.0) v_texcoord = a_texcoord.xy;
  else if (a_vertexId == 1.0) v_texcoord = a_texcoord.zy;
  else if (a_vertexId == 2.0) v_texcoord = a_texcoord.xw;
  else if (a_vertexId == 3.0) v_texcoord = a_texcoord.zw;

  v_color = a_color;
}