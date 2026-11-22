<script lang="ts">
    import { onMount } from "svelte";

    import { PUBLIC_API_KEY } from "$app/env/public";

    import {
        DEFAULT_SETTINGS,
        ExampleMap,
        type MarkerSettings,
    } from "#lib/library.js";
    import "@arenarium/maps-integration-maplibre/main.css";

    let mapContainer = $state<HTMLDivElement>();
    let example = $state.raw<ExampleMap>();

    let busy = $state(false);
    let count = $state(0);
    let amount = $state(200);
    let selected = $state<string>();
    let settings = $state<MarkerSettings>({ ...DEFAULT_SETTINGS });

    onMount(() => {
        let disposed = false;
        let created: ExampleMap | undefined;

        ExampleMap.create(mapContainer!, PUBLIC_API_KEY, { ...settings }, (id) => (selected = id))
            .then(async (map) => {
                if (disposed) return map.dispose();
                created = map;
                example = map;
                await run((map) => map.addMarkers(amount));
            })
            .catch((error) => console.error(error));

        return () => {
            disposed = true;
            created?.dispose();
        };
    });

    /** Runs an action on the map, one at a time, and updates the marker count after it. */
    async function run(action: (map: ExampleMap) => Promise<void>) {
        if (!example || busy) return;
        busy = true;
        try {
            await action(example);
        } catch (error) {
            console.error(error);
        } finally {
            count = example.count;
            if (selected && !example.has(selected)) selected = undefined;
            busy = false;
        }
    }

    function selectRandom() {
        selected = example?.getRandomId();
        if (selected) example?.showTooltip(selected);
    }

    function setSetting<K extends keyof MarkerSettings>(key: K, value: MarkerSettings[K]) {
        settings[key] = value;
        run((map) => map.setSettings({ ...settings }));
    }
</script>

<div class="map" bind:this={mapContainer}></div>

<aside class="panel">
    <header>
        <h1>@arenarium/maps</h1>
        <p>SvelteKit + MapLibre example</p>
    </header>

    <section>
        <h2>Markers</h2>
        <input type="number" min="1" max="10000" bind:value={amount} disabled={!example || busy} />
        <div class="row">
            <button onclick={() => run((map) => map.addMarkers(amount))} disabled={!example || busy || !(amount > 0)}>
                Add
            </button>
            <button onclick={() => run((map) => map.clearMarkers())} disabled={!example || busy || count === 0}>
                Clear
            </button>
        </div>
    </section>

    <section>
        <h2>Orientation</h2>
        <select
            value={settings.orientation}
            onchange={(e) => setSetting("orientation", e.currentTarget.value as MarkerSettings["orientation"])}
            disabled={!example || busy}
        >
            <option value="dynamic">Dynamic</option>
            <option value="centered">Centered</option>
        </select>
        <p class="hint">How tooltips and popups are placed around markers.</p>
    </section>

    <section>
        <h2>Select</h2>
        <p class="hint">
            {#if selected}
                Selected marker <strong>#{selected}</strong>
            {:else}
                Click a tooltip to select its marker.
            {/if}
        </p>
        <button onclick={selectRandom} disabled={!example || busy || count === 0}>Random</button>
    </section>

    <section>
        <h2>Popups</h2>
        <div class="row">
            <button
                onclick={() => selected && example?.showPopup(selected)}
                disabled={!selected || busy}
            >
                Show popup
            </button>
            <button onclick={() => example?.hidePopup()} disabled={!selected || busy}>
                Hide popup
            </button>
        </div>
    </section>
</aside>

<style>
    :global(body) {
        margin: 0;
    }

    .map {
        position: fixed;
        inset: 0;
        background-color: #e5e5e5;
    }

    .panel {
        position: absolute;
        top: 16px;
        left: 16px;
        z-index: 1;
        width: 260px;
        max-height: calc(100vh - 32px);
        overflow-y: auto;
        box-sizing: border-box;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        font-family: system-ui, sans-serif;
        color: #1f1f1f;
    }

    header {
        padding: 16px 16px 12px;
        border-bottom: 1px solid #eeeeee;
    }

    h1 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
    }

    header p {
        margin: 2px 0 0;
        font-size: 12px;
        color: #777777;
    }

    section {
        padding: 12px 16px;
        border-bottom: 1px solid #eeeeee;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    section:last-child {
        border-bottom: none;
    }

    h2 {
        margin: 0;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #777777;
    }

    .row {
        display: flex;
        gap: 8px;
    }

    .row > * {
        flex: 1;
    }

    button,
    select,
    input {
        height: 30px;
        box-sizing: border-box;
        padding: 0 10px;
        font: inherit;
        font-size: 13px;
        color: inherit;
        background: #ffffff;
        border: 1px solid #d4d4d4;
        border-radius: 6px;
        cursor: pointer;
    }

    button:hover:not(:disabled),
    select:hover:not(:disabled) {
        background: #f5f5f5;
    }

    input {
        cursor: text;
    }

    button:disabled,
    select:disabled,
    input:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .hint {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: #777777;
    }

    .hint strong {
        color: #1f1f1f;
    }
</style>
