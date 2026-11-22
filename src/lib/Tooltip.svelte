<script lang="ts">
    let { id, rank }: { id: string; rank: number } = $props();
</script>

<div class="tooltip">
    <div class="title">#{id}</div>
    <div class="rank">Rank {rank}</div>
</div>

<style>
    .tooltip {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, sans-serif;
    }

    .title {
        font-size: 14px;
        font-weight: 600;
        color: #1f1f1f;
    }

    .rank {
        font-size: 11px;
        color: #777777;
    }
</style>
