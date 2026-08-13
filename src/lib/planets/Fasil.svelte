<script>
    import { untrack } from "svelte";
    import { T, useThrelte, useTask } from "@threlte/core";
    import { BackSide, RepeatWrapping, TextureLoader, Vector3 } from "three";

    let {
        bodyRadius,
        output,
        position = [0, 0, 0],
        surf = 6.64,
        limb = 0.42,
        limbPower = 0.35,
        saturation = 1.33,
        bumpiness = 0.635,
        noiseScale = 1.95,
        scaleDrift = 0.46,
        twist = 3,
        threshold = 0.635,
        height = 0.08,
        falloff = 8.1,
        prominence = 6.15,
        drift = 0.027,
        churn = 0.097,
        steps = 40,
        lookSat = 0.96,
        lookContrast = 0.78,
        promFadeStart = 45,
        promFadeEnd = 12,
    } = $props();

    const config = untrack(() => ({
        bodyRadius,
        surf,
        limb,
        limbPower,
        saturation,
        bumpiness,
        noiseScale,
        scaleDrift,
        twist,
        threshold,
        height,
        falloff,
        prominence,
        drift,
        churn,
        steps,
        lookSat,
        lookContrast,
        promFadeStart,
        promFadeEnd,
    }));

    const H = Math.max(config.height, 0.02);
    const RMAX = 1 + 0.5 * config.bumpiness + H;
    const SHELL = RMAX * 1.02;

    const { camera } = useThrelte();
    const origin = untrack(() => new Vector3(...position));

    const FASIL_VERT = `
        uniform float uInvRp;
        varying vec3 vObj;
        void main() {
            vObj = position * uInvRp;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const FASIL_FRAG = `
        uniform sampler2D uColorTex;
        uniform sampler2D uPromTex;
        uniform sampler2D uDispTex;
        uniform vec3  uCamObj;
        uniform float uTime;
        uniform float uSurf, uLimb, uLimbP, uSat;
        uniform float uStren, uFScale, uDrift, uWarp, uFThr, uHeight;
        uniform float uFall, uProm, uDA, uDB, uSteps;
        uniform float uRMax, uPromFade, uLookS, uLookC;
        varying vec3 vObj;

        const float PI = 3.14159265359;
        const float HREF = 0.45;

        vec2 eq(vec3 n) {
            return vec2(atan(n.z, n.x) / (2.0 * PI) + 0.5,
                        asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
        }

        vec3 srgb3(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }

        float surfaceR(vec2 uv) {
            float h = pow(texture2D(uDispTex, uv).r, 1.0 / 2.2);
            return 1.0 + (h - 0.5) * uStren;
        }

        float hash13(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float vnoise(vec3 x) {
            vec3 i = floor(x), f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
                           mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
                       mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                           mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        float fbm2(vec3 p) { return vnoise(p) * 0.65 + vnoise(p * 2.07) * 0.35; }

        float fbmFlat(vec3 p) {
            float s = 0.0, f = 1.0;
            for (int i = 0; i < 4; i++) { s += vnoise(p * f); f *= 2.0; }
            return clamp((s / 4.0 - 0.5) * 1.5 + 0.5, 0.0, 1.0);
        }

        const mat3 AGX = mat3(0.842479062253094,  0.0423282422610123, 0.0423756549057051,
                              0.0784335999999992, 0.878468636469772,  0.0784336,
                              0.0792237451477643, 0.0791661274605434, 0.879142973793104);
        const mat3 AGX_INV = mat3( 1.19687900512017,   -0.0528968517574562, -0.0529716355144438,
                                  -0.0980208811401368,  1.15190312990417,   -0.0980434501171241,
                                  -0.0990297440797205, -0.0989611768448433,  1.15107367264116);

        vec3 agxCurve(vec3 x) {
            vec3 x2 = x * x, x4 = x2 * x2;
            return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4
                 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
        }

        vec3 agx(vec3 c) {
            c = AGX * max(c, vec3(0.0));
            c = clamp((log2(c + 1e-10) + 12.47393) / 16.500139, 0.0, 1.0);
            return agxCurve(c);
        }

        void main() {
            vec3 ro = uCamObj;
            vec3 rd = normalize(vObj - uCamObj);

            float b  = dot(ro, rd);
            vec3  q  = ro - b * rd;
            float q2 = dot(q, q);

            float tSurf = 1e9;
            bool  hit = false;
            float hs = 1.0 - q2;
            if (hs > 0.0) {
                float t = -b - sqrt(hs);
                if (t > 0.0) { tSurf = t; hit = true; }
            }

            vec3 col = vec3(0.0);

            float hb = uRMax * uRMax - q2;
            if (uPromFade > 0.002 && hb > 0.0) {
                float hh = sqrt(hb);
                float t0 = max(-b - hh, 0.0);
                float t1 = min(-b + hh, tSurf);
                if (t1 > t0) {
                    float H = max(uHeight, 0.02);
                    float n = uSteps;
                    float dt = max((t1 - t0) / n, 1e-4);
                    float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
                    float glow = 0.0;
                    vec3 flow = vec3(0.0, uTime * uDA, uTime * uDB);

                    for (int i = 0; i < 80; i++) {
                        if (float(i) >= n) break;
                        float t = t0 + (float(i) + jit) * dt;
                        if (t > t1) break;
                        vec3 p = q + rd * (t + b);
                        float r = length(p);
                        if (r < 1.0) break;
                        vec3 nd = p / r;
                        vec2 duv = eq(nd);
                        float pol = 1.0 - pow(abs(nd.y), 5.0);
                        float pm = texture2D(uPromTex, duv).r;
                        float mask = mix(0.45, 1.0, pm) * pol;
                        if (mask < 0.01) continue;
                        float above = r - surfaceR(duv);
                        if (above < -0.03) continue;
                        float reach = uFall * mix(2.4, 0.70, clamp(pm * 2.2, 0.0, 1.0)) * (HREF / H);
                        float fall = exp(-max(above, 0.0) * reach);
                        if (fall < 0.02) continue;
                        float hn = max(above, 0.0) / H;
                        float tw = hn * uWarp * 2.6 * HREF;
                        float ct = cos(tw), st = sin(tw);
                        vec3 tp = vec3(p.x * ct - p.z * st, p.y, p.x * st + p.z * ct);
                        vec3 gen = nd * 0.5 + 0.5;
                        float sd = mix(1.0, (gen.x + gen.y + gen.z) / 3.0 * 2.0, uDrift);
                        vec3 sp = tp * (uFScale * max(sd, 0.10)) + flow;
                        vec2 w2 = vec2(fbm2(sp), vnoise(sp + 7.3));
                        float wamt = uWarp * (0.25 + hn * 3.0 * HREF);
                        float dens = fbmFlat(sp * 1.35 + vec3(w2 - 0.5, w2.x - 0.5) * wamt);
                        dens = smoothstep(uFThr, 1.0, dens);
                        glow += dens * mask * fall * dt;
                    }
                    col += vec3(1.0, 0.90, 0.74) * glow * uProm * uPromFade;
                }
            }

            if (hit) {
                vec3 nrm = normalize(q + rd * (tSurf + b));
                vec2 uvS = eq(nrm);
                vec3 s = srgb3(texture2D(uColorTex, uvS).rgb);
                float sl = dot(s, vec3(0.2126, 0.7152, 0.0722));
                s = max(sl + (s - sl) * uSat, vec3(0.0));
                float f = clamp(dot(nrm, -rd), 0.0, 1.0);
                float term = pow(max(f, 0.001), uLimbP);
                float shade = uLimb >= 0.0
                    ? mix(1.0, term, uLimb)
                    : mix(1.0, 1.0 / max(term, 0.05), -uLimb);
                col += s * uSurf * shade;
            }

            vec3 t = agx(col);
            float luma = dot(t, vec3(0.2126, 0.7152, 0.0722));
            t = luma + (t - luma) * uLookS;
            t = pow(max(t, 0.0), vec3(uLookC));
            vec3 disp = clamp(AGX_INV * t, 0.0, 1.0);

            float a = hit ? 1.0 : max(disp.r, max(disp.g, disp.b));
            if (a < 0.002) discard;

            gl_FragColor = vec4(pow(disp, vec3(2.2)), a);
            #include <colorspace_fragment>
        }
    `;

    const UNIFORMS = untrack(() => ({
        uColorTex: { value: null },
        uPromTex: { value: null },
        uDispTex: { value: null },
        uCamObj: { value: new Vector3(0, 0, 8) },
        uInvRp: { value: 1 / config.bodyRadius },
        uTime: { value: 0 },
        uSurf: { value: config.surf },
        uLimb: { value: config.limb },
        uLimbP: { value: config.limbPower },
        uSat: { value: config.saturation },
        uStren: { value: config.bumpiness },
        uFScale: { value: config.noiseScale },
        uDrift: { value: config.scaleDrift },
        uWarp: { value: config.twist },
        uFThr: { value: config.threshold },
        uHeight: { value: H },
        uFall: { value: config.falloff },
        uProm: { value: config.prominence },
        uDA: { value: config.drift },
        uDB: { value: config.churn },
        uSteps: { value: Math.min(config.steps, 80) },
        uRMax: { value: RMAX },
        uPromFade: { value: 0 },
        uLookS: { value: config.lookSat },
        uLookC: { value: config.lookContrast },
    }));

    const loader = new TextureLoader();
    function load(url, slot) {
        loader.load(url, (tex) => {
            tex.wrapS = RepeatWrapping;
            tex.anisotropy = 8;
            UNIFORMS[slot].value = tex;
        });
    }
    load("/textures/fasil_color.jpg", "uColorTex");
    load("/textures/fasil_prom.jpg", "uPromTex");
    load("/textures/fasil_disp.png", "uDispTex");

    let elapsed = 0;
    let mesh = null;

    useTask((delta) => {
        const cam = camera.current;
        if (!cam || !mesh) return;

        elapsed += delta;
        UNIFORMS.uTime.value = elapsed;

        UNIFORMS.uCamObj.value.copy(cam.position);
        mesh.worldToLocal(UNIFORMS.uCamObj.value);
        UNIFORMS.uCamObj.value.multiplyScalar(UNIFORMS.uInvRp.value);

        const dist = Math.max(cam.position.distanceTo(origin), 1e-6);
        const f = Math.min(
            1,
            Math.max(
                0,
                (dist - config.promFadeEnd) /
                    (config.promFadeStart - config.promFadeEnd),
            ),
        );
        UNIFORMS.uPromFade.value = 1 - f * f * (3 - 2 * f);
    });
</script>

<T.Mesh
    {position}
    oncreate={(m) => {
        mesh = m;
        output?.(m);
    }}
>
    <T.SphereGeometry args={[SHELL * config.bodyRadius, 64, 32]} />
    <T.ShaderMaterial
        args={[
            {
                uniforms: UNIFORMS,
                vertexShader: FASIL_VERT,
                fragmentShader: FASIL_FRAG,
                transparent: true,
                premultipliedAlpha: true,
                depthWrite: false,
                depthTest: true,
                side: BackSide,
            },
        ]}
    />
</T.Mesh>
