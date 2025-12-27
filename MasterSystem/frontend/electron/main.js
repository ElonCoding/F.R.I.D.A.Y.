const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');

let mainWindow;
let tray;
let isExpanded = false;

// Window dimensions
const COLLAPSED_SIZE = 120;
const EXPANDED_WIDTH = 400;
const EXPANDED_HEIGHT = 500;

function createWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: COLLAPSED_SIZE,
        height: COLLAPSED_SIZE,
        x: screenWidth - COLLAPSED_SIZE - 20,
        y: screenHeight - COLLAPSED_SIZE - 20,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the Vite dev server in development
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // Uncomment to open DevTools
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Make window draggable
    mainWindow.setMovable(true);

    // Prevent window from being closed, hide instead
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    // Create a simple tray icon (you can replace with custom icon)
    tray = new Tray(path.join(__dirname, '../public/vite.svg'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show F.R.I.D.A.Y.',
            click: () => mainWindow.show()
        },
        {
            label: 'Toggle Size',
            click: () => toggleWindowSize()
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('F.R.I.D.A.Y. - Master System');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

function toggleWindowSize() {
    const bounds = mainWindow.getBounds();

    if (isExpanded) {
        // Collapse to orb
        mainWindow.setSize(COLLAPSED_SIZE, COLLAPSED_SIZE);
        mainWindow.setPosition(
            bounds.x + (EXPANDED_WIDTH - COLLAPSED_SIZE),
            bounds.y + (EXPANDED_HEIGHT - COLLAPSED_SIZE)
        );
    } else {
        // Expand to full interface
        mainWindow.setSize(EXPANDED_WIDTH, EXPANDED_HEIGHT);
        mainWindow.setPosition(
            bounds.x - (EXPANDED_WIDTH - COLLAPSED_SIZE),
            bounds.y - (EXPANDED_HEIGHT - COLLAPSED_SIZE)
        );
    }

    isExpanded = !isExpanded;
    mainWindow.webContents.send('window-state-changed', isExpanded);
}

function registerGlobalShortcut() {
    globalShortcut.register('CommandOrControl+Shift+F', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// IPC Handlers
ipcMain.on('toggle-size', () => {
    toggleWindowSize();
});

ipcMain.on('hide-window', () => {
    mainWindow.hide();
});

ipcMain.on('start-drag', () => {
    // Custom drag handling if needed
});

ipcMain.handle('get-window-state', () => {
    return isExpanded;
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    createTray();
    registerGlobalShortcut();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
