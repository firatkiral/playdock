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
    const content = fs.readFileSync(libraryVDF, "utf-8");
    const parsed = vdf.parse(content);

    const libraries = [];

    for (const key in parsed.libraryfolders) {
        if (!isNaN(key)) {
            libraries.push(parsed.libraryfolders[key].path);
        }
    }

    return libraries;
}

async function getInstalledGames() {
    const steamPath = await getSteamInstallPath();
    if (!steamPath) return [];

    const libraries = getLibraryPaths(steamPath);

    const games = [];

    libraries.forEach(lib => {
        const steamapps = path.join(lib, "steamapps");
        if (!fs.existsSync(steamapps)) return;

        const files = fs.readdirSync(steamapps)
            .filter(f => f.startsWith("appmanifest") && f.endsWith(".acf"));

        files.forEach(file => {
            const content = fs.readFileSync(path.join(steamapps, file), "utf-8");
            const data = vdf.parse(content).AppState;

            // skip steam apps
            const nonGameIndicators = ["Steamworks", "SteamVR"];
            if (nonGameIndicators.some(indicator => data.name.includes(indicator))) {
                return;
            }
            
            games.push({
                source: "steam",
                appid: data.appid,
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
