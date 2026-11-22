<script lang="ts">
    let {
        id,
        rank,
        lat,
        lng,
    }: { id: string; rank: number; lat: number; lng: number } = $props();
</script>

<div class="popup">
    <div class="title">Marker #{id}</div>
    <dl>
        <dt>Rank</dt>
        <dd>{rank}</dd>
        <dt>Lat</dt>
        <dd>{lat.toFixed(5)}</dd>
        <dt>Lng</dt>
        <dd>{lng.toFixed(5)}</dd>
    </dl>
</div>

<style>
    .popup {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 6px;
        font-family: system-ui, sans-serif;
    }

    .title {
        font-size: 14px;
        font-weight: 600;
        color: #1f1f1f;
    }

    dl {
        margin: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 2px 10px;
        font-size: 12px;
    }

    dt {
        color: #777777;
    }

    dd {
        margin: 0;
        color: #1f1f1f;
        font-variant-numeric: tabular-nums;
    }
</style>
