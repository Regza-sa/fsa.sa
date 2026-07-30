<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T, useThrelte } from "@threlte/core";
    import {
        BufferGeometry,
        Vector3,
        TextureLoader,
        EquirectangularReflectionMapping,
        SRGBColorSpace,
        AdditiveBlending,
        Color,
        Mesh,
    } from "three";

    let { output, waddahPosition } = $props();

    const { scene } = useThrelte();
    const WADDAH = planets.find((p) => p.id === 3);
    const ATMO_SCALE = 1.04;
    const ATMO_OFFSET = 1.01;
    const ATMO_COLOR = "#d6eeff";
    const ATMO_RP = bodyRadiusUnits(WADDAH);
    const ATMO_OF = ATMO_RP * ATMO_OFFSET;
    const ATMO_RA = ATMO_RP * ATMO_SCALE;

    const ATMO_VERT = `
        varying vec3 vPosW;
        varying vec3 vCenter;
        void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vPosW = world.xyz;
            vCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewMatrix * world;
        }
    `;

    const ATMO_FRAG = `
        uniform vec3 uColor;
        uniform vec3 uStarPos;
        uniform float uRp;
        uniform float uRa;
        uniform float uDensity;
        uniform float uIntensity;
        varying vec3 vPosW;
        varying vec3 vCenter;
        void main() {
            vec3 ro = cameraPosition;
            vec3 rd = normalize(vPosW - ro);
            vec3 oc = vCenter - ro;
            float tca = dot(oc, rd);
            float b2 = dot(oc, oc) - tca * tca;
            float ra2 = uRa * uRa;
            if (b2 >= ra2) discard;
            float rp2 = uRp * uRp;
            float outer = sqrt(ra2 - b2);
            float L = (b2 < rp2) ? (outer - sqrt(rp2 - b2)) : (2.0 * outer);
            float alpha = 1.0 - exp(-(L / uRp) * uDensity);
            vec3 near = ro + rd * tca;
            vec3 nrm = normalize(near - vCenter);
            float lit = smoothstep(-0.30, 0.30, dot(nrm, normalize(uStarPos - near)));
            gl_FragColor = vec4(uColor * uIntensity * alpha * lit, alpha * lit);
        }
    `;

    const ATMO_UNIFORMS = {
        uColor: { value: new Color(0.6396, 0.6304, 0.8008) },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uRp: { value: ATMO_RP },
        uRa: { value: ATMO_RA },
        uDensity: { value: 1.5 },
        uIntensity: { value: 1.15 },
    };

    let waddahMap = $state(null);
    let waddahMat = $state(null);

    new TextureLoader().load("/textures/waddah_color.jpg", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        waddahMap = tex;
    });

    $effect(() => {
        if (waddahMat && waddahMap) {
            waddahMat.map = waddahMap;
            waddahMat.needsUpdate = true;
        }
    });
</script>

<T.Mesh
    position={[waddahPosition.x, 0, waddahPosition.z]}
    oncreate={(mesh) => output(mesh)}
>
    <T.SphereGeometry args={[bodyRadiusUnits(WADDAH), 64, 32]} />
    <T.MeshStandardMaterial
        oncreate={(mat) => {
            waddahMat = mat;
        }}
        map={waddahMap}
        color={"#ffffff"}
        roughness={1}
        metalness={0}
    />
</T.Mesh>
<!--atmosphere ball-->
<T.Mesh position={[waddahPosition.x, 0, waddahPosition.z]}>
    <T.SphereGeometry args={[ATMO_OF, 64, 32]} />
    <T.MeshStandardMaterial
        color={ATMO_UNIFORMS.uColor}
        transparent={true}
        opacity={0.5}
        depthWrite={false}
    />
</T.Mesh>
<!--atmosphere effect-->
<T.Mesh position={[waddahPosition.x, 0, waddahPosition.z]}>
    <T.SphereGeometry args={[ATMO_RA, 64, 32]} />
    <T.ShaderMaterial
        args={[
            {
                uniforms: ATMO_UNIFORMS,
                vertexShader: ATMO_VERT,
                fragmentShader: ATMO_FRAG,
                transparent: true,
                depthWrite: false,
                blending: AdditiveBlending,
            },
        ]}
    />
</T.Mesh>
