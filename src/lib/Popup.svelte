<script lang="ts">
	let props: { rank: number; width: number; height: number } = $props();
</script>

<div class="tooltip" style="width: {props.width}px; height: {props.height}px;">
	<div class="rank">Rank: {props.rank}</div>
	<div class="dimensions">{props.width}x{props.height}</div>
</div>

<style>
	.tooltip {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.rank {
		font-size: 16px;
        font-weight: bold;
		color: green;
	}

	.dimensions {
		font-size: 14px;
		color: gray;
	}
</style>
