#version 300 es
precision highp float;

#define LOW_C 16.351597831287414
#define PI 3.1415926535897932384626433832795
#define PI2 6.283185307179586476925286766559
#define BPM 127.
#define T (BPM/60.)
#define TICK (T*4.)
#define T16 (T/4.)

#define P1 12.
#define P2 15.
#define P3 16.
#define P4 17.
#define END 60.

#define pC   36
#define pCis 37
#define pD   38
#define pDis 39
#define pE   40
#define pF   41
#define pFis 42
#define pG   43
#define pGis 44
#define pA   45
#define pAis 46
#define pH   47

#define Dmoll  vec3(pD, pF, pA)
#define Amoll6 vec3(pC, pE, pA)
#define Gdur6  vec3(pH, pD, pG)
#define Cdur   vec3(pC, pE, pG)

#define iSampleRate 48000.


#define nsin(th, a, dc) dc + a * sin(th)

float env(float t, vec4 adsr) {
    float x = fract(t*TICK);
    float y = smoothstep(.0, adsr.x, t);
    float g1 = adsr.x;
    float g2 = g1 + adsr.y;
    y = min(y, (smoothstep(g2, g1, t)  * (1.-adsr.z) + adsr.z));
    g1 = g2;
    g2 += adsr.w;
    y *= smoothstep(g2, g1, t);
    return y;
}

vec3 snBeat(float time) {
    vec3 n = vec3(0);
    
    if (time*T16 > 4.)
    {
    
    float steps = 16.;
    float t = fract(time*TICK/steps);
    float st = 1./steps;
    float s = 0.;

    n  = (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.1, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .7)*st))) * vec3(127.0, 0.1, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .3)*st))) * vec3(117.0, 0.0, .0); s++;
    
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3( 24.0, 1.2, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .7)*st))) * vec3( 27.0, 0.1, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .3)*st))) * vec3(117.0, 0.0, .0); s++;
    
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.2, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .7)*st))) * vec3(127.0, 0.1, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .3)*st))) * vec3( 17.0, 0.1, .0); s++;

    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3( 24.0, 1.2, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(117.0, 0.0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .7)*st))) * vec3( 27.0, 0.1, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .3)*st))) * vec3(117.0, 0.0, .0); s++;
    }
    n.z = n.y*time;
    return 1.0*n;
}

vec3 kdBeat(float time) {
    vec3 n = vec3(0);
  
    float pt = time*T16;
    
    if (pt < 12. || pt > 16. && pt < 40. || pt > 44.) {
    
    float steps = 32.;
    float t = fract(time*TICK/steps);
    float st = 1./steps;

    n  = (1.-step(0.5*st, abs(t - ( 0. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - ( 4. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - ( 8. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (12. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (15. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (16. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (20. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (24. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (28. + .5)*st))) * vec3(1.);
    n += (1.-step(0.5*st, abs(t - (30. + .5)*st))) * vec3(1.);

    n.x = t;
    n.z = sin(time*TICK*PI2)*n.y;
    }
    return 1.0*n;
}

vec3 hhBeat(float time) {
    vec3 n = vec3(0);

    float pt = time*T16;
    
    if (pt > 12. && pt < 28. || pt > 32.) {
    float steps = 16.;
    float t = fract(time*TICK/steps);
    float st = 1./steps;
    float s = 0.;

    n  = (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .4, .2); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .6, .6); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .3, .1); s++;

    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .4, .2); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .6, .6); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;

    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .4, .2); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .5, .2); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .6, .8); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;

    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .4, .2); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .6, .6); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(0., .0, .0); s++;

    n.x = t;
    }
    return 1.0*n;
}

vec3 pattern1(float time) {
    vec3 n = vec3(0);
    
    if (time*T16 > 4.) {
    
    float steps = 16.;
    float t = fract(time*TICK/steps);
    float s = 0.;
    float st = 1./steps;

    n  = (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(26.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(26.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(38.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(26.0, 1., .0); s++;
    
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(29.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(29.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(41.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(29.0, 1., .0); s++;

    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(24.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(24.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(36.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(24.0, 1., .0); s++;
    
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(31.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(26.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(38.0, 1., .0); s++;
    n += (1.-step(0.5*st, abs(t - (s + .5)*st))) * vec3(29.0, 1., .0); s++;
    
    n.z = n.y*t;

    }

    return 1.0*n;
}

vec2 pattern2(float time) {
    vec2 n = vec2(0);
    float steps = 16.;
    float t = fract(time*TICK/steps);
    float st = 1./steps;

    n  = (1.-step(0.5*st, abs(t - ( 2. + .5)*st))) * vec2(14.0, 1.);
    n += (1.-step(0.5*st, abs(t - ( 6. + .5)*st))) * vec2(14.0, 1.);
    n += (1.-step(0.5*st, abs(t - (10. + .5)*st))) * vec2(14.0, 1.);
    n += (1.-step(0.5*st, abs(t - (14. + .5)*st))) * vec2(26.0, 1.);
    n += (1.-step(0.5*st, abs(t - (15. + .5)*st))) * vec2(14.0, 1.);

    return 1.0*n;
}

vec4 pattern3(float time) {
    vec4 n = vec4(0);
    float steps = 64.;
    float t = fract(time*TICK/steps);
    float st = 1./steps;
    float pt = time*T16;

    if (pt < 8.) {
    } else
    if (pt < 16.) {
        steps = 16.;
        t = fract(time*TICK/steps);
        st = 1./steps;
        n  = (1.-step(0.5*st, abs(t - ( 0. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - ( 6. + .5)*st))) * vec4(1., Dmoll);
        //n += (1.-step(0.5*st, abs(t - (28. + .5)*st))) * vec4(1., 38., 41., 45.);
        //n += (1.-step(0.5*st, abs(t - (30. + .5)*st))) * vec4(1., 38., 41., 45.);
        //n += (1.-step(0.5*st, abs(t - (32. + .5)*st))) * vec4(1., 36., 40., 45.);

    } else
    if (pt < 24. || pt > 32.) {

        steps = 64.;
        t = fract(time*TICK/steps);
        st = 1./steps;

        n  = (1.-step(0.5*st, abs(t - ( 0. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - ( 6. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (12. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (14. + .5)*st))) * vec4(1., Amoll6);
        n += (1.-step(0.5*st, abs(t - (16. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (32. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (38. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (44. + .5)*st))) * vec4(1., Dmoll);
        n += (1.-step(0.5*st, abs(t - (46. + .5)*st))) * vec4(1., Cdur);
        n += (1.-step(0.5*st, abs(t - (48. + .5)*st))) * vec4(1., Gdur6);

        n += vec4(0, 12,12,12)*(1.-step(pt, 32.));
    }

    return 1.0*n;
}

float mask(float time, float f) {
    float pt = time*T16;

    float m1 = (1. - 0.)/(P2 - P1);
    float m2 = -(1. - 0.)/(P4 - P3);
    float v = 1. - f*clamp(min(m1*(pt-P1), m2*(pt-P4)), 0., 1.);
    return v;
}

float fadeInOut(float time) {
    float pt = time*T16;
    return min(smoothstep(0., 1., pt), smoothstep(END+8., END, pt));
}

// misc.
float hash11(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= 2.*p;
    return fract(p);
}

float hash21(vec2 p) {
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float p2f(float pitch) {
    return step(0., pitch) * pow(pow(2., 1./12.), pitch) * LOW_C;
}


// effects
float dist(float smp, float gain) {
    return clamp(smp, -gain, gain)/gain;
}

vec2 dist(vec2 smp, float gain) {
    return clamp(smp, -gain, gain)/gain;
}

float quant(float smp, float aLvl) {
    return floor(smp*aLvl)/aLvl;
}

vec2 quant(vec2 smp, float aLvl) {

    return floor(smp*aLvl)/aLvl;
}

// generators
float kick(float time) {
    float t = fract(TICK*time);
    float beat = kdBeat(time).y;
    float fm = 19.*pow(.06 + t, .247);
	float am = beat*env(t, vec4(.0, .5, .5, .4));
    float s = am*sin(fm * PI2);
    return dist(s, .5 );
}

float snare(float time) {
    float t = fract(TICK*time);
    vec3 beat = snBeat(time);
    float fm = beat.x*pow(2.1 + t, .275);
	float am = beat.y*env(t, vec4(.1, .2, .6, .6));
    float s = am*am*(sin(fm * PI2) + sin(1.5 * fm * PI2));
    float n = am*hash11(31.*fm);
    return dist(mix(s, n, .3), .3);
}

float hihat(float time) {
    float t = fract(TICK*time);
    vec3 beat = hhBeat(time);
    float fm = pow(851. + 4.*t, 1.6);
	float am = beat.y*env(t, vec4(.01, .5*beat.z, .4+.5*beat.z, .2 + .2*beat.z));
    float s = sin(fm * PI2) + sin(1.5 * fm * PI2);
    return am*am*s;
}

float sampleHihat(float time) {
    float td2 = .6*iSampleRate;
    float td1 = .9*td2;
    float t1 = floor(time*td1)/td1;
    float t2 = floor(time*td2)/td2;
    float smp1 = hihat(t1);
    float smp2 = hihat(t2);
    return dist(smp2 - smp1, .6);
}

float synth(float time, vec4 en, vec2 n, float m) {
    float t = fract(TICK*time);
    float e = n.y*env(t, en);
    float w = .45 *(1. - .05*e);
    float fm = fract(p2f(n.x)*time);
    float pls = 1.-step(w, fm);
	float saw = pls * fract(fm/w);
    return e*mix(saw, pls, m);
}

float sampleSynth(float time, vec4 en, vec2 n, float m, float td, float sm) {
    float t = floor(time*td)/td;
    return mix(synth(time, en, n, m), synth(t, en, n, m), sm);
}

float mono(float time, float sm) {
    vec3 n = pattern1(time);
    float td = nsin(T/64.*PI2*time, 10000., 12000.);
    float smp = sampleSynth(time, vec4(.01, .4, .4, .5), n.xy, .2, td, sm);
    return dist(smp, .7);
}

float bass(float time) {
    vec2 n = pattern2(time);
    float smp = sampleSynth(time, vec4(.1, .3, .6, .5), n, .6, 8000., .8);
    return dist(smp, .8);
}

float synth1(float time) {
    vec4 n = pattern3(time);
    //n -= vec4(.0, vec3(0,12,12));
    
    float t = fract(.5*TICK*time);
    float e = n.x*env(t, vec4(.001, .1, .4, .6));
    float w = (1. - .2*e) * nsin(time, .3, .5);
    // voice 1
    float fm = fract(p2f(n.y)*time);
    float pls = 1.-step(w, fm);
    float smp = pls*fract(fm/w);
    // voice2
    fm = fract(p2f(n.z+12.0)*time);
    pls = 1.-step(w, fm);
    smp += pls* fract(fm/w);
    // voice3
    fm = fract(p2f(n.w+12.0)*time);
    pls = 1.-step(w, fm);
    smp += pls* fract(fm/w);
    return e*smp;
}

float sampleSynth1(float time, float td, float sm) {
    float t = floor(time*td)/td;
    float h = nsin(PI2*td/iSampleRate, 1.-sm, sm);
    return mix(synth1(time), synth1(t), h);
}

vec2 chords(float time) {
    float td = nsin(T*time, 8000., 24000.);
    float s1 = sampleSynth1(time, td, .6);
    float s2 = sampleSynth1(time - 3./TICK, td, .6);
    float s3 = sampleSynth1(time - 6./TICK, td, .5);
    float s4 = sampleSynth1(time - 9./TICK, td, .4);
    return vec2(
        s1 + .4*s2 + .05*s3 + .07*s4,
        s1 + .1*s2 + .2*s3 + .07*s4
    );
}

vec2 allSound(float time) {
    // panning
    vec4 pan1 = vec4(.4, .5, .8, .45);
    vec4 pan2 = vec4(.4, .0, .4, .0);
    // master mix
    vec2 ch1 = .4*vec2(snare(time), snare(time-.01));
    vec2 ch2 = .3*vec2(kick(time), kick(time-.0001));
    vec2 ch3 = .2*vec2(mono(time, 0.6), mono(time-.03, .2));
    vec2 ch4 = .4*vec2(bass(time), bass(time-.01));
    vec4 ch5 = .2*vec4(chords(time), chords(time-.02));
    vec2 ch6 = .3*vec2(sampleHihat(time), sampleHihat(time-.02));

    vec4 left1 = vec4(ch1.x, ch2.x, ch3.x, ch4.x);
    vec4 right1 = vec4(ch1.y, ch2.y, ch3.y, ch4.y);
    
    vec4 left2 = vec4(ch5.x, ch5.z, ch6.x, .0);
    vec4 right2 = vec4(ch5.y, ch5.w, ch6.y, .0);
    
    vec2 final = vec2(dot(left1, pan1), dot(right1, 1.-pan1));
         final += vec2(dot(left2, pan2), dot(right2, 1.-pan2));
         
         final = quant(final, 65536.);

    return clamp(2.*final, -.8, .8);
}

vec2 sampleAll(float td, float time) {
    float t = floor(time*td)/td;
    return allSound(t);
}

vec2 mainSound(int samp, float time) {
    //return allSound(time);
    float m = pow(mask(time, .96), 1.2);
    return fadeInOut(time)*sampleAll(iSampleRate*m, time);
}


in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform int u_offset;
uniform vec2 u_size;

out vec2 smp;

// main function
void main(void) {
    vec2 size = vec2(textureSize(u_texture, 0));
    ivec2 ij = ivec2(floor(size * v_texcoord));
    int samp = u_offset + ij.x + ij.y*int(size.x);
    float time = float(samp)/48000.;

    smp = mainSound(samp, time);
}

