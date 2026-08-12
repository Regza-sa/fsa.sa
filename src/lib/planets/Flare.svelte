<script>
    import { untrack } from "svelte";
    import { T, useThrelte, useTask } from "@threlte/core";
    import { AdditiveBlending, Color, Vector3 } from "three";

    let {
        bodyRadius,
        color = "#fffdf9",
        ratio = 26.2,
        minScale = 0.02,
        fadeStart = 45,
        fadeEnd = 12,
        proxCurve = 1.5,
        proxFloor = 0.08,
        proxNear = 3,
        proxFar = 700,
        position = [0, 0, 0],
        occluder,
        occludeRatio = 4.5,
    } = $props();

    const config = untrack(() => ({
        bodyRadius,
        color,
        ratio,
        minScale,
        fadeStart,
        fadeEnd,
        proxCurve,
        proxFloor,
        proxNear,
        proxFar,
        occludeRatio,
    }));

    const { camera } = useThrelte();
    const origin = untrack(() => new Vector3(...position));
    const LOG_SPAN = Math.log(config.proxFar) - Math.log(config.proxNear);

    const FLARE_VERT = `
        varying vec2 vUv;
        uniform float uScale;
        void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            mv.xy += position.xy * uScale * (-mv.z);
            gl_Position = projectionMatrix * mv;
        }
    `;

    const FLARE_FRAG = `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uProx;
        uniform float uFade;
        uniform float uTime;

        float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }

        float angNoise(float a, float count, float seed) {
            float x = a / 6.28318530718 * count;
            float i = floor(x);
            float f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(hash1(mod(i, count) + seed), hash1(mod(i + 1.0, count) + seed), f);
        }

        float rayOctave(float ang, float d, float count, float seed, float sharp) {
            float m = pow(angNoise(ang, count, seed), sharp);
            float len = mix(0.260, 1.0, angNoise(ang, count, seed + 17.0));
            return m * pow(max(0.0, 1.0 - d / max(len, 0.06)), 1.6);
        }

        void main() {
            vec2 p = vUv - 0.5;
            float d = length(p) * 2.0;
            if (d > 1.0) discard;
            float ang = atan(p.y, p.x);

            float core = pow(1.0 - d, 10.0) * 2.40;

            float hb = 0.570 * mix(0.55, 1.0, uProx);
            vec3 halo = vec3(
                pow(max(0.0, 1.0 - d * 0.930), 2.50),
                pow(1.0 - d, 2.50),
                pow(max(0.0, 1.0 - d * 1.070), 2.50)
            ) * hb;

            float sa = ang + 0.4189 + uTime * 0.0096;
            float jit = (angNoise(sa, 4.0, 7.0) - 0.5) * 0.720;
            float lv = mix(0.752, 1.0, angNoise(sa, 4.0, 23.0));
            float sl = 1.90 * lv * mix(0.62, 1.0, uProx);
            float sp = abs(cos((sa + jit) * 2.0));
            float spikes = pow(sp, 80.0) *
                pow(max(0.0, 1.0 - d / sl), 1.4) * 0.300;

            float w = 18.0 / (1.0 + abs(p.x) * 0.90);
            float sy = exp(-abs(p.y) * w);
            float sx = exp(-abs(p.x) / 0.88);
            float streak = sy * sx * 0.290 * mix(0.40, 1.0, uProx);

            float t = uTime * 0.0286;
            float rays = rayOctave(ang + t, d, 22.0, 1.0, 2.80) * 1.00
                + rayOctave(ang - t * 0.63, d, 48.4, 2.0, 4.20) * 0.52
                + rayOctave(ang + t * 0.31, d, 103.4, 3.0, 6.16) * 0.27;
            rays *= 0.720 * uProx;

            float mono = (core + spikes + streak + rays) * uFade;
            vec3 col = uColor * mono + uColor * halo * uFade;
            float a = mono + halo.g * uFade;
            gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }
    `;

    const FLARE_UNIFORMS = untrack(() => ({
        uColor: { value: new Color(config.color) },
        uScale: { value: config.minScale },
        uProx: { value: config.proxFloor },
        uFade: { value: 0 },
        uTime: { value: 0 },
    }));

    let elapsed = 0;
    let proxy = $state(null);

    useTask((delta) => {
        const cam = camera.current;
        if (!cam) return;

        elapsed += delta;
        FLARE_UNIFORMS.uTime.value = elapsed;

        const dist = Math.max(cam.position.distanceTo(origin), 1e-6);

        const tanHalfFov = Math.tan(((cam.fov ?? 50) * Math.PI) / 360);
        const bodyScreen = config.bodyRadius / dist / tanHalfFov;
        const flareScreen = Math.max(
            config.minScale,
            bodyScreen * config.ratio,
        );
        FLARE_UNIFORMS.uScale.value = flareScreen * tanHalfFov;

        const t = (Math.log(config.proxFar) - Math.log(dist)) / LOG_SPAN;
        const p = Math.pow(Math.min(1, Math.max(0, t)), config.proxCurve);
        FLARE_UNIFORMS.uProx.value =
            config.proxFloor + (1 - config.proxFloor) * p;

        const f = Math.min(
            1,
            Math.max(
                0,
                (dist - config.fadeEnd) / (config.fadeStart - config.fadeEnd),
            ),
        );
        const fade = f * f * (3 - 2 * f);
        FLARE_UNIFORMS.uFade.value = fade;

        if (proxy) {
            proxy.scale.setScalar(config.bodyRadius * config.occludeRatio * fade);
        }
    });
</script>

<T.Mesh {position} renderOrder={10} frustumCulled={false}>
    <T.PlaneGeometry args={[2, 2]} />
    <T.ShaderMaterial
        args={[
            {
                uniforms: FLARE_UNIFORMS,
                vertexShader: FLARE_VERT,
                fragmentShader: FLARE_FRAG,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                blending: AdditiveBlending,
            },
        ]}
    />
</T.Mesh>

<T.Mesh
    {position}
    visible={false}
    oncreate={(mesh) => {
        proxy = mesh;
        occluder?.(mesh);
    }}
>
    <T.SphereGeometry args={[1, 16, 8]} />
</T.Mesh>
