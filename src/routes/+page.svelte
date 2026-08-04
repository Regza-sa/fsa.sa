<script>
    import { Canvas } from "@threlte/core";
    import System from "$lib/System.svelte";
    import infoIcon from "$lib/assets/icons/info.svg?raw";
    /** @type {import('./$types').PageProps} */
    let { data } = $props();
    let activeBody = $state(-1);
    let opacity = $state(1);
    let infotextopacity = $state(0);

    const infoText = {
        en: "A portfolio site integrated as a fantasy solar system. Each planet serves as a section of a normal portfolio website, click on a body to travel to it.",
        ar: "التتتتتت",
    };
    const nameText = {
        en: "Faisal Alshehri",
        ar: "فيصل الشهري",
    };

    function handleUI(bodyId) {
        activeBody = bodyId;
        if (bodyId == -1) {
            opacity = 1;
        } else {
            opacity = 0;
            infotextopacity = 0;
        }
    }
</script>

<Canvas>
    <System lang={data.language} setUI={(x) => handleUI(x)} />
</Canvas>

<div class="stage">
    <div class="left">
        <div class="top">
            <div class="toprow">
                <h1 class="title" style:opacity>fsa.sa</h1>
                <button
                    class="info"
                    onclick={() => {
                        if (infotextopacity == 0) {
                            infotextopacity = 1;
                        } else {
                            infotextopacity = 0;
                        }
                    }}
                    style:pointer-events={(() => {
                        if (opacity > 0) {
                            return "auto";
                        }
                        return "none";
                    })()}
                >
                    <span class="infoicon" style:opacity>{@html infoIcon}</span>
                </button>
            </div>
            <h3 class="name" style:opacity>{nameText[data.language]}</h3>
            <p class="infotext" style:opacity={infotextopacity}>
                {infoText[data.language]}
            </p>
        </div>
    </div>
</div>

<style>
    .stage {
        display: flex;
        position: fixed;
        inset: 0;
        pointer-events: none;
    }
    :global(html:lang(ar)) .stage {
        direction: rtl;
    }
    .top {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 30px 20px 0px;
    }
    .toprow {
        display: flex;
        align-items: center;
    }
    .title {
        color: white;
    }
    .infoicon :global(svg) {
        display: block;
        width: 32px;
        height: 32px;
        color: white;
    }
    .infotext {
        color: rgb(224, 224, 224);
        width: 35dvw;
        letter-spacing: normal;
        font-family: "Geist Variable", monospace;
    }
    :global(html:lang(ar)) .infotext {
        font-family: "Readex Pro Variable", sans-serif;
        letter-spacing: normal;
        font-weight: 400;
    }
    .info {
        padding: 0px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        width: 32px;
        height: 32px;
        pointer-events: auto;
        cursor: pointer;
    }
    :global(html:lang(ar)) .info {
        padding: 0px 30px;
    }
    .name {
        color: white;
        font-family: "Newsreader Variable", monospace;
    }
    :global(html:lang(ar)) .name {
        font-family: "Readex Pro Variable", sans-serif;
        letter-spacing: normal;
        text-transform: none;
        color: white;
        font-weight: 500;
    }
    h1 {
        margin: 0px;
        font-family: "Newsreader Variable", monospace;
        letter-spacing: 0.35em;
        transition: opacity 0.5s ease-in-out;
    }
    h3 {
        margin: 0px;
        font-family: "Newsreader Variable", monospace;
        letter-spacing: 0.35em;
        transition: opacity 0.5s ease-in-out;
    }
    p {
        margin: 0px;
        font-family: "Newsreader Variable", monospace;
        letter-spacing: 0.35em;
        transition: opacity 0.5s ease-in-out;
    }
    span {
        transition: opacity 0.5s ease-in-out;
    }
</style>
