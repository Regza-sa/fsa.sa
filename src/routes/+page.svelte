<script>
    import { Canvas } from "@threlte/core";
    import { Tween } from "svelte/motion";
    import { cubicInOut } from "svelte/easing";
    import { MediaQuery } from "svelte/reactivity";

    import { aynImage, waddahImage } from "$lib/assets/images";

    import System from "$lib/System.svelte";
    import xIcon from "$lib/assets/icons/x.svg?raw";
    import infoIcon from "$lib/assets/icons/info.svg?raw";
    import gearIcon from "$lib/assets/icons/gear.svg?raw";
    import { redirect } from "@sveltejs/kit";
    import { RGBADepthPacking } from "three";
    /** @type {import('./$types').PageProps} */

    let { data } = $props();
    let activeBody = $state(-1);
    let opacity = $state(1);
    let infotextopacity = $state(0);

    let menuOpen = $state(false);
    let menuExists = $state(false);
    let menuDebounce = $state(false);
    let menuWasOpen = $state(false);

    let system;

    const narrow = new MediaQuery("max-width: 640px");

    const spin = new Tween(0, { duration: 400, easing: cubicInOut });

    const durationTween = 500;
    const tweenType = cubicInOut;
    const sidebarTween = new Tween(100, {
        duration: durationTween,
        easing: tweenType,
    });
    const effect1Tween = new Tween(100, {
        duration: durationTween,
        easing: tweenType,
    });
    const effect2Tween = new Tween(100, {
        duration: durationTween,
        easing: tweenType,
    });

    // const wait = (seconds) =>
    //     new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    // ^ could be useful later

    const infoText = {
        en: "A portfolio site integrated as a fantasy solar system. Each planet serves as a section of a normal portfolio website, click on a body to travel to it.",
        ar: "التتتتتت",
    };
    const nameText = {
        en: "Faisal Alshehri",
        ar: "فيصل الشهري",
    };
    const hoverInfoText = {
        en: "Info",
        ar: "ال",
    };

    const hoverMenuTextOpen = {
        en: "Menu",
        ar: "ألا",
    };
    const hoverMenuTextClose = {
        en: "Close",
        ar: "ألبل",
    };

    const menuItems = [
        {
            id: 1,
            en: "Services",
            ar: "الخدمات",
            planetName: "Rahhal",
            color: "rgb(179, 110, 46)",
        },
        {
            id: 2,
            en: "Contact",
            ar: "تواصل",
            image: aynImage,
            planetName: "Ayn",
            color: "rgb(50, 113, 168)",
        },
        {
            id: 3,
            en: "Projects",
            ar: "المشاريع",
            image: waddahImage,
            planetName: "Waddah",
            color: "rgb(217, 217, 217)",
        },
        {
            id: 4,
            en: "About",
            ar: "نبذة",
            planetName: "Nafis",
            color: "rgb(156, 68, 25)",
        },
    ];

    const menuPadding = {
        en: "10px 30px",
        ar: "12px 35px",
    };

    async function animateButton(bool) {
        if (bool) {
            await spin.set(45);
        } else {
            await spin.set(0);
        }
    }

    async function animateMenu(bool) {
        if (bool) {
            //open
            effect1Tween.set(0);
            effect2Tween.set(0, { delay: 40 });
            await sidebarTween.set(0, { delay: 100 });
        } else {
            //close
            sidebarTween.set(100);
            effect2Tween.set(100, { delay: 40 });
            await effect1Tween.set(100, { delay: 100 });
        }
    }

    async function openMenu() {
        menuOpen = true;
        menuExists = true;
        await Promise.all([animateMenu(true), animateButton(true)]);
        menuDebounce = false;
    }

    async function closeMenu() {
        menuOpen = false;
        await Promise.all([animateMenu(false), animateButton(false)]);
        menuExists = false;
        menuDebounce = false;
    }

    function handleUI(bodyId) {
        activeBody = bodyId;
        if (bodyId == -1) {
            opacity = 1;
            if (menuWasOpen) {
                menuWasOpen = false;
                openMenu();
            }
        } else {
            opacity = 0;
            infotextopacity = 0;
            if (menuOpen) {
                menuWasOpen = true;
                closeMenu();
            }
        }
    }
</script>

<Canvas>
    <System
        bind:this={system}
        lang={data.language}
        setUI={(x) => handleUI(x)}
        interactable={!(menuExists && narrow.current)}
    />
</Canvas>

{#if menuExists}
    <div class="menu">
        <div
            class="effect1"
            style:transform="translateX({effect1Tween.current}%)"
        ></div>
        <div
            class="effect2"
            style:transform="translateX({effect2Tween.current}%)"
        ></div>
        <div
            class="sidebar"
            style:transform="translateX({sidebarTween.current}%)"
        >
            <div class="emptyspace1"></div>
            {#each menuItems as menuItem (menuItem.id)}
                <button
                    class="menuItemHolder"
                    style:margin={menuPadding[data.language]}
                    onclick={() => {
                        menuDebounce = true;
                        closeMenu();
                        system.flyToPage(menuItem.id);
                    }}
                >
                    <h3 class="planetName" style:color={menuItem.color}>
                        {menuItem.planetName}
                    </h3>
                    <h3 class="planetNum">{"0" + menuItem.id}</h3>
                    <h1
                        class="textMenu"
                        class:hasFill={menuItem.image}
                        style:--fill={menuItem.image
                            ? `url(${menuItem.image})`
                            : null}
                    >
                        {menuItem[data.language]}
                    </h1>
                </button>
            {/each}
        </div>
    </div>
{/if}

<div class="buttonlayer" class:open={menuOpen}>
    <span class="menuHoverText">
        <span class="labelMenu">{hoverMenuTextOpen[data.language]}</span>
        <span class="labelClose">{hoverMenuTextClose[data.language]}</span>
    </span>
    <button
        class="menuButton"
        aria-label="settings"
        onclick={async () => {
            if (menuDebounce) return;
            menuDebounce = true;
            await (menuOpen ? closeMenu() : openMenu());
            menuDebounce = false;
        }}
        style:pointer-events={(() => {
            if (opacity > 0) {
                return "auto";
            }
            return "none";
        })()}
    >
        <span
            class="menuicon"
            style:opacity
            style:rotate="{45 - spin.current}deg">{@html xIcon}</span
        >
    </button>
</div>

<div class="stage">
    <div class="left">
        <!--left/right referring to english. it'll flip in arabic.-->
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
                <span class="hoverinfotext">{hoverInfoText[data.language]}</span
                >
            </div>
            <h3 class="name" style:opacity>{nameText[data.language]}</h3>
            <p class="infotext" style:opacity={infotextopacity}>
                {infoText[data.language]}
            </p>
        </div>
    </div>
</div>

<style>
    /*menu*/
    .menu {
        z-index: 200;
        display: flex;
        position: fixed;
        justify-content: right;
        inset: 0;
        pointer-events: none;
    }
    .menuItemHolder {
        position: relative;
        background: none;
        border: none;
        margin: 0;
        font: inherit;
        color: inherit;
        text-align: inherit;
        width: fit-content;
        cursor: pointer;
        pointer-events: auto;
    }
    .sidebar,
    .effect1,
    .effect2 {
        position: absolute;
        top: 0;
        bottom: 0;
        inset-inline-end: 0;
        width: clamp(300px, 25%, 480px);
    }
    .sidebar {
        display: flex;
        flex-direction: column;
        z-index: 2;
        gap: 20px;
        background: rgb(12, 12, 12);
    }
    .planetName {
        position: absolute;
        letter-spacing: normal;
        top: 0;
        right: auto;
        left: 100%;
        opacity: 0;
    }
    .planetNum {
        position: absolute;
        letter-spacing: normal;
        color: rgb(255, 233, 136);
        top: 0;
        right: -20px;
    }
    .textMenu {
        letter-spacing: 0.1em;
        width: fit-content;
        font-size: 3.5rem;
        background-image: var(--fill);
        background-size: cover;
        background-position: center;
        -webkit-background-clip: text;
        background-clip: text;
        color: rgb(255, 255, 255);
        transition: color 0.2s ease-in-out;
    }
    .menuItemHolder:hover .textMenu.hasFill {
        color: rgba(255, 255, 255, 0);
    }
    .menuItemHolder:hover .planetNum {
        opacity: 0;
    }
    .menuItemHolder:hover .planetName {
        opacity: 1;
    }
    .emptyspace1 {
        height: max(80px, 10dvh);
    }
    .effect2 {
        z-index: 1;
        background-color: rgb(52, 52, 52);
    }
    .effect1 {
        z-index: 0;
        background-color: rgb(77, 77, 77);
    }

    @media (max-width: 640px) {
        .sidebar,
        .effect1,
        .effect2 {
            width: 100%;
        }
    }

    /*buttonlayer*/
    .buttonlayer {
        position: fixed;
        top: 0;
        inset-inline-end: 0;
        z-index: 300;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        padding: 30px 20px 0px;
        pointer-events: none;
    }
    .menuicon :global(svg) {
        display: block;
        width: 32px;
        height: 32px;
        color: white;
    }
    .menuButton {
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
    :global(html:lang(ar)) .buttonlayer {
        direction: rtl;
    }
    /*stage*/
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
    .menuHoverText {
        display: grid;
        justify-items: end;
        opacity: 0;
        color: white;
        font-family: "Newsreader Variable", serif;
        letter-spacing: 0.1em;
        transition: opacity 0.2s ease-in-out;
    }
    .menuHoverText > span {
        grid-area: 1 / 1;
        transition: opacity 0.25s ease-in-out;
    }
    .labelClose {
        opacity: 0;
    }
    .buttonlayer.open .labelMenu {
        opacity: 0;
    }
    .buttonlayer.open .labelClose {
        opacity: 1;
    }
    .buttonlayer:has(.menuButton:hover) .menuHoverText,
    .buttonlayer.open .menuHoverText {
        opacity: 1;
    }
    .hoverinfotext {
        opacity: 0;
        color: white;
        font-family: "Newsreader Variable", monospace;
        letter-spacing: 0.1em;
        transition: opacity 0.2s ease-in-out;
        position: relative;
        top: 2px;
    }
    .toprow:has(.info:hover) .hoverinfotext {
        opacity: 1;
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

    /*global*/
    h1 {
        margin: 0px;
        font-family: "Newsreader Variable", monospace;
        letter-spacing: 0.35em;
        color: white;
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
        margin: 0px;
        transition: opacity 0.5s ease-in-out;
        color: white;
    }
</style>
