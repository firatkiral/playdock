const { exec } = require("child_process");
const path = require("path");

function psBase64(script) {
    return Buffer.from(script, "utf16le").toString("base64");
}

function runPowerShellJson(script) {
    return new Promise((resolve) => {
        const encoded = psBase64(script);
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, {
            windowsHide: true,
            maxBuffer: 1024 * 1024 * 10
        }, (err, stdout) => {
            if (err || !stdout) return resolve([]);

            try {
                const parsed = JSON.parse(stdout.toString().trim());
                resolve(Array.isArray(parsed) ? parsed : [parsed]);
            } catch (error) {
                resolve([]);
            }
        });
    });
}

function cleanName(value) {
    return String(value || "")
        .replace(/^ms-resource:.*/i, "")
        .replace(/[_\.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function fallbackNameFromPackage(packageName) {
    const parts = String(packageName || "").split(".");
    return cleanName(parts[parts.length - 1] || packageName);
}

function packageFamilyNameFromFullName(packageFullName) {
    const match = String(packageFullName || "").match(/^(.+?)_\d+(?:\.\d+)*_[^_]+__(.+)$/);
    return match ? `${match[1]}_${match[2]}` : "";
}

function normalizeInstallRoot(value) {
    return String(value || "")
        .replace(/^\\\\\?\\/, "")
        .replace(/[\\\/]+$/, "");
}

function isLikelySystemApp(item) {
    const packageName = String(item.packageName || "").toLowerCase();
    const name = String(item.name || "").toLowerCase();
    const installLocation = String(item.installdir || "").toLowerCase();

    if (installLocation.includes("\\windows\\systemapps\\")) return true;
    if (packageName.startsWith("microsoft.windows")) return true;
    if (packageName.startsWith("microsoftwindows.")) return true;
    if (packageName.startsWith("microsoft.ui.")) return true;
    if (packageName.startsWith("microsoft.vclibs.")) return true;
    if (packageName.startsWith("microsoft.net.")) return true;
    if (packageName.startsWith("microsoft.services.store")) return true;
    if (packageName.includes("appinstaller")) return true;
    if (packageName.includes("desktopappinstaller")) return true;
    if (packageName.includes("storepurchaseapp")) return true;
    if (packageName.includes("xboxgamecallableui")) return true;
    if (packageName.includes("gamingservices")) return true;
    if (packageName.includes("gamingapp")) return true;
    if (packageName.includes("xboxapp")) return true;
    if (packageName.includes("xbox.tcui")) return true;
    if (packageName.includes("xboxidentityprovider")) return true;
    if (packageName.includes("xboxspeechto textoverlay")) return true;
    if (name === "xbox" || name === "game bar" || name === "gaming services") return true;

    return false;
}

function isLikelyGame(item) {
    const combined = [
        item.packageName,
        item.packageFamilyName,
        item.name,
        item.publisher
    ].join(" ").toLowerCase();

    const gameHints = [
        "game",
        "xbox",
        "bethesda",
        "mojang",
        "minecraft",
        "forza",
        "halo",
        "flight",
        "solitaire",
        "ageofempires",
        "microsoftstudios",
        "doublefine",
        "obsidian",
        "rare",
        "ninja theory",
        "turn10",
        "playgroundgames"
    ];

    return gameHints.some((hint) => combined.includes(hint));
}

function normalizeCandidate(item) {
    const packageName = String(item.packageName || "").trim();
    const packageFamilyName = String(item.packageFamilyName || "").trim();
    const appId = String(item.appId || "").trim();
    const aumid = String(item.aumid || (packageFamilyName && appId ? `${packageFamilyName}!${appId}` : "")).trim();
    const name = cleanName(item.name) || fallbackNameFromPackage(packageName);

    if (!packageName || !packageFamilyName || !appId || !aumid || !name) {
        return null;
    }

    const normalized = {
        source: "xbox",
        appId: aumid,
        name,
        installdir: item.installdir || "",
        launchCmd: `shell:AppsFolder\\${aumid}`,
        launchExe: item.executable ? path.basename(item.executable) : "",
        launchArgs: "",
        packageName,
        packageFamilyName
    };

    if (isLikelySystemApp(normalized)) {
        return null;
    }

    if (!isLikelyGame(normalized)) {
        return null;
    }

    return normalized;
}

async function getInstalledGames() {
    const gamingServicesGames = await getGamingServicesGames();
    if (gamingServicesGames.length) {
        return gamingServicesGames;
    }

    return getAppxGames();
}

async function getGamingServicesGames() {
    const script = `
        $rootByPackage = @{}
        try {
            Get-ChildItem -Path "HKLM:\\SOFTWARE\\Microsoft\\GamingServices\\PackageRepository\\Root" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
                $props = Get-ItemProperty -Path $_.PSPath
                if ($props.Package -and $props.Root) {
                    $rootByPackage[[string]$props.Package] = [string]$props.Root
                }
            }
        } catch {}

        $items = New-Object System.Collections.Generic.List[object]

        try {
            Get-ChildItem -Path "HKLM:\\SOFTWARE\\Microsoft\\GamingServices\\GameConfig" -ErrorAction SilentlyContinue | ForEach-Object {
                $key = $_
                $packageFullName = [string]$key.PSChildName
                $config = Get-ItemProperty -Path $key.PSPath

                if (-not $rootByPackage.ContainsKey($packageFullName)) { return }

                $shell = $null
                try { $shell = Get-ItemProperty -Path (Join-Path $key.PSPath "ShellVisuals") -ErrorAction SilentlyContinue } catch {}

                $executables = @()
                try {
                    $executables = @(Get-ChildItem -Path (Join-Path $key.PSPath "Executable") -ErrorAction SilentlyContinue)
                } catch {}

                $exeProps = $null
                foreach ($exeKey in $executables) {
                    $candidate = Get-ItemProperty -Path $exeKey.PSPath
                    if (-not $candidate.IsDevOnly -or [int]$candidate.IsDevOnly -eq 0) {
                        $exeProps = $candidate
                        break
                    }
                }

                $protocol = $null
                try {
                    $protocolKey = Get-ChildItem -Path (Join-Path $key.PSPath "Protocol") -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($protocolKey) { $protocol = Get-ItemProperty -Path $protocolKey.PSPath }
                } catch {}

                $items.Add([pscustomobject]@{
                    name = if ($shell -and $shell.DefaultDisplayName) { [string]$shell.DefaultDisplayName } else { [string]$config.Name }
                    packageFullName = $packageFullName
                    appId = if ($exeProps -and $exeProps.Id) { [string]$exeProps.Id } else { "App" }
                    installdir = $rootByPackage[$packageFullName]
                    executable = if ($exeProps -and $exeProps.Name) { [string]$exeProps.Name } else { "" }
                    protocol = if ($protocol -and $protocol.Name) { [string]$protocol.Name } else { "" }
                    storeId = if ($config.StoreId) { [string]$config.StoreId } else { "" }
                    titleId = if ($config.TitleId) { [string]$config.TitleId } else { "" }
                    publisher = if ($shell -and $shell.PublisherDisplayName) { [string]$shell.PublisherDisplayName } else { [string]$config.Publisher }
                })
            }
        } catch {}

        $items | ConvertTo-Json -Depth 4 -Compress
    `;

    const items = await runPowerShellJson(script);
    const games = [];
    const seen = new Set();

    for (const item of items) {
        const packageFullName = String(item.packageFullName || "").trim();
        const packageFamilyName = packageFamilyNameFromFullName(packageFullName);
        const appId = String(item.appId || "App").trim();
        const aumid = packageFamilyName && appId ? `${packageFamilyName}!${appId}` : "";
        const protocol = String(item.protocol || "").trim();
        const name = cleanName(item.name) || fallbackNameFromPackage(packageFullName);

        if (!packageFullName || !name || (!aumid && !protocol)) {
            continue;
        }

        const key = aumid || `${packageFullName}:${protocol}`;
        if (seen.has(key)) continue;
        seen.add(key);

        games.push({
            source: "xbox",
            appId: key,
            name,
            installdir: normalizeInstallRoot(item.installdir),
            launchCmd: aumid ? `shell:AppsFolder\\${aumid}` : `${protocol}:`,
            launchExe: item.executable ? path.basename(item.executable) : "",
            launchArgs: "",
            packageName: packageFullName,
            packageFamilyName,
            storeId: item.storeId || "",
            titleId: item.titleId || ""
        });
    }

    return games.sort((a, b) => a.name.localeCompare(b.name));
}

async function getAppxGames() {
    const script = `
        $startApps = @{}
        try {
            Get-StartApps | ForEach-Object {
                if ($_.AppID) { $startApps[$_.AppID] = $_.Name }
            }
        } catch {}

        $items = New-Object System.Collections.Generic.List[object]

        Get-AppxPackage | ForEach-Object {
            $pkg = $_
            if (-not $pkg.InstallLocation) { return }

            $manifestPath = Join-Path $pkg.InstallLocation "AppxManifest.xml"
            if (-not (Test-Path $manifestPath)) { return }

            try {
                [xml]$manifest = Get-Content $manifestPath -Raw
            } catch {
                return
            }

            $publisher = ""
            try { $publisher = [string]$manifest.Package.Identity.Publisher } catch {}

            $apps = @()
            try { $apps = @($manifest.Package.Applications.Application) } catch {}

            foreach ($appNode in $apps) {
                $id = [string]$appNode.Id
                if ([string]::IsNullOrWhiteSpace($id)) { continue }

                $aumid = "$($pkg.PackageFamilyName)!$id"
                $displayName = $null

                if ($startApps.ContainsKey($aumid)) {
                    $displayName = $startApps[$aumid]
                }

                if ([string]::IsNullOrWhiteSpace($displayName)) {
                    try { $displayName = [string]$appNode.VisualElements.DisplayName } catch {}
                }

                if ([string]::IsNullOrWhiteSpace($displayName)) {
                    try { $displayName = [string]$manifest.Package.Properties.DisplayName } catch {}
                }

                $items.Add([pscustomobject]@{
                    name = $displayName
                    packageName = $pkg.Name
                    packageFamilyName = $pkg.PackageFamilyName
                    appId = $id
                    aumid = $aumid
                    installdir = $pkg.InstallLocation
                    executable = [string]$appNode.Executable
                    publisher = $publisher
                })
            }
        }

        $items | ConvertTo-Json -Depth 4 -Compress
    `;

    const items = await runPowerShellJson(script);
    const games = [];
    const seen = new Set();

    for (const item of items) {
        const game = normalizeCandidate(item);
        if (!game || seen.has(game.appId)) continue;
        seen.add(game.appId);
        games.push(game);
    }

    return games.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
    getInstalledGames
};
