#version 300 es
precision highp float;

out vec4 fragColor;

in vec2 v_texcoord;
in vec3 v_color;
in vec3 v_normal;
in vec4 v_position;

// globals
uniform vec3 u_sun_color;
uniform vec3 u_sun_direction;

uniform vec3 u_lamp1_color;
uniform vec3 u_lamp1_position;

uniform vec3 u_lamp2_color;
uniform vec3 u_lamp2_position;

uniform vec3 u_camera_position;

// material
uniform vec3 u_color;
uniform float u_diffuse;
uniform float u_specular1;
uniform float u_specular2;

// model
uniform sampler2D u_texture0;
uniform sampler2D u_texture1;

float diffuseLight(vec3 direction, vec3 normal) {
    return clamp(u_diffuse*dot(direction, normal), 0., 1.);
}

vec3 pointLight(vec3 lightPosition, vec3 color, vec3 normal, vec3 cameraDirection) {
    vec3 dir = normalize(lightPosition - v_position.xyz);
    float diffuse = diffuseLight(dir, normal);
    float sf = max(dot(cameraDirection, reflect(dir, normal)), .0);
    float specular = u_specular1 * pow(sf, u_specular2);

    return color * pow(distance(lightPosition, v_position.xyz), -1.2) * (diffuse + specular);
}

void main(void) {
    // ambient
    vec3 ambColor = vec3(0.08, 0.09, 0.1);
    vec4 texColor = texture(u_texture0, v_texcoord);
    vec3 delta = vec3(.001, .001, .0);
    float h1 = texture(u_texture1, v_texcoord).x;
    float h2 = texture(u_texture1, v_texcoord + delta.xx).x;
    delta.z = 2.4*(h1 - h2);
    vec3 normal = normalize(v_normal + delta);

    // sun: directional light
    vec3 sunDiffuse = u_sun_color * diffuseLight(u_sun_direction, normal);

    vec3 cameraDirection = normalize(u_camera_position - v_position.xyz);

    vec3 lampColor = pointLight(u_lamp1_position, u_lamp1_color, normal, cameraDirection);
    lampColor += pointLight(u_lamp2_position, u_lamp2_color, normal, cameraDirection);

    vec3 col = /*v_color */ u_color * (ambColor + clamp(sunDiffuse + lampColor, 0., 1.));

    fragColor = vec4(col, 1.) * texColor;
}