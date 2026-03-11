'use client';

import { useState, useEffect, useRef } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';

export default function VideoInterviewPage() {
  const [roomId, setRoomId] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  const startCall = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInCall(true);

      await fetch('http://localhost:4200/api/v1/video-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
    } catch (error) {
      alert('Failed to access camera/microphone');
    }
  };

  const endCall = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsInCall(false);
    setStream(null);

    await fetch(`http://localhost:4200/api/v1/video-interview/${roomId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration }),
    });
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 px-4 sm:px-0">
      <PageTitle title="Video Interview" description="Conduct live video interviews" />

      {!isInCall ? (
        <GlassCard>
          <h3 className="text-lg font-semibold mb-4">Join Interview Room</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full border rounded px-3 py-2 text-base"
            />
            <button
              onClick={startCall}
              disabled={!roomId}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50 touch-manipulation"
            >
              Start Interview
            </button>
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h3 className="text-lg font-semibold">Interview in Progress</h3>
              <div className="text-xl font-mono">{formatDuration(duration)}</div>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: 'clamp(300px, 60vh, 500px)' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <p className="text-white text-xl">Camera Off</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={toggleMute}
                className={`px-6 py-3 rounded touch-manipulation ${isMuted ? 'bg-red-600' : 'bg-blue-600'} text-white hover:opacity-80`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={toggleVideo}
                className={`px-6 py-3 rounded touch-manipulation ${isVideoOff ? 'bg-red-600' : 'bg-blue-600'} text-white hover:opacity-80`}
              >
                {isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
              </button>
              <button
                onClick={endCall}
                className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 touch-manipulation"
              >
                End Interview
              </button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
