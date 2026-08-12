<script>
    import { T, useTask, useThrelte } from "@threlte/core";
    import {
        BufferAttribute,
        BufferGeometry,
        Color,
        DoubleSide,
        Mesh,
        ShaderMaterial,
        Vector2,
    } from "three";
    import { planets, auToUnits, orbitPoint, orbitAngle } from "$lib/census";

    let { opacity = 0.5, elapsed = 0 } = $props();

    const TAU = Math.PI * 2;
    const SEGMENTS = 192;
    const CORE_PX = 2.2;
    const GLOW_SCALE = 4.5;
    const GLOW = 0.45;
    const TRAIL = 1;
    const SPAN = TAU;
    const FALLOFF = 1.8;
    const DEPTH_FADE = 0.35;

    const { size } = useThrelte();

    const VERT = `
        attribute vec3 aNext;
        attribute float aSide;
        attribute float aTheta;

        uniform vec2 uResolution;
        uniform float uWidth;
        uniform float uRadius;

        varying float vTheta;
        varying float vSide;
        varying float vDepth;

        void main() {
            vTheta = aTheta;
            vSide = aSide;

            vec4 mvA = modelViewMatrix * vec4(position, 1.0);
            vec4 mvB = modelViewMatrix * vec4(aNext, 1.0);
            vec4 starMv = viewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            vDepth = (mvA.z - starMv.z) / uRadius;

            vec4 clipA = projectionMatrix * mvA;
            vec4 clipB = projectionMatrix * mvB;

            vec2 ndcA = clipA.xy / clipA.w;
            vec2 ndcB = clipB.xy / clipB.w;

            vec2 d = (ndcB - ndcA) * uResolution;
            vec2 dir = length(d) > 1e-6 ? normalize(d) : vec2(1.0, 0.0);
            vec2 nrm = vec2(-dir.y, dir.x);

            vec2 off = nrm * aSide * (uWidth * 0.5) * (2.0 / uResolution);
            clipA.xy += off * clipA.w;

            gl_Position = clipA;
        }
    `;

    const FRAG = `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uAngleA;
        uniform float uAngleB;
        uniform float uCount;
        uniform float uOpacity;
        uniform float uTrail;
        uniform float uSpan;
        uniform float uFalloff;
        uniform float uDepthFade;
        uniform float uCore;
        uniform float uGlow;

        varying float vTheta;
        varying float vSide;
        varying float vDepth;

        float trailAt(float ang) {
            float d = mod(ang - vTheta, 6.28318530718);
            return pow(max(0.0, 1.0 - d / uSpan), uFalloff);
        }

        void main() {
            float kA = trailAt(uAngleA);
            float kB = uCount > 1.5 ? trailAt(uAngleB) : 0.0;
            vec3 col = kB > kA ? uColorB : uColorA;

            float a = uOpacity * (1.0 - uTrail + uTrail * max(kA, kB));

            float nearF = 0.5 + 0.5 * clamp(vDepth, -1.0, 1.0);
            a *= 1.0 - uDepthFade * (1.0 - nearF);

            float t = abs(vSide);
            float core = 1.0 - smoothstep(uCore * 0.6, uCore, t);
            float halo = pow(max(0.0, 1.0 - t), 2.5) * uGlow;
            a *= max(core, halo);

            if (a <= 0.002) discard;
            gl_FragColor = vec4(col, a);
        }
    `;

    const groups = [];
    for (const p of planets) {
        const key =
            p.semiMajorAxis + "|" + p.eccentricity + "|" + p.orbitalInclination;
        const hit = groups.find((g) => g.key === key);
        if (hit) hit.bodies.push(p);
        else groups.push({ key, bodies: [p] });
    }

    const orbits = groups.map((g) => {
        const lead = g.bodies[0];
        const R = auToUnits(lead.semiMajorAxis);
        const e = lead.eccentricity;

        const P = [];
        const TH = [];
        for (let i = 0; i <= SEGMENTS; i++) {
            const w = (i / SEGMENTS) * TAU;
            const th = w - e * 0.85 * Math.sin(w);
            TH.push(th);
            P.push(orbitPoint(lead, th));
        }

        const n = SEGMENTS + 1;
        const pos = new Float32Array(n * 6);
        const nxt = new Float32Array(n * 6);
        const sid = new Float32Array(n * 2);
        const the = new Float32Array(n * 2);

        for (let i = 0; i < n; i++) {
            const a = P[i];
            const b = i < SEGMENTS ? P[i + 1] : P[1];
            for (let s = 0; s < 2; s++) {
                const v = i * 2 + s;
                pos[v * 3] = a.x;
                pos[v * 3 + 1] = a.y;
                pos[v * 3 + 2] = a.z;
                nxt[v * 3] = b.x;
                nxt[v * 3 + 1] = b.y;
                nxt[v * 3 + 2] = b.z;
                sid[v] = s === 0 ? -1 : 1;
                the[v] = TH[i];
            }
        }

        const idx = [];
        for (let i = 0; i < SEGMENTS; i++) {
            const a = i * 2;
            idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }

        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(pos, 3));
        geometry.setAttribute("aNext", new BufferAttribute(nxt, 3));
        geometry.setAttribute("aSide", new BufferAttribute(sid, 1));
        geometry.setAttribute("aTheta", new BufferAttribute(the, 1));
        geometry.setIndex(idx);

        const cols = g.bodies.map(
            (b) => new Color(b.orbitLineColor ?? "#999999"),
        );

        const uniforms = {
            uResolution: { value: new Vector2(1, 1) },
            uWidth: { value: CORE_PX * GLOW_SCALE },
            uRadius: { value: R },
            uCore: { value: 1 / GLOW_SCALE },
            uGlow: { value: GLOW },
            uOpacity: { value: opacity },
            uTrail: { value: TRAIL },
            uSpan: { value: SPAN },
            uFalloff: { value: FALLOFF },
            uDepthFade: { value: DEPTH_FADE },
            uAngleA: { value: 0 },
            uAngleB: { value: 0 },
            uCount: { value: g.bodies.length },
            uColorA: { value: cols[0] },
            uColorB: { value: cols[1] ?? cols[0] },
        };

        const mesh = new Mesh(
            geometry,
            new ShaderMaterial({
                uniforms,
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                depthWrite: false,
                side: DoubleSide,
            }),
        );
        mesh.frustumCulled = false;
        mesh.renderOrder = 1;

        return { mesh, uniforms, bodies: g.bodies };
    });

    useTask(() => {
        for (const o of orbits) {
            o.uniforms.uResolution.value.set(
                size.current.width,
                size.current.height,
            );
            o.uniforms.uOpacity.value = opacity;
            o.uniforms.uAngleA.value = orbitAngle(o.bodies[0], elapsed);
            if (o.bodies[1]) {
                o.uniforms.uAngleB.value = orbitAngle(o.bodies[1], elapsed);
            }
        }
    });
</script>

{#each orbits as o}
    <T is={o.mesh} />
{/each}
