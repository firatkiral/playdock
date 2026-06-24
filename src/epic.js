const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// ----------------------------------------------------
// 1. Get Epic Games Launcher install path from registry
// ----------------------------------------------------
function getEpicInstallPath() {
    return new Promise((resolve) => {
        const regPath = 'HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher';

        exec(`reg query "${regPath}" /v AppDataPath`, (err, stdout) => {
            if (err || !stdout) return resolve(null);

            const match = stdout.match(/AppDataPath\s+REG_SZ\s+(.+)/);
            resolve(match ? match[1].trim() : null);
        });
    });
}

// ----------------------------------------------------
// 2. Read installed Epic games, filter using "AppCategories": ["games"]
// ----------------------------------------------------
async function getInstalledGames() {
    const epicPath = await getEpicInstallPath();

    // fallback if registry fails
    const manifestsDir = epicPath
        ? path.join(epicPath, "Manifests")
        : "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests";

    if (!fs.existsSync(manifestsDir)) return [];

    let files = [];
    try {
        files = fs.readdirSync(manifestsDir).filter(f => f.endsWith(".item"));
    } catch (error) {
        return [];
    }

    const games = [];

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(manifestsDir, file), "utf-8"));

            // filter ONLY real games
            if (!Array.isArray(data.AppCategories)) continue;
            if (!data.AppCategories.includes("games")) continue;

            games.push({
                source: "epic",
                appId: data.CatalogItemId,
                name: data.DisplayName,
                installdir: data.InstallLocation,
                launchCmd: `com.epicgames.launcher://apps/${data.AppName}?action=launch&silent=true`,
                launchExe: data.LaunchExecutable,
                launchArgs: data.LaunchCommand || ""
            });

        } catch (e) {
            continue;
        }
    }

    return games;
}

module.exports = {
    getInstalledGames
};
