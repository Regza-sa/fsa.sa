<script>
	import favicon from "$lib/assets/favicon.svg";
	import "@fontsource/ibm-plex-mono/400.css";
	import "@fontsource/ibm-plex-sans-arabic/400.css";
	import "@fontsource/ibm-plex-sans-arabic/500.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
		overflow: hidden;
	}
</style>
