import React, { useState, useEffect } from 'react';

const FloatingOrb = ({ status, emotion, onExpand }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Listen for window state changes from Electron
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getWindowState().then(setIsExpanded);
            window.electronAPI.onWindowStateChanged(setIsExpanded);

            return () => {
                window.electronAPI.removeWindowStateListener();
            };
        }
    }, []);

    const handleClick = () => {
        if (window.electronAPI) {
            window.electronAPI.toggleSize();
        }
        if (onExpand) onExpand();
    };

    const getStatusGradient = () => {
        if (status === 'idle' && emotion && emotion !== 'neutral') {
            switch (emotion) {
                case 'happy': return 'from-green-400 via-emerald-500 to-teal-600';
                case 'angry': return 'from-red-500 via-rose-600 to-red-700';
                case 'sad': return 'from-blue-500 via-indigo-600 to-blue-700';
                default: return 'from-cyan-400 via-blue-500 to-indigo-600';
            }
        }
        switch (status) {
            case 'listening': return 'from-cyan-400 via-teal-500 to-cyan-600';
            case 'thinking': return 'from-amber-400 via-yellow-500 to-orange-500';
            case 'speaking': return 'from-purple-400 via-violet-500 to-fuchsia-600';
            case 'locked': return 'from-red-500 via-rose-600 to-red-700';
            default: return 'from-cyan-400 via-blue-500 to-indigo-600';
        }
    };

    const getGlowColor = () => {
        if (status === 'idle' && emotion && emotion !== 'neutral') {
            switch (emotion) {
                case 'happy': return 'rgba(74, 222, 128, 0.6)';
                case 'angry': return 'rgba(239, 68, 68, 0.6)';
                case 'sad': return 'rgba(59, 130, 246, 0.6)';
                default: return 'rgba(34, 211, 238, 0.5)';
            }
        }
        switch (status) {
            case 'listening': return 'rgba(34, 211, 238, 0.7)';
            case 'thinking': return 'rgba(251, 191, 36, 0.6)';
            case 'speaking': return 'rgba(168, 85, 247, 0.7)';
            case 'locked': return 'rgba(239, 68, 68, 0.5)';
            default: return 'rgba(34, 211, 238, 0.5)';
        }
    };

    return (
        <div
            className="orb-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            style={{
                // Enable window dragging on the orb itself
                WebkitAppRegion: 'drag',
                cursor: 'pointer',
            }}
        >
            {/* Main Orb */}
            <div
                className={`orb-main bg-gradient-to-br ${getStatusGradient()}`}
                style={{
                    boxShadow: `
            0 0 20px ${getGlowColor()},
            0 0 40px ${getGlowColor()},
            0 0 60px ${getGlowColor()},
            inset 0 0 20px rgba(255, 255, 255, 0.2)
          `,
                    WebkitAppRegion: 'no-drag', // Allow clicking
                }}
            >
                {/* Inner glow effect */}
                <div className="orb-inner-glow" />

                {/* Animated ring for active states */}
                {(status === 'listening' || status === 'speaking') && (
                    <div className="orb-pulse-ring" style={{ borderColor: getGlowColor() }} />
                )}

                {/* Status indicator */}
                <div className="orb-status-text">
                    {status === 'locked' ? '🔒' : status === 'listening' ? '🎤' : status === 'thinking' ? '💭' : status === 'speaking' ? '💬' : '✨'}
                </div>
            </div>

            {/* Outer rotating ring */}
            <div className={`orb-outer-ring ${status !== 'idle' ? 'active' : ''}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke={getGlowColor()}
                        strokeWidth="1"
                        strokeDasharray="10 5"
                        className="orb-ring-path"
                    />
                </svg>
            </div>

            {/* Tooltip on hover */}
            {isHovered && (
                <div className="orb-tooltip">
                    Click to {isExpanded ? 'collapse' : 'expand'} • Drag to move
                </div>
            )}
        </div>
    );
};

export default FloatingOrb;
