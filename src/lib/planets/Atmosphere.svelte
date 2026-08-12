<script>
    import { untrack } from "svelte";
    import { T } from "@threlte/core";
    import { AdditiveBlending, Color, Vector3 } from "three";

    let {
        planetRadius,
        color = "#99e2ff",
        density = 1.5,
        intensity = 1.15,
        scale = 1.045,
        shellOpacity = 0.25,
    } = $props();

    const config = untrack(() => ({
        radius: planetRadius,
        color,
        density,
        intensity,
        scale,
    }));

    const SHELL = config.radius * 1.01;
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
        uniform vec3 uColor;
        uniform vec3 uStarPos;
        uniform float uRp;
        uniform float uRa;
        uniform float uDensity;
        uniform float uIntensity;
        varying vec3 vPosV;
        varying vec3 vCenterV;
        void main() {
            vec3 rd = normalize(vPosV);
            vec3 oc = vCenterV;
            float tca = dot(oc, rd);
            float b2 = dot(oc, oc) - tca * tca;
            float ra2 = uRa * uRa;
            if (b2 >= ra2) discard;
            float rp2 = uRp * uRp;
            float outer = sqrt(ra2 - b2);
            float L = (b2 < rp2) ? (outer - sqrt(rp2 - b2)) : (2.0 * outer);
            float alpha = 1.0 - exp(-(L / uRp) * uDensity);
            vec3 nearP = rd * tca;
            vec3 nrm = normalize(nearP - vCenterV);
            vec3 starV = (viewMatrix * vec4(uStarPos, 1.0)).xyz;
            float lit = smoothstep(-0.30, 0.30, dot(nrm, normalize(starV - nearP)));
            gl_FragColor = vec4(uColor * uIntensity * alpha * lit, alpha * lit);
        }
    `;

    const uniforms = {
        uColor: { value: new Color(config.color) },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uRp: { value: config.radius },
        uRa: { value: OUTER },
        uDensity: { value: config.density },
        uIntensity: { value: config.intensity },
    };
</script>

<T.Mesh>
    <T.SphereGeometry args={[SHELL, 48, 24]} />
    <T.MeshStandardMaterial
        {color}
        transparent={true}
        opacity={shellOpacity}
        depthWrite={false}
    />
</T.Mesh>

<T.Mesh>
    <T.SphereGeometry args={[OUTER, 64, 32]} />
    <T.ShaderMaterial
        args={[
            {
                uniforms,
                vertexShader: VERT,
                fragmentShader: FRAG,
                transparent: true,
                depthWrite: false,
                blending: AdditiveBlending,
            },
        ]}
    />
</T.Mesh>
