import { mount, unmount } from "svelte";

import {
    MapLibrary,
    MapMarkerOrientation,
    type MapManager,
    type MapMarkerOptions,
} from "@arenarium/maps";
import {
    MaplibreLightStyle,
    MaplibreProvider,
} from "@arenarium/maps-integration-maplibre";

import Pin from "./Pin.svelte";
import Popup from "./Popup.svelte";
import Tooltip from "./Tooltip.svelte";

/** The data of a marker, independent of the map. */
export type MarkerData = {
    id: string;
    lat: number;
    lng: number;
    rank: number;
};

/** The marker options that the side panel controls. */
export type MarkerSettings = {
    /** Where the tooltip and the popup are placed around the marker. */
    orientation: "dynamic" | "centered";
};

export const DEFAULT_SETTINGS: MarkerSettings = {
    orientation: "dynamic",
};

const TOOLTIP_SIZE = { width: 96, height: 48 };
const POPUP_SIZE = { width: 168, height: 112 };

/** Pin colors from low to high rank. The marker styles must be hex colors. */
const PIN_COLORS = ["#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#5b21b6"];

/**
 * The example map: a MapLibre map with an @arenarium/maps manager on it.
 * It keeps the marker data, so it can insert the markers again when their settings change.
 */
export class ExampleMap {
    #provider: MaplibreProvider;
    #manager: MapManager;
    #settings: MarkerSettings;

    #markers = new Map<string, MarkerData>();
    #mounts = new Map<string, Array<Record<string, any>>>();
    #nextId = 0;

    private constructor(
        provider: MaplibreProvider,
        manager: MapManager,
        settings: MarkerSettings,
        onMarkerClick: (id: string) => void,
    ) {
        this.#provider = provider;
        this.#manager = manager;
        this.#settings = settings;

        // The manager opens the popup of a marker when its tooltip is clicked,
        // and closes the popup when the map is clicked
        this.#manager.on("marker_click", ({ id }) => onMarkerClick(id));

        // If the manager removed the markers to recover from an error, insert them again
        this.#manager.on("error", ({ error, cleared }) => {
            console.error(error);
            if (cleared) this.#insertAll();
        });
    }

    /**
     * Creates the map in the container, loads the library and creates the map manager.
     *
     * @param container - The element that contains the map.
     * @param key - The @arenarium/maps API key.
     * @param settings - The marker settings.
     * @param onMarkerClick - Called when the user clicks the tooltip of a marker.
     */
    static async create(
        container: HTMLElement,
        key: string,
        settings: MarkerSettings,
        onMarkerClick: (id: string) => void,
    ): Promise<ExampleMap> {
        // The integration package creates the MapLibre map
        const provider = await MaplibreProvider.create({
            container,
            style: MaplibreLightStyle,
            center: { lat: 51.505, lng: -0.09 },
            zoom: 12,
        });

        // The library adapts the provider and creates a map manager for it
        const library = await MapLibrary.load(key, {
            preload: { manager: true },
        });
        const manager = await library.manager.create(
            await library.provider.adapt(provider),
        );

        return new ExampleMap(provider, manager, settings, onMarkerClick);
    }

    /** The number of markers on the map. */
    get count(): number {
        return this.#markers.size;
    }

    /** Gets the id of a random marker on the map, or `undefined` if there are no markers. */
    getRandomId(): string | undefined {
        const ids = Array.from(this.#markers.keys());
        return ids[Math.floor(Math.random() * ids.length)];
    }

    /** Tells if a marker with the id is on the map. */
    has(id: string): boolean {
        return this.#markers.has(id);
    }

    /**
     * Inserts markers at random coordinates in the visible area of the map.
     *
     * @param count - The number of markers to insert.
     */
    async addMarkers(count: number): Promise<void> {
        const { sw, ne } = this.#provider.getBounds();

        const markers = new Array<MarkerData>();
        for (let i = 0; i < count; i++) {
            markers.push({
                id: (this.#nextId++).toString(),
                lat: sw.lat + Math.random() * (ne.lat - sw.lat),
                lng: sw.lng + Math.random() * (ne.lng - sw.lng),
                rank: Math.floor(Math.random() * 1000) + 1,
            });
        }

        for (const marker of markers) this.#markers.set(marker.id, marker);

        // Markers with an id that is already on the map are kept, so this call only adds the new ones
        await this.#manager.insertMarkers(
            markers.map((m) => this.#getMarkerOptions(m)),
        );
    }

    /** Removes all markers from the map. */
    async clearMarkers(): Promise<void> {
        await this.#manager.clearMarkers();

        this.#markers.clear();
        this.#unmountAll();
    }

    /**
     * Changes the marker settings. Markers that are on the map keep their options,
     * so they are cleared and inserted again with the new settings.
     *
     * @param settings - The new marker settings.
     */
    async setSettings(settings: MarkerSettings): Promise<void> {
        this.#settings = settings;
        await this.#insertAll();
    }

    /** Moves the map to the marker and zooms in until its tooltip shows. */
    showTooltip(id: string): void {
        this.#manager.showTooltip(id);
    }

    /** Opens the popup of the marker. */
    showPopup(id: string): void {
        this.#manager.showPopup(id);
    }

    /** Closes the open popup. */
    hidePopup(): void {
        this.#manager.hidePopup();
    }

    /** Releases the manager, the map and the mounted components. */
    dispose(): void {
        this.#manager.dispose();
        this.#provider.dispose();
        this.#unmountAll();
    }

    /** Clears the map and inserts all the stored markers again, with new elements. */
    async #insertAll(): Promise<void> {
        await this.#manager.clearMarkers();
        this.#unmountAll();

        const markers = Array.from(this.#markers.values());
        await this.#manager.insertMarkers(
            markers.map((m) => this.#getMarkerOptions(m)),
        );
    }

    /**
     * Makes the options of a marker. The elements are empty: the components mount in the `initialize` callbacks,
     * when each element shows for the first time, so markers that never show cost nothing.
     */
    #getMarkerOptions(marker: MarkerData): MapMarkerOptions {
        const { orientation } = this.#settings;

        return {
            id: marker.id,
            lat: marker.lat,
            lng: marker.lng,
            rank: marker.rank,
            orientation:
                orientation === "centered"
                    ? MapMarkerOrientation.Centered
                    : MapMarkerOrientation.Dynamic,
            tooltip: {
                element: createElement(),
                // Setting the size skips the measurement of the element
                dimensions: { size: TOOLTIP_SIZE, padding: 6, margin: 1 },
                style: { background: "#ffffff", radius: 10 },
                initialize: async (id, element) => {
                    this.#mount(id, Tooltip, element, { id, rank: marker.rank });
                },
            },
            pin: {
                element: createElement(),
                dimensions: { radius: 8, stroke: 2 },
                style: { background: getPinColor(marker.rank), stroke: "#ffffff" },
                initialize: async (id, element) => {
                    this.#mount(id, Pin, element, {});
                },
            },
            popup: {
                element: createElement(),
                dimensions: { size: POPUP_SIZE, padding: 8 },
                style: { background: "#ffffff", radius: 14 },
                initialize: async (id, element) => {
                    this.#mount(id, Popup, element, {
                        id,
                        rank: marker.rank,
                        lat: marker.lat,
                        lng: marker.lng,
                    });
                },
            },
        };
    }

    #mount(id: string, component: any, target: HTMLElement, props: Record<string, any>): void {
        const instance = mount(component, { target, props });

        const instances = this.#mounts.get(id);
        if (instances) instances.push(instance);
        else this.#mounts.set(id, [instance]);
    }

    #unmountAll(): void {
        for (const instances of this.#mounts.values()) {
            for (const instance of instances) unmount(instance);
        }
        this.#mounts.clear();
    }
}

/** Creates an empty element that fills the area the manager gives it. */
function createElement(): HTMLElement {
    const element = document.createElement("div");
    element.style.width = "100%";
    element.style.height = "100%";
    return element;
}

/** Gets the pin color of a rank from 1 to 1000: higher ranks are darker. */
function getPinColor(rank: number): string {
    const index = Math.min(PIN_COLORS.length - 1, Math.floor(((rank - 1) / 1000) * PIN_COLORS.length));
    return PIN_COLORS[index];
}
