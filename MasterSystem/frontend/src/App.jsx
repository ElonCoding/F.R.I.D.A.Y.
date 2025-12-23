import React, { useEffect, useState } from 'react';
import Hologram from './components/Hologram';

function App() {
  const [status, setStatus] = useState('locked'); // locked, idle, listening, thinking, speaking
  const [emotion, setEmotion] = useState('neutral');
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    let socket;
    let keepAlive;

    // Auto-reconnect function
    const connect = () => {
      if (socket && socket.readyState === WebSocket.OPEN) return;

      console.log("Attempting connection to Master System Core...");
      socket = new WebSocket('ws://localhost:8000/ws');

      socket.onopen = () => {
        console.log('Connected to Master System Core');
        setStatus('idle');
        addMessage('System Online. Connected to Core.');
        // Ping to keep connection alive
        keepAlive = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        // Expecting format: "EventType|{json_data}" or simple strings
        console.log("Message:", event.data);
        try {
          if (event.data.includes("|")) {
            const [type, payloadStr] = event.data.split("|");
            // Simplified payload parsing
            if (type === "sense.vision.presence") {
              addMessage("System: User Detected");
            } else if (type === "brain.response.generated") {
              addMessage(`System: Speaking...`);
              setStatus('speaking');
              // We rely on TTS_SPEAKING_END to settle, but for safety:
              setTimeout(() => setStatus('idle'), 5000);
            } else if (type === "feedback.tts.start") {
              setStatus('speaking');
            } else if (type === "feedback.tts.end") {
              setStatus('idle');
            } else if (type === "sense.vision.emotion") {
              if (payloadStr.includes('happy')) setEmotion('happy');
              else if (payloadStr.includes('angry')) setEmotion('angry');
              else if (payloadStr.includes('sad')) setEmotion('sad');
              else setEmotion('neutral');
              addMessage(`Emotion Detected: ${payloadStr}`);
            }
          } else {
            if (event.data !== "ping" && event.data !== "Echo: ping") {
              addMessage(`Core: ${event.data}`);
            }
          }
        } catch (e) {
          console.error("Parse Error", e);
        }
      };

      socket.onclose = () => {
        console.log('Disconnected. Retrying in 3s...');
        setStatus('locked');
        addMessage('System Offline. Reconnecting...');
        clearInterval(keepAlive);
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("Websocket Error", err);
        socket.close();
      };

      setWs(socket);
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (keepAlive) clearInterval(keepAlive);
    };
  }, []);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev.slice(-4), msg]); // Keep last 5
  };

  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-holo-100 overflow-hidden relative">

      {/* Background Grid/Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-10 w-full text-center tracking-[0.5em] text-xs font-bold text-holo-500 opacity-70">
        MASTER SYSTEM INTERFACE v1.0
      </div>

      {/* Main Hologram */}
      <div className="z-10 transform scale-150 mb-10">
        <Hologram status={status} emotion={emotion} />
      </div>

      {/* Status Integration (Temporary Controls for Testing) */}
      <div className="absolute bottom-32 flex space-x-4 z-20 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-gray-800 rounded text-xs border border-gray-600">Idle</button>
        <button onClick={() => setStatus('listening')} className="px-4 py-2 bg-gray-800 rounded text-xs border border-neon text-neon shadow-[0_0_10px_cyan]">Listen</button>
        <button onClick={() => setStatus('thinking')} className="px-4 py-2 bg-gray-800 rounded text-xs border border-yellow-500 text-yellow-400">Think</button>
        <button onClick={() => setStatus('speaking')} className="px-4 py-2 bg-gray-800 rounded text-xs border border-purple-500 text-purple-400">Speak</button>
      </div>

      {/* Transcript / Logs */}
      <div className="absolute bottom-10 w-full max-w-2xl px-10 text-center">
        <div className="flex flex-col space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`text-sm tracking-wide font-light ${i === messages.length - 1 ? 'opacity-100 text-white' : 'opacity-40 text-holo-300'}`}>
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
