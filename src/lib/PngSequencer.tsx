import {
  forwardRef,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped'

export type PlayOptions = {
  stopAtFrame?: number
}

export type GoToFrameOptions = {
  autoPause?: boolean
}

export type PngSequencerHandle = {
  play: (options?: PlayOptions) => void
  pause: () => void
  stop: () => void
  restart: () => void
  goToFrame: (frameIndex: number, options?: GoToFrameOptions) => void
  getCurrentFrame: () => number
  getPlaybackState: () => PlaybackState
}

export type PngSequencerProps = {
  frames: string[]
  fps?: number
  duration?: number
  loop?: boolean
  autoPlay?: boolean
  initialFrame?: number
  preload?: boolean
  className?: string
  style?: CSSProperties
  imageProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>
  onFrameChange?: (frameIndex: number) => void
  onStateChange?: (state: PlaybackState) => void
  renderPlaceholder?: ReactNode
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const DEFAULT_FPS = 24

export const PngSequencer = forwardRef<PngSequencerHandle, PngSequencerProps>(
  (
    {
      frames,
      fps = DEFAULT_FPS,
      duration,
      loop = true,
      autoPlay = true,
      initialFrame = 0,
      preload = true,
      className,
      style,
      imageProps,
      onFrameChange,
      onStateChange,
      renderPlaceholder,
    },
    ref,
  ) => {
    const safeLastIndex = Math.max(frames.length - 1, 0)
    const clampFrame = useCallback(
      (frameIndex: number) =>
        frames.length === 0 ? 0 : clamp(frameIndex, 0, safeLastIndex),
      [frames.length, safeLastIndex],
    )

    const [currentFrame, setCurrentFrame] = useState(() =>
      clampFrame(initialFrame),
    )
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackState, setPlaybackState] =
      useState<PlaybackState>('idle')

    const intervalRef = useRef<number | null>(null)
    const stopAtRef = useRef<number | null>(null)
    const pendingStopRef = useRef<PlaybackState | null>(null)

    const frameInterval = useMemo(() => {
      if (!frames.length) return Number.POSITIVE_INFINITY
      if (duration && duration > 0) {
        return duration / frames.length
      }

      const safeFps = fps > 0 ? fps : DEFAULT_FPS
      return 1000 / safeFps
    }, [duration, fps, frames.length])

    const clearTimer = useCallback(() => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, [])

    const transitionTo = useCallback(
      (state: PlaybackState) => {
        setPlaybackState((prev) => {
          if (prev === state) return prev
          return state
        })
      },
      [],
    )

    const pauseInternal = useCallback(() => {
      setIsPlaying(false)
      transitionTo('paused')
    }, [transitionTo])

    const stopInternal = useCallback(() => {
      setIsPlaying(false)
      setCurrentFrame(0)
      stopAtRef.current = null
      transitionTo('stopped')
    }, [transitionTo])

    const play = useCallback(
      (options?: PlayOptions) => {
        if (!frames.length) return
        if (typeof options?.stopAtFrame === 'number') {
          stopAtRef.current = clampFrame(options.stopAtFrame)
        } else {
          stopAtRef.current = null
        }

        setIsPlaying(true)
        transitionTo('playing')
      },
      [clampFrame, frames.length, transitionTo],
    )

    const restart = useCallback(() => {
      setCurrentFrame(0)
      play()
    }, [play])

    const pause = useCallback(() => {
      pauseInternal()
    }, [pauseInternal])

    const stop = useCallback(() => {
      stopInternal()
    }, [stopInternal])

    const goToFrame = useCallback(
      (frameIndex: number, options?: GoToFrameOptions) => {
        setCurrentFrame(clampFrame(frameIndex))
        if (options?.autoPause) {
          pauseInternal()
        }
      },
      [clampFrame, pauseInternal],
    )

    useImperativeHandle(
      ref,
      () => ({
        play,
        pause,
        stop,
        restart,
        goToFrame,
        getCurrentFrame: () => currentFrame,
        getPlaybackState: () => playbackState,
      }),
      [goToFrame, pause, play, playbackState, restart, stop, currentFrame],
    )

    useEffect(() => {
      if (!frames.length) {
        // React compiler discourages calling setState in effects, but we must reset
        // playback whenever the source frames disappear.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        stopInternal()
        return
      }

      setCurrentFrame((prev) => clampFrame(prev))
    }, [clampFrame, frames.length, stopInternal])

    useEffect(() => {
      if (!autoPlay || !frames.length) return
      // eslint-disable-next-line react-hooks/set-state-in-effect
      play()
    }, [autoPlay, frames.length, play])

    useEffect(() => {
      if (!isPlaying || !Number.isFinite(frameInterval)) {
        clearTimer()
        return
      }

      clearTimer()

      intervalRef.current = window.setInterval(() => {
        setCurrentFrame((prev) => {
          if (!frames.length) return prev
          const lastIndex = frames.length - 1
          let next = prev + 1
          const stopAtTarget = stopAtRef.current
          const reachedStopAt =
            typeof stopAtTarget === 'number' && next >= stopAtTarget

          if (reachedStopAt) {
            next = clamp(stopAtTarget!, 0, lastIndex)
            pendingStopRef.current = 'paused'
          } else if (next > lastIndex) {
            if (loop) {
              next = 0
            } else {
              next = lastIndex
              pendingStopRef.current = 'stopped'
            }
          } else {
            pendingStopRef.current = null
          }

          return next
        })

        if (pendingStopRef.current) {
          const nextState = pendingStopRef.current
          pendingStopRef.current = null
          stopAtRef.current = null
          setIsPlaying(false)
          transitionTo(nextState)
        }
      }, frameInterval)

      return clearTimer
    }, [clearTimer, frameInterval, frames.length, isPlaying, loop, transitionTo])

    useEffect(() => {
      if (!preload || !frames.length) return
      const preloadRefs = frames.map((src) => {
        const img = new Image()
        img.src = src
        return img
      })

      return () => {
        preloadRefs.forEach((img) => {
          img.src = ''
        })
      }
    }, [frames, preload])

    useEffect(() => {
      onFrameChange?.(currentFrame)
    }, [currentFrame, onFrameChange])

    useEffect(() => {
      onStateChange?.(playbackState)
    }, [onStateChange, playbackState])

    useEffect(
      () => () => {
        clearTimer()
      },
      [clearTimer],
    )

    const hasFrames = frames.length > 0
    const composedClassName = ['png-sequencer', className]
      .filter(Boolean)
      .join(' ')

    if (!hasFrames) {
      return (
        <div className={composedClassName} style={style}>
          {renderPlaceholder ?? (
            <div className="png-sequencer__placeholder">
              Provide PNG frames to start playback.
            </div>
          )}
        </div>
      )
    }

    const src = frames[currentFrame]
    const alt =
      imageProps?.alt ??
      `PNG frame ${currentFrame + 1} of ${frames.length} (state: ${playbackState})`

    return (
      <div
        className={composedClassName}
        style={{ display: 'inline-flex', ...style }}
        data-frame={currentFrame}
        data-state={playbackState}
      >
        <img src={src} {...imageProps} alt={alt} />
      </div>
    )
  },
)

PngSequencer.displayName = 'PngSequencer'


