const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const REGISTRY_ROOTS = [
    "HKLM\\SOFTWARE\\EA Games",
    "HKLM\\SOFTWARE\\WOW6432Node\\EA Games",
    "HKLM\\SOFTWARE\\EA Sports",
    "HKLM\\SOFTWARE\\WOW6432Node\\EA Sports",
    "HKLM\\SOFTWARE\\Full Circle",
    "HKLM\\SOFTWARE\\WOW6432Node\\Full Circle"
];

const SKIP_EXE_PATTERNS = [
    "activationui",
    "cleanup",
    "config",
    "crash",
    "installer",
    "launcher",
    "redist",
    "setup",
    "showcase",
    "touchup",
    "trial",
    "unins",
    "vc_redist",
    "vcredist"
];

function queryRegistry(regPath) {
    return new Promise((resolve) => {
        exec(`reg query "${regPath}"`, (err, stdout) => {
            if (err || !stdout) return resolve("");
            resolve(stdout);
        });
    });
}

function parseRegistryKeys(stdout) {
    return stdout
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith("HKEY"));
}

function parseRegistryValues(stdout) {
    const values = {};

    stdout.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s{4}(.+?)\s+REG_\w+\s+(.+)$/);
        if (!match) return;

        values[match[1].trim().toLowerCase()] = match[2].trim();
    });

    return values;
}

function normalizeName(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

function isAbsoluteInstallDir(value) {
    return /^[a-z]:[\\/]/i.test(String(value || ""));
}

function normalizeInstallDir(value) {
    return String(value || "").trim().replace(/[\\\/]+$/, "");
}

function isSteamInstallDir(value) {
    return /[\\\/]steamapps[\\\/]common[\\\/]?/i.test(String(value || ""));
}

function getExeCandidates(folderPath, depth = 0, maxDepth = 3) {
    let entries = [];

    try {
        entries = fs.readdirSync(folderPath, { withFileTypes: true });
    } catch (error) {
        return [];
    }

    const candidates = [];

    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isFile() && entry.name.toLowerCase().endsWith(".exe")) {
            candidates.push({ fullPath, depth });
        } else if (entry.isDirectory() && depth < maxDepth) {
            candidates.push(...getExeCandidates(fullPath, depth + 1, maxDepth));
        }
    }

    return candidates;
}

function scoreExeCandidate(candidate, gameName, installDir) {
    const basename = path.basename(candidate.fullPath).toLowerCase();
    const normalizedExe = normalizeName(path.basename(candidate.fullPath, ".exe"));
    const normalizedGame = normalizeName(gameName);
    const normalizedFolder = normalizeName(path.basename(installDir));
    let score = 100 - candidate.depth * 10;

    if (path.dirname(candidate.fullPath) === installDir) {
        score += 30;
    }

    if (normalizedExe && normalizedGame && normalizedGame.includes(normalizedExe)) {
        score += 80;
    }

    if (normalizedExe && normalizedFolder && normalizedFolder.includes(normalizedExe)) {
        score += 50;
    }

    if (SKIP_EXE_PATTERNS.some(pattern => basename.includes(pattern))) {
        score -= 100;
    }

    return score;
}

function findLaunchExe(installDir, gameName) {
    const candidates = getExeCandidates(installDir);
    if (!candidates.length) return "";

    candidates.sort((a, b) => {
        const scoreDiff = scoreExeCandidate(b, gameName, installDir) - scoreExeCandidate(a, gameName, installDir);
        if (scoreDiff !== 0) return scoreDiff;
        return a.fullPath.localeCompare(b.fullPath);
    });

    return candidates[0].fullPath;
}

async function readGameKey(keyPath) {
    const stdout = await queryRegistry(keyPath);
    if (!stdout) return null;

    const values = parseRegistryValues(stdout);
    const name = values.displayname || path.basename(keyPath);
    const installDir = normalizeInstallDir(values["install dir"] || values.installdir || values.path);
    const appId = values["product guid"] || path.basename(keyPath);

    if (!name || !isAbsoluteInstallDir(installDir) || isSteamInstallDir(installDir) || !fs.existsSync(installDir)) {
        return null;
    }

    const launchCmd = findLaunchExe(installDir, name);

    if (!launchCmd) {
        return null;
    }

    return {
        source: "ea",
        appId,
        name,
        installdir: installDir,
        launchCmd,
        launchExe: path.basename(launchCmd),
        launchArgs: ""
    };
}

async function getRegistryGameKeys() {
    const keys = [];

    for (const root of REGISTRY_ROOTS) {
        const stdout = await queryRegistry(root);
        keys.push(...parseRegistryKeys(stdout).filter(key => key !== root));
    }

    return keys;
}

async function getInstalledGames() {
    const keys = await getRegistryGameKeys();
    const games = [];
    const seen = new Set();

    for (const key of keys) {
        const game = await readGameKey(key);
        if (!game) continue;

        const dedupeKey = `${normalizeName(game.name)}:${normalizeInstallDir(game.installdir).toLowerCase()}`;
        if (seen.has(dedupeKey)) continue;

        seen.add(dedupeKey);
        games.push(game);
    }

    return games.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
    getInstalledGames
};
