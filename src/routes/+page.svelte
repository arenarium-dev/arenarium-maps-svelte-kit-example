<script lang="ts">
    import { mount, onMount } from "svelte";

    import Pin from "$lib/Pin.svelte";
    import Popup from "$lib/Popup.svelte";
    import Tooltip from "$lib/Tooltip.svelte";

    import { PUBLIC_API_KEY } from "$env/static/public";

    import { MapManager, type MapMarkerProperties } from "@arenarium/maps";
    import {
        MaplibreProvider,
        MaplibreLightStyle,
    } from "@arenarium/maps-integration-maplibre";
    import "@arenarium/maps-integration-maplibre/main.css";

    let mapManager: MapManager;

    let map: maplibregl.Map;
    let mapContainer = $state<HTMLDivElement>();

    let mapMarkers = new Map<string, MapMarkerProperties>();

    onMount(async () => {
        if (!mapContainer) return;

        const mapProvider = await MaplibreProvider.create({
            container: mapContainer,
            style: MaplibreLightStyle,
            center: { lat: 51.505, lng: -0.09 },
            zoom: 13,
        });

        mapManager = await MapManager.create(PUBLIC_API_KEY, mapProvider);

        map = mapProvider.getMap();
        map.on("click", onMapClick);

        update();
    });

    async function update() {
        const bounds = map.getBounds();
        const centers = [
            { lat: 51.505, lng: -0.09 },
            { lat: 45, lng: 22 },
            { lat: 52.52, lng: 13.409 },
            { lat: 48.8566, lng: 2.3522 },
        ];
        const radius = 10;
        const count = 1024;
        const limit = 1024;

        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * limit);
            const id = index.toString();
            if (mapMarkers.has(id)) continue;

            const distance = radius / (limit - index);
            const center = centers[index % centers.length];

            const lat = center.lat + distance * (-1 + Math.random() * 2);
            const lng = center.lng + distance * (-1 + Math.random() * 2);
            if (
                lat < bounds._sw.lat ||
                bounds._ne.lat < lat ||
                lng < bounds._sw.lng ||
                bounds._ne.lng < lng
            )
                continue;

            mapMarkers.set(id, {
                id: id,
                rank: index + 1,
                lat: lat,
                lng: lng,
                tooltip: {
                    element: getTooltipBody(id),
                    dimensions: {
                        height: 64,
                        width: 96,
                        padding: 8,
                    },
                    style: {
                        radius: 12,
                    },
                },
                pin: {
                    element: getPinBody(id),
                    dimensions: {
                        radius: 8,
                        stroke: 2,
                    },
                    style: {
                        background: "#ff00ff",
                    },
                },
                popup: {
                    element: getPopupBody(id),
                    dimensions: {
                        height: 128,
                        width: 156,
                        padding: 8,
                    },
                    style: {
                        radius: 16,
                    },
                },
            });
        }

        const now = performance.now();
        await mapManager.updateMarkers(Array.from(mapMarkers.values()));
        console.log(`[SET ${mapMarkers.size}] ${performance.now() - now}ms`);
    }

    function remove() {
        mapManager.removeMarkers();
    }

    function getTooltipBody(id: string): HTMLElement {
        const element = document.createElement("div");
        element.addEventListener("click", (e) => onTooltipClick(e, id));
        mount(Tooltip, {
            target: element,
            props: { rank: Number.parseInt(id), width: 96, height: 64 },
        });
        return element;
    }

    function getPinBody(id: string): HTMLElement {
        const element = document.createElement("div");
        element.style.width = "100%";
        element.style.height = "100%";
        mount(Pin, { target: element });
        return element;
    }

    function getPopupBody(id: string): HTMLElement {
        const element = document.createElement("div");
        mount(Popup, {
            target: element,
            props: { rank: Number.parseInt(id), width: 156, height: 128 },
        });
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
