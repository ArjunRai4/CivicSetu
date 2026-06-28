import { useEffect, useRef, useState } from 'react'
import { Camera, ImageUp, Sparkles, CameraOff } from 'lucide-react'
import { DEMO_STREET_PHOTO } from '../../data/mockData/demoPhoto'

export function CameraCapture({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch {
        setError('Camera unavailable — upload a photo or use the demo photo.')
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function captureFrame() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 800
    canvas.height = video.videoHeight || 600
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      onCapture(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {!error ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
            <CameraOff size={40} className="text-white/50" />
            <p className="max-w-xs text-sm">{error}</p>
          </div>
        )}
        {ready && !error && (
          <div className="pointer-events-none absolute inset-0 m-8 rounded-2xl border-2 border-white/40" />
        )}
      </div>

      {/* controls */}
      <div className="flex items-center justify-between gap-3 bg-black px-6 py-5">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white/80"
          aria-label="Upload from gallery"
        >
          <ImageUp size={24} />
          <span className="text-[10px]">Gallery</span>
        </button>

        <button
          onClick={captureFrame}
          disabled={!!error}
          aria-label="Capture photo"
          className="grid h-16 w-16 place-items-center rounded-full bg-white ring-4 ring-white/30 transition active:scale-95 disabled:opacity-40"
        >
          <Camera size={26} className="text-ink" />
        </button>

        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop())
            onCapture(DEMO_STREET_PHOTO)
          }}
          className="flex flex-col items-center gap-1 text-saffron"
          aria-label="Use demo photo"
        >
          <Sparkles size={24} />
          <span className="text-[10px]">Demo</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFile}
      />
    </div>
  )
}
