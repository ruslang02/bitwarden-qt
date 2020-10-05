/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import {
    QAction,
    QApplication, QFontDatabase, QIcon, QMenu, WidgetEventTypes,
} from '@nodegui/nodegui';
import { existsSync, promises } from 'fs';
import { join } from 'path';
import { ApplicationEventEmitter } from './utilities/applicationEventEmitter';
import { Events as AppEvents } from './structures/Events';
import { RootWindow } from './windows/RootWindow';

console.log(require('./services'));
const { readdir } = promises;
const FONTS_PATH = join(__dirname, './assets/fonts');

export class Application extends ApplicationEventEmitter {
    application = QApplication.instance();

    trayMenu = new QMenu();

    accountsMenu = new QMenu();

    tagAction = new QAction();

    appIcon = new QIcon(join(__dirname, 'assets/icon.png'));

    constructor() {
        super();
        this.setMaxListeners(128);
        this.application.setQuitOnLastWindowClosed(false);
    }

    public async start() {
        const { application } = this;
        await this.loadFonts();
        this.window = new RootWindow();
        this.window.show();
        this.window.addEventListener(WidgetEventTypes.Close, async () => {
          console.log('Bye.');
          application.quit();
        });
        this.emit(AppEvents.READY);
    }

    private async loadFonts() {
        if (!existsSync(FONTS_PATH)) return;
        for (const file of await readdir(FONTS_PATH)) {
            QFontDatabase.addApplicationFont(join(FONTS_PATH, file));
        }
    }

    public get window(): RootWindow {
        return (global as any).win;
    }

    public set window(v: RootWindow) {
        (global as any).win = v;
    }
}
