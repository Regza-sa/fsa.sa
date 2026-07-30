<script>
    import { Canvas } from "@threlte/core";
    import System from "$lib/System.svelte";
    /** @type {import('./$types').PageProps} */
    let { data } = $props();
</script>

<Canvas>
    <System lang={data.language} />
</Canvas>

<div class="page">
    <div class="top">
        <div class="planetrow">
            <button class="fasil"></button>
            <button class="rahhal"></button>
            <button class="ayn"></button>
            <button class="waddah"></button>
            <button class="nafis"></button>
        </div>
    </div>
</div>

<style>
    .page {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        pointer-events: none;
    }
    .top {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center; /* temporary */
        height: 200px;
        pointer-events: none;
    }
    .planetrow {
        display: flex;
        flex-direction: row;
        gap: 5px;
        width: 50%;
        height: 50%;
    }
    .planetrow button {
        width: 20%;
        /* background: none; */
        border: none;
    }
</style>
