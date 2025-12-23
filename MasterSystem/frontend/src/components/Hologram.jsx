import React from 'react';

const Hologram = ({ status, emotion }) => {
    // Status: 'locked', 'idle', 'listening', 'thinking', 'speaking'
    // Emotion: 'neutral', 'happy', 'angry', 'sad'

    const getStatusColor = () => {
        if (status === 'idle' && emotion && emotion !== 'neutral') {
            switch (emotion) {
                case 'happy': return 'text-green-400 shadow-green-400';
                case 'angry': return 'text-red-600 shadow-red-600';
                case 'sad': return 'text-blue-600 shadow-blue-600';
                default: return 'text-blue-400 shadow-blue-400';
            }
        }
        switch (status) {
            case 'listening': return 'text-neon shadow-neon';
            case 'thinking': return 'text-yellow-400 shadow-yellow-400';
            case 'speaking': return 'text-purple-400 shadow-purple-400';
            case 'locked': return 'text-red-500 shadow-red-500';
            default: return 'text-blue-400 shadow-blue-400';
        }
    };

    const getRingColor = () => {
        if (status === 'idle' && emotion && emotion !== 'neutral') {
            switch (emotion) {
                case 'happy': return 'border-green-400';
                case 'angry': return 'border-red-600';
                case 'sad': return 'border-blue-600';
                default: return 'border-blue-400';
            }
        }
        switch (status) {
            case 'listening': return 'border-neon';
            case 'thinking': return 'border-yellow-400';
            case 'speaking': return 'border-purple-400';
            case 'locked': return 'border-red-500';
            default: return 'border-blue-400';
        }
    };

    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Outer Ring */}
            <div className={`absolute w-full h-full rounded-full border-2 border-dashed ${getRingColor()} border-opacity-30 animate-spin-slow`}></div>

            {/* Middle Ring */}
            <div className={`absolute w-48 h-48 rounded-full border border-solid ${getRingColor()} border-opacity-50 animate-spin-reverse`}></div>

            {/* Inner Core */}
            <div className={`relative w-32 h-32 rounded-full glass-panel flex items-center justify-center animate-float overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-10`}></div>

                {/* Core Glow */}
                <div className={`w-20 h-20 rounded-full bg-current opacity-20 blur-xl absolute animate-pulse-fast ${getStatusColor()}`}></div>

                {/* Status Icon/Waveform Placeholder */}
                <div className={`text-4xl font-bold tracking-wider holo-text z-10 ${getStatusColor()}`}>
                    {status === 'locked' ? 'LOCK' : 'AI'}
                </div>
            </div>

            {/* Particles/Decorations - Optional */}
            {status === 'speaking' && (
                <div className="absolute w-56 h-56 rounded-full border-4 border-t-transparent border-b-transparent border-purple-400 animate-spin"></div>
            )}
        </div>
    );
};

export default Hologram;
