## This is an example of using [@arenarium/maps](https://arenarium.dev) with [SvelteKit](https://svelte.dev/docs/kit).

The floating panel lets you try the markers of the library:

- **Markers**: insert a number of random markers in the visible area, and clear them.
- **Orientation**: switch the tooltips and popups between dynamic and centered.
- **Select**: click a tooltip to select its marker, or move the map to a random marker.
- **Popups**: show or hide the popup of the selected marker.

The library logic is in [`src/lib/library.ts`](src/lib/library.ts). The pin, tooltip and popup are Svelte components that mount lazily, in the `initialize` callback of each element.

### Run

1. Add your API key to `.env`: `PUBLIC_API_KEY=...`
2. `pnpm install`
3. `pnpm dev`
