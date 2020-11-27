attribute vec4 a_position;
attribute float a_vertexId;

attribute mat4 a_matrix;
attribute vec4 a_texcoord;
// attribute vec3 a_translate;
// attribute float a_rotateZ;
// attribute vec2 a_scale;
 
varying vec2 v_texcoord;
 
void main() {
  gl_Position = a_matrix*a_position;
  if (a_vertexId == 0.0) v_texcoord = a_texcoord.xy;
  else if (a_vertexId == 1.0) v_texcoord = vec2(a_texcoord.x + a_texcoord.z, a_texcoord.y);
  else if (a_vertexId == 2.0) v_texcoord = vec2(a_texcoord.x, a_texcoord.y + a_texcoord.w);
  else if (a_vertexId == 3.0) v_texcoord = vec2(a_texcoord.x + a_texcoord.z, a_texcoord.y + a_texcoord.w);
}