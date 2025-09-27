import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

// Fix: Manually declare Node.js globals as a workaround for a misconfigured TypeScript environment
// that cannot find @types/node. This resolves errors for `__dirname` and `process`.
declare const process: any;
declare const __dirname: string;

// The built directory structure
//
// ├─┬─ dist
// │ └── index.html
// │
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
     width: 1200,
     height: 800,
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // IPC handlers for filesystem access
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory']
    });
    if (!canceled) {
      return filePaths[0];
    }
  });

  const readDirectoryRecursive = async (dirPath: string, rootPath: string): Promise<{ fileName: string, code: string }[]> => {
    const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.DS_Store', '.vscode', 'venv', '__pycache__']);
    const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md', '.py', '.txt', '.yml', '.yaml', '.bat', '.sh', 'dockerfile', '.env', '.gitignore', '.npmrc']);
    let files: { fileName: string, code: string }[] = [];
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (ignore.has(entry.name.toLowerCase())) continue;

            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(await readDirectoryRecursive(fullPath, rootPath));
            } else {
                const extension = path.extname(entry.name).toLowerCase();
                // Check extension or if filename has no extension but is a known text file type
                if (textExtensions.has(extension) || textExtensions.has(entry.name.toLowerCase())) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        files.push({
                            fileName: path.relative(rootPath, fullPath).replace(/\\/g, '/'), // use relative path and forward slashes
                            code: content
                        });
                    } catch (e) {
                        console.error(`Could not read file ${fullPath}:`, e);
                    }
                }
            }
        }
    } catch (e) {
      console.error(`Could not read directory ${dirPath}`, e);
    }
    return files;
  };
  
  ipcMain.handle('fs:readDirectory', async (event, dirPath: string) => {
    return await readDirectoryRecursive(dirPath, dirPath);
  });

  ipcMain.handle('fs:saveFiles', async (event, projectPath: string, files: { fileName: string, code: string }[]) => {
    try {
        for (const file of files) {
            const filePath = path.join(projectPath, file.fileName);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, file.code, 'utf-8');
        }
    } catch (err) {
        console.error('Failed to save files:', err);
        throw err;
    }
  });


  createWindow()
});
