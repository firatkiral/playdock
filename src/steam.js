const fs = require("fs");
const path = require("path");
const vdf = require("vdf");
const { exec } = require("child_process");

function getSteamInstallPath() {
    return new Promise((resolve, reject) => {
        const regPath = 'HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam';

        exec(`reg query "${regPath}" /v InstallPath`, (err, stdout) => {
            if (err || !stdout) return resolve(null);

            const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/);
            if (match) {
                resolve(match[1].trim());
            } else {
                resolve(null);
            }
        });
    });
}

function getLibraryPaths(steamPath) {
    const libraryVDF = path.join(steamPath, "steamapps", "libraryfolders.vdf");
    try {
        const content = fs.readFileSync(libraryVDF, "utf-8");
        const parsed = vdf.parse(content);
        const libraryFolders = parsed && parsed.libraryfolders ? parsed.libraryfolders : {};

        const libraries = [];

        for (const key in libraryFolders) {
            if (!isNaN(key) && libraryFolders[key] && libraryFolders[key].path) {
                libraries.push(libraryFolders[key].path);
            }
        }

        return libraries;
    } catch (error) {
        return [];
    }
}

async function getInstalledGames() {
    const steamPath = await getSteamInstallPath();
    if (!steamPath) return [];

    const libraries = getLibraryPaths(steamPath);

    const games = [];

    libraries.forEach(lib => {
        const steamapps = path.join(lib, "steamapps");
        if (!fs.existsSync(steamapps)) return;

        let files = [];
        try {
            files = fs.readdirSync(steamapps)
                .filter(f => f.startsWith("appmanifest") && f.endsWith(".acf"));
        } catch (error) {
            return;
        }

        files.forEach(file => {
            let data;
            try {
                const content = fs.readFileSync(path.join(steamapps, file), "utf-8");
                const parsed = vdf.parse(content);
                data = parsed && parsed.AppState ? parsed.AppState : null;
            } catch (error) {
                return;
            }

            if (!data || !data.name || !data.appid || !data.installdir) {
                return;
            }

            // skip steam apps
            const nonGameIndicators = ["Steamworks", "SteamVR"];
            if (nonGameIndicators.some(indicator => data.name.includes(indicator))) {
                return;
            }
            
            games.push({
                source: "steam",
                appId: data.appid,
                name: data.name,
                installdir: path.join(steamapps, "common", data.installdir),
                launchCmd: `steam://rungameid/${data.appid}`,
                launchExe: "",
                launchArgs: ""
            });
        });
    });

    return games;
}

module.exports = {
    getInstalledGames,
};
