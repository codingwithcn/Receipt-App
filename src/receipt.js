const {app, BrowserWindow, nativeImage} = require('electron')
const path = require('path')

const db_func = require(path.join(__dirname, 'db'));

const image = nativeImage.createFromPath(
  path.join(__dirname, 'icon.png')
);

class Receipt {
    constructor(parent, parent_name, parent_func, width, height, webpref, frame) {
        this.parent = parent;
        this.parent_name = parent_name;
        this.width = width;
        this.height = height;
        this.webpref = webpref;
        this.parent_func = parent_func;
        this.windows = {};
        this.triggers = {};
        this.currentWindow = null;
        this.close_before = null;
        this.update_window = null;
        this.frame = frame;
        this.data = null;
    }

    add_child = (name, file, open_dev, callback, parent = false) => {
        if (name in this.windows) {
            return "Name already exist"
        }
        if (parent == false) {
            let new_child_func = () => {
                let new_child = new BrowserWindow({
                    width: this.width,
                    height: this.height,
                    show: false,
                    fullscreen: true,
                    webPreferences: this.webpref,
                    icon: image.resize({ width: 600, height: 600 }),
                    alwaysOnTop: true,
                    frame: this.frame
                });
                new_child.on('close', this.close_all)
                new_child.loadFile(path.join(__dirname, file));
                if (open_dev == true) {
                    let devtools = new BrowserWindow();
                    new_child.webContents.setDevToolsWebContents(devtools.webContents)
                    new_child.webContents.openDevTools();
                }
                new_child.webContents.setZoomFactor(1.0);
                new_child.webContents
                .setVisualZoomLevelLimits(1, 5)
                .then(console.log("Zoom Levels Have been Set between 100% and 500%"))
                .catch((err) => console.log(err));
                this.windows[name] = new_child;
                new_child.on('show', () => {
                    new_child.maximize()
                    callback(new_child)
                })

            }
            this.triggers[name] = new_child_func;
            return `Added ${name} to ${this.parent_name} program`
        } else {
            this.parent_func = () => {
                this.parent = new BrowserWindow({
                    width: this.width,
                    height: this.height,
                    fullscreen: true,
                    webPreferences: this.webpref,
                    icon: image.resize({ width: 600, height: 600 }),
                    alwaysOnTop: true,
                    frame: this.frame
                });
                this.parent.on('close', app.quit)
                this.parent.loadFile(path.join(__dirname, file));
                if (open_dev == true) {
                    let devtools = new BrowserWindow()
                    this.parent.webContents.setDevToolsWebContents(devtools.webContents)
                    this.parent.webContents.openDevTools({ mode: 'detach' });
                }
                this.parent.webContents.setZoomFactor(1.0);
                this.parent.webContents
                .setVisualZoomLevelLimits(1, 5)
                .then(console.log("Zoom Levels Have been Set between 100% and 500%"))
                .catch((err) => console.log(err));
                this.windows[this.parent_name] = this.parent;
            }
            this.triggers[this.parent_name] = this.parent_func;
            return `Added ${this.parent_name} to program`
        }
    }

    close_all = () => {
        app.quit()
    }

    openWindow = (name) => {
        let keys = Object.keys(this.triggers)
        if (keys.includes(name)) {
            if (this.currentWindow == this.windows[name]) { return }
            this.currentWindow.hide();
            this.triggers[name]();
            this.currentWindow = this.windows[name];
            this.currentWindow.show()
            return `${name} has been opened.`
        }
        return `${name} does not exist.`
    }

    run = () => {
        db_func.does_db_exit_if_not_create()
        this.triggers[this.parent_name]()
        this.windows[this.parent_name] = this.parent;
        this.currentWindow = this.parent

        return `Running ${this.parent_name} APP`
    }
}

module.exports = {
    Receipt: Receipt,
    image: image,
}