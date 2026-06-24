const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const https = require('https');

function isProcessRunning(processName) {
    return new Promise((resolve) => {
        exec(`tasklist /FI "IMAGENAME eq ${processName}"`, (err, stdout) => {
            if (err) return resolve(false);
            resolve(stdout.includes(processName));
        });
    });
}

function waitForProcessExit(processName, interval = 2000) {
    return new Promise(async (resolve) => {
        // Wait until the process appears
        while (!(await isProcessRunning(processName))) {
            await new Promise(r => setTimeout(r, interval));
        }

        // Then wait until it exits
        while (await isProcessRunning(processName)) {
            await new Promise(r => setTimeout(r, interval));
        }

        resolve();
    });
}

function waitForProcessStart(processName, timeout = 15000, interval = 1000) {
    return new Promise(async (resolve) => {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeout) {
            if (await isProcessRunning(processName)) {
                resolve(true);
                return;
            }

            await new Promise(r => setTimeout(r, interval));
        }

        resolve(false);
    });
}

function executeLaunchCommand(game) {
    return new Promise((resolve, reject) => {
        const command = `start "" /D "${game.installDir}" "${game.launchCmd}" ${game.launchArgs}`;
        const child = exec(command, { windowsHide: true });

        child.once("error", (error) => {
            console.error("Failed to launch game:", error);
            reject(error);
        });
        child.once("spawn", () => {
            resolve();
        });
    });
}

async function launchGame(game, options = {}) {
    const waitForExit = options.waitForExit !== false;

    await executeLaunchCommand(game);

    console.log(`Launching game ${game.name}...`);

    if (waitForExit && game.launchExe) {
        // Wait for game to exit
        console.log(`Waiting for ${game.name} to exit...`);
        await waitForProcessExit(game.launchExe);
        console.log(`Game exited.`);
    }
}

function psBase64(str) {
    return Buffer.from(str, "utf16le").toString("base64");
}

function getGameNameFromExe(exePath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(exePath);

        // PowerShell script to extract FileDescription
        const script = `
            $p = "${fullPath}";
            $v = (Get-Item $p).VersionInfo.FileDescription;
            if ([string]::IsNullOrWhiteSpace($v)) {
                Split-Path $p -Parent | Split-Path -Leaf
            } else {
                $v
            }
        `;

        const encoded = psBase64(script);

        const cmd = `powershell -NoProfile -EncodedCommand ${encoded}`;

        exec(cmd, { windowsHide: true }, (err, stdout) => {
            if (err) return reject(err);

            const name = stdout.toString().trim();
            const installdir = path.dirname(fullPath);
            const launchCmd = fullPath;
            const launchExe = path.basename(fullPath);
            resolve({
                source: "local",
                appId: "",
                name,
                installdir,
                launchCmd,
                launchExe,
                launchArgs: ""
            });
        });
    });
}

function getGameFromShortcut(shortcutPath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(shortcutPath);

        const script = `
            $p = "${fullPath}";
            $s = New-Object -ComObject WScript.Shell;
            $lnk = $s.CreateShortcut($p);
            $obj = @{
                TargetPath = $lnk.TargetPath;
                WorkingDirectory = $lnk.WorkingDirectory;
                Arguments = $lnk.Arguments;
                Description = $lnk.Description;
                IconLocation = $lnk.IconLocation;
            };
            $obj | ConvertTo-Json -Compress
        `;

        const encoded = psBase64(script);

        const cmd = `powershell -NoProfile -EncodedCommand ${encoded}`;

        exec(cmd, { windowsHide: true }, (err, stdout) => {
            if (err) return reject(err);

            let info;
            try {
                info = JSON.parse(stdout);
            } catch (e) {
                const trimmed = stdout.toString().trim();
                try {
                    info = JSON.parse(trimmed);
                } catch (ee) {
                    return reject(new Error('Failed to parse shortcut info'));
                }
            }

            // Collect common shortcut properties
            const target = (info.TargetPath || '').toString();
            const startIn = (info.WorkingDirectory || '').toString();
            const args = (info.Arguments || '').toString();
            const desc = (info.Description || '').toString();

            if (!target) return reject(new Error('Could not resolve shortcut target'));

            const ext = path.extname(target).toLowerCase();

            // Helper to build default game object
            const makeDefault = (nameVal) => ({
                source: "local",
                appId: '',
                name: nameVal || desc || path.basename(target),
                installdir: startIn || path.dirname(target),
                launchCmd: target,
                launchExe: ext === '.exe' ? path.basename(target) : '',
                launchArgs: args
            });

            // If the target is an executable, reuse existing extractor for friendly name
            if (ext === '.exe' || ext === '.com' || ext === '.bat' || ext === '.cmd') {
                getGameNameFromExe(target).then(game => {
                    // Prefer the FileDescription name, but fall back to shortcut description
                    game.source = "local";
                    game.appId = '';
                    game.name = game.name || desc || path.basename(target);
                    game.installdir = startIn || game.installdir || path.dirname(target);
                    game.launchCmd = target;
                    game.launchExe = path.basename(target);
                    game.launchArgs = args;
                    resolve(game);
                }).catch(() => resolve(makeDefault(desc || path.basename(target))));

                return;
            }

            // Fallback for other file types
            resolve(makeDefault(desc || path.basename(target)));
        });
    });
}

function getGameFromUrl(urlFilePath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(urlFilePath);

        fs.readFile(fullPath, 'utf8', (err, data) => {
            if (err) return reject(err);

            // Parse simple INI-like .url contents
            // Example:
            // [InternetShortcut]
            // URL=steam://rungameid/12345
            // IconFile=C:\Path\to\icon.ico
            const lines = data.split(/\r?\n/);
            let url = '';
            for (const line of lines) {
                const mUrl = line.match(/^URL=(.*)$/i);
                if (mUrl) url = mUrl[1].trim();
            }

            if (!url) return reject(new Error('Could not find URL in .url file'));

            // Normalize file:// URIs to local paths
            let target = url;
            const fileUriMatch = url.match(/^file:\/\/\/?(.+)$/i);
            if (fileUriMatch) {
                // decode and convert slashes
                target = decodeURIComponent(fileUriMatch[1].replace(/\//g, path.sep));
                // On Windows, file:///C:/path becomes C:/path
            }

            const ext = path.extname(target || '').toLowerCase();
            const desc = path.basename(fullPath, path.extname(fullPath));

            const makeDefault = () => ({
                source: "local",
                appId: '',
                name: desc,
                installdir: "",
                launchCmd: target,
                launchExe: ext === '.exe' ? path.basename(target) : '',
                launchArgs: ""
            });

            // If the target is an executable path, use existing extractor
            if (ext === '.exe' || ext === '.com' || ext === '.bat' || ext === '.cmd') {
                // if target looks like a URI but points to an exe, ensure it's converted
                let exePath = target;
                // strip possible leading slashes from file:// conversion
                if (exePath.startsWith(path.sep) && /^[A-Za-z]:/.test(exePath.slice(1))) exePath = exePath.slice(1);

                getGameNameFromExe(exePath).then(game => {
                    game.source = "local";
                    game.appId = '';
                    game.name = game.name || desc;
                    game.installdir = game.installdir || path.dirname(exePath);
                    game.launchCmd = exePath;
                    game.launchExe = path.basename(exePath);
                    game.launchArgs = "";
                    resolve(game);
                }).catch(() => resolve(makeDefault()));

                return;
            }

            // Fallback
            resolve(makeDefault());
        });
    });
}

function sanitizeGameName(user_input) {
    if (!user_input) return null;
    try {
        let safe_input = null;
        try {
            safe_input = decodeURIComponent(String(user_input));
        } catch (e) {
            safe_input = String(user_input);
        }

        // Remove common trademark/copyright symbols but keep regular text
        safe_input = safe_input.replace(/[\u00AE\u2122\u00A9]/g, " ");

        // Remove control characters
        safe_input = safe_input.replace(/[\x00-\x1F\x7F]/g, "");

        // Normalize smart quotes and dashes to simple equivalents
        safe_input = safe_input
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u02C6\u2039\u203A\u02DC]/g, ' ');

        // Remove backslashes and unescaped double quotes that may break queries
        safe_input = safe_input.replace(/\\/g, ' ');
        safe_input = safe_input.replace(/\"/g, '"');

        // Keep most human-readable characters: letters (many unicode ranges), numbers, and common punctuation
        // Remove unusual symbols that are unlikely to be part of official game titles
        safe_input = safe_input.replace(/[^0-9A-Za-z\u00C0-\u024F\u0400-\u04FF\s\-:\'\.\,\&\(\)\/\+!_\?]/g, ' ');

        // Collapse multiple spaces into one and trim
        safe_input = safe_input.replace(/\s+/g, ' ').trim();

        // Normalize unicode for consistent storage/search.
        // Note: no external HTML sanitizer is used here.
        // The character allowlist above already strips angle brackets and other markup symbols.

        try {
            safe_input = safe_input.normalize('NFC');
        } catch (e) {
            // ignore normalization errors
        }

        // Limit length to a reasonable size for queries
        if (safe_input.length > 200) safe_input = safe_input.slice(0, 200).trim();

        return safe_input || null;
    } catch (error) {
        return null;
    }
}

module.exports = {
    isProcessRunning,
    waitForProcessExit,
    waitForProcessStart,
    launchGame,
    getGameNameFromExe,
    getGameFromShortcut,
    getGameFromUrl,
    sanitizeGameName
};
