<script>
    import { Canvas } from "@threlte/core";
    import System from "$lib/System.svelte";
    /** @type {import('./$types').PageProps} */
    let { data } = $props();
</script>

<Canvas>
    <System lang={data.language} />
</Canvas>
