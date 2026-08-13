<script>
    import { planets, bodyRadiusUnits } from "$lib/census";
    import { T } from "@threlte/core";
    import { TextureLoader, SRGBColorSpace } from "three";
    import Haze from "./Haze.svelte";

    let { output, nafisPosition } = $props();

    const NAFIS = planets.find((p) => p.id === 4);
    const AXIAL_TILT = (NAFIS.axialTilt * Math.PI) / 180;
    const CLOUD_SCALE = 1.0405;
    const HAZE_SCALE = 1.0591;
    const ATMO_RP = bodyRadiusUnits(NAFIS);
    const cloud_radius = ATMO_RP * CLOUD_SCALE;
    const ATMO_COLOR = "#ffffff";

    let nafisMap = $state(null);
    let nafisMat = $state(null);

    let cloudMap = $state(null);
    let cloudMat = $state(null);

    new TextureLoader().load("/textures/nafis_color.jpg", (tex) => {
        tex.colorSpace = SRGBColorSpace;
        nafisMap = tex;
    });

    new TextureLoader().load("/textures/nafis_clouds_alpha.png", (tex) => {
        cloudMap = tex;
    });

    $effect(() => {
        if (nafisMap && nafisMat) {
            nafisMat.map = nafisMap;
            nafisMat.needsUpdate = true;
        }
        if (cloudMap && cloudMat) {
            cloudMat.alphaMap = cloudMap;
            cloudMat.needsUpdate = true;
        }
    });
</script>

<T.Group
    position={[nafisPosition.x, nafisPosition.y, nafisPosition.z]}
    rotation={[0, 0, AXIAL_TILT]}
>
    <T.Mesh oncreate={(mesh) => output(mesh)}>
        <T.SphereGeometry args={[ATMO_RP, 64, 32]} />
        <T.MeshStandardMaterial
            oncreate={(mat) => {
                nafisMat = mat;
            }}
            map={nafisMap}
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
            opacity={1}
            depthWrite={false}
        />
    </T.Mesh>

    <!--atmosphere haze-->
    <Haze planetRadius={ATMO_RP} scale={HAZE_SCALE} />
</T.Group>
