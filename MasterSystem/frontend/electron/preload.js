const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    toggleSize: () => ipcRenderer.send('toggle-size'),
    hideWindow: () => ipcRenderer.send('hide-window'),
    startDrag: () => ipcRenderer.send('start-drag'),

    // Get current window state
    getWindowState: () => ipcRenderer.invoke('get-window-state'),

    // Listen for window state changes
    onWindowStateChanged: (callback) => {
        ipcRenderer.on('window-state-changed', (event, isExpanded) => callback(isExpanded));
    },

    // Remove listeners
    removeWindowStateListener: () => {
        ipcRenderer.removeAllListeners('window-state-changed');
    },

    // Check if running in Electron
    isElectron: true,
});
