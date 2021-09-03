#version 300 es
precision highp float;

in vec2 v_position;
uniform sampler2D u_texture;
uniform int u_offset;
uniform vec2 u_size;

out vec4 color;

void main(void) {
    vec2 uv = gl_FragCoord.xy/u_size;
    // get texture position to uv.x
    vec2 size = vec2(textureSize(u_texture, 0));
    float ix = uv.x * size.x*size.y;
    vec2 texcoor = vec2(mod(ix, size.x)/size.x, ix/size.x/size.y);
    vec2 smp = texture(u_texture, texcoor).xy;
    float left = 0.25*smp.x + 0.75;
    float right = 0.25*smp.y + 0.25;
    color = (1.-step(.001, abs(uv.y-left))) * vec4(.2,.8,.3, 1.);
    color += (1.-step(.001, abs(uv.y-right))) * vec4(.8,.3,.2, 1.);
}
