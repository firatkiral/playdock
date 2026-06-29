const { app, BrowserWindow, ipcMain, dialog, screen, Tray, Menu } = require('electron/main');
const { shell } = require('electron');
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const packageInfo = require('./package.json');
const db = require('./src/db');
const fs = require('fs-extra');

const steam = require("./src/steam");
const epic = require("./src/epic");
const ubisoft = require("./src/ubisoft");
const gog = require("./src/gog");
const xbox = require("./src/xbox");
const ea = require("./src/ea");
const fn = require("./src/functions");
const igdb = require("./src/igdb");
const rss = require("./src/rss");
const { fetchRssFeeds } = rss;

let mainWindow;
let tray;
let isQuitting = false;
let rssRefreshPromise = null;
const APP_LOCAL_PATH = path.join(process.env.LOCALAPPDATA, 'PlayDock');
const METADATA_PATH = path.join(APP_LOCAL_PATH, 'metadata');
const APP_ICON_PATH = path.join(__dirname, 'client', 'images', 'playdock_logo.png');
const APP_SHORTCUT_ICON_PATH = path.join(__dirname, 'client', 'images', 'icon.ico');
const DEFAULT_WINDOW_BOUNDS = { width: 1280, height: 720, isMaximized: false };
const AUTOSCAN_SOURCES = ["steam", "epic", "ubisoft", "gog", "xbox", "ea"];
const DEFAULT_LIBRARY_VIEW_SETTINGS = {
    source: "all",
    sort: "name",
    groupedBySource: false,
};
const DEFAULT_FAVORITES_VIEW_SETTINGS = {
    sort: "favoritedAt",
};
const DEFAULTS_PATH = path.join(__dirname, 'defaults.json');
let saveWindowBoundsTimer = null;
const folderScanJobs = new Map();
const launchingGameIds = new Set();

async function openExternalUrl(url) {
    const targetUrl = String(url || "");
    if (!/^https?:\/\//i.test(targetUrl)) {
        throw new Error("invalid-url");
    }

    await shell.openExternal(targetUrl);
    return { ok: true };
}

const createWindow = (savedBounds = DEFAULT_WINDOW_BOUNDS) => {
    const windowBounds = sanitizeWindowBounds(savedBounds);
    mainWindow = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        ...(Number.isFinite(windowBounds.x) && Number.isFinite(windowBounds.y) ? { x: windowBounds.x, y: windowBounds.y } : {}),
        frame: false,
        icon: APP_ICON_PATH,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    if (windowBounds.isMaximized) {
        mainWindow.maximize();
    }

    bindWindowBoundsTracking();

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        openExternalUrl(url).catch((error) => {
            console.error("Could not open external URL.", error);
        });

        return { action: 'deny' };
    });

    mainWindow.loadFile('client/index.html');
    // mainWindow.webContents.openDevTools();
};

function toStoredGame(game) {
    return {
        name: game.name,
        installDir: game.launch && game.launch.installDir ? game.launch.installDir : "",
        launchCmd: game.launch && game.launch.cmd ? game.launch.cmd : "",
        launchExe: game.launch && game.launch.exe ? game.launch.exe : "",
        launchArgs: game.launch && game.launch.args ? game.launch.args : "",
    };
}

function isLocalSource(source) {
    return !source || source === 'local';
}

function normalizeSource(source) {
    return String(source || 'local').trim().toLowerCase() || 'local';
}

function normalizeGameName(name) {
    return String(name || '').trim().toLowerCase();
}

function getScannedGameKeys(game) {
    const source = normalizeSource(game && game.source);
    const appId = String(game && game.appId ? game.appId : '').trim();
    const name = normalizeGameName(game && game.name);
    return [
        appId ? `${source}:app:${appId}` : '',
        name ? `${source}:name:${name}` : '',
    ].filter(Boolean);
}

function getStoredGameKeys(game) {
    const launch = game && game.launch ? game.launch : {};
    const source = normalizeSource(launch.source);
    const appId = String(launch.appId || '').trim();
    const name = normalizeGameName(game && game.name);
    return [
        appId ? `${source}:app:${appId}` : '',
        name ? `${source}:name:${name}` : '',
    ].filter(Boolean);
}

function updateStoredLaunchFromScan(existingGame, scannedGame) {
    existingGame.name = scannedGame.name || existingGame.name;
    existingGame.launch = existingGame.launch || {};
    existingGame.launch.appId = scannedGame.appId || existingGame.launch.appId || "";
    existingGame.launch.source = scannedGame.source || existingGame.launch.source || "local";
    existingGame.launch.installDir = scannedGame.installdir || existingGame.launch.installDir || "";
    existingGame.launch.cmd = scannedGame.launchCmd || existingGame.launch.cmd || "";
    existingGame.launch.exe = scannedGame.launchExe || existingGame.launch.exe || "";
    existingGame.launch.args = scannedGame.launchArgs || existingGame.launch.args || "";
    return existingGame;
}

function markGameLaunched(game) {
    game.lastPlayed = Date.now();
    game.playCount = (game.playCount || 0) + 1;
    db.instance.Game.update(game);
    return game;
}

function refreshRssFeeds() {
    if (!rssRefreshPromise) {
        rssRefreshPromise = fetchRssFeeds()
            .then(() => saveDatabase())
            .catch((error) => {
                console.warn("Failed to refresh RSS feed:", error && error.message ? error.message : error);
                throw error;
            })
            .finally(() => {
                rssRefreshPromise = null;
            });
    }

    return rssRefreshPromise;
}

function toStoredMetadata(metadata) {
    if (!metadata) {
        return {};
    }

    const hasMetadata = Boolean(
        metadata.igdbId ||
        metadata.igdbUrl ||
        metadata.name ||
        metadata.description ||
        metadata.coverImage ||
        (Array.isArray(metadata.genres) && metadata.genres.length) ||
        (Array.isArray(metadata.screenshots) && metadata.screenshots.length)
    );

    if (!hasMetadata) {
        return {};
    }

    return {
        igdbId: metadata.igdbId,
        igdbUrl: metadata.igdbUrl,
        name: metadata.name,
        description: metadata.description,
        genres: Array.isArray(metadata.genres) ? metadata.genres : [],
        publishers: Array.isArray(metadata.publishers) ? metadata.publishers : [],
        developers: Array.isArray(metadata.developers) ? metadata.developers : [],
        modes: Array.isArray(metadata.modes) ? metadata.modes : [],
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        releaseDate: metadata.releaseDate,
        ageRatings: metadata.ageRatings,
        criticScore: metadata.criticScore,
        communityScore: metadata.communityScore,
        icon: metadata.icon,
        coverImage: metadata.coverImage,
        screenshots: Array.isArray(metadata.screenshots) ? metadata.screenshots : [],
        videos: Array.isArray(metadata.videos) ? metadata.videos : [],
        links: Array.isArray(metadata.links) ? metadata.links : []
    };
}

function isRemoteUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function isLocalFileUrl(url) {
    return typeof url === 'string' && /^file:\/\//i.test(url);
}

function isLocalFilePath(value) {
    return typeof value === 'string' && path.isAbsolute(value);
}

function hasLocalMetadataImages(metadata, gameId) {
    if (!metadata || !metadata.igdbId) {
        return false;
    }

    const imageUrls = [
        metadata.icon,
        metadata.coverImage,
        ...(Array.isArray(metadata.screenshots) ? metadata.screenshots : [])
    ].filter(Boolean);

    const gameMetadataPath = path.join(METADATA_PATH, String(gameId || ''));
    const gameMetadataPathPrefix = `${gameMetadataPath}${path.sep}`.toLowerCase();
    return imageUrls.length === 0 || imageUrls.every((url) => {
        if (!isLocalFileUrl(url)) {
            return false;
        }

        try {
            return fileURLToPath(url).toLowerCase().startsWith(gameMetadataPathPrefix);
        } catch (err) {
            return false;
        }
    });
}

function getImageExtension(remoteUrl, contentType = '') {
    const contentExtension = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/avif': '.avif'
    }[String(contentType).split(';')[0].trim().toLowerCase()];
    if (contentExtension) {
        return contentExtension;
    }

    try {
        const ext = path.extname(new URL(remoteUrl).pathname).toLowerCase();
        return ext || '.jpg';
    } catch (err) {
        return '.jpg';
    }
}

function sourceFingerprint(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex').slice(0, 10);
}

function downloadImage(remoteUrl, localPath, redirectCount = 0) {
    return new Promise((resolve, reject) => {
        if (redirectCount > 5) {
            reject(new Error('too-many-redirects'));
            return;
        }

        const client = remoteUrl.startsWith('https://') ? https : http;
        const request = client.get(remoteUrl, (response) => {
            const statusCode = response.statusCode || 0;
            if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
                response.resume();
                const nextUrl = new URL(response.headers.location, remoteUrl).toString();
                downloadImage(nextUrl, localPath, redirectCount + 1).then(resolve).catch(reject);
                return;
            }

            if (statusCode < 200 || statusCode >= 300) {
                response.resume();
                reject(new Error(`image-download-failed:${statusCode}`));
                return;
            }

            const file = fs.createWriteStream(localPath);
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
            file.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy(new Error('image-download-timeout'));
        });
    });
}

async function cacheImage(remoteUrl, gameId, type, index = 0) {
    if (!remoteUrl) {
        return "";
    }

    if (!isRemoteUrl(remoteUrl) && !isLocalFileUrl(remoteUrl) && !isLocalFilePath(remoteUrl)) {
        return remoteUrl || "";
    }

    const gameMetadataPath = path.join(METADATA_PATH, String(gameId || 'unknown'));
    await fs.ensureDir(gameMetadataPath);

    let extension = getImageExtension(remoteUrl);
    const fingerprint = sourceFingerprint(remoteUrl);
    const baseName = type === 'screenshot' ? `screenshot-${index}-${fingerprint}` : `${type}-${fingerprint}`;
    let localPath = path.join(gameMetadataPath, `${baseName}${extension}`);

    if (isLocalFileUrl(remoteUrl) || isLocalFilePath(remoteUrl)) {
        try {
            const sourcePath = isLocalFileUrl(remoteUrl) ? fileURLToPath(remoteUrl) : remoteUrl;
            extension = path.extname(sourcePath) || extension;
            localPath = path.join(gameMetadataPath, `${baseName}${extension}`);

            if (sourcePath.toLowerCase() !== localPath.toLowerCase()) {
                await fs.copy(sourcePath, localPath, { overwrite: true });
            }

            return pathToFileURL(localPath).toString();
        } catch (err) {
            throw err;
        }
    }

    const tempPath = `${localPath}.tmp`;
    try {
        await downloadImage(remoteUrl, tempPath);
        await fs.move(tempPath, localPath, { overwrite: true });
    } catch (err) {
        await fs.remove(tempPath).catch(() => {});
        throw err;
    }

    return pathToFileURL(localPath).toString();
}

async function cacheImageSafely(remoteUrl, gameId, type, index = 0) {
    try {
        return await cacheImage(remoteUrl, gameId, type, index);
    } catch (err) {
        console.error(`Failed to cache metadata ${type}:`, err);
        return remoteUrl || "";
    }
}

async function cacheMetadataImages(metadata, gameId) {
    const storedMetadata = toStoredMetadata(metadata);
    if (!storedMetadata.igdbId && !storedMetadata.coverImage && !(Array.isArray(storedMetadata.screenshots) && storedMetadata.screenshots.length)) {
        return storedMetadata;
    }

    const screenshots = Array.isArray(storedMetadata.screenshots) ? storedMetadata.screenshots : [];
    const cachedMetadata = { ...storedMetadata };

    const [icon, coverImage, cachedScreenshots] = await Promise.all([
        cacheImageSafely(storedMetadata.icon, gameId, 'icon'),
        cacheImageSafely(storedMetadata.coverImage, gameId, 'cover'),
        Promise.all(screenshots.map((screenshot, index) => cacheImageSafely(screenshot, gameId, 'screenshot', index)))
    ]);

    cachedMetadata.icon = icon;
    cachedMetadata.coverImage = coverImage;
    cachedMetadata.screenshots = cachedScreenshots;

    return cachedMetadata;
}

function normalizeRssUrls(value) {
    if (!Array.isArray(value)) {
        if (typeof value !== 'string') return [];
        value = value.split(/\r?\n/);
    }

    return value
        .map((entry) => String(entry || '').trim())
        .filter(Boolean);
}

function getDefaultRssUrls() {
    try {
        const defaults = fs.readJsonSync(DEFAULTS_PATH);
        return normalizeRssUrls(defaults && defaults.rssUrls);
    } catch (error) {
        console.warn("Could not load default RSS URLs:", error && error.message ? error.message : error);
        return [];
    }
}

function normalizeAutoscanSources(value) {
    if (!Array.isArray(value)) {
        return [...AUTOSCAN_SOURCES];
    }

    return Array.from(new Set(
        value
            .map((entry) => String(entry || '').trim().toLowerCase())
            .filter((entry) => AUTOSCAN_SOURCES.includes(entry))
    ));
}

function normalizeLibraryViewSettings(value = {}) {
    const source = String(value.source || DEFAULT_LIBRARY_VIEW_SETTINGS.source).trim().toLowerCase();
    const sort = String(value.sort || DEFAULT_LIBRARY_VIEW_SETTINGS.sort).trim().toLowerCase();

    return {
        source: ["all", "local", ...AUTOSCAN_SOURCES].includes(source) ? source : DEFAULT_LIBRARY_VIEW_SETTINGS.source,
        sort: ["name", "created", "source"].includes(sort) ? sort : DEFAULT_LIBRARY_VIEW_SETTINGS.sort,
        groupedBySource: Boolean(value.groupedBySource),
    };
}

function normalizeFavoritesViewSettings(value = {}) {
    const sort = String(value.sort || DEFAULT_FAVORITES_VIEW_SETTINGS.sort).trim();

    return {
        sort: ["favoritedAt", "name", "lastPlayed"].includes(sort)
            ? sort
            : DEFAULT_FAVORITES_VIEW_SETTINGS.sort,
    };
}

function createDefaultAppDoc() {
    let defaultUiScale = 1;
    try {
        const disp = screen.getPrimaryDisplay();
        const size = (disp && (disp.size || disp.workAreaSize)) || {};
        const width = Number(size.width || 0);
        const height = Number(size.height || 0);
        // If the primary display is HD (1920x1080) or smaller, use a smaller UI scale by default
        if (width > 0 && height > 0 && (width <= 1920 || height <= 1080)) {
            defaultUiScale = 0.7;
        }
    } catch (err) {
        // ignore and fallback to 1
    }

    return {
        name: "PlayDock",
        termsAccepted: false,
        firstRun: true,
        showTips: true,
        settings: {
            runOnStartup: false,
            closeToTray: false,
            igdb: {
                clientId: "",
                clientSecret: "",
            },
            rssUrls: getDefaultRssUrls(),
            autoscan: [...AUTOSCAN_SOURCES],
            libraryView: { ...DEFAULT_LIBRARY_VIEW_SETTINGS },
            favoritesView: { ...DEFAULT_FAVORITES_VIEW_SETTINGS },
            windowBounds: { ...DEFAULT_WINDOW_BOUNDS },
            uiScale: defaultUiScale,
        },
    };
}

function ensureAppDocSettings(appDoc) {
    appDoc.showTips = appDoc.showTips !== false;
    appDoc.settings = appDoc.settings || {};
    appDoc.settings.runOnStartup = Boolean(appDoc.settings.runOnStartup);
    appDoc.settings.closeToTray = appDoc.settings.closeToTray !== false;
    appDoc.settings.igdb = appDoc.settings.igdb || {};
    appDoc.settings.igdb.clientId = String(appDoc.settings.igdb.clientId || '');
    appDoc.settings.igdb.clientSecret = String(appDoc.settings.igdb.clientSecret || '');
    appDoc.settings.rssUrls = normalizeRssUrls(appDoc.settings.rssUrls);
    appDoc.settings.autoscan = normalizeAutoscanSources(appDoc.settings.autoscan);
    appDoc.settings.libraryView = normalizeLibraryViewSettings(appDoc.settings.libraryView);
    appDoc.settings.favoritesView = normalizeFavoritesViewSettings(appDoc.settings.favoritesView);
    appDoc.settings.windowBounds = {
        ...DEFAULT_WINDOW_BOUNDS,
        ...(appDoc.settings.windowBounds || {}),
    };
    const uiScaleCandidate = Number(appDoc.settings.uiScale);
    appDoc.settings.uiScale = (Number.isFinite(uiScaleCandidate) && uiScaleCandidate > 0) ? uiScaleCandidate : 1;
    return appDoc;
}

function getIgdbCredentials() {
    const appDoc = getOrCreateAppDoc();
    return {
        clientId: appDoc.settings?.igdb?.clientId || '',
        clientSecret: appDoc.settings?.igdb?.clientSecret || '',
    };
}

function getRssUrls() {
    return getOrCreateAppDoc().settings?.rssUrls || [];
}

function getAppResponseDoc() {
    const appDoc = getOrCreateAppDoc();
    return {
        ...appDoc,
        displayName: packageInfo?.build?.productName || appDoc.name || app.getName(),
        version: app.getVersion(),
        license: packageInfo?.license || "",
        copyright: packageInfo?.build?.copyright || "",
    };
}

function sameRssUrls(left = [], right = []) {
    if (left.length !== right.length) {
        return false;
    }

    return left.every((value, index) => value === right[index]);
}

async function getIgdbStatus() {
    const credentials = getIgdbCredentials();

    return getIgdbStatusForCredentials(credentials);
}

async function getIgdbStatusForCredentials(credentials = {}) {
    const normalizedCredentials = {
        clientId: String(credentials.clientId || '').trim(),
        clientSecret: String(credentials.clientSecret || '').trim(),
    };

    if (!normalizedCredentials.clientId || !normalizedCredentials.clientSecret) {
        return {
            ok: false,
            reason: 'missing_credentials',
            message: 'Add your IGDB Client ID and Client Secret in Settings to pull metadata.',
        };
    }

    try {
        await igdb.validateCredentials(normalizedCredentials);
        return { ok: true, reason: 'connected', message: '' };
    } catch (error) {
        return {
            ok: false,
            reason: 'connection_failed',
            message: error?.body || error?.message || 'Could not connect to IGDB with the current credentials.',
        };
    }
}

function getOrCreateAppDoc() {
    let appDoc = db.instance.App.findOne({});
    if (!appDoc) {
        appDoc = db.instance.App.insert(createDefaultAppDoc());
    }

    ensureAppDocSettings(appDoc);
    db.instance.App.update(appDoc);
    return appDoc;
}

function sanitizeWindowBounds(bounds = {}) {
    const width = Math.max(800, Math.round(Number(bounds.width) || DEFAULT_WINDOW_BOUNDS.width));
    const height = Math.max(520, Math.round(Number(bounds.height) || DEFAULT_WINDOW_BOUNDS.height));
    const x = Number(bounds.x);
    const y = Number(bounds.y);
    const candidate = {
        width,
        height,
        ...(Number.isFinite(x) && Number.isFinite(y) ? { x: Math.round(x), y: Math.round(y) } : {}),
        isMaximized: Boolean(bounds.isMaximized),
    };

    if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)) {
        return candidate;
    }

    const windowRect = { x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height };
    const visible = screen.getAllDisplays().some((display) => {
        const area = display.workArea;
        return windowRect.x < area.x + area.width &&
            windowRect.x + windowRect.width > area.x &&
            windowRect.y < area.y + area.height &&
            windowRect.y + windowRect.height > area.y;
    });

    if (!visible) {
        delete candidate.x;
        delete candidate.y;
    }

    return candidate;
}

function saveWindowBounds() {
    if (!mainWindow || !db.instance || mainWindow.isDestroyed()) return;

    const appDoc = getOrCreateAppDoc();
    const bounds = mainWindow.isMaximized() ? mainWindow.getNormalBounds() : mainWindow.getBounds();
    appDoc.settings.windowBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized(),
    };
    db.instance.App.update(appDoc);
}

function scheduleSaveWindowBounds() {
    if (saveWindowBoundsTimer) {
        clearTimeout(saveWindowBoundsTimer);
    }

    saveWindowBoundsTimer = setTimeout(() => {
        saveWindowBoundsTimer = null;
        saveWindowBounds();
    }, 300);
}

function bindWindowBoundsTracking() {
    mainWindow.on('resize', scheduleSaveWindowBounds);
    mainWindow.on('move', scheduleSaveWindowBounds);
    mainWindow.on('maximize', saveWindowBounds);
    mainWindow.on('unmaximize', saveWindowBounds);
    mainWindow.on('close', (event) => {
        saveWindowBounds();
        const appDoc = getOrCreateAppDoc();
        if (!isQuitting && appDoc.settings.closeToTray) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function showMainWindow() {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
}

function createTray() {
    if (tray) return;

    tray = new Tray(APP_ICON_PATH);
    tray.setToolTip('PlayDock');
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show PlayDock', click: showMainWindow },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]));
    tray.on('click', showMainWindow);
}

function getStartupShortcutPath() {
    return path.join(
        app.getPath('appData'),
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs',
        'Startup',
        'PlayDock.lnk'
    );
}

function getStartupExecutablePath() {
    return process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
}

function isPathInsideAsar(filePath) {
    const normalized = String(filePath || '').toLowerCase();
    return normalized.includes(`${path.sep}app.asar${path.sep}`) || normalized.endsWith(`${path.sep}app.asar`);
}

function resolveShortcutIconPath(target) {
    const candidates = [
        path.join(process.resourcesPath || '', 'app.asar.unpacked', 'client', 'images', 'icon.ico'),
        path.join(process.resourcesPath || '', 'icon.ico'),
        APP_SHORTCUT_ICON_PATH,
        target,
    ];

    for (const candidate of candidates) {
        if (!candidate || isPathInsideAsar(candidate)) {
            continue;
        }

        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return target;
}

function getShortcutLaunchOptions(description) {
    const target = getStartupExecutablePath();
    return {
        target,
        args: app.isPackaged ? '' : `"${app.getAppPath()}"`,
        cwd: app.isPackaged ? path.dirname(target) : app.getAppPath(),
        icon: resolveShortcutIconPath(target),
        iconIndex: 0,
        description,
    };
}

function createAppShortcut(shortcutPath, description) {
    if (process.platform !== 'win32') {
        throw new Error('shortcut-unsupported-platform');
    }

    fs.ensureDirSync(path.dirname(shortcutPath));
    const operation = fs.existsSync(shortcutPath) ? 'replace' : 'create';
    const created = shell.writeShortcutLink(shortcutPath, operation, getShortcutLaunchOptions(description));
    if (!created) {
        throw new Error('shortcut-create-failed');
    }

    return { ok: true, path: shortcutPath };
}

function getDesktopShortcutPath() {
    return path.join(app.getPath('desktop'), 'PlayDock.lnk');
}

function getStartMenuShortcutPath() {
    return path.join(
        app.getPath('appData'),
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs',
        'PlayDock.lnk'
    );
}

function applyAppSettings(settings = {}) {

    if (process.platform !== 'win32' || !app.isPackaged) {
        return;
    }

    const startupShortcutPath = getStartupShortcutPath();

    if (settings.runOnStartup) {
        try {
            createAppShortcut(startupShortcutPath, 'Start PlayDock when Windows starts');
        } catch (error) {
            console.warn(`Could not create startup shortcut at ${startupShortcutPath}`);
        }
        return;
    }

    try {
        fs.removeSync(startupShortcutPath);
    } catch (error) {
        console.warn(`Could not remove startup shortcut at ${startupShortcutPath}: ${error && error.message ? error.message : error}`);
    }
}

app.whenReady().then(async val => {

    fs.ensureDirSync(APP_LOCAL_PATH, { recursive: true });

    await db.init();

    const appDoc = getOrCreateAppDoc();
    applyAppSettings(appDoc.settings);
    createTray();

    igdb.setCredentialsProvider(getIgdbCredentials);
    rss.setRssUrlsProvider(getRssUrls);

    refreshRssFeeds()
        .then(() => saveDatabase())
        .catch((error) => {
            console.warn("Background RSS refresh failed:", error && error.message ? error.message : error);
        });

    igdb.initIgdb();

    ipcMain.handle('get-app', async () => {
        return getAppResponseDoc();
    });

    ipcMain.handle('set-show-tips', async (event, showTips = true) => {
        const appDoc = getOrCreateAppDoc();
        appDoc.showTips = showTips !== false;
        db.instance.App.update(appDoc);
        await saveDatabase();
        return appDoc;
    });

    ipcMain.handle('get-terms', async () => {
        return fs.readFile(path.join(__dirname, 'client', 'terms-and-conditions.md'), 'utf8');
    });

    ipcMain.handle('accept-terms', async () => {
        const appDoc = getOrCreateAppDoc();
        appDoc.termsAccepted = true;
        db.instance.App.update(appDoc);
        await saveDatabase();
        return appDoc;
    });

    ipcMain.handle('update-app-settings', async (event, settings = {}) => {
        const appDoc = getOrCreateAppDoc();
        ensureAppDocSettings(appDoc);
        const previousRssUrls = normalizeRssUrls(appDoc.settings.rssUrls);
        const nextRssUrls = normalizeRssUrls(settings.rssUrls);
        const rssUrlsChanged = sameRssUrls(previousRssUrls, nextRssUrls) === false;
        appDoc.showTips = settings.showTips !== false;
        appDoc.settings.runOnStartup = Boolean(settings.runOnStartup);
        appDoc.settings.closeToTray = Boolean(settings.closeToTray);
        appDoc.settings.igdb.clientId = String(settings.igdb?.clientId || '').trim();
        appDoc.settings.igdb.clientSecret = String(settings.igdb?.clientSecret || '').trim();
        appDoc.settings.rssUrls = nextRssUrls;
        if (settings.uiScale !== undefined) {
            const z = Number(settings.uiScale);
            appDoc.settings.uiScale = (Number.isFinite(z) && z > 0) ? z : appDoc.settings.uiScale || 1;
        }
        appDoc.settings.autoscan = settings.autoscan === undefined
            ? normalizeAutoscanSources(appDoc.settings.autoscan)
            : normalizeAutoscanSources(settings.autoscan);
        appDoc.settings.libraryView = settings.libraryView === undefined
            ? normalizeLibraryViewSettings(appDoc.settings.libraryView)
            : normalizeLibraryViewSettings(settings.libraryView);
        appDoc.settings.favoritesView = settings.favoritesView === undefined
            ? normalizeFavoritesViewSettings(appDoc.settings.favoritesView)
            : normalizeFavoritesViewSettings(settings.favoritesView);
        db.instance.App.update(appDoc);
        igdb.setCredentialsProvider(getIgdbCredentials);
        applyAppSettings(appDoc.settings);

        if (rssUrlsChanged && db.instance.Feed) {
            console.log("feed update");
            
            db.instance.Feed.clear();
            await refreshRssFeeds();
        }

        await saveDatabase();
        return appDoc;
    });

    ipcMain.handle('get-igdb-status', async () => {
        return getIgdbStatus();
    });

    ipcMain.handle('test-igdb-connection', async (event, credentials = {}) => {
        return getIgdbStatusForCredentials(credentials);
    });

    ipcMain.handle('create-desktop-shortcut', async () => {
        return createAppShortcut(getDesktopShortcutPath(), 'Open PlayDock');
    });

    ipcMain.handle('create-start-menu-shortcut', async () => {
        return createAppShortcut(getStartMenuShortcutPath(), 'Open PlayDock from Start');
    });

    ipcMain.handle('get-rss-feed', async (event, options = {}) => {
        const page = Math.max(0, Number.parseInt(options.page, 10) || 0);
        const limit = Math.min(100, Math.max(1, Number.parseInt(options.limit, 10) || 30));

        return db.instance.Feed.find()
            .simplesort("pubDate", true)
            .offset(page * limit)
            .limit(limit)
            .docs();
    });

    ipcMain.handle('refresh-rss-feed', async () => {
        await refreshRssFeeds();
        return { ok: true };
    });

    ipcMain.handle('open-external-url', async (event, url) => {
        return openExternalUrl(url);
    });

    ipcMain.handle('window-close', async () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });

    ipcMain.handle('window-minimize', async () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.handle('window-toggle-maximize', async () => {
        if (!mainWindow) return;
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.handle('get-games', async (event) => {
        const appDoc = getOrCreateAppDoc();
        const enabledSources = new Set(normalizeAutoscanSources(appDoc.settings?.autoscan));
        const scanners = [
            { source: 'steam', scan: () => steam.getInstalledGames() },
            { source: 'epic', scan: () => epic.getInstalledGames() },
            { source: 'ubisoft', scan: () => ubisoft.getInstalledGames() },
            { source: 'gog', scan: () => gog.getInstalledGames() },
            { source: 'xbox', scan: () => xbox.getInstalledGames() },
            { source: 'ea', scan: () => ea.getInstalledGames() },
        ];
        const scannedGames = [];
        const scannedSources = new Set();
        for (const scanner of scanners) {
            if (!enabledSources.has(scanner.source)) {
                continue;
            }

            try {
                const games = await scanner.scan();
                if (Array.isArray(games) && games.length) {
                    scannedGames.push(...games);
                }
                scannedSources.add(scanner.source);
            } catch (error) {
                console.warn(`Scanner failed for ${scanner.source}:`, error && error.message ? error.message : error);
            }
        }

        const storedGames = db.instance.Game.find().docs();
        for (let game of scannedGames) {
            const scannedKeys = getScannedGameKeys(game);
            const existingGame = storedGames.find((storedGame) => {
                const storedKeys = getStoredGameKeys(storedGame);
                return scannedKeys.some((key) => storedKeys.includes(key));
            });

            if (existingGame) {
                db.instance.Game.update(updateStoredLaunchFromScan(existingGame, game));
            } else {
                const insertedGame = db.instance.Game.insert({
                    name: game.name,
                    launch: {
                        appId: game.appId,
                        source: game.source,
                        installDir: game.installdir,
                        cmd: game.launchCmd || "",
                        exe: game.launchExe || "",
                        args: game.launchArgs || ""
                    },
                });
                storedGames.push(insertedGame);
            }
        }

        const scannedGameKeys = new Set(scannedGames.flatMap(getScannedGameKeys));

        // Delete missing launcher games only for sources that were actually scanned.
        db.instance.Game.removeWhere(function (obj) {
            const source = normalizeSource(obj.launch && obj.launch.source);
            if (isLocalSource(source)) return false;
            if (!scannedSources.has(source)) return false;
            return !getStoredGameKeys(obj).some((key) => scannedGameKeys.has(key));
        });

        return db.instance.Game.find({
            '$or': [
                { 'launch.source': { '$in': ['local', ...enabledSources] } },
                { 'launch.source': { '$exists': false } },
            ],
        }).docs();
    });

    ipcMain.handle('get-metadata', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }

        const cachedMetadata = game.metadata;
        if (cachedMetadata && cachedMetadata.igdbId && hasLocalMetadataImages(cachedMetadata, game.id)) {
            return game.metadata;
        }

        const metadata = cachedMetadata && cachedMetadata.igdbId
            ? cachedMetadata
            : await igdb.fetchGameMetadata(fn.sanitizeGameName(game.name)).catch(err => {
                return null;
            }); 
        game.metadata = metadata ? await cacheMetadataImages(metadata, game.id) : {};

        db.instance.Game.update(game);

        return game.metadata;
    });

    ipcMain.handle('browse-game-file', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: "Add a game",
            buttonLabel: "Use this file",
            properties: ["openFile"],
            filters: [
                { name: "Games and Shortcuts", extensions: ["exe", "lnk", "url", "com", "bat", "cmd"] },
                { name: "Executables", extensions: ["exe", "com", "bat", "cmd"] },
                { name: "Shortcuts", extensions: ["lnk", "url"] },
                { name: "All Files", extensions: ["*"] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return inspectGamePath(result.filePaths[0]);
    });

    ipcMain.handle('select-scan-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: "Scan a folder",
            buttonLabel: "Select folder",
            properties: ["openDirectory"]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle('start-folder-scan', async (event, folderPath) => {
        if (!folderPath) {
            throw new Error('missing-folder-path');
        }

        const scanId = crypto.randomBytes(8).toString('hex');
        const scanJob = { canceled: false };
        folderScanJobs.set(scanId, scanJob);
        scanExecutables(folderPath, {
            scanJob,
            onItem: (item) => event.sender.send('folder-scan-item', { scanId, item }),
        }).then((result) => {
            event.sender.send('folder-scan-done', { scanId, ...result });
        }).catch((error) => {
            event.sender.send('folder-scan-done', { scanId, canceled: false, error: error.message || 'scan-failed' });
        }).finally(() => {
            folderScanJobs.delete(scanId);
        });

        return { scanId };
    });

    ipcMain.handle('stop-folder-scan', async (event, scanId) => {
        const scanJob = folderScanJobs.get(scanId);
        if (scanJob) {
            scanJob.canceled = true;
        }
        return { stopped: Boolean(scanJob) };
    });

    ipcMain.handle('inspect-game-path', async (event, filePath) => {
        return inspectGamePath(filePath);
    });

    ipcMain.handle('search-metadata', async (event, gameName) => {
        const query = fn.sanitizeGameName(gameName);
        if (!query) {
            throw new Error("missing-game-name");
        }

        return igdb.searchGameMetadataSuggestions(query).catch(() => []);
    });

    ipcMain.handle('add-local-game', async (event, input) => {
        const name = String(input.name || "").trim();
        const launch = input.launch || {};

        if (!name) {
            throw new Error("missing-name");
        }

        if (!launch.cmd && !launch.exe) {
            throw new Error("missing-launch-path");
        }

        const gameInput = {
            name,
            favorite: Boolean(input.favorite),
            launch: {
                appId: launch.appId || "",
                source: "local",
                installDir: launch.installDir || "",
                cmd: launch.cmd || "",
                exe: launch.exe || "",
                args: launch.args || ""
            },
        };
        if (gameInput.favorite) {
            gameInput.favoritedAt = Date.now();
        }

        const game = db.instance.Game.insert(gameInput);
        game.metadata = await cacheMetadataImages(input.metadata, game.id);
        db.instance.Game.update(game);
        await saveDatabase();

        return game;
    });

    ipcMain.handle('update-game', async (event, input) => {
        const game = db.instance.Game.findOne({ id: input.id });
        if (!game) {
            throw new Error('missing-game');
        }

        const name = String(input.name || '').trim();
        const localSource = isLocalSource(game.launch && game.launch.source ? game.launch.source : 'local');
        if (localSource && !name) {
            throw new Error('missing-name');
        }

        if (localSource) {
            game.name = name;
        }
        const wasFavorite = Boolean(game.favorite);
        game.favorite = Boolean(input.favorite);
        if (game.favorite && !wasFavorite) {
            game.favoritedAt = Date.now();
        } else if (!game.favorite) {
            delete game.favoritedAt;
        }
        game.metadata = await cacheMetadataImages(input.metadata, game.id);

        if (localSource) {
            const launch = input.launch || {};
            if (!launch.cmd && !launch.exe) {
                throw new Error('missing-launch-path');
            }

            game.launch = {
                appId: launch.appId || '',
                source: launch.source || game.launch.source || 'local',
                installDir: launch.installDir || '',
                cmd: launch.cmd || '',
                exe: launch.exe || '',
                args: launch.args || ''
            };
        }

        db.instance.Game.update(game);
        await saveDatabase();
        return game;
    });

    ipcMain.handle('delete-game', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }
        if (!isLocalSource(game.launch && game.launch.source ? game.launch.source : 'local')) {
            throw new Error('delete-not-supported');
        }

        db.instance.Game.remove(game);
        await saveDatabase();
        return { id: gameId };
    });

    ipcMain.handle('hide-game', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }

        game.hidden = true;
        db.instance.Game.update(game);
        await saveDatabase();
        return { id: gameId };
    });

    ipcMain.handle('get-hidden-games', async () => {
        return db.instance.Game.find().docs().filter((game) => game.hidden);
    });

    ipcMain.handle('unhide-game', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }

        game.hidden = false;
        db.instance.Game.update(game);
        await saveDatabase();
        return game;
    });

    ipcMain.handle('launch-game', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }

        if (launchingGameIds.has(game.id)) {
            return {
                game,
                launch: {
                    status: 'already-starting',
                    verified: false,
                    reason: 'launch-in-progress'
                }
            };
        }

        const launch = game.launch || {};
        if (!launch.cmd && !launch.exe) {
            throw new Error('missing-launch-path');
        }

        launchingGameIds.add(game.id);

        try {
            await fn.launchGame(toStoredGame(game), { waitForExit: false });
            markGameLaunched(game);
            await saveDatabase();

            return {
                game,
                launch: {
                    status: 'launched',
                    verified: false,
                    reason: 'launch-command-completed'
                }
            };
        } catch (error) {
            console.error('Failed to launch game:', error);
            return {
                game,
                launch: {
                    status: 'failed',
                    verified: false,
                    reason: 'launch-command-failed'
                }
            };
        } finally {
            launchingGameIds.delete(game.id);
        }

    });

    ipcMain.handle('toggle-favorite', async (event, gameId) => {
        const game = db.instance.Game.findOne({ id: gameId });
        if (!game) {
            throw new Error('missing-game');
        }

        game.favorite = !Boolean(game.favorite);
        if (game.favorite) {
            game.favoritedAt = Date.now();
        } else {
            delete game.favoritedAt;
        }
        db.instance.Game.update(game);
        await saveDatabase();

        return game;
    });

    createWindow(appDoc.settings.windowBounds);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            const currentAppDoc = getOrCreateAppDoc();
            createWindow(currentAppDoc.settings.windowBounds);
        }
    });
});

app.on('window-all-closed', async () => {
    await cleanup().catch(console.error);
    // await saveDatabase().catch(console.error);
    app.quit();
});


app.on('before-quit', async () => {
    isQuitting = true;
    await cleanup().catch(console.error);
});

async function saveDatabase() {
    return new Promise(async (resolve, reject) => {
        db.instance.saveDatabase(function (err) {
            if (err) {
                reject(err);
            }
            else {
                console.log("database saved.");
                resolve();
            }
        });
    });
}

async function cleanup() {
    return new Promise(async (resolve, reject) => {
        try {
            // clean up code here, e.g. stop background processes
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

async function inspectGamePath(filePath) {
    if (!filePath) {
        throw new Error("missing-file-path");
    }

    const fullPath = path.resolve(filePath);
    const ext = path.extname(fullPath).toLowerCase();
    let game;

    if (ext === ".lnk") {
        game = await fn.getGameFromShortcut(fullPath);
    }
    else if (ext === ".url") {
        game = await fn.getGameFromUrl(fullPath);
    }
    else if ([".exe", ".com", ".bat", ".cmd"].includes(ext)) {
        game = await fn.getGameNameFromExe(fullPath);
    }
    else {
        throw new Error("unsupported-file-type");
    }

    return {
        name: game.name || path.basename(fullPath, ext),
        favorite: false,
        sourcePath: fullPath,
        launch: {
            appId: game.appId || "",
            source: "local",
            installDir: game.installdir || "",
            cmd: game.launchCmd || fullPath,
            exe: game.launchExe || "",
            args: game.launchArgs || ""
        }
    };
}

async function scanExecutables(folderPath, { scanJob, onItem } = {}) {
    const rootPath = path.resolve(folderPath);
    const executableExtensions = new Set([".exe", ".com", ".bat", ".cmd"]);
    const ignoredDirectories = new Set(["node_modules", ".git", "__pycache__"]);
    const maxResults = 500;
    let found = 0;

    async function walk(currentPath) {
        if (scanJob && scanJob.canceled) return;
        if (found >= maxResults) return;

        let entries;
        try {
            entries = await fs.readdir(currentPath, { withFileTypes: true });
        } catch (err) {
            return;
        }

        for (const entry of entries) {
            if (scanJob && scanJob.canceled) return;
            if (found >= maxResults) return;

            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                if (!ignoredDirectories.has(entry.name.toLowerCase())) {
                    await walk(fullPath);
                }
                continue;
            }

            if (!entry.isFile()) continue;

            const ext = path.extname(entry.name).toLowerCase();
            if (!executableExtensions.has(ext)) continue;

            const item = {
                name: path.basename(entry.name, ext),
                path: fullPath,
                installDir: path.dirname(fullPath),
                exe: ext === ".exe" ? path.basename(fullPath) : "",
                icon: ""
            };

            try {
                const icon = await app.getFileIcon(item.path, { size: "normal" });
                item.icon = icon.toDataURL();
            } catch (err) {
                item.icon = "";
            }

            found += 1;
            if (typeof onItem === "function") {
                onItem(item);
            }
        }
    }

    await walk(rootPath);
    return {
        canceled: Boolean(scanJob && scanJob.canceled),
        count: found,
    };
}
