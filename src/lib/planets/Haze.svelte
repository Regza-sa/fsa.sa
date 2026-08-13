<script>
    import { untrack } from "svelte";
    import { T } from "@threlte/core";
    import { Color, Vector3 } from "three";

    let {
        planetRadius,
        scale = 1.0991,
        deepColor = "#94c9ff",
        hazeColor = "#b3d4f8",
        deepDensity = 6.0,
        hazeDensity = 2.5,
        hazeFalloff = 0.35,
        density = 1.0,
        intensity = 1.0,
        terminator = 0.35,
        steps = 12,
    } = $props();

    const config = untrack(() => ({
        radius: planetRadius,
        scale,
        deepColor,
        hazeColor,
        deepDensity,
        hazeDensity,
        hazeFalloff,
        density,
        intensity,
        terminator,
        steps,
    }));

    const OUTER = config.radius * config.scale;

    const VERT = `
        varying vec3 vPosV;
        varying vec3 vCenterV;
        void main() {
            vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
            vPosV = viewPos.xyz;
            vCenterV = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewPos;
        }
    `;

    const FRAG = `
        uniform vec3  uDeep;
        uniform vec3  uHaze;
        uniform vec3  uStarPos;
        uniform float uRp;
        uniform float uRa;
        uniform float uDeepD;
        uniform float uHazeD;
        uniform float uHazeP;
        uniform float uDensity;
        uniform float uIntensity;
        uniform float uTerm;
        uniform float uSteps;
        varying vec3 vPosV;
        varying vec3 vCenterV;

        void main() {
            vec3 rd = normalize(vPosV);
            vec3 oc = vCenterV;
            float tca = dot(oc, rd);
            vec3  qv = oc - tca * rd;
            float d2 = dot(qv, qv);

            float ra2 = uRa * uRa;
            if (d2 >= ra2) discard;

            float rp2 = uRp * uRp;
            float outer = sqrt(ra2 - d2);
            float s0 = -outer;
            float s1 = (d2 < rp2) ? -sqrt(rp2 - d2) : outer;
            if (s1 <= s0) discard;

            vec3 starV = (viewMatrix * vec4(uStarPos, 1.0)).xyz;

            float n = uSteps;
            float ds = (s1 - s0) / n;
            float dsn = ds / uRa * uDensity;
            float span = uRa - uRp;

            float tau = 0.0;
            vec3 scat = vec3(0.0);

            for (int i = 0; i < 24; i++) {
                if (float(i) >= n) break;
                float s = s0 + (float(i) + 0.5) * ds;
                vec3 rel = rd * s - qv;
                float h = clamp((uRa - length(rel)) / span, 0.0, 1.0);
                float dA = uDeepD * h;
                float dB = uHazeD * pow(h, uHazeP);
                vec3 nrm = normalize(rel);
                vec3 p = rd * (tca + s);
                float lit = smoothstep(-uTerm, uTerm, dot(nrm, normalize(starV - p)));
                tau += (dA + dB) * dsn;
                scat += (uDeep * dA + uHaze * dB) * dsn * lit;
            }

            float alpha = 1.0 - exp(-tau);
            if (alpha < 0.002) discard;
            vec3 col = scat / max(tau, 1e-4) * uIntensity * alpha;

            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
    `;

    const uniforms = {
        uDeep: { value: new Color(config.deepColor) },
        uHaze: { value: new Color(config.hazeColor) },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uRp: { value: config.radius },
        uRa: { value: OUTER },
        uDeepD: { value: config.deepDensity },
        uHazeD: { value: config.hazeDensity },
        uHazeP: { value: config.hazeFalloff },
        uDensity: { value: config.density },
        uIntensity: { value: config.intensity },
        uTerm: { value: config.terminator },
        uSteps: { value: Math.min(config.steps, 24) },
    };
</script>

<T.Mesh>
    <T.SphereGeometry args={[OUTER, 64, 32]} />
    <T.ShaderMaterial
        args={[
            {
                uniforms,
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                premultipliedAlpha: true,
                depthWrite: false,
            },
        ]}
    />
</T.Mesh>
