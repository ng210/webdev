#version 300 es

// buffer #1
in vec2 a_position;
//in float a_vertexId;

// buffer #2
in vec3 a_translate;
in vec2 a_scale;
in float a_rotateZ;
in vec4 a_color;
in vec4 a_texcoord;

uniform mat4 u_projectionView;

out vec2 v_texcoord;
out vec4 v_color;
 
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
  gl_Position = u_projectionView * m * vec4(a_position, 0., 1.);
  
  if (gl_VertexID == 0) v_texcoord = a_texcoord.zw;
  else if (gl_VertexID == 1) v_texcoord = a_texcoord.zy;
  else if (gl_VertexID == 2) v_texcoord = a_texcoord.xw;
  else if (gl_VertexID == 3) v_texcoord = a_texcoord.xy;
  v_color = a_color;
}