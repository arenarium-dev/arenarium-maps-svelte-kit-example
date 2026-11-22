<script lang="ts">
    import { mount, onMount } from "svelte";

    import Pin from "#lib/Pin.svelte";
    import Popup from "#lib/Popup.svelte";
    import Tooltip from "#lib/Tooltip.svelte";

    import { PUBLIC_API_KEY } from "$app/env/public";

    import {
        MapLibrary,
        type MapManager,
        type MapMarkerOptions,
    } from "@arenarium/maps";
    import {
        MaplibreProvider,
        MaplibreLightStyle,
    } from "@arenarium/maps-integration-maplibre";
    import "@arenarium/maps-integration-maplibre/main.css";

    let mapProvider: MaplibreProvider;
    let mapManager: MapManager;

    let mapContainer = $state<HTMLDivElement>();

    let mapMarkers = new Map<string, MapMarkerOptions>();

    onMount(async () => {
        if (!mapContainer) return;

        mapProvider = await MaplibreProvider.create({
            container: mapContainer,
            style: MaplibreLightStyle,
            center: { lat: 51.505, lng: -0.09 },
            zoom: 13,
        });

        // The manager opens the popup of a marker when its tooltip is clicked,
        // and closes the popup when the map is clicked
        const mapLibrary = await MapLibrary.load(PUBLIC_API_KEY);
        mapManager = await mapLibrary.manager.create(
            await mapLibrary.provider.adapt(mapProvider),
        );

        update();
    });

    async function update() {
        const bounds = mapProvider.getBounds();
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
                lat < bounds.sw.lat ||
                bounds.ne.lat < lat ||
                lng < bounds.sw.lng ||
                bounds.ne.lng < lng
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
                        size: { height: 64, width: 96 },
                        padding: 8,
                        margin: 1,
                    },
                    style: {
                        radius: 12,
                    },
                },
                pin: {
                    element: getPinBody(),
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
                        size: { height: 128, width: 156 },
                        padding: 8,
                    },
                    style: {
                        radius: 16,
                    },
                },
            });
        }

        // Markers with an id that is already on the map are kept
        const now = performance.now();
        await mapManager.insertMarkers(Array.from(mapMarkers.values()));
        console.log(`[SET ${mapMarkers.size}] ${performance.now() - now}ms`);
    }

    function remove() {
        mapManager.clearMarkers();
    }

    function getTooltipBody(id: string): HTMLElement {
        const element = document.createElement("div");
        mount(Tooltip, {
            target: element,
            props: { rank: Number.parseInt(id), width: 96, height: 64 },
        });
        return element;
    }

    function getPinBody(): HTMLElement {
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
