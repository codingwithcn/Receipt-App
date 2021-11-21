// Modules to control application life and create native browser window
const { app, ipcMain, Tray, BrowserWindow } = require('electron');

if (require('electron-squirrel-startup')) return app.quit();

const { autoUpdater } = require("electron-updater");


const path = require('path');

require(path.resolve(__dirname, "debug_console"))

// Used to Debug Releases that won't have a console... Comment out when devloping

const fs = require("fs");
try {
    fs.unlinkSync(path.resolve(process.resourcesPath, "console.log"))
        //We will need to delete the previous log, so we will only deal with recent errors
} catch (err) {
    console.error(err)
}
console.file(path.resolve(process.resourcesPath, "console.log"));

const { Receipt, image } = require(path.join(__dirname, 'receipt'));
const db_func = require(path.join(__dirname, 'db'));

let cap = new Receipt(null, 'Receipt', null, 1300,
    600, {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
    }, false)

console.log(cap.add_child('Home', 'index.html', false, (win) => { console.log("DONE") }, true))

let run = () => {
    cap.run()
    autoUpdater.checkForUpdates();
}


ipcMain.on("quitAndInstall", (event, arg) => {
    autoUpdater.quitAndInstall();
})

autoUpdater.on('update-downloaded', (info) => {
    cap.currentWindow.webContents.send('updateReady')
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        run();
    }
});

let tray = null

app.whenReady().then(() => {
    tray = new Tray(image.resize({ width: 600, height: 600 }))
    tray.setTitle('Receipt App');
    run();
})

ipcMain.on("NewReceipt", (event, data) => {
    db_func.new_reciept(data.name, data.amount)
    db_func.get_reciepts(function(rows) {
        cap.data = rows;
        cap.currentWindow.webContents.send("NewReceiptEntrySaved", { data: rows })
    })
})

ipcMain.on("GetReceiptAll", () => {
    db_func.get_reciepts(function(rows) {
        cap.data = rows;
        cap.currentWindow.webContents.send("NewReceiptEntrySaved", { data: rows })
    })
})

ipcMain.on("ChangeValues", (event, data) => {
    let keys = Object.keys(data);

    for (var i = 0; i < keys.length; i++) {
        let change = data[keys[i]];

        let change_keys = Object.keys(change);

        for (var c_i = 0; c_i < change_keys.length; c_i++) {
            let real_change = change_keys[c_i];

            db_func.updateReciepts(real_change, change[real_change], keys[i])
        }
    }
    cap.currentWindow.webContents.send("AllChangesSaved")
})

ipcMain.on("DeleteRow", (event, data) => {
    db_func.deleteReciepts(data.row);
    db_func.get_reciepts(function(rows) {
        cap.data = rows;
        cap.currentWindow.webContents.send("NewReceiptEntrySaved", { data: rows })
    })
})

ipcMain.on("FilterData", (event, data) => {
    db_func.get_reciepts(function(rows) {
        cap.data = rows;
        cap.currentWindow.webContents.send("NewReceiptEntrySaved", { data: rows })
    }, data.query)
})

// This is for the render process do not touch
ipcMain.on("closeWindow", () => {
    app.quit()
})

ipcMain.on("minimizeWindow", () => {
    cap.currentWindow.isMinimized() ? cap.currentWindow.restore() : cap.currentWindow.minimize()
})

ipcMain.on("maximizeWindow", () => {
    if (cap.currentWindow.isFullScreen()) {
        cap.currentWindow.setFullScreen(false)
    } else {
        cap.currentWindow.setSimpleFullScreen(false)
        cap.currentWindow.setFullScreen(true)
    }
})

ipcMain.on("RemoveAlwaysOnTop", () => {
    cap.currentWindow.setAlwaysOnTop(false, 'screen');
})

ipcMain.on("AddAlwaysOnTop", () => {
    cap.currentWindow.setAlwaysOnTop(true, 'screen');
})

ipcMain.on("go_to_home", () => {
    cap.openWindow('Home')
})

ipcMain.on("ReloadWindow", () => {
    cap.currentWindow.reload()
})

ipcMain.on("ForceReload", () => {
    cap.currentWindow.webContents.reloadIgnoringCache()
})

ipcMain.on("TDEVTOOLS", () => {
    let devtools = new BrowserWindow();
    cap.currentWindow.webContents.setDevToolsWebContents(devtools.webContents)
    cap.currentWindow.webContents.openDevTools({ mode: 'detach' });
})

ipcMain.on("ZOOMIN", () => {
    var currentZoom = cap.currentWindow.webContents.getZoomFactor();
    cap.currentWindow.webContents.zoomFactor = currentZoom + 0.2;
})

ipcMain.on("ZOOMOUT", () => {
    var currentZoom = cap.currentWindow.webContents.getZoomFactor();
    cap.currentWindow.webContents.zoomFactor = currentZoom - 0.2;
})

ipcMain.on("NORMALZOOM", () => {
        cap.currentWindow.webContents.setZoomFactor(1.0);
    })
    // End of the render process