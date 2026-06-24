const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// -------------------------------
// GET ALL GOG GAME KEYS
// -------------------------------
function getGOGRegistryKeys() {
    return new Promise((resolve) => {
        const regPath = `HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games`;

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

// -------------------------------
// READ GOG GAME INFO FROM REGISTRY
// -------------------------------
function readGOGGameKey(keyPath) {
    return new Promise((resolve) => {

        exec(`reg query "${keyPath}"`, (err, stdout) => {
            if (err || !stdout) return resolve(null);

            const appId = keyPath.split("\\").pop();

            const installDirMatch = stdout.match(/path\s+REG_SZ\s+(.+)/i);
            const exeMatch         = stdout.match(/exeFile\s+REG_SZ\s+(.+)/i);
            const nameMatch        = stdout.match(/gameName\s+REG_SZ\s+(.+)/i);

            const installDir = installDirMatch ? installDirMatch[1].trim() : null;
            const launchExe = exeMatch ? exeMatch[1].trim() : "";
            const name   = nameMatch ? nameMatch[1].trim() : `GOG Game ${appId}`;

            if (!installDir) return resolve(null);

            resolve({
                source: "gog",
                appId,
                name,
                installdir: installDir,
                launchExe,
                launchCmd: launchExe ? `${path.join(installDir, launchExe)}` : "",
                launchArgs: ""
            });
        });
    });
}

// -------------------------------
// MAIN — GET INSTALLED GOG GAMES
// -------------------------------
async function getInstalledGames() {
    const keys = await getGOGRegistryKeys();
    const games = [];

    for (const key of keys) {
        const game = await readGOGGameKey(key);
        if (game) games.push(game);
    }

    return games;
}

module.exports = {
    getInstalledGames
};
