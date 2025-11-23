import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { PngSequencer, type PngSequencerHandle } from './lib'
import type { PlaybackState } from './lib'
import './App.css'

const FRAME_COUNT = 148

const buildFrameUrl = (index: number) => {
  const id = (index + 1).toString().padStart(2, '0')
  return `https://placehold.co/320x320/1e293b/ffffff.png?text=Frame%20${id}`
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function App() {
  const sequencerRef = useRef<PngSequencerHandle>(null)
  const [fps, setFps] = useState(12)
  const [durationMs, setDurationMs] = useState(1200)
  const [useDuration, setUseDuration] = useState(false)
  const [loop, setLoop] = useState(true)
  const [stopFrameInput, setStopFrameInput] = useState('')
  const [currentFrame, setCurrentFrame] = useState(0)
  const [playbackState, setPlaybackState] =
    useState<PlaybackState>('idle')

  const frames = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => buildFrameUrl(index)),
    [],
  )

  const parsedStopFrame =
    stopFrameInput === ''
      ? undefined
      : clamp(Number(stopFrameInput), 0, frames.length - 1)

  const sharedPlayOptions =
    typeof parsedStopFrame === 'number' ? { stopAtFrame: parsedStopFrame } : undefined

  const handlePlay = () => {
    sequencerRef.current?.play(sharedPlayOptions)
  }

  const handlePause = () => {
    sequencerRef.current?.pause()
  }

  const handleStop = () => {
    sequencerRef.current?.stop()
  }

  const handleRestart = () => {
    sequencerRef.current?.restart()
  }

  const handleScrub = (nextValue: number) => {
    sequencerRef.current?.goToFrame(nextValue, { autoPause: true })
  }

  const handleStopFrameInput = (event: ChangeEvent<HTMLInputElement>) => {
    setStopFrameInput(event.target.value)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
      <div>
          <p className="eyebrow">Reusable React component</p>
          <h1>PNG Sequencer</h1>
          <p className="lead">
            Drop in a stack of PNG files and control how and when they play —
            perfect for sprite animations, video replacements, or loading sequences.
        </p>
      </div>
        <div className="header-stats">
          <dl>
            <div>
              <dt>Frames</dt>
              <dd>{frames.length}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd className={`state state--${playbackState}`}>{playbackState}</dd>
            </div>
            <div>
              <dt>Frame</dt>
              <dd>
                {currentFrame + 1}/{frames.length}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="app-grid">
        <section className="preview-panel">
          <PngSequencer
            ref={sequencerRef}
            frames={frames}
            fps={useDuration ? undefined : fps}
            duration={useDuration ? durationMs : undefined}
            loop={loop}
            onFrameChange={setCurrentFrame}
            onStateChange={setPlaybackState}
            imageProps={{
              width: 320,
              height: 320,
              loading: 'lazy',
              decoding: 'async',
            }}
            className="preview-panel__sequencer"
          />
        </section>

        <section className="controls-panel">
          <h2>Playback</h2>
          <div className="control-row">
            <button onClick={handlePlay}>Play</button>
            <button onClick={handlePause}>Pause</button>
            <button onClick={handleStop}>Stop</button>
            <button onClick={handleRestart}>Restart</button>
          </div>

          <div className="control-row">
            <label>
              Stop at frame
              <input
                min={0}
                max={frames.length - 1}
                type="number"
                inputMode="numeric"
                value={stopFrameInput}
                onChange={handleStopFrameInput}
                placeholder="(optional)"
              />
            </label>
          </div>

          <div className="divider" />
          <h2>Speed</h2>

          <div className="control-row toggle-row">
            <label>
              <input
                type="radio"
                name="speed-mode"
                checked={!useDuration}
                onChange={() => setUseDuration(false)}
              />
              FPS
            </label>
            <label>
              <input
                type="radio"
                name="speed-mode"
                checked={useDuration}
                onChange={() => setUseDuration(true)}
              />
              Duration
            </label>
          </div>

          {!useDuration ? (
            <label>
              Frames per second
              <input
                type="range"
                min={1}
                max={60}
                value={fps}
                onChange={(event) => setFps(Number(event.target.value))}
              />
              <span className="value">{fps} fps</span>
            </label>
          ) : (
            <label>
              Timeline duration (ms)
              <input
                type="range"
                min={200}
                max={6000}
                step={100}
                value={durationMs}
                onChange={(event) => setDurationMs(Number(event.target.value))}
              />
              <span className="value">{durationMs} ms</span>
            </label>
          )}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={loop}
              onChange={(event) => setLoop(event.target.checked)}
            />
            Loop playback
          </label>

          <div className="divider" />
          <h2>Scrub</h2>
          <label>
            Current frame
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentFrame}
              onChange={(event) => {
                const nextFrame = Number(event.target.value)
                setCurrentFrame(nextFrame)
                handleScrub(nextFrame)
              }}
            />
            <span className="value">
              {currentFrame + 1}/{frames.length}
            </span>
          </label>
        </section>
      </main>

      <section className="usage">
        <h2>Use it in your app</h2>
        <ol>
          <li>Build the library once with <code>npm run build</code>.</li>
          <li>Publish the generated contents of <code>dist/</code> to npm.</li>
          <li>Install it elsewhere with <code>npm i png-sequencer</code>.</li>
          <li>Import <code>{`import { PngSequencer } from 'png-sequencer'`}</code> and pass your PNG frames.</li>
        </ol>
      </section>
    </div>
  )
}

export default App
