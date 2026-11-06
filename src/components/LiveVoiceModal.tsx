import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  AlertCircle,
  X,
  Radio,
  Send
} from 'lucide-react';
import { floatTo16BitPCMBase64, base64ToFloat32Array } from '../utils/audioPcm';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionTitle?: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  decisionTitle,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Initializing Live API connection...');
  const [textInput, setTextInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  const startSession = async () => {
    setErrorMessage(null);
    setStatusText('Connecting to Gemini 3.8 Live API...');

    try {
      // 1. Audio context setup: 16kHz input, 24kHz output
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('Live Voice Session Active — Talk freely with The Tiebreaker');
        // If there's an active decision, seed initial context
        if (decisionTitle) {
          ws.send(
            JSON.stringify({
              text: `The user is weighing this dilemma: "${decisionTitle}". Help them make a clear choice.`,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMessage(msg.error);
            return;
          }

          if (msg.interrupted) {
            // User spoke over the model: stop playback immediately and clear queue
            activeSourcesRef.current.forEach((src) => {
              try {
                src.stop();
              } catch (_) {}
            });
            activeSourcesRef.current = [];
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
            setIsSpeaking(false);
          }

          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMessage('Failed to connect to Live API server. Check your connection or API key.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText('Disconnected');
      };

      // 4. Capture microphone stream and send 16kHz PCM chunks
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || !ws || ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const base64 = floatTo16BitPCMBase64(channelData);
        ws.send(JSON.stringify({ audio: base64 }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setErrorMessage(
        err?.message || 'Microphone access denied or audio initialization failed.'
      );
      setStatusText('Connection Failed');
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    const outputCtx = outputAudioCtxRef.current;
    if (!outputCtx) return;

    try {
      const float32Array = base64ToFloat32Array(base64Audio);
      const audioBuffer = outputCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);

      const currentTime = outputCtx.currentTime;
      // Schedule gapless playback
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setIsSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Audio chunk playback error:', e);
    }
  };

  const endSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (_) {}
    });
    activeSourcesRef.current = [];

    setIsConnected(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      endSession();
    }
    return () => endSession();
  }, [isOpen]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;
    wsRef.current.send(JSON.stringify({ text: textInput.trim() }));
    setTextInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl shadow-indigo-950/50">
        {/* Background ambient orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Gemini 3.8 Live Voice Advisor</span>
                <span className="rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-400/30">
                  Real-time PCM
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Low-latency spoken conversation with The Tiebreaker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Notice: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Center Live Waveform Animation */}
        <div className="my-8 flex flex-col items-center justify-center py-4">
          {/* Circular Pulse Ring */}
          <div className="relative flex h-36 w-36 items-center justify-center">
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full border border-indigo-400/40 animate-pulse" />
              </>
            )}

            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all ${
                isSpeaking
                  ? 'border-indigo-400 bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-lg shadow-indigo-500/50 scale-105'
                  : isConnected
                  ? 'border-emerald-500/50 bg-slate-800/90 text-emerald-400'
                  : 'border-slate-700 bg-slate-900 text-slate-500'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="h-10 w-10 text-white animate-bounce" />
              ) : (
                <Mic className="h-10 w-10 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Status Label */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? isSpeaking
                      ? 'bg-indigo-400 animate-ping'
                      : 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-200">
                {isSpeaking
                  ? 'The Tiebreaker is speaking...'
                  : isConnected
                  ? isMuted
                    ? 'Microphone Muted'
                    : 'Listening to your voice...'
                  : statusText}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
              Speak naturally about your options, hesitations, or tradeoffs. Say &ldquo;What should I do?&rdquo; to begin.
            </p>
          </div>
        </div>

        {/* Fallback Text Input */}
        <form onSubmit={handleSendText} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type a spoken prompt if preferred..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || !isConnected}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Footer Voice Controls */}
        <div className="flex items-center justify-center gap-4 border-t border-white/10 pt-4">
          {/* Mute Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
            }`}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
          >
            <PhoneOff className="h-4 w-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
