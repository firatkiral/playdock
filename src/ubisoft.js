const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// ----------------------------------------------------
// 1. Get all Ubisoft registry installation keys
// ----------------------------------------------------
function getUbisoftRegistryKeys() {
    return new Promise((resolve) => {
        const regPath = `HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs`;

        exec(`reg query "${regPath}"`, (err, stdout) => {
            if (err || !stdout) return resolve([]);

            const keys = stdout
                .split("\r\n")
                .map(line => line.trim())
                .filter(line => line.startsWith("HKEY"));

            resolve(keys);
        });
    });
}

// ----------------------------------------------------
// 2. Extract game info from registry + manifest
// ----------------------------------------------------
async function readUbisoftGameKey(keyPath) {
    return new Promise((resolve) => {

        // Read InstallDir value
        exec(`reg query "${keyPath}" /v InstallDir`, (err, stdout) => {
            if (err || !stdout) return resolve(null);

            const match = stdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
            if (!match) return resolve(null);

            const appId = path.basename(keyPath);
            const installdir = match[1].trim();
            const name = path.basename(installdir);
            const launchCmd = `uplay://launch/${appId}/0`

            resolve({
                source: "ubisoft",
                appId,
                name,
                installdir,
                launchCmd,
                launchExe: "",
                launchArgs: ""
            });
        });
    });
}

// ----------------------------------------------------
// 3. Main function: return all Ubisoft installed games
// ----------------------------------------------------
async function getInstalledGames() {
    const keys = await getUbisoftRegistryKeys();
    const games = [];

    for (const key of keys) {
        const game = await readUbisoftGameKey(key);
        if (game) games.push(game);
    }

    return games;
}

module.exports = {
    getInstalledGames
};
