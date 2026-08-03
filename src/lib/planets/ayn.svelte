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
        DoubleSide,
    } from "three";

    let { output, aynPosition } = $props();

    const { scene } = useThrelte();
    const AYN = planets.find((p) => p.id === 2);
    const AXIAL_TILT = (AYN.axialTilt * Math.PI) / 180;
    const CLOUD_SCALE = 1.0015;
    const ATMO_RP = bodyRadiusUnits(AYN);
    const cloud_radius = ATMO_RP * CLOUD_SCALE;
    const ATMO_SCALE = 1.04;
    const ATMO_OFFSET = 1.01;
    const ATMO_COLOR = "#99E2FF";
    const ATMO_OF = ATMO_RP * ATMO_OFFSET;
    const ATMO_RA = ATMO_RP * ATMO_SCALE;

    const ATMO_VERT = `
        varying vec3 vPosV;
        varying vec3 vCenterV;
        void main() {
            vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
            vPosV = viewPos.xyz;
            vCenterV = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * viewPos;
        }
    `;

    const ATMO_FRAG = `
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

    const ATMO_UNIFORMS = {
        uColor: { value: new Color(0.3185, 0.7605, 1.0) },
        uStarPos: { value: new Vector3(0, 0, 0) },
        uRp: { value: ATMO_RP },
        uRa: { value: ATMO_RA },
        uDensity: { value: 1.5 },
        uIntensity: { value: 1.15 },
    };

    let aynMap = $state(null);
    let aynMat = $state(null);

    let cloudMap = $state(null);
    let cloudMat = $state(null);

    new TextureLoader().load("/textures/ayn_color.jpg", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        aynMap = tex;
    });

    new TextureLoader().load("/textures/ayn_clouds.png", (tex) => {
        cloudMap = tex;
    });

    $effect(() => {
        if (aynMap && aynMat) {
            aynMat.map = aynMap;
            aynMat.needsUpdate = true;
        }
        if (cloudMap && cloudMat) {
            cloudMat.alphaMap = cloudMap;
            cloudMat.needsUpdate = true;
        }
    });
</script>

<T.Group
    position={[aynPosition.x, 0, aynPosition.z]}
    rotation={[0, 0, AXIAL_TILT]}
>
    <T.Mesh oncreate={(mesh) => output(mesh)}>
        <T.SphereGeometry args={[ATMO_RP, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                aynMat = mat;
            }}
            map={aynMap}
            color={"#ffffff"}
            roughness={1}
            metalness={0}
        />
    </T.Mesh>

    <!--clouds-->
    <T.Mesh>
        <T.SphereGeometry args={[cloud_radius, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                cloudMat = mat;
            }}
            alphaMap={cloudMap}
            color="#ffffff"
            transparent={true}
            depthWrite={false}
            roughness={1}
            metalness={0}
        />
    </T.Mesh>

    <!--atmosphere ball-->
    <T.Mesh>
        <T.SphereGeometry args={[ATMO_OF, 64, 32]} />
        <T.MeshStandardMaterial
            color={ATMO_COLOR}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
        />
    </T.Mesh>

    <!--atmosphere effect-->
    <T.Mesh>
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
</T.Group>
