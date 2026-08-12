<script>
    // todo:
    // media is now bugged, doesn't work on iOS.
    // flyTo using the menu on iOS doesn't work.

    import { Canvas } from "@threlte/core";
    import { Tween } from "svelte/motion";
    import { cubicInOut } from "svelte/easing";
    import { MediaQuery } from "svelte/reactivity";

    import { aynImage, waddahImage, rahhalImage } from "$lib/assets/images";

    import System from "$lib/System.svelte";

    import xIcon from "$lib/assets/icons/x.svg?raw";
    import infoIcon from "$lib/assets/icons/info.svg?raw";
    import gearIcon from "$lib/assets/icons/gear.svg?raw";
    import githubIcon from "$lib/assets/icons/github.svg?raw";
    import arrowLeftIcon from "$lib/assets/icons/arrow-left.svg?raw";

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
    let settingsOpen = $state(false);

    let system;

    const narrow = new MediaQuery("max-width: 640px");
    const slide = $derived(data.language === "ar" ? -1 : 1);

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
        ar: "موقعي الشخصي على شكل نظام شمسي خيالي. كل كوكب هو قسم من الموقع. اضغط على أي جرم للانتقال إليه.",
    };
    const nameText = {
        en: "Faisal Alshehri",
        ar: "فيصل الشهري",
    };
    const hoverInfoText = {
        en: "Info",
        ar: "معلومات",
    };

    const hoverMenuTextOpen = {
        en: "Menu",
        ar: "القائمة",
    };
    const hoverMenuTextClose = {
        en: "Close",
        ar: "إغلاق",
    };
    const hoverSettingsText = {
        en: "Settings",
        ar: "الإعدادات",
    };

    const menuItems = [
        {
            id: 1,
            en: "Services",
            ar: "الخدمات",
            image: rahhalImage,
            planetName: { en: "Rahhal", ar: "الرحال" },
            color: "rgb(166, 147, 106)",
        },
        {
            id: 2,
            en: "Contact",
            ar: "تواصل",
            image: aynImage,
            planetName: { en: "Ayn", ar: "العين" },
            color: "rgb(50, 113, 168)",
        },
        {
            id: 3,
            en: "Projects",
            ar: "المشاريع",
            image: waddahImage,
            planetName: { en: "Waddah", ar: "وضاح" },
            color: "rgb(217, 217, 217)",
        },
        {
            id: 4,
            en: "About",
            ar: "نبذة",
            planetName: { en: "Nafis", ar: "النفيس" },
            color: "rgb(156, 68, 25)",
        },
    ];

    const menuPadding = {
        en: "10px 30px",
        ar: "12px 50px",
    };

    const settings = [
        {
            id: 0,
            en: "Audio",
            ar: "الصوت",
            options: [
                { value: "on", en: "On", ar: "تشغيل" },
                { value: "off", en: "Off", ar: "إيقاف" },
            ],
        },
        {
            id: 1,
            en: "Language",
            ar: "اللغة",
            options: [
                { value: "en", en: "English", ar: "English" },
                { value: "ar", en: "العربية", ar: "العربية" },
                { value: "auto", en: "Auto", ar: "تلقائي" },
            ],
        },
    ];
    let chosen = $state({ 0: "on", 1: "auto" });

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
            style:transform="translateX({sidebarTween.current * slide}%)"
        ></div>
        <div
            class="effect2"
            style:transform="translateX({sidebarTween.current * slide}%)"
        ></div>
        <div
            class="sidebar"
            style:transform="translateX({sidebarTween.current * slide}%)"
        >
            <div class="pages">
                <div class="page" class:hidden={settingsOpen}>
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
                                {menuItem.planetName[data.language]}
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
                    <div class="bottomarea">
                        <div class="buttonsettingsarea">
                            <button
                                class="iconButton settingsButton"
                                onclick={() => {
                                    settingsOpen = !settingsOpen;
                                }}
                                ><span class="settingsIcon"
                                    >{@html gearIcon}</span
                                ></button
                            >
                            <span class="settingsLabel"
                                >{hoverSettingsText[data.language]}</span
                            >
                        </div>
                        <div class="line"></div>
                        <div class="socialsline">
                            <button
                                class="iconButton githubButton"
                                onclick={() => {
                                    window.open(
                                        "https://github.com/Regza-sa/fsa.sa",
                                        "_blank",
                                    );
                                }}
                                ><span class="githubIcon"
                                    >{@html githubIcon}</span
                                ></button
                            >
                        </div>
                    </div>
                </div>
                <div class="page" class:hidden={!settingsOpen}>
                    <div class="emptyspace1"></div>
                    <!-- settings -->
                    <h1 class="settingsTitle">
                        {hoverSettingsText[data.language]}
                    </h1>
                    <div class="settingsList">
                        {#each settings as setting (setting.id)}
                            <div class="settingRow">
                                <div class="settingLabel">
                                    <span class="settingNum"
                                        >{"0" + (setting.id + 1)}</span
                                    >
                                    {setting[data.language]}
                                </div>
                                <div class="settingOptions">
                                    {#each setting.options as option (option.value)}
                                        <button
                                            class="settingOption"
                                            class:active={chosen[setting.id] ===
                                                option.value}
                                            onclick={() =>
                                                (chosen[setting.id] =
                                                    option.value)}
                                        >
                                            {option[data.language]}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<div class="buttonlayer" class:open={menuOpen}>
    <button
        class="iconButton backButton"
        aria-label="back"
        class:hidden={!settingsOpen}
        onclick={() => {
            settingsOpen = !settingsOpen;
        }}
    >
        <span class="backIcon" style:opacity>{@html arrowLeftIcon}</span>
    </button>
    <span class="menuHoverText">
        <span class="labelMenu">{hoverMenuTextOpen[data.language]}</span>
        <span class="labelClose">{hoverMenuTextClose[data.language]}</span>
    </span>
    <button
        class="iconButton menuButton"
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
                    class="iconButton info"
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
    /*global-top*/
    .iconButton {
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
    .iconButton :global(svg) {
        display: block;
        width: 32px;
        height: 32px;
        color: white;
    }
    /*menu*/
    /*settings*/
    .settingsList {
        display: flex;
        flex-direction: column;
    }
    .settingRow {
        padding: 18px 36px;
    }
    .settingRow + .settingRow {
        border-top: 1px solid rgba(255, 255, 255, 0.152);
    }
    .settingLabel {
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-family: "Geist Variable", sans-serif;
        font-size: 0.7rem;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: rgb(128, 128, 128);
        margin-bottom: 12px;
    }
    .settingNum {
        color: rgb(255, 233, 136);
        letter-spacing: 0.2em;
    }
    .settingOptions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }
    .settingOption {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.152);
        border-radius: 2px;
        padding: 5px 12px;
        color: rgb(128, 128, 128);
        font-family: "Newsreader Variable", serif;
        font-size: 0.9rem;
        letter-spacing: 0.12em;
        cursor: pointer;
        pointer-events: auto;
        transition:
            color 0.2s ease-in-out,
            border-color 0.2s ease-in-out;
    }
    .settingOption:hover {
        color: rgb(224, 224, 224);
        border-color: rgba(255, 255, 255, 0.34);
    }
    .settingOption.active {
        color: rgb(12, 12, 12);
        background: rgb(255, 233, 136);
        border-color: rgb(255, 233, 136);
    }
    .settingsTitle {
        margin: 10px 36px;
        letter-spacing: 0.1em;
        width: fit-content;
        font-size: 3.5rem;
        color: rgb(255, 255, 255);
        transition: color 0.2s ease-in-out;
    }
    :global(html:lang(ar)) .settingsTitle {
        margin: 12px 36px;
    }
    /*sidebar*/
    .pages {
        display: grid;
    }
    .page {
        grid-area: 1 / 1;
        display: flex;
        flex-direction: column;
        gap: 20px;
        transition: opacity 0.3s ease-in-out;
    }
    .page.hidden {
        opacity: 0;
        visibility: hidden;
        transition:
            opacity 0.3s ease-in-out,
            visibility 0s 0.3s;
    }
    .settingsLabel {
        opacity: 0;
        color: white;
        font-family: "Newsreader Variable", serif;
        transform: translateY(2px);
        letter-spacing: 0.1em;
        transition: opacity 0.2s ease-in-out;
    }
    .buttonsettingsarea:has(.settingsButton:hover) .settingsLabel {
        opacity: 1;
    }
    .buttonsettingsarea {
        display: flex;
        align-items: center;
    }
    .line {
        position: relative;
        background: rgba(255, 255, 255, 0.152);
        width: 100%;
        height: 2px;
    }
    .bottomarea {
        display: flex;
        flex-direction: column;
        gap: 10px;
        position: absolute;
        padding: 0px 10px;
        padding-bottom: 10px;
        bottom: 0;
        inset-inline: 0;
    }
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
        width: var(--sidebar-w);
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
            width: var(--sidebar-w);
        }
    }

    /*buttonlayer*/
    .backButton {
        margin-inline-end: auto;
        transition: opacity 0.3s ease-in-out;
    }
    .backButton.hidden {
        opacity: 0;
        visibility: hidden;
        transition:
            opacity 0.3s ease-in-out,
            visibility 0s 0.3s;
    }
    .buttonlayer {
        width: var(--sidebar-w);
        justify-content: flex-end;
        box-sizing: border-box;
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
    .menuButton {
        padding: 0px;
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
    :global(:root) {
        --sidebar-w: clamp(300px, 25dvw, 480px);
    }
    @media (max-width: 640px) {
        :global(:root) {
            --sidebar-w: 100dvw;
        }
    }
    :global(html:lang(ar)) .menu {
        direction: rtl;
    }
    :global(html:lang(ar)) .menuHoverText,
    :global(html:lang(ar)) .hoverinfotext,
    :global(html:lang(ar)) .settingsLabel {
        font-family: "Readex Pro Variable", sans-serif;
        letter-spacing: normal;
        font-weight: 400;
    }
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
