# PNG Sequencer

Reusable, controllable PNG sequence player for React. Feed it pre-rendered PNG frames (sprite sheets, 3D renders, loading animations, etc.), then manage playback speed, looping, and scrubbing through a tiny API that works in any React app or via npm.

The repo ships with:

- `src/lib/` — publishable component code (library build)
- `src/App.tsx` — interactive playground showcasing the API

## Quick start

Install dependencies:

```bash
npm install
```

Run the playground:

```bash
npm run dev
```

## Using the component

Install from npm (after you publish it):

```bash
npm install png-sequencer
```

```tsx
import { useRef } from 'react'
import { PngSequencer, type PngSequencerHandle } from 'png-sequencer'

const frames = ['/sprites/frame-01.png', '/sprites/frame-02.png', /* ... */]

export function LoadingAnimation() {
  const sequencerRef = useRef<PngSequencerHandle>(null)

  return (
    <>
      <PngSequencer
        ref={sequencerRef}
        frames={frames}
        fps={18}
        loop
        onFrameChange={(frame) => console.log('frame', frame)}
        onStateChange={(state) => console.log('state', state)}
      />

      <button onClick={() => sequencerRef.current?.pause()}>Pause</button>
      <button onClick={() => sequencerRef.current?.play({ stopAtFrame: 48 })}>
        Play to frame 48
      </button>
    </>
  )
}
```

### Key props

- `frames` **(required)** — ordered list of PNG URLs
- `fps` *or* `duration` — choose frame rate or total timeline duration
- `loop` (`true`) — loop playback when it reaches the end
- `autoPlay` (`true`) — start automatically
- `preload` (`true`) — eager-load frames to avoid flickers
- `initialFrame` — starting index
- `imageProps` — forwarded to the rendered `<img>`
- `onFrameChange` / `onStateChange` — hook into playback updates

### Imperative API

Attach a ref for advanced scenarios.

```ts
type PngSequencerHandle = {
  play: (options?: { stopAtFrame?: number }) => void
  pause: () => void
  stop: () => void
  restart: () => void
  goToFrame: (frameIndex: number, options?: { autoPause?: boolean }) => void
  getCurrentFrame: () => number
  getPlaybackState: () => 'idle' | 'playing' | 'paused' | 'stopped'
}
```

## Building & publishing

The build pipeline outputs both JS bundles and type declarations.

```bash
npm run build
```

This produces:

- `dist/png-sequencer.mjs` — ESM bundle (default import)
- `dist/png-sequencer.cjs` — CommonJS bundle
- `dist/types/` — `.d.ts` files for TypeScript consumers

Publish straight from the repo root (only `dist/` is included thanks to the `files` field):

```bash
npm publish
```

## Scripts

- `npm run dev` — start the playground
- `npm run build` — emit type declarations + bundles
- `npm run preview` — preview the built playground
- `npm run lint` — run ESLint

## License

MIT
