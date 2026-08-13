<script>
	import "@fontsource/ibm-plex-mono/400.css";
	import "@fontsource/ibm-plex-sans-arabic/400.css";
	import "@fontsource/ibm-plex-sans-arabic/500.css";

	import "@fontsource-variable/newsreader/opsz.css";
	import "@fontsource-variable/geist";
	import "@fontsource-variable/geist-mono";
	import "@fontsource-variable/readex-pro/full.css";

	let { children } = $props();
</script>

<svelte:window ondragstart={(e) => e.preventDefault()} />

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="alternate icon" href="/favicon.ico" sizes="32x32" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

{@render children()}

<style>
	:global(:root) {
		--font-display: "Newsreader Variable", serif;
		--font-body: "Geist Variable", sans-serif;
		--font-mono: "Geist Mono Variable", monospace;
		--font-ar: "Readex Pro Variable", sans-serif;
	}

	:global(html, body) {
		margin: 0;
		height: 100%;
		overflow: hidden;
		background: #0c0c0c;
	}
</style>
