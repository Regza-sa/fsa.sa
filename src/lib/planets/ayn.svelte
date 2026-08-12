<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T } from "@threlte/core";
    import { TextureLoader, SRGBColorSpace } from "three";
    import Atmosphere from "./Atmosphere.svelte";

    let { output, aynPosition } = $props();

    const AYN = planets.find((p) => p.id === 2);
    const AXIAL_TILT = (AYN.axialTilt * Math.PI) / 180;
    const CLOUD_SCALE = 1.0015;
    const ATMO_RP = bodyRadiusUnits(AYN);
    const cloud_radius = ATMO_RP * CLOUD_SCALE;
    const ATMO_COLOR = "#99e2ff";

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
    position={[aynPosition.x, aynPosition.y, aynPosition.z]}
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

    <!--atmosphere-->
    <Atmosphere
        planetRadius={ATMO_RP}
        color={ATMO_COLOR}
        scale={1.04}
        shellOpacity={0.4}
    />
</T.Group>
