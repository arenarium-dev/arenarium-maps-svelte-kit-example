<script lang="ts">
	import { mount, onMount } from "svelte";

	import Pin from "$lib/Pin.svelte";
	import Popup from "$lib/Popup.svelte";
	import Tooltip from "$lib/Tooltip.svelte";

	import { PUBLIC_API_KEY } from "$env/static/public";

	import { MapManager, type MapMarker } from "@arenarium/maps";
	import { MaplibreProvider, MaplibreLightStyle } from "@arenarium/maps/maplibre";
	import "@arenarium/maps/dist/style.css";

	import maplibregl from "maplibre-gl";
	import "maplibre-gl/dist/maplibre-gl.css";

	let mapManager: MapManager;
	let map: maplibregl.Map;
	let mapContainer: HTMLDivElement;

	onMount(() => {
		const mapProvider = new MaplibreProvider(maplibregl.Map, maplibregl.Marker, {
			container: mapContainer,
			style: MaplibreLightStyle,
			center: { lat: 51.505, lng: -0.09 },
			zoom: 13,
		});

		mapManager = new MapManager(PUBLIC_API_KEY, mapProvider);

		map = mapProvider.getMap();
		map.on("click", onMapClick);

		update();
	});

	async function update() {
		const bounds = map.getBounds();
		const markers = new Array<MapMarker>();

		const centers = [
			{ lat: 51.505, lng: -0.09 },
			{ lat: 45, lng: 22 },
			{ lat: 52.52, lng: 13.409 },
			{ lat: 48.8566, lng: 2.3522 },
		];
		const radius = 10;
		const count = 1024;
		const limit = 1024;

		let randomPrev = 1;
		const random = () => {
			const val = (randomPrev * 16807) % 2147483647;
			randomPrev = val;
			return val / 2147483647;
		};

		let cnt = 0;

		for (let i = 0; i < count; i++) {
			const index = Math.floor(random() * count);
			const distance = radius / (count - index);
			const center = centers[index % centers.length];

			const lat = center.lat + distance * (-1 + random() * 2);
			const lng = center.lng + distance * (-1 + random() * 2);
			if (lat < bounds._sw.lat || bounds._ne.lat < lat || lng < bounds._sw.lng || bounds._ne.lng < lng) continue;
			if (cnt++ >= limit) break;

			markers.push({
				id: i.toString(),
				rank: i,
				lat: lat,
				lng: lng,
				tooltip: {
					style: {
						height: 64,
						width: 96,
						margin: 8,
						radius: 12,
					},
					body: getTooltipBody,
				},
				pin: {
					style: {
						height: 16,
						width: 16,
						radius: 8,
					},
					body: getPinBody,
				},
				popup: {
					style: {
						height: 128,
						width: 156,
						margin: 8,
						radius: 16,
					},
					body: getPopupBody,
				},
			});
		}

		const now = performance.now();
		await mapManager.updateMarkers(markers);
		console.log(`[SET ${markers.length}] ${performance.now() - now}ms`);
	}

	function remove() {
		mapManager.removeMarkers();
	}

	async function getTooltipBody(id: string): Promise<HTMLElement> {
		const element = document.createElement("div");
		element.addEventListener("click", e => onTooltipClick(e, id));
		mount(Tooltip, { target: element, props: { rank: Number.parseInt(id), width: 96, height: 64 } });
		return element;
	}

	async function getPinBody(id: string): Promise<HTMLElement> {
		const element = document.createElement("div");
		mount(Pin, { target: element });
		return element;
	}

	async function getPopupBody(id: string): Promise<HTMLElement> {
		const element = document.createElement("div");
		mount(Popup, { target: element, props: { rank: Number.parseInt(id), width: 156, height: 128 } });
		return element;
	}

	function onTooltipClick(event: Event, id: string) {
		event.stopPropagation();
		mapManager.showPopup(id);
	}

	function onMapClick() {
		mapManager.hidePopup();
	}
</script>

<div class="map" bind:this={mapContainer}></div>

<div class="bottom">
	<button class="button" onclick={update}> Update Markers </button>
	<button class="button" onclick={remove}> Remove Markers </button>
</div>

<style>
	.map {
		position: absolute;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
		background-color: gray;
	}

	.bottom {
		position: fixed;
		bottom: 24px;
		left: 24px;
	}

	.button {
		height: 32px;
		border-radius: 8px;
	}
</style>
