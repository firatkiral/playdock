const state = {
  games: [],
  rssItems: [],
  page: "library",
  view: "all",
  search: "",
  selectedGameId: null,
  userSelectedGameId: false,
  openDetailsGameId: null,
  metadataLoaded: 0,
  metadataTotal: 0,
  heroSlideIndex: 0,
  heroSlideTimer: null,
  metadataRequests: new Set(),
  selectedMetadata: null,
  metadataSuggestions: [],
  metadataSearchTimer: null,
  metadataSearchToken: 0,
  modalSelectedMetadata: null,
  selectedCoverFilePath: "",
  selectedScreenshotFilePaths: [],
  scannedExecutables: [],
  selectedScannedPaths: new Set(),
  scanFolderPath: "",
  activeScanId: null,
  isScanningFolder: false,
  isAddingScannedGames: false,
  scanFeedbackTimer: null,
  scanFeedbackStep: 0,
  editorMode: "create",
  editingGameId: null,
  editingGameSource: "local",
  editingGameAppId: "",
  isLoadingRss: false,
  isRefreshingRss: false,
  isLoadingMoreRss: false,
  rssError: "",
  rssPage: 0,
  rssLimit: 30,
  rssHasMore: false,
  igdbStatus: null,
  pendingUnhideGameIds: new Set(),
  launchingGameIds: new Set(),
  isInspectingGameFile: false,
  isSavingGame: false,
  libraryView: {
    source: "all",
    sort: "name",
    groupedBySource: false,
  },
  favoritesView: {
    sort: "favoritedAt",
  },
  enabledAutoscanSources: ["steam", "epic", "ubisoft", "gog"],
  libraryViewSaveTimer: null,
  favoritesViewSaveTimer: null,
};

const heroDock = document.querySelector("#heroDock");
const libraryIntro = document.querySelector("#libraryIntro");
const shelvesContent = document.querySelector("#shelvesContent");
const libraryContent = document.querySelector("#libraryContent");
const searchInput = document.querySelector("#searchInput");
const topbar = document.querySelector(".topbar");
const windowMinimizeButton = document.querySelector("#windowMinimizeButton");
const windowMaximizeButton = document.querySelector("#windowMaximizeButton");
const windowCloseButton = document.querySelector("#windowCloseButton");
const librarySummary = document.querySelector("#librarySummary");
const metadataStatus = document.querySelector("#metadataStatus");
const statusPill = document.querySelector(".status-pill");
const detailDrawer = document.querySelector("#detailDrawer");
const drawerTitle = document.querySelector(".drawer-title");
const drawerContent = document.querySelector("#drawerContent");
const closeDrawer = document.querySelector("#closeDrawer");
const addGameDrawer = document.querySelector("#addGameDrawer");
const addGameBackdrop = document.querySelector("#addGameBackdrop");
const addGameDrawerTitle = document.querySelector("#addGameDrawerTitle");
const openAddGame = document.querySelector("#openAddGame");
const openSettings = document.querySelector("#openSettings");
const addGameMenu = document.querySelector("#addGameMenu");
const addGameMenuAdd = document.querySelector("#addGameMenuAdd");
const addGameMenuScan = document.querySelector("#addGameMenuScan");
const closeAddGame = document.querySelector("#closeAddGame");
const cancelAddGame = document.querySelector("#cancelAddGame");
const saveGameButton = document.querySelector("#saveGameButton");
const editGameDanger = document.querySelector("#editGameDanger");
const browseGameFile = document.querySelector("#browseGameFile");
const gameDropZone = document.querySelector("#gameDropZone");
const gameDropFeedback = document.querySelector("#gameDropFeedback");
const addGameForm = document.querySelector("#addGameForm");
const addGameError = document.querySelector("#addGameError");
const gameSourcePath = document.querySelector("#gameSourcePath");
const launchOptionsSection = document.querySelector("#launchOptionsSection");
const gameNameInput = document.querySelector("#gameNameInput");
const gameDescriptionInput = document.querySelector("#gameDescriptionInput");
const gameGenresInput = document.querySelector("#gameGenresInput");
const gameCoverImageInput = document.querySelector("#gameCoverImageInput");
const gameScreenshotsInput = document.querySelector("#gameScreenshotsInput");
const coverPreviewCard = document.querySelector("#coverPreviewCard");
const screenshotPreviewCard = document.querySelector("#screenshotPreviewCard");
const clearCoverButton = document.querySelector("#clearCoverButton");
const clearScreenshotsButton = document.querySelector("#clearScreenshotsButton");
const clearMetadataButton = document.querySelector("#clearMetadataButton");
const coverFileName = document.querySelector("#coverFileName");
const screenshotsFileName = document.querySelector("#screenshotsFileName");
const coverPreview = document.querySelector("#coverPreview");
const screenshotPreviewStrip = document.querySelector("#screenshotPreviewStrip");
const openMetadataModal = document.querySelector("#openMetadataModal");
const metadataModalBackdrop = document.querySelector("#metadataModalBackdrop");
const closeMetadataModal = document.querySelector("#closeMetadataModal");
const cancelMetadataModal = document.querySelector("#cancelMetadataModal");
const metadataSearchInput = document.querySelector("#metadataSearchInput");
const loadMetadataButton = document.querySelector("#loadMetadataButton");
const scanFolderModalBackdrop = document.querySelector("#scanFolderModalBackdrop");
const scanFolderModalPanel = document.querySelector("#scanFolderModalPanel");
const selectScanFolderButton = document.querySelector("#selectScanFolderButton");
const closeScanFolderModal = document.querySelector("#closeScanFolderModal");
const cancelScanFolderModal = document.querySelector("#cancelScanFolderModal");
const scanFolderInput = document.querySelector("#scanFolderInput");
const scanFolderActionButton = document.querySelector("#scanFolderActionButton");
const scanFolderFeedback = document.querySelector("#scanFolderFeedback");
const scanFolderResults = document.querySelector("#scanFolderResults");
const addScannedGamesButton = document.querySelector("#addScannedGamesButton");
const termsModalBackdrop = document.querySelector("#termsModalBackdrop");
const termsContent = document.querySelector("#termsContent");
const acceptTermsButton = document.querySelector("#acceptTermsButton");
const declineTermsButton = document.querySelector("#declineTermsButton");
const igdbInfoModalBackdrop = document.querySelector("#igdbInfoModalBackdrop");
const igdbInfoModalText = document.querySelector("#igdbInfoModalText");
const igdbInfoShowTipsInput = document.querySelector("#igdbInfoShowTipsInput");
const dismissIgdbInfoButton = document.querySelector("#dismissIgdbInfoButton");
const openSettingsFromIgdbInfoButton = document.querySelector("#openSettingsFromIgdbInfoButton");
const settingsModalBackdrop = document.querySelector("#settingsModalBackdrop");
const closeSettingsModal = document.querySelector("#closeSettingsModal");
const cancelSettingsModal = document.querySelector("#cancelSettingsModal");
const saveSettingsButton = document.querySelector("#saveSettingsButton");
const rssSettingsModalBackdrop = document.querySelector("#rssSettingsModalBackdrop");
const closeRssSettingsModal = document.querySelector("#closeRssSettingsModal");
const cancelRssSettingsModal = document.querySelector("#cancelRssSettingsModal");
const saveRssSettingsButton = document.querySelector("#saveRssSettingsButton");
const runOnStartupInput = document.querySelector("#runOnStartupInput");
const closeToTrayInput = document.querySelector("#closeToTrayInput");
const igdbClientIdInput = document.querySelector("#igdbClientIdInput");
const igdbClientSecretInput = document.querySelector("#igdbClientSecretInput");
const igdbCredentialsHelpLink = document.querySelector("#igdbCredentialsHelpLink");
const testIgdbConnectionButton = document.querySelector("#testIgdbConnectionButton");
const igdbTestFeedback = document.querySelector("#igdbTestFeedback");
const rssSettingsUrlsInput = document.querySelector("#rssSettingsUrlsInput");
const rssSettingsFeedback = document.querySelector("#rssSettingsFeedback");
const showTipsInput = document.querySelector("#showTipsInput");
const uiScaleSelect = document.querySelector("#uiScaleSelect");
const autoscanSteamInput = document.querySelector("#autoscanSteamInput");
const autoscanEpicInput = document.querySelector("#autoscanEpicInput");
const autoscanUbisoftInput = document.querySelector("#autoscanUbisoftInput");
const autoscanGogInput = document.querySelector("#autoscanGogInput");
const pinToStartButton = document.querySelector("#pinToStartButton");
const createDesktopShortcutButton = document.querySelector("#createDesktopShortcutButton");
const shortcutFeedback = document.querySelector("#shortcutFeedback");
const hiddenGamesList = document.querySelector("#hiddenGamesList");
const settingsAppVersionText = document.querySelector("#settingsAppVersionText");
const settingsCopyrightText = document.querySelector("#settingsCopyrightText");
const settingsLicenseText = document.querySelector("#settingsLicenseText");
const metadataFeedback = document.querySelector("#metadataFeedback");
const metadataSuggestions = document.querySelector("#metadataSuggestions");
const gameCmdInput = document.querySelector("#gameCmdInput");
const gameInstallDirInput = document.querySelector("#gameInstallDirInput");
const gameExeInput = document.querySelector("#gameExeInput");
const gameArgsInput = document.querySelector("#gameArgsInput");
const gameCmdField = document.querySelector("#gameCmdField");
const gameInstallDirField = document.querySelector("#gameInstallDirField");
const gameExeField = document.querySelector("#gameExeField");
const gameArgsField = document.querySelector("#gameArgsField");
const navButtons = [...document.querySelectorAll(".nav-button[data-page]")];
const rssFallbackImage = "./images/playdock_logo.svg";
const autoscanSourceOptions = [
  { source: "steam", label: "Steam", input: autoscanSteamInput },
  { source: "epic", label: "Epic Games", input: autoscanEpicInput },
  { source: "ubisoft", label: "Ubisoft Connect", input: autoscanUbisoftInput },
  { source: "gog", label: "GOG", input: autoscanGogInput },
];
const librarySourceOptions = [
  { source: "all", label: "All Sources" },
  { source: "local", label: "Local" },
];
const librarySortOptions = [
  { sort: "name", label: "Name" },
  { sort: "created", label: "Date Added" },
  { sort: "source", label: "Source" },
];
const favoritesSortOptions = [
  { sort: "favoritedAt", label: "Recently Favorited" },
  { sort: "name", label: "Name" },
  { sort: "lastPlayed", label: "Recently Played" },
];

const fallbackDescriptions = [
  "Ready when you are. Launch straight in or open details to check what is installed.",
  "A clean library entry waiting for richer metadata from PlayDock.",
  "Keep this one close for quick sessions, long campaigns, or a late-night run.",
  "No artwork yet, but it still deserves a polished spot in the library.",
];

const fallbackGenres = [
  ["Action", "Multiplayer"],
  ["Adventure", "Single Player"],
  ["Strategy", "Simulation"],
  ["RPG", "Story Rich"],
  ["Competitive", "Online"],
];

function cleanText(value) {
  return String(value || "")
    .replaceAll("â„¢", "™")
    .replaceAll("Â®", "®")
    .replaceAll("Â©", "©")
    .replaceAll("Î”", "Δ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLocalSource(source) {
  return !source || source === "local";
}

function normalizeSource(source) {
  return String(source || "local").trim().toLowerCase() || "local";
}

function sourceLabel(source) {
  const option = [...librarySourceOptions, ...autoscanSourceOptions].find((item) => item.source === normalizeSource(source));
  return option ? option.label : cleanText(source || "Local");
}

function sourceOrder(source) {
  const sourceOptions = getLibrarySourceOptions();
  const index = sourceOptions.findIndex((item) => item.source === normalizeSource(source));
  return index < 0 ? sourceOptions.length : index;
}

function hashString(value) {
  return [...cleanText(value)].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function pickByName(name, values) {
  return values[hashString(name) % values.length];
}

function normalizeGame(game, index) {
  const metadata = hasMetadata(game) ? game.metadata : null;
  const title = metadata && metadata.name ? metadata.name : game.name;
  const fallbackTags = pickByName(title, fallbackGenres);

  return {
    ...game,
    index,
    title,
    metadata: game.metadata,
    description: metadata && metadata.description ? metadata.description : pickByName(title, fallbackDescriptions),
    genres: metadata ? metadata.genres : fallbackTags,
    modes: metadata ? metadata.modes : [],
    tags: metadata ? metadata.tags.slice(0, 4) : [],
    developers: metadata ? metadata.developers : [],
    publishers: metadata ? metadata.publishers : [],
    releaseDate: metadata ? metadata.releaseDate : null,
    criticScore: metadata ? metadata.criticScore : null,
    communityScore: metadata ? metadata.communityScore : null,
    icon: metadata ? metadata.icon : "",
    coverImage: metadata ? metadata.coverImage : "",
    screenshots: metadata ? metadata.screenshots : [],
    favorite: game.favorite,
    favoritedAt: game.favoritedAt,
  };
}

function hasMetadata(game) {
  if (!game.metadata) return false;
  if (!game.metadata.igdbId && !game.metadata.name && !game.metadata.description && !game.metadata.coverImage) return false;
  return true;
}

function gameAccent(game) {
  const colors = [
    ["#00d1a7", "#2479ff"],
    ["#f2c15d", "#e85d75"],
    ["#5ce1e6", "#7a5cff"],
    ["#72d572", "#0d8b8b"],
    ["#ff8f5c", "#d64061"],
  ];
  return pickByName(game.title || game.name, colors);
}

function fallbackArt(game) {
  const [a, b] = gameAccent(game);
  const title = escapeSvgText(game.title || game.name || "PlayDock");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${a}"/>
          <stop offset="1" stop-color="${b}"/>
        </linearGradient>
        <pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="46" height="46" fill="none"/>
          <path d="M0 0h46" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
        </pattern>
      </defs>
      <rect width="600" height="800" fill="#11151d"/>
      <rect width="600" height="800" fill="url(#g)" opacity=".82"/>
      <rect width="600" height="800" fill="url(#p)" opacity=".52"/>
      <circle cx="472" cy="122" r="98" fill="rgba(255,255,255,.16)"/>
      <rect x="54" y="494" width="492" height="174" rx="18" fill="rgba(0,0,0,.28)"/>
      <text x="76" y="574" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="800">${title}</text>
      <text x="78" y="626" fill="rgba(255,255,255,.74)" font-family="Arial, sans-serif" font-size="24">PlayDock Library</text>
    </svg>`;
  return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
}

function backgroundImageValueFromSource(value) {
  const source = imageSourceForPath(value);
  if (!source) return "";
  return `url(${JSON.stringify(source)})`;
}

function setElementBackgroundImage(element, source, { fallbackSource = "", fallbackCss = "" } = {}) {
  if (!element) return;

  const cssValue = backgroundImageValueFromSource(source)
    || backgroundImageValueFromSource(fallbackSource)
    || fallbackCss;

  if (cssValue) {
    element.style.backgroundImage = cssValue;
  } else {
    element.style.removeProperty("background-image");
  }
}

function applyGameCardFallbackArt(context = document) {
  context.querySelectorAll("[data-game-card-fallback]").forEach((element) => {
    const gameId = element.getAttribute("data-game-card-fallback");
    const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
    if (!game) return;
    setElementBackgroundImage(element, "", { fallbackCss: fallbackArt(game) });
  });
}

function getHeroImages(game) {
  const images = [];
  if (game.coverImage) {
    images.push(game.coverImage);
  }
  for (const screenshot of game.screenshots) {
    images.push(screenshot);
  }

  return [...new Set(images.filter(Boolean))];
}

function getHeroSlideImage(game) {
  const images = getHeroImages(game);
  if (!images.length) return "";
  return images[state.heroSlideIndex % images.length];
}

function icon(name, size = 18) {
  const icons = {
    play: '<path d="M8 5v14l11-7Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    favorite: '<path d="m12 17.27-5.18 3.05 1.39-5.89L3.64 10.5l6.02-.5L12 4.5l2.34 5.5 6.02.5-4.57 3.93 1.39 5.89z"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  };

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${name === "play" || name === "favorite" ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function isGameLaunching(gameId) {
  return state.launchingGameIds.has(String(gameId));
}

function playButtonAttributes(gameId) {
  return isGameLaunching(gameId) ? 'disabled aria-busy="true"' : "";
}

function playButtonContent(gameId, iconSize) {
  return isGameLaunching(gameId) ? "Starting..." : `${icon("play", iconSize)} Play`;
}

function setLibraryIntroVisible(isVisible) {
  libraryIntro.classList.toggle("is-hidden", !isVisible);
}

function filteredGames() {
  const query = state.search.toLowerCase();

  return state.games.filter((game) => {
    if (game.hidden) return false;

    const haystack = [
      game.title,
      ...game.genres,
      ...game.tags,
      ...game.developers,
      ...game.publishers,
      game.launch.source
    ].join(" ").toLowerCase();

    const matchesSearch = !query || haystack.includes(query);
    return matchesSearch;
  });
}

function makeShelves(games) {
  const recent = games
    .filter((game) => game.lastPlayed)
    .sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 10);
  const favorites = getFavoriteGames(games);
  
  return [
    { title: "Continue Playing", subtitle: "Your latest sessions, sorted by last launch.", games: recent.slice(0, 18) },
    {
      title: "Favorites",
      subtitle: "Pinned games you want close at hand.",
      games: favorites.slice(0, 18),
      controls: renderFavoritesControls(),
    },
  ].filter((shelf) => shelf.games.length > 0);
}

function normalizeFavoritesViewSettings(value = {}) {
  const sort = String(value.sort || "favoritedAt").trim();

  return {
    sort: favoritesSortOptions.some((option) => option.sort === sort) ? sort : "favoritedAt",
  };
}

function applyFavoritesViewSettings(value = {}) {
  state.favoritesView = normalizeFavoritesViewSettings(value);
}

function getFavoriteGames(games) {
  const favorites = games.filter((game) => game.favorite);
  const sort = normalizeFavoritesViewSettings(state.favoritesView).sort;

  return [...favorites].sort((a, b) => {
    if (sort === "name") {
      return compareGamesByName(a, b);
    }

    if (sort === "lastPlayed") {
      return Number(b.lastPlayed || 0) - Number(a.lastPlayed || 0) || compareGamesByName(a, b);
    }

    const aFavoritedAt = Number(a.favoritedAt || 0);
    const bFavoritedAt = Number(b.favoritedAt || 0);
    if (aFavoritedAt > 0 || bFavoritedAt > 0) {
      return bFavoritedAt - aFavoritedAt || compareGamesByName(a, b);
    }

    const aCreated = a && a.meta ? Number(a.meta.created || 0) : 0;
    const bCreated = b && b.meta ? Number(b.meta.created || 0) : 0;
    return bCreated - aCreated || compareGamesByName(a, b);
  });
}

function normalizeLibraryViewSettings(value = {}, enabledAutoscanSources = state.enabledAutoscanSources) {
  const source = normalizeSource(value.source || "all");
  const sort = String(value.sort || "name").trim().toLowerCase();
  const sourceOptions = getLibrarySourceOptions(enabledAutoscanSources);

  return {
    source: sourceOptions.some((option) => option.source === source) ? source : "all",
    sort: librarySortOptions.some((option) => option.sort === sort) ? sort : "name",
    groupedBySource: Boolean(value.groupedBySource),
  };
}

function applyLibraryViewSettings(value = {}) {
  state.libraryView = normalizeLibraryViewSettings(value);
}

function applyEnabledAutoscanSources(value) {
  state.enabledAutoscanSources = normalizeAutoscanSources(value);
  state.libraryView = normalizeLibraryViewSettings(state.libraryView);
}

function getLibrarySourceOptions(enabledAutoscanSources = state.enabledAutoscanSources) {
  const enabledSources = new Set(enabledAutoscanSources);
  return [
    ...librarySourceOptions,
    ...autoscanSourceOptions
      .filter((option) => enabledSources.has(option.source))
      .map(({ source, label }) => ({ source, label })),
  ];
}

function gameCreatedTime(game) {
  const created = game && game.meta ? Number(game.meta.created) : 0;
  return Number.isFinite(created) && created > 0 ? created : Number.MAX_SAFE_INTEGER;
}

function compareGamesByName(a, b) {
  return String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""));
}

function getFullLibraryGames(games) {
  const view = normalizeLibraryViewSettings(state.libraryView);
  const sourceFilteredGames = view.source === "all"
    ? games
    : games.filter((game) => normalizeSource(game.launch && game.launch.source) === view.source);
  const sortedGames = [...sourceFilteredGames];

  if (view.sort === "created") {
    sortedGames.sort((a, b) => gameCreatedTime(b) - gameCreatedTime(a) || compareGamesByName(a, b));
  } else if (view.sort === "source") {
    sortedGames.sort((a, b) => {
      const sourceDifference = sourceOrder(a.launch && a.launch.source) - sourceOrder(b.launch && b.launch.source);
      return sourceDifference || compareGamesByName(a, b);
    });
  } else {
    sortedGames.sort(compareGamesByName);
  }

  return sortedGames;
}

function groupGamesBySource(games) {
  const groups = new Map();
  games.forEach((game) => {
    const source = normalizeSource(game.launch && game.launch.source);
    if (!groups.has(source)) {
      groups.set(source, []);
    }
    groups.get(source).push(game);
  });

  return [...groups.entries()]
    .sort(([leftSource], [rightSource]) => sourceOrder(leftSource) - sourceOrder(rightSource))
    .map(([source, sourceGames]) => ({ source, games: sourceGames }));
}

function chooseAutoSelectedGame(games, fullLibraryGames) {
  const lastPlayedGame = games
    .filter((game) => Number(game.lastPlayed) > 0)
    .sort((a, b) => Number(b.lastPlayed) - Number(a.lastPlayed))[0];

  if (lastPlayedGame) {
    return lastPlayedGame;
  }

  const favoriteGame = getFavoriteGames(games)[0];
  if (favoriteGame) {
    return favoriteGame;
  }

  return fullLibraryGames[0] || null;
}

function render() {
  if (state.page === "rss") {
    renderRssFeed();
    return;
  }

  searchInput.placeholder = "Search games, genres, sources...";
  const games = filteredGames();
  librarySummary.textContent = `${state.games.length} games in library`;

  if (!games.length) {
    stopHeroSlideshow();
    state.selectedGameId = null;
    state.userSelectedGameId = false;
    setLibraryIntroVisible(false);
    heroDock.innerHTML = "";
    shelvesContent.innerHTML = "";
    libraryContent.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>No games found</strong>
          <p>Try a different search or switch back to Home.</p>
        </div>
      </div>`;
    return;
  }

  const shelves = makeShelves(games);
  const fullLibraryGames = getFullLibraryGames(games);
  let hero = games.find((game) => String(game.id) === String(state.selectedGameId));
  if (!hero || !state.userSelectedGameId) {
    hero = chooseAutoSelectedGame(games, fullLibraryGames);
    state.selectedGameId = hero ? hero.id : null;
    state.userSelectedGameId = false;
  }

  if (!hero) {
    stopHeroSlideshow();
    setLibraryIntroVisible(false);
    heroDock.innerHTML = "";
    shelvesContent.innerHTML = shelves.map(renderShelf).join("");
    libraryContent.innerHTML = `
      <section class="section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Full Library</h2>
            <p class="section-subtitle">0 of ${games.length} matching games</p>
          </div>
          ${renderFullLibraryControls()}
        </div>
        ${renderFullLibraryContent(fullLibraryGames)}
      </section>
    `;
    bindFullLibraryControls();
    bindFavoritesControls();
    applyGameCardFallbackArt();
    bindGameCards();
    return;
  }

  setLibraryIntroVisible(true);
  heroDock.innerHTML = renderHero(hero);
  startHeroSlideshow(hero);
  shelvesContent.innerHTML = shelves.map(renderShelf).join("");
  libraryContent.innerHTML = `
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Full Library</h2>
          <p class="section-subtitle">${fullLibraryGames.length} of ${games.length} matching games</p>
        </div>
        ${renderFullLibraryControls()}
      </div>
      ${renderFullLibraryContent(fullLibraryGames)}
    </section>
  `;

  bindFullLibraryControls();
  bindFavoritesControls();
  applyGameCardFallbackArt();
  bindGameCards();
}

function filteredRssItems() {
  const query = state.search.toLowerCase();
  return state.rssItems.filter((item) => {
    const haystack = [
      item.title,
      item.source,
      item.author,
      item.content,
    ].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
}

function normalizeRssUrls(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sameRssUrls(firstValue, secondValue) {
  const first = normalizeRssUrls(firstValue);
  const second = normalizeRssUrls(secondValue);
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

function normalizeAutoscanSources(value) {
  const validSources = autoscanSourceOptions.map((option) => option.source);

  if (!Array.isArray(value)) {
    return validSources;
  }

  return [...new Set(
    value
      .map((entry) => String(entry || "").trim().toLowerCase())
      .filter((entry) => validSources.includes(entry))
  )];
}

function sameAutoscanSources(firstValue, secondValue) {
  const first = normalizeAutoscanSources(firstValue);
  const second = normalizeAutoscanSources(secondValue);
  const secondSet = new Set(second);
  return first.length === second.length && first.every((value) => secondSet.has(value));
}

function setAutoscanInputs(value) {
  const enabledSources = new Set(normalizeAutoscanSources(value));
  autoscanSourceOptions.forEach(({ source, input }) => {
    input.checked = enabledSources.has(source);
  });
}

function getSelectedAutoscanSources() {
  return autoscanSourceOptions
    .filter(({ input }) => input.checked)
    .map(({ source }) => source);
}

async function loadGames({ hydrate = true } = {}) {
  const games = await window.electronAPI.getGames();
  state.games = games.map(normalizeGame).sort((a, b) => a.title.localeCompare(b.title));
  render();

  if (hydrate && state.igdbStatus && state.igdbStatus.ok) {
    hydrateMetadata();
  } else {
    updateReadyStatus();
  }
}

function setHeaderStatus(message, kind = "default") {
  metadataStatus.textContent = message;
  statusPill.classList.toggle("error", kind === "error");
}

function setIgdbStatus(igdbStatus) {
  state.igdbStatus = igdbStatus || null;
  if (state.page !== "rss" && (!state.metadataTotal || state.metadataLoaded === state.metadataTotal)) {
    updateReadyStatus();
  }
}

function updateReadyStatus() {
  if (state.igdbStatus && !state.igdbStatus.ok) {
    setHeaderStatus("IGDB off", "error");
    return;
  }

  setHeaderStatus("Ready");
}

function renderRssFeed() {
  stopHeroSlideshow();
  closeDetails();
  searchInput.placeholder = "Search RSS posts, sources, authors...";
  const items = filteredRssItems();
  const groups = groupRssItemsByDate(items);
  const sourceCount = new Set(state.rssItems.map((item) => item.source).filter(Boolean)).size;
  librarySummary.textContent = state.isLoadingRss
    ? "Loading RSS feed..."
    : `${state.rssItems.length} RSS item${state.rssItems.length === 1 ? "" : "s"} loaded`;
  setHeaderStatus(
    state.rssError
      ? "RSS error"
      : state.isRefreshingRss ? "Updating RSS"
        : state.isLoadingRss ? "RSS loading" : "RSS ready",
    state.rssError ? "error" : "default"
  );

  setLibraryIntroVisible(false);
  heroDock.innerHTML = "";
  shelvesContent.innerHTML = "";
  const rssHeader = `
    <section class="rss-header" aria-label="RSS feed">
      <div class="rss-header-copy">
        <h1>Headlines</h1>
        <p>${sourceCount ? `${sourceCount} source${sourceCount === 1 ? "" : "s"} live in this stream.` : "Add RSS URLs in RSS Settings to fill this page."}</p>
      </div>
      <div class="rss-header-actions">
        <button class="icon-button rss-settings-button" type="button" title="RSS settings" aria-label="RSS settings" data-open-rss-settings>
          ${icon("settings", 18)}
        </button>
        <button class="icon-button rss-refresh-button${state.isRefreshingRss ? " refreshing" : ""}" type="button" title="Refresh RSS feed" aria-label="Refresh RSS feed" data-refresh-rss${state.isRefreshingRss ? " disabled" : ""}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 0 1-15.5 6.2" />
            <path d="M3 12A9 9 0 0 1 18.5 5.8" />
            <path d="M18 2v4h4" />
            <path d="M6 22v-4H2" />
          </svg>
        </button>
      </div>
    </section>`;

  if (state.isLoadingRss) {
    libraryContent.innerHTML = `
      ${rssHeader}
      <section class="rss-page">
        <div class="loading-state">
          <div>
            <div class="loading-spinner"></div>
            <strong>Refreshing feed</strong>
            <p>Pulling the latest items from your RSS URLs.</p>
          </div>
        </div>
      </section>`;
    bindRssControls();
    return;
  }

  if (state.rssError || !items.length) {
    libraryContent.innerHTML = `
      ${rssHeader}
      <section class="rss-page">
        <div class="empty-state">
          <div>
            <strong>${state.rssError ? "Could not load RSS feed" : "No RSS items found"}</strong>
            <p>${state.rssError || (state.search ? "Try a different search." : "Add RSS URLs in RSS Settings, then open this page again.")}</p>
          </div>
        </div>
      </section>`;
    bindRssControls();
    return;
  }

  libraryContent.innerHTML = `
    ${rssHeader}
    <section class="rss-page">
      <div class="rss-timeline">
        ${groups.map(renderRssGroup).join("")}
      </div>
      ${state.rssHasMore ? `
        <div class="rss-load-more">
          <button class="ghost-button" type="button" data-load-more-rss${state.isLoadingMoreRss ? " disabled" : ""}>
            ${state.isLoadingMoreRss ? "Loading..." : "Load More"}
          </button>
          <span>${items.length} loaded</span>
        </div>` : ""}
    </section>`;

  bindRssControls();
}

function hasRssImage(item) {
  const mediaUrl = item.media && item.media.url ? item.media.url : "";
  const mediaType = item.media && item.media.type ? item.media.type : "";
  return Boolean(mediaUrl && (!mediaType || mediaType.startsWith("image"))) || Boolean(youtubeThumbnailUrl(item));
}

function youtubeThumbnailUrl(item) {
  const mediaUrl = item.media && item.media.url ? item.media.url : "";
  const mediaType = item.media && item.media.type ? item.media.type : "";
  const candidates = [
    mediaType === "video/youtube" ? mediaUrl : "",
    item.link || "",
  ].filter(Boolean);

  for (const candidate of candidates) {
    const value = String(candidate);
    const idMatch = value.match(/[?&]v=([^&#]+)/i)
      || value.match(/youtube\.com\/embed\/([^?&#/]+)/i)
      || value.match(/youtube\.com\/v\/([^?&#/]+)/i)
      || value.match(/youtu\.be\/([^?&#/]+)/i);
    if (idMatch && idMatch[1]) {
      return `https://i.ytimg.com/vi/${idMatch[1]}/hqdefault.jpg`;
    }
  }

  return "";
}

function rssImage(item) {
  const mediaUrl = item.media && item.media.url ? item.media.url : "";
  const mediaType = item.media && item.media.type ? item.media.type : "";
  if (mediaUrl && (!mediaType || mediaType.startsWith("image"))) {
    return mediaUrl;
  }

  return youtubeThumbnailUrl(item) || rssFallbackImage;
}

function rssMeta(item) {
  return [
    item.source,
    item.pubDate ? formatDate(item.pubDate) : "",
    item.author,
  ].filter(Boolean);
}

function renderFeaturedRssItem(item, className = "rss-feature") {
  const image = rssImage(item);
  const media = `<img src="${escapeAttribute(image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${escapeAttribute(rssFallbackImage)}';">`;
  const key = rssItemKey(item);

  return `
    <article class="${escapeAttribute(className)}" role="button" tabindex="0" data-rss-item="${escapeAttribute(key)}" data-details-rss>
      <div class="rss-feature-media">${media}</div>
      <div class="rss-feature-body">
        <div class="rss-card-meta">${rssMeta(item).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
        <h2>${escapeHtml(item.title || "Untitled feed item")}</h2>
        <p>${escapeHtml(item.content || "")}</p>
      </div>
    </article>`;
}

function groupRssItemsByDate(items) {
  const groups = [
    { title: "Today", items: [] },
    { title: "Yesterday", items: [] },
    { title: "This Week", items: [] },
    { title: "Older", items: [] },
  ];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 1000 * 60 * 60 * 24;

  items.forEach((item) => {
    const time = item.pubDate ? new Date(item.pubDate).getTime() : 0;
    const age = today - new Date(time || Date.now()).setHours(0, 0, 0, 0);
    if (age <= 0) {
      groups[0].items.push(item);
    } else if (age <= day) {
      groups[1].items.push(item);
    } else if (age <= day * 7) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  });

  return groups.filter((group) => group.items.length);
}

function renderRssGroup(group) {
  const [featureItem, ...timelineItems] = group.items;
  return `
    <section class="rss-date-group">
      <h2>${escapeHtml(group.title)}</h2>
      <div class="rss-date-items">
        ${featureItem ? renderFeaturedRssItem(featureItem, "rss-feature timeline-feature") : ""}
        ${timelineItems.length ? `
          <div class="rss-timeline-list">
            ${timelineItems.map(renderRssTimelineItem).join("")}
          </div>` : ""}
      </div>
    </section>`;
}

function renderRssTimelineItem(item) {
  const image = rssImage(item);
  const key = rssItemKey(item);
  return `
    <article class="rss-timeline-item" role="button" tabindex="0" data-rss-item="${escapeAttribute(key)}" data-details-rss>
      <div class="rss-timeline-dot"></div>
      <div class="rss-timeline-thumb"><img src="${escapeAttribute(image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${escapeAttribute(rssFallbackImage)}';"></div>
      <div class="rss-timeline-body">
        <div class="rss-card-meta">${rssMeta(item).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>
        <h3>${escapeHtml(item.title || "Untitled feed item")}</h3>
        <p>${escapeHtml(item.content || "")}</p>
      </div>
    </article>`;
}

function bindRssControls() {
  const refreshButton = document.querySelector("[data-refresh-rss]");
  if (refreshButton && !refreshButton.dataset.boundRefreshRss) {
    refreshButton.dataset.boundRefreshRss = "true";
    refreshButton.addEventListener("click", refreshRssFeed);
  }

  const settingsButton = document.querySelector("[data-open-rss-settings]");
  if (settingsButton && !settingsButton.dataset.boundOpenRssSettings) {
    settingsButton.dataset.boundOpenRssSettings = "true";
    settingsButton.addEventListener("click", openRssSettingsModal);
  }

  const loadMoreButton = document.querySelector("[data-load-more-rss]");
  if (loadMoreButton && !loadMoreButton.dataset.boundLoadMoreRss) {
    loadMoreButton.dataset.boundLoadMoreRss = "true";
    loadMoreButton.addEventListener("click", async () => {
      if (state.isLoadingMoreRss) return;
      await loadRssFeedPage(state.rssPage + 1, { append: true });
      renderRssFeed();
    });
  }

  document.querySelectorAll("[data-rss-item]:not([data-bound-rss])").forEach((element) => {
    element.dataset.boundRss = "true";
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      openRssItem(element.dataset.rssItem);
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRssItem(element.dataset.rssItem);
      }
    });
  });
}

function rssItemKey(item) {
  return String(item.id || item.link || item.title || "");
}

function openRssItem(itemKey) {
  const item = state.rssItems.find((candidate) => rssItemKey(candidate) === String(itemKey));
  if (!item) return;

  state.openDetailsGameId = `rss:${rssItemKey(item)}`;
  drawerTitle.textContent = "Feed Preview";
  drawerContent.innerHTML = renderRssDrawer(item);
  setElementBackgroundImage(drawerContent.querySelector("[data-rss-drawer-cover]"), rssImage(item), {
    fallbackSource: rssFallbackImage,
  });
  detailDrawer.classList.add("open");
  detailDrawer.setAttribute("aria-hidden", "false");

  const openButton = drawerContent.querySelector("[data-open-rss-browser]");
  if (openButton) {
    openButton.addEventListener("click", () => openExternalUrl(item.link));
  }
}

function renderRssDrawer(item) {
  const media = `<div class="drawer-cover rss-drawer-cover" data-rss-drawer-cover></div>`;
  const rows = [
    ["Source", item.source],
    ["Published", item.pubDate ? formatDate(item.pubDate) : ""],
    ["Author", item.author],
  ].filter((row) => row[1]);

  return `
    ${media}
    <h3 class="drawer-game-title">${escapeHtml(item.title || "Untitled feed item")}</h3>
    <p class="drawer-description">${escapeHtml(item.content || "")}</p>
    <div class="drawer-actions">
      <button class="primary-button" type="button" data-open-rss-browser ${item.link ? "" : "disabled"}>${icon("external", 17)} Open in Browser</button>
    </div>
    <div class="detail-list">
      ${rows.map(([label, value]) => `
        <div class="detail-row">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </div>`;
}

async function openExternalUrl(url) {
  if (!url) return;

  try {
    await window.electronAPI.openExternalUrl(url);
  } catch (error) {
    console.error("Could not open external link.", error);
  }
}

async function openExternalLink(event) {
  event.preventDefault();
  await openExternalUrl(event.currentTarget && event.currentTarget.href);
}

async function refreshRssFeed() {
  if (state.isRefreshingRss) return;
  state.isRefreshingRss = true;
  state.rssError = "";
  renderRssFeed();

  try {
    await window.electronAPI.refreshRssFeed();
    state.rssPage = 0;
    state.rssHasMore = false;
    await loadRssFeedPage(0);
  } catch (error) {
    console.error("Could not refresh RSS feed.", error);
    state.rssError = "Could not refresh RSS right now.";
  } finally {
    state.isRefreshingRss = false;
    renderRssFeed();
  }
}

async function loadRssFeedPage(page, { append = false } = {}) {
  if (append) {
    state.isLoadingMoreRss = true;
    renderRssFeed();
  }

  try {
    state.rssError = "";
    const items = await window.electronAPI.getRssFeed({ page, limit: state.rssLimit });
    const docs = Array.isArray(items) ? items : [];
    state.rssItems = append ? [...state.rssItems, ...docs] : docs;
    state.rssPage = page;
    state.rssHasMore = docs.length === state.rssLimit;
  } catch (error) {
    console.error("Could not load RSS feed.", error);
    if (!append) {
      state.rssItems = [];
    }
    state.rssError = "Check your RSS URLs in RSS Settings and try again.";
  } finally {
    state.isLoadingMoreRss = false;
  }
}

async function loadRssFeed() {
  state.page = "rss";
  state.isLoadingRss = true;
  state.rssError = "";
  state.rssPage = 0;
  state.rssHasMore = false;
  render();

  await loadRssFeedPage(0);
  state.isLoadingRss = false;
  render();
}

function renderHero(game) {
  const heroImage = getHeroSlideImage(game);

  return `
    <section class="hero" data-hero-game="${game.id}">
      <div class="hero-fallback"></div>
      ${heroImage ? `<img class="hero-media" data-hero-media src="${escapeAttribute(heroImage)}" alt="">` : ""}
      <div class="hero-content">
        <h1 class="hero-title">${escapeHtml(game.title)}</h1>
        <p class="hero-description">${escapeHtml(game.description)}</p>
        <div class="meta-strip">
          ${game.genres.slice(0, 3).map((genre) => `<span class="meta-chip">${escapeHtml(genre)}</span>`).join("")}
          ${game.releaseDate ? `<span class="meta-chip">${formatDate(game.releaseDate)}</span>` : ""}
          ${scoreText(game) ? `<span class="meta-chip">${scoreText(game)}</span>` : ""}
        </div>
        <div class="hero-actions">
          <button class="primary-button hero-play-button" type="button" data-play-game="${game.id}" ${playButtonAttributes(game.id)}>${playButtonContent(game.id, 20)}</button>
        </div>
      </div>
    </section>`;
}

function renderShelf(shelf) {
  if (!shelf.games.length) {
    return "";
  }

  return `
    <section class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">${escapeHtml(shelf.title)}</h2>
          <p class="section-subtitle">${escapeHtml(shelf.subtitle)}</p>
        </div>
        ${shelf.controls || ""}
      </div>
      <div class="rail">
        ${shelf.games.map(renderGameCard).join("")}
      </div>
    </section>`;
}

function renderFavoritesControls() {
  const view = normalizeFavoritesViewSettings(state.favoritesView);

  return `
    <div class="library-controls" aria-label="Favorites controls">
      <label class="library-control">
        <span>Sort</span>
        <select class="library-control-select" data-favorites-view-control="sort">
          ${favoritesSortOptions.map((option) => `
            <option value="${escapeAttribute(option.sort)}"${view.sort === option.sort ? " selected" : ""}>${escapeHtml(option.label)}</option>
          `).join("")}
        </select>
      </label>
    </div>`;
}

function renderFullLibraryControls() {
  const view = normalizeLibraryViewSettings(state.libraryView);
  const sourceOptions = getLibrarySourceOptions();

  return `
    <div class="library-controls" aria-label="Full library controls">
      <label class="library-control">
        <span>Source</span>
        <select class="library-control-select" data-library-view-control="source">
          ${sourceOptions.map((option) => `
            <option value="${escapeAttribute(option.source)}"${view.source === option.source ? " selected" : ""}>${escapeHtml(option.label)}</option>
          `).join("")}
        </select>
      </label>
      <label class="library-control">
        <span>Sort</span>
        <select class="library-control-select" data-library-view-control="sort">
          ${librarySortOptions.map((option) => `
            <option value="${escapeAttribute(option.sort)}"${view.sort === option.sort ? " selected" : ""}>${escapeHtml(option.label)}</option>
          `).join("")}
        </select>
      </label>
      <label class="library-group-toggle">
        <input class="settings-toggle" type="checkbox" data-library-view-control="groupedBySource"${view.groupedBySource ? " checked" : ""}>
        <span>Group by source</span>
      </label>
    </div>`;
}

function renderFullLibraryContent(games) {
  if (!games.length) {
    return `
      <div class="empty-state library-empty-state">
        <div>
          <strong>No games in this view</strong>
          <p>Change the Full Library source filter to show more games.</p>
        </div>
      </div>`;
  }

  if (state.libraryView.groupedBySource) {
    return `
      <div class="library-source-groups">
        ${groupGamesBySource(games).map(renderFullLibrarySourceGroup).join("")}
      </div>`;
  }

  return `
    <div class="library-grid">
      ${games.map(renderGameCard).join("")}
    </div>`;
}

function renderFullLibrarySourceGroup(group) {
  return `
    <section class="library-source-group">
      <div class="library-source-header">
        <h3>${escapeHtml(sourceLabel(group.source))}</h3>
        <span>${group.games.length} game${group.games.length === 1 ? "" : "s"}</span>
      </div>
      <div class="library-grid">
        ${group.games.map(renderGameCard).join("")}
      </div>
    </section>`;
}

function bindFullLibraryControls() {
  document.querySelectorAll("[data-library-view-control]:not([data-bound-library-view])").forEach((control) => {
    control.dataset.boundLibraryView = "true";
    control.addEventListener("change", () => {
      const key = control.dataset.libraryViewControl;
      const value = control.type === "checkbox" ? control.checked : control.value;
      state.libraryView = normalizeLibraryViewSettings({
        ...state.libraryView,
        [key]: value,
      });
      render();
      queueLibraryViewSettingsSave();
    });
  });
}

function bindFavoritesControls() {
  document.querySelectorAll("[data-favorites-view-control]:not([data-bound-favorites-view])").forEach((control) => {
    control.dataset.boundFavoritesView = "true";
    control.addEventListener("change", () => {
      state.favoritesView = normalizeFavoritesViewSettings({
        ...state.favoritesView,
        [control.dataset.favoritesViewControl]: control.value,
      });
      render();
      queueFavoritesViewSettingsSave();
    });
  });
}

function queueFavoritesViewSettingsSave() {
  if (state.favoritesViewSaveTimer) {
    window.clearTimeout(state.favoritesViewSaveTimer);
  }

  state.favoritesViewSaveTimer = window.setTimeout(() => {
    state.favoritesViewSaveTimer = null;
    saveFavoritesViewSettings();
  }, 350);
}

async function saveFavoritesViewSettings() {
  try {
    const appDoc = await window.electronAPI.getApp();
    const settings = appDoc && appDoc.settings ? appDoc.settings : {};
    await window.electronAPI.updateAppSettings({
      runOnStartup: Boolean(settings.runOnStartup),
      closeToTray: settings.closeToTray !== false,
      igdb: settings.igdb || {},
      rssUrls: settings.rssUrls || [],
      autoscan: settings.autoscan,
      libraryView: state.libraryView,
      favoritesView: state.favoritesView,
      uiScale: settings.uiScale || 1,
      showTips: appDoc ? appDoc.showTips !== false : true,
    });
  } catch (error) {
    console.error("Could not save favorites view settings.", error);
  }
}

function queueLibraryViewSettingsSave() {
  if (state.libraryViewSaveTimer) {
    window.clearTimeout(state.libraryViewSaveTimer);
  }

  state.libraryViewSaveTimer = window.setTimeout(() => {
    state.libraryViewSaveTimer = null;
    saveLibraryViewSettings();
  }, 350);
}

async function saveLibraryViewSettings() {
  try {
    const appDoc = await window.electronAPI.getApp();
    const settings = appDoc && appDoc.settings ? appDoc.settings : {};
    await window.electronAPI.updateAppSettings({
      runOnStartup: Boolean(settings.runOnStartup),
      closeToTray: settings.closeToTray !== false,
      igdb: settings.igdb || {},
      rssUrls: settings.rssUrls || [],
      autoscan: settings.autoscan,
      libraryView: state.libraryView,
      favoritesView: state.favoritesView,
      uiScale: settings.uiScale || 1,
      showTips: appDoc ? appDoc.showTips !== false : true,
    });
  } catch (error) {
    console.error("Could not save library view settings.", error);
  }
}

function renderGameCard(game) {
  const isSelected = String(game.id) === String(state.selectedGameId);
  const media = game.coverImage
    ? `<img class="game-card-image" src="${escapeAttribute(game.coverImage)}" alt="${escapeAttribute(game.title)} cover" loading="lazy">`
    : `<div class="game-card-media" data-game-card-fallback="${escapeAttribute(game.id)}"></div>`;
  const favoriteLabel = game.favorite ? "Remove favorite" : "Add favorite";
  const sourceLabel = cleanText(game.launch && game.launch.source ? game.launch.source : "local").toUpperCase();

  return `
    <article class="game-card${isSelected ? " selected" : ""}" tabindex="0" role="button" data-card-game="${game.id}" data-select-game="${game.id}" aria-label="Select ${escapeHtml(game.title)}">
      ${media}
      <div class="source-badge">${escapeHtml(sourceLabel || "LOCAL")}</div>
      <button class="favorite-toggle${game.favorite ? " active" : ""}" type="button" data-favorite-game="${game.id}" aria-label="${favoriteLabel}">
        ${icon("favorite", 14)}
      </button>
      <div class="game-card-content">
        <h3 class="game-title">${escapeHtml(game.title)}</h3>
        <div class="game-meta">${escapeHtml(game.genres.slice(0, 2).join(" / ") || "Library Game")}</div>
        <div class="card-actions">
          <button class="quick-play" type="button" data-play-game="${game.id}" ${playButtonAttributes(game.id)}>${playButtonContent(game.id, 15)}</button>
          <button class="card-edit-icon" type="button" data-edit-game="${game.id}" aria-label="Edit ${escapeAttribute(game.title)}" title="Edit">
            ${icon("edit", 14)}
          </button>
        </div>
      </div>
    </article>`;
}

function bindGameCards() {
  document.querySelectorAll("[data-select-game]:not([data-bound-select])").forEach((element) => {
    element.dataset.boundSelect = "true";
    element.addEventListener("click", () => selectGame(element.dataset.selectGame));
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectGame(element.dataset.selectGame);
      }
    });
  });

  document.querySelectorAll("[data-edit-game]:not([data-bound-edit])").forEach((element) => {
    element.dataset.boundEdit = "true";
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      openEditGamePanel(element.dataset.editGame);
    });
  });

  document.querySelectorAll("[data-play-game]:not([data-bound-play])").forEach((element) => {
    element.dataset.boundPlay = "true";
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      playGame(element.dataset.playGame);
    });
  });

  document.querySelectorAll("[data-favorite-game]:not([data-bound-favorite])").forEach((element) => {
    element.dataset.boundFavorite = "true";
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(element.dataset.favoriteGame);
    });
  });
}

function refreshGameMetadata(game) {
  document.querySelectorAll(`[data-card-game="${cssEscape(String(game.id))}"]`).forEach((card) => {
    const replacement = htmlToElement(renderGameCard(game));
    applyGameCardFallbackArt(replacement);
    card.replaceWith(replacement);
  });

  if (String(game.id) === String(state.selectedGameId)) {
    heroDock.innerHTML = renderHero(game);
    startHeroSlideshow(game);
  }

  if (String(game.id) === String(state.openDetailsGameId)) {
    drawerContent.innerHTML = renderDrawer(game);
    setElementBackgroundImage(drawerContent.querySelector("[data-game-drawer-cover]"), getHeroSlideImage(game), {
      fallbackCss: fallbackArt(game),
    });
  }

  bindGameCards();
}

function htmlToElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function selectGame(gameId) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  if (!game) return;

  state.selectedGameId = game.id;
  state.userSelectedGameId = true;
  state.heroSlideIndex = 0;
  closeDetails();
  render();
  ensureGameMetadata(game.id);
}

function startHeroSlideshow(game) {
  stopHeroSlideshow();

  const images = getHeroImages(game);
  if (images.length <= 1) return;

  state.heroSlideTimer = window.setInterval(() => {
    const selectedGame = state.games.find((candidate) => String(candidate.id) === String(state.selectedGameId));
    if (!selectedGame) return;

    const selectedImages = getHeroImages(selectedGame);
    if (selectedImages.length <= 1) return;

    state.heroSlideIndex = (state.heroSlideIndex + 1) % selectedImages.length;
    updateHeroSlide(selectedGame);
  }, 4500);
}

function stopHeroSlideshow() {
  if (!state.heroSlideTimer) return;
  window.clearInterval(state.heroSlideTimer);
  state.heroSlideTimer = null;
}

function updateHeroSlide(game) {
  const media = heroDock.querySelector("[data-hero-media]");
  if (!media) return;

  const image = getHeroSlideImage(game);
  if (image) {
    media.setAttribute("src", image);
  }
}

function openGame(gameId) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  if (!game) return;

  state.openDetailsGameId = game.id;
  drawerTitle.textContent = "Game Details";
  drawerContent.innerHTML = renderDrawer(game);
  setElementBackgroundImage(drawerContent.querySelector("[data-game-drawer-cover]"), getHeroSlideImage(game), {
    fallbackCss: fallbackArt(game),
  });
  detailDrawer.classList.add("open");
  detailDrawer.setAttribute("aria-hidden", "false");
  bindGameCards();
  ensureGameMetadata(game.id);
}

function setEditorLocalFieldsVisible(visible) {
  const method = visible ? "remove" : "add";
  gameDropZone.classList[method]("is-hidden");
  browseGameFile.classList[method]("is-hidden");
  launchOptionsSection.classList[method]("is-hidden");
  gameCmdField.classList[method]("is-hidden");
  gameInstallDirField.classList[method]("is-hidden");
  gameExeField.classList[method]("is-hidden");
  gameArgsField.classList[method]("is-hidden");
}

function setAddGameMode(mode, game = null) {
  state.editorMode = mode;
  state.editingGameId = game ? game.id : null;
  state.editingGameSource = game && game.launch ? game.launch.source || "local" : "local";
  state.editingGameAppId = game && game.launch ? game.launch.appId || "" : "";

  const isEdit = mode === "edit";
  const isLocal = !isEdit || isLocalSource(state.editingGameSource);

  addGameDrawerTitle.textContent = isEdit ? "Edit Game" : "Add Game";
  renderSaveGameButton();
  editGameDanger.classList.toggle("is-hidden", !isEdit);
  editGameDanger.textContent = isLocal ? "Delete Game" : "Hide Game";
  gameNameInput.readOnly = false;
  setEditorLocalFieldsVisible(isLocal);
}

function getSaveGameButtonText() {
  return state.editorMode === "edit" ? "Save Changes" : "Save Game";
}

function renderSaveGameButton() {
  if (state.isSavingGame) {
    saveGameButton.innerHTML = '<span class="button-label"><span class="button-spinner" aria-hidden="true"></span><span>Saving...</span></span>';
  } else {
    saveGameButton.textContent = getSaveGameButtonText();
  }
  saveGameButton.setAttribute("aria-busy", String(state.isSavingGame));
}

function setAddGameSaving(isSaving) {
  state.isSavingGame = isSaving;
  addGameDrawer.classList.toggle("is-busy", isSaving);
  addGameDrawer.setAttribute("aria-busy", String(isSaving));
  closeAddGame.disabled = isSaving;
  cancelAddGame.disabled = isSaving;
  saveGameButton.disabled = isSaving;
  editGameDanger.disabled = isSaving;
  openMetadataModal.disabled = isSaving;
  clearMetadataButton.disabled = isSaving;
  clearCoverButton.disabled = isSaving;
  clearScreenshotsButton.disabled = isSaving;
  gameNameInput.disabled = isSaving;
  gameDescriptionInput.disabled = isSaving;
  gameGenresInput.disabled = isSaving;
  gameCoverImageInput.disabled = isSaving;
  gameScreenshotsInput.disabled = isSaving;
  gameCmdInput.disabled = isSaving;
  gameInstallDirInput.disabled = isSaving;
  gameExeInput.disabled = isSaving;
  gameArgsInput.disabled = isSaving;
  gameDropZone.classList.toggle("is-disabled", isSaving || state.isInspectingGameFile);
  gameDropZone.setAttribute("aria-disabled", String(isSaving || state.isInspectingGameFile));
  gameDropZone.setAttribute("aria-busy", String(isSaving || state.isInspectingGameFile));
  browseGameFile.disabled = isSaving || state.isInspectingGameFile;
  renderSaveGameButton();
}

function parseListInput(value) {
  return cleanText(value)
    .split(/[\n,]/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function formatListInput(values) {
  return Array.isArray(values) ? values.filter(Boolean).join(", ") : "";
}

function applyMetadataToEditor(metadata) {
  if (!metadata) return;

  state.selectedMetadata = metadata;
  state.selectedCoverFilePath = "";
  state.selectedScreenshotFilePaths = [];
  gameCoverImageInput.value = "";
  gameScreenshotsInput.value = "";
  gameNameInput.value = metadata.name || gameNameInput.value;
  gameDescriptionInput.value = metadata.description || "";
  gameGenresInput.value = formatListInput(metadata.genres);
  updateMediaPreview();
}

function getEditorMetadata() {
  const metadata = state.selectedMetadata ? { ...state.selectedMetadata } : {};
  const name = gameNameInput.value.trim();
  const description = gameDescriptionInput.value.trim();
  const genres = parseListInput(gameGenresInput.value);
  const coverImage = state.selectedCoverFilePath || metadata.coverImage || "";
  const screenshots = state.selectedScreenshotFilePaths.length
    ? state.selectedScreenshotFilePaths
    : Array.isArray(metadata.screenshots) ? metadata.screenshots : [];

  metadata.name = name;
  metadata.description = description;
  metadata.genres = genres;
  metadata.coverImage = coverImage;
  metadata.screenshots = screenshots;

  if (
    !metadata.igdbId &&
    !metadata.igdbUrl &&
    !metadata.description &&
    !metadata.coverImage &&
    !metadata.screenshots.length &&
    !metadata.genres.length
  ) {
    return null;
  }

  return metadata;
}

function hasStoredMetadataValue(metadata) {
  if (!metadata) return false;

  return Boolean(
    metadata.igdbId ||
    metadata.igdbUrl ||
    metadata.description ||
    metadata.coverImage ||
    metadata.icon ||
    metadata.releaseDate ||
    metadata.ageRatings ||
    metadata.criticScore ||
    metadata.communityScore ||
    (Array.isArray(metadata.genres) && metadata.genres.length) ||
    (Array.isArray(metadata.publishers) && metadata.publishers.length) ||
    (Array.isArray(metadata.developers) && metadata.developers.length) ||
    (Array.isArray(metadata.modes) && metadata.modes.length) ||
    (Array.isArray(metadata.tags) && metadata.tags.length) ||
    (Array.isArray(metadata.screenshots) && metadata.screenshots.length) ||
    (Array.isArray(metadata.videos) && metadata.videos.length) ||
    (Array.isArray(metadata.links) && metadata.links.length)
  );
}

function hasEditorMetadataContent() {
  return Boolean(
    gameDescriptionInput.value.trim() ||
    parseListInput(gameGenresInput.value).length ||
    state.selectedCoverFilePath ||
    state.selectedScreenshotFilePaths.length ||
    hasStoredMetadataValue(state.selectedMetadata)
  );
}

function clearCoverImage() {
  state.selectedCoverFilePath = "";
  gameCoverImageInput.value = "";
  if (state.selectedMetadata) {
    state.selectedMetadata = {
      ...state.selectedMetadata,
      coverImage: ""
    };
  }
  updateMediaPreview();
}

function clearScreenshots() {
  state.selectedScreenshotFilePaths = [];
  gameScreenshotsInput.value = "";
  if (state.selectedMetadata) {
    state.selectedMetadata = {
      ...state.selectedMetadata,
      screenshots: []
    };
  }
  updateMediaPreview();
}

function clearEditorMetadata() {
  state.selectedMetadata = null;
  state.selectedCoverFilePath = "";
  state.selectedScreenshotFilePaths = [];
  gameDescriptionInput.value = "";
  gameGenresInput.value = "";
  gameCoverImageInput.value = "";
  gameScreenshotsInput.value = "";
  addGameError.textContent = "";
  updateMediaPreview();
}

function updateEditorMetadataActions() {
  const coverImage = state.selectedCoverFilePath || (state.selectedMetadata && state.selectedMetadata.coverImage) || "";
  const screenshots = state.selectedScreenshotFilePaths.length
    ? state.selectedScreenshotFilePaths
    : state.selectedMetadata && Array.isArray(state.selectedMetadata.screenshots) ? state.selectedMetadata.screenshots : [];

  coverPreviewCard.classList.toggle("is-hidden", !coverImage);
  clearCoverButton.classList.toggle("is-hidden", !coverImage);
  screenshotPreviewCard.classList.toggle("is-hidden", !screenshots.length);
  clearScreenshotsButton.classList.toggle("is-hidden", !screenshots.length);
  clearMetadataButton.classList.toggle("is-hidden", !hasEditorMetadataContent());
}

function updateMediaPreview() {
  const coverImage = state.selectedCoverFilePath || (state.selectedMetadata && state.selectedMetadata.coverImage) || "";
  const screenshots = (
    state.selectedScreenshotFilePaths.length
      ? state.selectedScreenshotFilePaths
      : state.selectedMetadata && Array.isArray(state.selectedMetadata.screenshots) ? state.selectedMetadata.screenshots : []
  ).slice(0, 8);

  if (coverImage) {
    coverPreview.src = imageSourceForPath(coverImage);
  } else {
    coverPreview.removeAttribute("src");
  }

  screenshotPreviewStrip.innerHTML = screenshots.map((screenshot) => (
    `<img class="screenshot-preview" src="${escapeAttribute(imageSourceForPath(screenshot))}" alt="">`
  )).join("");

  coverFileName.textContent = state.selectedCoverFilePath
    ? fileNameFromPath(state.selectedCoverFilePath)
    : coverImage ? "Metadata image" : "No image selected";
  screenshotsFileName.textContent = state.selectedScreenshotFilePaths.length
    ? `${state.selectedScreenshotFilePaths.length} image${state.selectedScreenshotFilePaths.length === 1 ? "" : "s"} selected`
    : screenshots.length ? "Metadata images" : "No images selected";
  updateEditorMetadataActions();
}

function imageSourceForPath(value) {
  const imagePath = cleanText(value);
  if (!imagePath) return "";
  if (/^(https?:|file:|data:|blob:)/i.test(imagePath)) return imagePath;
  return `file:///${encodeURI(imagePath.replace(/\\/g, "/").replace(/^\/+/, ""))}`;
}

function fileNameFromPath(value) {
  return cleanText(value).split(/[\\/]/).filter(Boolean).pop() || "Selected image";
}

function fillEditorForm(draft) {
  const launch = draft.launch || {};
  const preferredName = !isLocalSource(state.editingGameSource) && draft.metadata && draft.metadata.name
    ? draft.metadata.name
    : draft.name;
  gameSourcePath.value = draft.sourcePath || "";
  gameNameInput.value = preferredName || "";
  gameDescriptionInput.value = draft.metadata && draft.metadata.description ? draft.metadata.description : "";
  gameGenresInput.value = draft.metadata ? formatListInput(draft.metadata.genres) : "";
  gameCoverImageInput.value = "";
  gameScreenshotsInput.value = "";
  gameCmdInput.value = launch.cmd || "";
  gameInstallDirInput.value = launch.installDir || "";
  gameExeInput.value = launch.exe || "";
  gameArgsInput.value = launch.args || "";
  addGameError.textContent = "";
  state.selectedMetadata = draft.metadata && (draft.metadata.igdbId || draft.metadata.coverImage || draft.metadata.description) ? draft.metadata : null;
  state.selectedCoverFilePath = "";
  state.selectedScreenshotFilePaths = [];
  state.metadataSuggestions = [];
  renderMetadataSuggestions();
  updateMediaPreview();
}

function toggleGameDetails(gameId) {
  if (String(state.openDetailsGameId) === String(gameId)) {
    closeDetails();
    return;
  }

  openGame(gameId);
}

function renderDrawer(game) {
  const rows = [
    ["Genres", game.genres.join(", ")],
    ["Modes", game.modes.join(", ")],
    ["Developers", game.developers.join(", ")],
    ["Publishers", game.publishers.join(", ")],
    ["Release", game.releaseDate ? formatDate(game.releaseDate) : ""],
    ["Source", game.launch && game.launch.source ? cleanText(game.launch.source) : "Library"],
    ["Score", scoreText(game)],
  ].filter((row) => row[1]);

  return `
    <div class="drawer-cover" data-game-drawer-cover></div>
    <h3 class="drawer-game-title">${escapeHtml(game.title)}</h3>
    <p class="drawer-description">${escapeHtml(game.description)}</p>
    <div class="drawer-actions">
      <button class="primary-button" type="button" data-play-game="${game.id}" ${playButtonAttributes(game.id)}>${playButtonContent(game.id, 17)}</button>
      <button class="ghost-button" type="button">${icon("grid", 17)} Collection</button>
    </div>
    <div class="detail-list">
      ${rows.map(([label, value]) => `
        <div class="detail-row">
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(value)}</span>
        </div>
      `).join("")}
    </div>`;
}

function closeDetails() {
  state.openDetailsGameId = null;
  detailDrawer.classList.remove("open");
  detailDrawer.setAttribute("aria-hidden", "true");
}

async function playGame(gameId) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  if (!game) return;

  const launchKey = String(game.id);
  if (state.launchingGameIds.has(launchKey)) return;

  state.launchingGameIds.add(launchKey);
  setHeaderStatus("Starting...");
  render();

  try {
    const [result] = await Promise.all([
      window.electronAPI.launchGame(game.id),
      new Promise((resolve) => window.setTimeout(resolve, 3000)),
    ]);
    const updatedGame = result && result.game ? result.game : result;
    const launchResult = result && result.launch ? result.launch : { status: "started" };

    const index = state.games.findIndex((candidate) => String(candidate.id) === String(game.id));
    if (index >= 0) {
      state.games[index] = normalizeGame(updatedGame, state.games[index].index);
    }
    state.selectedGameId = updatedGame.id;

    if (launchResult.status === "failed") {
      setHeaderStatus(
        launchResult.reason === "process-not-found" ? "Launch failed" : "Could not start",
        "error"
      );
      console.error("Could not launch game.", launchResult);
    } else {
      // causes game started windowed or minimized
      // try {
      //   await window.electronAPI.minimizeWindow();
      // } catch (error) {
      //   console.error("Could not minimize window after launch.", error);
      // }
      updateReadyStatus();
    }
  } catch (error) {
    console.error("Could not launch game.", error);
    setHeaderStatus("Could not start", "error");
  } finally {
    state.launchingGameIds.delete(launchKey);
    render();
  }
}

async function toggleFavorite(gameId) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  if (!game) return;

  try {
    const updatedGame = await window.electronAPI.toggleFavorite(game.id);
    const index = state.games.findIndex((candidate) => String(candidate.id) === String(game.id));
    if (index >= 0) {
      state.games[index] = normalizeGame(updatedGame, state.games[index].index);
    }
    render();
  } catch (error) {
    console.error("Could not update favorite.", error);
  }
}

function openAddGamePanel() {
  closeDetails();
  setAddGameMode("create");
  addGameBackdrop.classList.add("open");
  addGameBackdrop.setAttribute("aria-hidden", "false");
  addGameDrawer.classList.add("open");
  addGameDrawer.setAttribute("aria-hidden", "false");
  addGameError.textContent = "";
  gameNameInput.focus();
}

function openEditGamePanel(gameId) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  if (!game) return;

  closeDetails();
  setAddGameMode("edit", game);
  fillEditorForm(game);
  addGameBackdrop.classList.add("open");
  addGameBackdrop.setAttribute("aria-hidden", "false");
  addGameDrawer.classList.add("open");
  addGameDrawer.setAttribute("aria-hidden", "false");
  gameNameInput.focus();
}

function closeAddGamePanel({ force = false } = {}) {
  if (state.isSavingGame && !force) return;
  closeMetadataSearchModal();
  addGameBackdrop.classList.remove("open");
  addGameBackdrop.setAttribute("aria-hidden", "true");
  addGameDrawer.classList.remove("open");
  addGameDrawer.setAttribute("aria-hidden", "true");
  resetAddGameForm();
}

function clearMetadataSearchTimer() {
  if (!state.metadataSearchTimer) return;
  window.clearTimeout(state.metadataSearchTimer);
  state.metadataSearchTimer = null;
}

function setMetadataFeedback(message, kind = "info") {
  metadataFeedback.textContent = message;
  metadataFeedback.classList.toggle("error", kind === "error");
}

function setGameDropFeedback(message, kind = "info") {
  gameDropFeedback.textContent = message;
  gameDropFeedback.classList.toggle("error", kind === "error");
}

function setGameDropBusy(isBusy, message) {
  state.isInspectingGameFile = isBusy;
  const isDisabled = isBusy || state.isSavingGame;
  gameDropZone.classList.toggle("is-disabled", isDisabled);
  gameDropZone.classList.remove("drag-over");
  gameDropZone.setAttribute("aria-disabled", String(isDisabled));
  gameDropZone.setAttribute("aria-busy", String(isDisabled));
  browseGameFile.disabled = isDisabled;
  if (message !== undefined) {
    setGameDropFeedback(message);
  }
}

function resetAddGameForm() {
  addGameForm.reset();
  setAddGameSaving(false);
  setAddGameMode("create");
  gameSourcePath.value = "";
  addGameError.textContent = "";
  setGameDropBusy(false, "");
  clearMetadataSearchTimer();
  state.metadataSearchToken += 1;
  state.selectedMetadata = null;
  state.modalSelectedMetadata = null;
  state.selectedCoverFilePath = "";
  state.selectedScreenshotFilePaths = [];
  state.metadataSuggestions = [];
  setMetadataFeedback("");
  metadataSuggestions.innerHTML = "";
  loadMetadataButton.disabled = true;
  updateMediaPreview();
}

function fillAddGameForm(draft) {
  fillEditorForm(draft);
}

async function inspectAndFillGame(filePath) {
  if (!filePath || state.isInspectingGameFile || state.isSavingGame) return;
  addGameError.textContent = "";
  setGameDropBusy(true, "Reading file...");

  try {
    const draft = await window.electronAPI.inspectGamePath(filePath);
    fillAddGameForm(draft);
    setGameDropFeedback("");
  } catch (error) {
    setGameDropFeedback("Could not read that file. Use an executable or shortcut.", "error");
  } finally {
    setGameDropBusy(false);
  }
}

function getAddGamePayload() {
  const editingGame = state.editorMode === "edit"
    ? state.games.find((game) => String(game.id) === String(state.editingGameId))
    : null;

  return {
    id: state.editingGameId,
    name: gameNameInput.value.trim(),
    favorite: editingGame ? Boolean(editingGame.favorite) : false,
    metadata: getEditorMetadata(),
    launch: {
      appId: state.editingGameAppId,
      source: state.editingGameSource,
      installDir: gameInstallDirInput.value.trim(),
      cmd: gameCmdInput.value.trim(),
      exe: gameExeInput.value.trim(),
      args: gameArgsInput.value.trim(),
    },
  };
}

function renderMetadataSuggestions() {
  metadataSuggestions.innerHTML = state.metadataSuggestions.map((metadata) => {
    const isSelected = state.modalSelectedMetadata && state.modalSelectedMetadata.igdbId === metadata.igdbId;
    const release = metadata.releaseDate ? new Date(metadata.releaseDate).getFullYear() : "";
    const meta = [
      release,
      metadata.genres.slice(0, 2).join(" / "),
      metadata.developers.slice(0, 1).join(""),
    ].filter(Boolean).join(" • ");

    return `
      <button class="metadata-option${isSelected ? " selected" : ""}" type="button" data-metadata-id="${metadata.igdbId}">
        ${metadata.coverImage ? `<img class="metadata-thumb" src="${escapeAttribute(metadata.coverImage)}" alt="">` : `<div class="metadata-thumb"></div>`}
        <span>
          <span class="metadata-option-title">${escapeHtml(metadata.name)}</span>
          <span class="metadata-option-meta">${escapeHtml(meta || "IGDB metadata")}</span>
          <span class="metadata-option-meta">${escapeHtml(metadata.description || "").slice(0, 120)}</span>
        </span>
      </button>`;
  }).join("");

  metadataSuggestions.querySelectorAll("[data-metadata-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const metadata = state.metadataSuggestions.find((item) => String(item.igdbId) === button.dataset.metadataId);
      if (!metadata) return;

      state.modalSelectedMetadata = metadata;
      loadMetadataButton.disabled = false;
      setMetadataFeedback("Ready to load selected metadata.");
      renderMetadataSuggestions();
    });
  });
}

function openMetadataSearchModal() {
  clearMetadataSearchTimer();
  state.metadataSearchToken += 1;
  state.modalSelectedMetadata = null;
  state.metadataSuggestions = [];
  metadataSuggestions.innerHTML = "";
  metadataSearchInput.value = gameNameInput.value.trim();
  loadMetadataButton.disabled = true;
  setMetadataFeedback("");
  metadataModalBackdrop.classList.remove("is-hidden");
  metadataModalBackdrop.setAttribute("aria-hidden", "false");
  metadataSearchInput.focus();

  if (metadataSearchInput.value.trim()) {
    searchMetadataSuggestions(metadataSearchInput.value.trim());
  }
}

function closeMetadataSearchModal() {
  clearMetadataSearchTimer();
  state.metadataSearchToken += 1;
  state.modalSelectedMetadata = null;
  state.metadataSuggestions = [];
  metadataSuggestions.innerHTML = "";
  loadMetadataButton.disabled = true;
  metadataModalBackdrop.classList.add("is-hidden");
  metadataModalBackdrop.setAttribute("aria-hidden", "true");
}

function toggleAddGameMenu() {
  addGameMenu.classList.toggle("is-hidden");
}

function closeAddGameMenu() {
  addGameMenu.classList.add("is-hidden");
}

function openScanFolderModal() {
  closeAddGameMenu();
  resetScanFolderModalState();
  syncScanFolderUi();
  scanFolderModalBackdrop.classList.remove("is-hidden");
  scanFolderModalBackdrop.setAttribute("aria-hidden", "false");
}

function closeScanFolderModalPanel() {
  if (state.isAddingScannedGames) return;
  if (state.isScanningFolder && state.activeScanId) {
    window.electronAPI.stopFolderScan(state.activeScanId);
  }
  scanFolderModalBackdrop.classList.add("is-hidden");
  scanFolderModalBackdrop.setAttribute("aria-hidden", "true");
  resetScanFolderModalState();
  syncScanFolderUi();
}

function getIgdbSetupMessage(reason = "missing_credentials") {
  const action = reason === "connection_failed"
    ? "Update your IGDB credentials in the Settings menu to enable metadata fetching."
    : "Add IGDB credentials in the Settings menu to enable metadata fetching.";

  return `
    <p>PlayDock connects to IGDB.com (Internet Game Database) to fetch game metadata like covers, summaries, genres, and release dates.</p>
    <p>${action}</p>
  `;
}

async function syncInfoModalShowTipsPreference() {
  await window.electronAPI.setShowTips(igdbInfoShowTipsInput.checked);
}

async function openIgdbInfoModal(message) {
  const appDoc = await window.electronAPI.getApp();
  igdbInfoModalText.innerHTML = message;
  igdbInfoShowTipsInput.checked = appDoc ? appDoc.showTips !== false : true;
  igdbInfoModalBackdrop.classList.remove("is-hidden");
  igdbInfoModalBackdrop.setAttribute("aria-hidden", "false");
}

function closeIgdbInfoModal() {
  igdbInfoModalText.textContent = "";
  igdbInfoModalBackdrop.classList.add("is-hidden");
  igdbInfoModalBackdrop.setAttribute("aria-hidden", "true");
}

function setIgdbTestFeedback(message = "", kind = "info") {
  igdbTestFeedback.textContent = message;
  igdbTestFeedback.classList.toggle("error", kind === "error");
}

function setShortcutFeedback(message = "", kind = "info") {
  shortcutFeedback.textContent = message;
  shortcutFeedback.classList.toggle("error", kind === "error");
}

async function runShortcutAction(button, pendingMessage, successMessage, action) {
  button.disabled = true;
  setShortcutFeedback(pendingMessage);

  try {
    await action();
    setShortcutFeedback(successMessage);
  } catch (error) {
    console.error("Could not create shortcut.", error);
    setShortcutFeedback("Could not create shortcut on this system.", "error");
  } finally {
    button.disabled = false;
  }
}

async function openSettingsModal() {
  closeAddGameMenu();
  const appDoc = await window.electronAPI.getApp();
  const settings = appDoc && appDoc.settings ? appDoc.settings : {};
  const igdbSettings = settings.igdb || {};
  const appDisplayName = cleanText(appDoc && appDoc.displayName ? appDoc.displayName : "PlayDock") || "PlayDock";
  const appVersion = cleanText(appDoc && appDoc.version ? appDoc.version : "");
  const appLicense = cleanText(appDoc && appDoc.license ? appDoc.license : "MIT") || "MIT";
  const appCopyright = cleanText(appDoc && appDoc.copyright
    ? appDoc.copyright
    : "Copyright (c) 2026 Firat Kiral") || "Copyright (c) 2026 Firat Kiral";
  const hiddenGames = await window.electronAPI.getHiddenGames();
  state.pendingUnhideGameIds = new Set();
  runOnStartupInput.checked = Boolean(settings.runOnStartup);
  closeToTrayInput.checked = settings.closeToTray !== false;
  igdbClientIdInput.value = igdbSettings.clientId || "";
  igdbClientSecretInput.value = igdbSettings.clientSecret || "";
  showTipsInput.checked = appDoc ? appDoc.showTips !== false : true;
  if (uiScaleSelect) {
    uiScaleSelect.value = settings && settings.uiScale ? String(settings.uiScale) : "1";
  }
  setAutoscanInputs(settings.autoscan);
  renderHiddenGames(hiddenGames);
  if (settingsAppVersionText) {
    settingsAppVersionText.textContent = appVersion ? `${appDisplayName} v${appVersion}` : appDisplayName;
  }
  if (settingsLicenseText) {
    settingsLicenseText.textContent = appLicense;
  }
  if (settingsCopyrightText) {
    settingsCopyrightText.textContent = appCopyright;
  }
  setIgdbTestFeedback("");
  setShortcutFeedback("");
  settingsModalBackdrop.classList.remove("is-hidden");
  settingsModalBackdrop.setAttribute("aria-hidden", "false");
}

function closeSettingsModalPanel() {
  setIgdbTestFeedback("");
  setShortcutFeedback("");
  state.pendingUnhideGameIds = new Set();
  settingsModalBackdrop.classList.add("is-hidden");
  settingsModalBackdrop.setAttribute("aria-hidden", "true");
}

async function openRssSettingsModal() {
  closeAddGameMenu();
  const appDoc = await window.electronAPI.getApp();
  const settings = appDoc && appDoc.settings ? appDoc.settings : {};
  rssSettingsUrlsInput.value = normalizeRssUrls(settings.rssUrls).join("\n");
  setRssSettingsFeedback("");
  rssSettingsModalBackdrop.classList.remove("is-hidden");
  rssSettingsModalBackdrop.setAttribute("aria-hidden", "false");
}

function closeRssSettingsModalPanel() {
  setRssSettingsFeedback("");
  rssSettingsModalBackdrop.classList.add("is-hidden");
  rssSettingsModalBackdrop.setAttribute("aria-hidden", "true");
}

function setRssSettingsFeedback(message = "", kind = "info") {
  rssSettingsFeedback.textContent = message;
  rssSettingsFeedback.classList.toggle("error", kind === "error");
}

function renderHiddenGames(games) {
  const visibleGames = (games || []).filter((game) => !state.pendingUnhideGameIds.has(String(game.id)));

  if (!visibleGames.length) {
    hiddenGamesList.innerHTML = `<div class="settings-inline-feedback">No hidden games.</div>`;
    return;
  }

  hiddenGamesList.innerHTML = visibleGames.map((game) => {
    const label = cleanText(game.metadata && game.metadata.name ? game.metadata.name : game.name || "Unknown Game");
    const source = cleanText(game.launch && game.launch.source ? game.launch.source : "local").toUpperCase();
    return `
      <div class="settings-row">
        <span>
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(source)}</span>
        </span>
        <button class="ghost-button" type="button" data-unhide-game="${game.id}">Unhide</button>
      </div>`;
  }).join("");

  hiddenGamesList.querySelectorAll("[data-unhide-game]").forEach((button) => {
    button.addEventListener("click", () => {
      const gameId = String(button.dataset.unhideGame);
      state.pendingUnhideGameIds.add(gameId);
      renderHiddenGames(games);
    });
  });
}

async function testIgdbConnection() {
  testIgdbConnectionButton.disabled = true;
  setIgdbTestFeedback("Testing IGDB connection...");

  try {
    const result = await window.electronAPI.testIgdbConnection({
      clientId: igdbClientIdInput.value,
      clientSecret: igdbClientSecretInput.value,
    });

    if (result.ok) {
      setIgdbStatus(result);
      setIgdbTestFeedback("Connection successful.");
      return;
    }

    setIgdbStatus(result);
    setIgdbTestFeedback(
      result.reason === "connection_failed"
        ? "Could not connect to IGDB with those credentials."
        : "Add both IGDB fields before testing.",
      "error"
    );
  } catch (error) {
    console.error("Could not test IGDB connection.", error);
    setIgdbStatus({ ok: false, reason: "connection_failed" });
    setIgdbTestFeedback("Could not test IGDB connection right now.", "error");
  } finally {
    testIgdbConnectionButton.disabled = false;
  }
}

async function saveSettings() {
  saveSettingsButton.disabled = true;
  try {
    const previousAppDoc = await window.electronAPI.getApp();
    const previousIgdbSettings = previousAppDoc && previousAppDoc.settings && previousAppDoc.settings.igdb
      ? previousAppDoc.settings.igdb
      : {};
    const nextIgdbSettings = {
      clientId: igdbClientIdInput.value.trim(),
      clientSecret: igdbClientSecretInput.value.trim(),
    };
    const previousAutoscanSources = previousAppDoc && previousAppDoc.settings
      ? previousAppDoc.settings.autoscan
      : undefined;
    const nextAutoscanSources = getSelectedAutoscanSources();
    const autoscanSourcesChanged = !sameAutoscanSources(previousAutoscanSources, nextAutoscanSources);
    const nextLibraryViewSettings = normalizeLibraryViewSettings(
      previousAppDoc && previousAppDoc.settings ? previousAppDoc.settings.libraryView : state.libraryView,
      nextAutoscanSources
    );
    const nextFavoritesViewSettings = normalizeFavoritesViewSettings(
      previousAppDoc && previousAppDoc.settings ? previousAppDoc.settings.favoritesView : state.favoritesView
    );
    const igdbCredentialsChanged = previousIgdbSettings.clientId !== nextIgdbSettings.clientId
      || previousIgdbSettings.clientSecret !== nextIgdbSettings.clientSecret;

    await window.electronAPI.updateAppSettings({
      runOnStartup: runOnStartupInput.checked,
      closeToTray: closeToTrayInput.checked,
      igdb: nextIgdbSettings,
      rssUrls: previousAppDoc && previousAppDoc.settings ? previousAppDoc.settings.rssUrls : [],
      autoscan: nextAutoscanSources,
      libraryView: nextLibraryViewSettings,
      favoritesView: nextFavoritesViewSettings,
      uiScale: uiScaleSelect ? Number(uiScaleSelect.value) : (previousAppDoc && previousAppDoc.settings ? previousAppDoc.settings.uiScale : 1),
      showTips: showTipsInput.checked,
    });
    // Apply zoom immediately after saving
    try {
      if (uiScaleSelect && window.electronAPI && typeof window.electronAPI.setZoomFactor === 'function') {
        await window.electronAPI.setZoomFactor(Number(uiScaleSelect.value));
      }
    } catch (err) {
      console.warn('Could not apply zoom factor:', err);
    }
    applyEnabledAutoscanSources(nextAutoscanSources);
    state.libraryView = nextLibraryViewSettings;
    state.favoritesView = nextFavoritesViewSettings;

    for (const gameId of state.pendingUnhideGameIds) {
      const game = await window.electronAPI.unhideGame(gameId);
      const normalizedGame = normalizeGame(game, state.games.length);
      const existingIndex = state.games.findIndex((candidate) => String(candidate.id) === String(game.id));
      if (existingIndex >= 0) {
        state.games[existingIndex] = normalizedGame;
      } else {
        state.games.push(normalizedGame);
      }
    }
    state.games = state.games.filter((candidate) => !candidate.hidden);
    state.games.sort((a, b) => a.title.localeCompare(b.title));

    closeSettingsModalPanel();
    if (autoscanSourcesChanged) {
      setHeaderStatus("Updating library");
      await loadGames({ hydrate: false });
    } else {
      render();
    }

    const igdbStatus = await window.electronAPI.getIgdbStatus();
    setIgdbStatus(igdbStatus);

    if (!igdbStatus.ok) {
      return;
    }

    if (igdbCredentialsChanged || autoscanSourcesChanged) {
      hydrateMetadata();
    }
  } catch (error) {
    console.error("Could not save settings.", error);
    setIgdbTestFeedback("Could not save settings right now.", "error");
  } finally {
    saveSettingsButton.disabled = false;
  }
}

async function saveRssSettings() {
  saveRssSettingsButton.disabled = true;
  setRssSettingsFeedback("Saving RSS settings...");

  try {
    const previousAppDoc = await window.electronAPI.getApp();
    const previousSettings = previousAppDoc && previousAppDoc.settings ? previousAppDoc.settings : {};
    const previousRssUrls = normalizeRssUrls(previousSettings.rssUrls);
    const nextRssUrls = normalizeRssUrls(rssSettingsUrlsInput.value);
    const rssUrlsChanged = !sameRssUrls(previousRssUrls, nextRssUrls);

    await window.electronAPI.updateAppSettings({
      runOnStartup: Boolean(previousSettings.runOnStartup),
      closeToTray: previousSettings.closeToTray !== false,
      igdb: previousSettings.igdb || {},
      rssUrls: nextRssUrls,
      autoscan: previousSettings.autoscan,
      libraryView: previousSettings.libraryView,
      favoritesView: previousSettings.favoritesView,
      uiScale: previousSettings.uiScale || 1,
      showTips: previousAppDoc ? previousAppDoc.showTips !== false : true,
    });

    closeRssSettingsModalPanel();

    if (state.page === "rss" && rssUrlsChanged) {
      await loadRssFeed();
    }
  } catch (error) {
    console.error("Could not save RSS settings.", error);
    setRssSettingsFeedback("Could not save RSS settings right now.", "error");
  } finally {
    saveRssSettingsButton.disabled = false;
  }
}

function setScanFolderFeedback(message, kind = "info") {
  scanFolderFeedback.textContent = message;
  scanFolderFeedback.classList.toggle("error", kind === "error");
}

function getScanningText(step = 0) {
  const sequence = ["Scanning", "Scanning.", "Scanning..", "Scanning..."];
  return sequence[step % sequence.length];
}

function renderAddScannedGamesButton() {
  if (state.isAddingScannedGames) {
    addScannedGamesButton.innerHTML = '<span class="button-label"><span class="button-spinner" aria-hidden="true"></span><span>Adding...</span></span>';
  } else {
    addScannedGamesButton.textContent = "Add";
  }
  addScannedGamesButton.setAttribute("aria-busy", String(state.isAddingScannedGames));
}

function resetScanFolderModalState() {
  stopScanningFeedbackAnimation();
  state.scannedExecutables = [];
  state.selectedScannedPaths = new Set();
  state.scanFolderPath = "";
  state.activeScanId = null;
  state.isScanningFolder = false;
  state.isAddingScannedGames = false;
  scanFolderInput.textContent = "No folder selected";
  scanFolderFeedback.textContent = "";
  scanFolderFeedback.classList.remove("error");
  scanFolderResults.innerHTML = "";
}

function updateScanFolderModalState() {
  const isBusy = state.isAddingScannedGames;
  scanFolderModalPanel.classList.toggle("is-busy", isBusy);
  scanFolderModalPanel.setAttribute("aria-busy", String(isBusy));
  selectScanFolderButton.disabled = isBusy;
  closeScanFolderModal.disabled = isBusy;
  cancelScanFolderModal.disabled = isBusy;
  addScannedGamesButton.disabled = isBusy || state.selectedScannedPaths.size === 0 || state.isScanningFolder;
  renderAddScannedGamesButton();
}

function syncScanFolderUi() {
  renderScannedExecutables();
  updateScanFolderAction();
  updateScanFolderModalState();
}

function renderScanningFeedback() {
  const base = getScanningText(state.scanFeedbackStep);
  const foundCount = state.scannedExecutables.length;
  const prefix = foundCount > 0
    ? `${foundCount} game${foundCount === 1 ? "" : "s"} found. `
    : "";

  setScanFolderFeedback(`${prefix}${base}`);
}

function stopScanningFeedbackAnimation() {
  if (!state.scanFeedbackTimer) return;
  window.clearInterval(state.scanFeedbackTimer);
  state.scanFeedbackTimer = null;
}

function startScanningFeedbackAnimation() {
  stopScanningFeedbackAnimation();
  state.scanFeedbackStep = 0;
  renderScanningFeedback();
  state.scanFeedbackTimer = window.setInterval(() => {
    if (!state.isScanningFolder) {
      stopScanningFeedbackAnimation();
      return;
    }

    state.scanFeedbackStep = (state.scanFeedbackStep + 1) % 4;
    renderScanningFeedback();
  }, 450);
}

function renderScannedExecutables() {
  scanFolderResults.innerHTML = state.scannedExecutables.map((item) => {
    const checked = state.selectedScannedPaths.has(item.path);
    const disabled = state.isScanningFolder || state.isAddingScannedGames;
    return `
      <label class="scan-option${disabled ? " is-disabled" : ""}">
        <input type="checkbox" data-scan-path="${escapeAttribute(item.path)}"${checked ? " checked" : ""}${disabled ? " disabled" : ""}>
        ${item.icon ? `<img class="scan-option-icon" src="${escapeAttribute(item.icon)}" alt="">` : `<span class="scan-option-icon"></span>`}
        <span>
          <span class="scan-option-title">${escapeHtml(item.name)}</span>
          <span class="scan-option-path">${escapeHtml(item.path)}</span>
        </span>
      </label>`;
  }).join("");

  scanFolderResults.querySelectorAll("[data-scan-path]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (state.isScanningFolder || state.isAddingScannedGames) {
        checkbox.checked = state.selectedScannedPaths.has(checkbox.dataset.scanPath);
        return;
      }

      if (checkbox.checked) {
        state.selectedScannedPaths.add(checkbox.dataset.scanPath);
      } else {
        state.selectedScannedPaths.delete(checkbox.dataset.scanPath);
      }
      updateScanFolderModalState();
      setScanFolderFeedback(`${state.selectedScannedPaths.size} selected`);
    });
  });
}

function appendScannedExecutable(item) {
  if (!item || !item.path) return;
  if (state.scannedExecutables.some((candidate) => candidate.path === item.path)) return;

  state.scannedExecutables.push(item);
  state.scannedExecutables.sort((a, b) => a.name.localeCompare(b.name));
  syncScanFolderUi();
}

function updateScanFolderAction() {
  scanFolderActionButton.textContent = state.isScanningFolder ? "Stop" : "Scan";
  scanFolderActionButton.disabled = state.isAddingScannedGames || (!state.isScanningFolder && !state.scanFolderPath);
}

async function selectScanFolder() {
  if (state.isScanningFolder || state.isAddingScannedGames) return;

  try {
    const folderPath = await window.electronAPI.selectScanFolder();
    if (!folderPath) return;

    state.scanFolderPath = folderPath;
    state.scannedExecutables = [];
    state.selectedScannedPaths = new Set();
    scanFolderInput.textContent = folderPath;
    setScanFolderFeedback("");
    syncScanFolderUi();
  } catch (error) {
    setScanFolderFeedback("Could not select that folder.", "error");
  }
}

async function startScanFolder() {
  if (!state.scanFolderPath || state.isScanningFolder || state.isAddingScannedGames) return;

  state.scannedExecutables = [];
  state.selectedScannedPaths = new Set();
  state.isScanningFolder = true;
  startScanningFeedbackAnimation();
  syncScanFolderUi();

  try {
    const result = await window.electronAPI.startFolderScan(state.scanFolderPath);
    state.activeScanId = result.scanId;
  } catch (error) {
    stopScanningFeedbackAnimation();
    state.isScanningFolder = false;
    state.activeScanId = null;
    syncScanFolderUi();
    setScanFolderFeedback("Could not scan that folder.", "error");
  }
}

async function stopScanFolder() {
  if (!state.isScanningFolder || !state.activeScanId) return;
  await window.electronAPI.stopFolderScan(state.activeScanId);
  renderScanningFeedback();
}

function handleScanFolderAction() {
  if (state.isScanningFolder) {
    stopScanFolder();
  } else {
    startScanFolder();
  }
}

async function addSelectedScannedGames() {
  if (state.isAddingScannedGames) return;
  const selectedItems = state.scannedExecutables.filter((item) => state.selectedScannedPaths.has(item.path));
  if (!selectedItems.length) return;

  state.isAddingScannedGames = true;
  syncScanFolderUi();
  setScanFolderFeedback(`Adding ${selectedItems.length} game${selectedItems.length === 1 ? "" : "s"}...`);

  const addedGames = [];
  try {
    for (const item of selectedItems) {
      try {
        const draft = await window.electronAPI.inspectGamePath(item.path);
        const game = await window.electronAPI.addLocalGame({
          name: draft.name || item.name,
          favorite: false,
          metadata: null,
          launch: draft.launch || {
            appId: "",
            source: "local",
            installDir: item.installDir || "",
            cmd: item.path,
            exe: item.exe || "",
            args: "",
          },
        });
        addedGames.push(game);
      } catch (error) {
        console.error("Could not add scanned game.", error);
      }
    }

    mergeGamesIntoState(addedGames);
    if (addedGames.length) {
      state.selectedGameId = addedGames[0].id;
    }
  } finally {
    state.isAddingScannedGames = false;
    syncScanFolderUi();
  }

  closeScanFolderModalPanel();
  render();
  addedGames.forEach((game) => ensureGameMetadata(game.id));
}

function formatMetadataSearchError(error) {
  const message = cleanText(error && error.message ? error.message : "");
  if (!message) return "Could not pull metadata. Check your connection and IGDB settings.";
  if (message.includes("missing-game-name")) return "Enter a game name to load metadata suggestions.";
  if (message.includes("Client ID or Client Secret not set")) return "Could not pull metadata. Configure IGDB client credentials in Settings.";
  return `Could not pull metadata: ${message}`;
}

function mergeGamesIntoState(games) {
  for (const game of games) {
    const normalizedGame = normalizeGame(game, state.games.length);
    const existingIndex = state.games.findIndex((candidate) => String(candidate.id) === String(game.id));
    if (existingIndex >= 0) {
      state.games[existingIndex] = normalizedGame;
    } else {
      state.games.push(normalizedGame);
    }
  }

  state.games.sort((a, b) => a.title.localeCompare(b.title));
}

async function searchMetadataSuggestions(query, { preserveSelection = false } = {}) {
  const trimmedQuery = cleanText(query);
  if (!trimmedQuery) {
    clearMetadataSearchTimer();
    state.metadataSearchToken += 1;
    state.modalSelectedMetadata = null;
    state.metadataSuggestions = [];
    metadataSuggestions.innerHTML = "";
    loadMetadataButton.disabled = true;
    setMetadataFeedback("");
    return;
  }

  const requestToken = state.metadataSearchToken + 1;
  state.metadataSearchToken = requestToken;
  setMetadataFeedback("Loading metadata...");
  metadataSuggestions.innerHTML = "";
  loadMetadataButton.disabled = true;

  try {
    const suggestions = await window.electronAPI.searchMetadata(trimmedQuery);
    if (requestToken !== state.metadataSearchToken) {
      return;
    }

    state.metadataSuggestions = suggestions;

    if (preserveSelection && state.modalSelectedMetadata) {
      const matchedMetadata = suggestions.find((item) => item.igdbId === state.modalSelectedMetadata.igdbId);
      state.modalSelectedMetadata = matchedMetadata || null;
    } else {
      state.modalSelectedMetadata = null;
    }

    loadMetadataButton.disabled = !state.modalSelectedMetadata;
    renderMetadataSuggestions();

    if (state.modalSelectedMetadata) {
      setMetadataFeedback("Ready to load selected metadata.");
    } else if (suggestions.length) {
      setMetadataFeedback("Choose a metadata match to load.");
    } else {
      setMetadataFeedback("No metadata suggestions found.");
    }
  } catch (error) {
    if (requestToken !== state.metadataSearchToken) {
      return;
    }

    state.modalSelectedMetadata = null;
    state.metadataSuggestions = [];
    metadataSuggestions.innerHTML = "";
    loadMetadataButton.disabled = true;
    setMetadataFeedback(formatMetadataSearchError(error), "error");
  }
}

function queueMetadataSuggestions({ immediate = false } = {}) {
  clearMetadataSearchTimer();

  const query = metadataSearchInput.value.trim();
  if (!query) {
    searchMetadataSuggestions("");
    return;
  }

  const preserveSelection = Boolean(
    state.modalSelectedMetadata && cleanText(state.modalSelectedMetadata.name).toLowerCase() === cleanText(query).toLowerCase()
  );

  const runSearch = () => searchMetadataSuggestions(query, { preserveSelection });
  if (immediate) {
    runSearch();
    return;
  }

  state.metadataSearchTimer = window.setTimeout(() => {
    state.metadataSearchTimer = null;
    runSearch();
  }, 450);
}

async function hydrateMetadata() {
  const gamesNeedingMetadata = state.games
    .filter((game) => !hasMetadata(game));
  state.metadataLoaded = 0;
  state.metadataTotal = gamesNeedingMetadata.length;
  updateMetadataStatus();

  for (const game of gamesNeedingMetadata) {
    await ensureGameMetadata(game.id, true);
  }
}

function ensureGameMetadata(gameId, countProgress = false) {
  const game = state.games.find((candidate) => String(candidate.id) === String(gameId));
  
  if (!game || hasMetadata(game) || state.metadataRequests.has(game.id)) {
    return Promise.resolve();
  }

  state.metadataRequests.add(game.id);
  return window.electronAPI.getMetadata(game.id)
    .then((metadata) => {
      const index = state.games.findIndex((candidate) => candidate.id === game.id);
      if (index >= 0) {
        state.games[index] = normalizeGame({ ...state.games[index], metadata }, state.games[index].index);
        refreshGameMetadata(state.games[index]);
      }
    })
    .catch(() => {})
    .finally(() => {
      state.metadataRequests.delete(game.id);
      if (countProgress) {
        state.metadataLoaded += 1;
        updateMetadataStatus();
      }
    });
}

function updateMetadataStatus() {
  if (state.metadataLoaded === state.metadataTotal) {
    updateReadyStatus();
    return;
  }

  const done = Math.min(state.metadataLoaded, state.metadataTotal);
  setHeaderStatus(`Metadata ${done}/${state.metadataTotal}`);
}

function scoreText(game) {
  const score = game.criticScore || game.communityScore;
  if (!score) return "";
  return `${Math.round(score)} score`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return cleanText(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeSvgText(value) {
  const text = cleanText(value);
  const shortText = text.length > 18 ? `${text.slice(0, 16)}...` : text;
  return shortText
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function bindControls() {
  declineTermsButton.addEventListener("click", () => {
    window.electronAPI.closeWindow();
  });

  acceptTermsButton.addEventListener("click", async () => {
    await window.electronAPI.acceptTerms();
    termsModalBackdrop.classList.add("is-hidden");
    termsModalBackdrop.setAttribute("aria-hidden", "true");
    termsModalBackdrop.dispatchEvent(new CustomEvent("terms-accepted"));
  });

  dismissIgdbInfoButton.addEventListener("click", async () => {
    await syncInfoModalShowTipsPreference();
    closeIgdbInfoModal();
  });
  openSettingsFromIgdbInfoButton.addEventListener("click", async () => {
    await syncInfoModalShowTipsPreference();
    closeIgdbInfoModal();
    await openSettingsModal();
  });

  window.electronAPI.onFolderScanItem(({ scanId, item }) => {
    if (scanId !== state.activeScanId) return;
    appendScannedExecutable(item);
    if (state.isScanningFolder) {
      renderScanningFeedback();
    }
  });

  window.electronAPI.onFolderScanDone(({ scanId, canceled, error, count }) => {
    if (scanId !== state.activeScanId) return;

    stopScanningFeedbackAnimation();
    state.isScanningFolder = false;
    state.activeScanId = null;
    syncScanFolderUi();

    if (error) {
      setScanFolderFeedback("Could not scan that folder.", "error");
      return;
    }

    if (canceled) {
      setScanFolderFeedback(`Scan stopped. ${state.scannedExecutables.length} executable${state.scannedExecutables.length === 1 ? "" : "s"} found`);
      return;
    }

    const found = typeof count === "number" ? count : state.scannedExecutables.length;
    setScanFolderFeedback(found
      ? `${found} executable${found === 1 ? "" : "s"} found`
      : "No executables found in that folder.");
  });

  windowCloseButton.addEventListener("click", () => {
    window.electronAPI.closeWindow();
  });

  windowMinimizeButton.addEventListener("click", () => {
    window.electronAPI.minimizeWindow();
  });

  windowMaximizeButton.addEventListener("click", () => {
    window.electronAPI.toggleMaximizeWindow();
  });

  topbar.addEventListener("dblclick", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button, input, label, a, select, textarea")) {
      return;
    }

    window.electronAPI.toggleMaximizeWindow();
  });

  searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    render();
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      navButtons.forEach((item) => item.classList.toggle("active", item === button));
      if (state.page === "rss") {
        loadRssFeed();
      } else {
        state.view = "all";
        updateReadyStatus();
        render();
      }
    });
  });

  closeDrawer.addEventListener("click", closeDetails);
  openSettings.addEventListener("click", openSettingsModal);
  closeSettingsModal.addEventListener("click", closeSettingsModalPanel);
  cancelSettingsModal.addEventListener("click", closeSettingsModalPanel);
  saveSettingsButton.addEventListener("click", saveSettings);
  closeRssSettingsModal.addEventListener("click", closeRssSettingsModalPanel);
  cancelRssSettingsModal.addEventListener("click", closeRssSettingsModalPanel);
  saveRssSettingsButton.addEventListener("click", saveRssSettings);
  testIgdbConnectionButton.addEventListener("click", testIgdbConnection);
  igdbCredentialsHelpLink.addEventListener("click", openExternalLink);
  pinToStartButton.addEventListener("click", () => {
    runShortcutAction(
      pinToStartButton,
      "Adding PlayDock to Start...",
      "PlayDock was added to Start.",
      window.electronAPI.createStartMenuShortcut
    );
  });
  createDesktopShortcutButton.addEventListener("click", () => {
    runShortcutAction(
      createDesktopShortcutButton,
      "Creating desktop shortcut...",
      "Desktop shortcut created.",
      window.electronAPI.createDesktopShortcut
    );
  });
  openAddGame.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleAddGameMenu();
  });
  addGameMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  addGameMenuAdd.addEventListener("click", () => {
    closeAddGameMenu();
    openAddGamePanel();
  });
  addGameMenuScan.addEventListener("click", openScanFolderModal);
  addGameBackdrop.addEventListener("click", () => {
    if (state.editorMode === "edit") {
      closeAddGamePanel();
    }
  });
  closeAddGame.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAddGamePanel();
  });
  cancelAddGame.addEventListener("click", closeAddGamePanel);
  openMetadataModal.addEventListener("click", () => {
    if (!state.isSavingGame) openMetadataSearchModal();
  });
  clearCoverButton.addEventListener("click", () => {
    if (!state.isSavingGame) clearCoverImage();
  });
  clearScreenshotsButton.addEventListener("click", () => {
    if (!state.isSavingGame) clearScreenshots();
  });
  clearMetadataButton.addEventListener("click", () => {
    if (!state.isSavingGame) clearEditorMetadata();
  });
  closeMetadataModal.addEventListener("click", closeMetadataSearchModal);
  cancelMetadataModal.addEventListener("click", closeMetadataSearchModal);
  metadataModalBackdrop.addEventListener("click", (event) => {
    if (event.target === metadataModalBackdrop) {
      closeMetadataSearchModal();
    }
  });
  closeScanFolderModal.addEventListener("click", closeScanFolderModalPanel);
  cancelScanFolderModal.addEventListener("click", closeScanFolderModalPanel);
  scanFolderModalBackdrop.addEventListener("click", (event) => {
    if (event.target === scanFolderModalBackdrop) {
      closeScanFolderModalPanel();
    }
  });
  selectScanFolderButton.addEventListener("click", selectScanFolder);
  scanFolderActionButton.addEventListener("click", handleScanFolderAction);
  addScannedGamesButton.addEventListener("click", addSelectedScannedGames);
  loadMetadataButton.addEventListener("click", () => {
    if (!state.modalSelectedMetadata) return;
    applyMetadataToEditor(state.modalSelectedMetadata);
    closeMetadataSearchModal();
  });
  editGameDanger.addEventListener("click", async () => {
    if (state.isSavingGame) return;
    if (state.editorMode !== "edit" || !state.editingGameId) return;

    try {
      if (isLocalSource(state.editingGameSource)) {
        await window.electronAPI.deleteGame(state.editingGameId);
      } else {
        await window.electronAPI.hideGame(state.editingGameId);
      }

      state.games = state.games.filter((game) => String(game.id) !== String(state.editingGameId));
      closeAddGamePanel();
      render();
    } catch (error) {
      addGameError.textContent = isLocalSource(state.editingGameSource)
        ? "Could not delete this game."
        : "Could not hide this game.";
    }
  });

  document.addEventListener("click", (event) => {
    closeAddGameMenu();
    const target = event.target;
    if (!state.openDetailsGameId) return;

    if (!(target instanceof Element)) return;
    if (target.closest("#detailDrawer")) return;
    if (target.closest("[data-details-game]")) return;
    if (target.closest("[data-details-rss]")) return;

    closeDetails();
  });

  browseGameFile.addEventListener("click", async () => {
    if (state.isInspectingGameFile || state.isSavingGame) return;
    addGameError.textContent = "";
    setGameDropBusy(true, "Reading file...");

    try {
      const draft = await window.electronAPI.browseGameFile();
      if (draft) {
        fillAddGameForm(draft);
        setGameDropFeedback("");
      } else {
        setGameDropFeedback("");
      }
    } catch (error) {
      setGameDropFeedback("Could not open that file.", "error");
    } finally {
      setGameDropBusy(false);
    }
  });

  gameNameInput.addEventListener("input", () => {
    addGameError.textContent = "";
    if (state.selectedMetadata) {
      state.selectedMetadata = { ...state.selectedMetadata, name: gameNameInput.value.trim() };
    }
  });

  gameDescriptionInput.addEventListener("input", () => {
    if (state.selectedMetadata) {
      state.selectedMetadata = { ...state.selectedMetadata, description: gameDescriptionInput.value.trim() };
    }
    updateEditorMetadataActions();
  });

  gameGenresInput.addEventListener("input", () => {
    if (state.selectedMetadata) {
      state.selectedMetadata = { ...state.selectedMetadata, genres: parseListInput(gameGenresInput.value) };
    }
    updateEditorMetadataActions();
  });

  gameCoverImageInput.addEventListener("change", () => {
    const file = gameCoverImageInput.files && gameCoverImageInput.files[0] ? gameCoverImageInput.files[0] : null;
    state.selectedCoverFilePath = file ? window.electronAPI.getPathForFile(file) : "";
    if (state.selectedMetadata) {
      state.selectedMetadata = {
        ...state.selectedMetadata,
        coverImage: state.selectedCoverFilePath || state.selectedMetadata.coverImage || ""
      };
    }
    updateMediaPreview();
  });

  gameScreenshotsInput.addEventListener("change", () => {
    state.selectedScreenshotFilePaths = [...(gameScreenshotsInput.files || [])]
      .map((file) => window.electronAPI.getPathForFile(file))
      .filter(Boolean);
    if (state.selectedMetadata) {
      state.selectedMetadata = {
        ...state.selectedMetadata,
        screenshots: state.selectedScreenshotFilePaths.length
          ? state.selectedScreenshotFilePaths
          : Array.isArray(state.selectedMetadata.screenshots) ? state.selectedMetadata.screenshots : []
      };
    }
    updateMediaPreview();
  });

  metadataSearchInput.addEventListener("input", queueMetadataSuggestions);
  metadataSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchMetadataSuggestions(metadataSearchInput.value.trim());
    }
  });

  gameDropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (state.isInspectingGameFile || state.isSavingGame) return;
    gameDropZone.classList.add("drag-over");
  });

  gameDropZone.addEventListener("dragleave", () => {
    gameDropZone.classList.remove("drag-over");
  });

  gameDropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    gameDropZone.classList.remove("drag-over");
    if (state.isInspectingGameFile || state.isSavingGame) return;

    const file = event.dataTransfer.files[0];
    if (!file) return;

    const filePath = window.electronAPI.getPathForFile(file);
    await inspectAndFillGame(filePath);
  });

  addGameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isSavingGame) return;
    addGameError.textContent = "";

    const payload = getAddGamePayload();
    if (!payload.name) {
      addGameError.textContent = "Game name is required.";
      return;
    }
    if ((state.editorMode !== "edit" || isLocalSource(state.editingGameSource)) && !payload.launch.cmd) {
      addGameError.textContent = "Launch path is required.";
      return;
    }

    setAddGameSaving(true);
    try {
      const game = state.editorMode === "edit"
        ? await window.electronAPI.updateGame(payload)
        : await window.electronAPI.addLocalGame(payload);
      mergeGamesIntoState([game]);
      state.selectedGameId = game.id;
      closeAddGamePanel({ force: true });
      render();
    } catch (error) {
      addGameError.textContent = state.editorMode === "edit"
        ? "Could not save changes for this game."
        : "Could not save this game.";
      setAddGameSaving(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!addGameMenu.classList.contains("is-hidden")) {
        closeAddGameMenu();
        return;
      }
      if (!scanFolderModalBackdrop.classList.contains("is-hidden")) {
        closeScanFolderModalPanel();
        return;
      }
      if (!settingsModalBackdrop.classList.contains("is-hidden")) {
        return;
      }
      if (!rssSettingsModalBackdrop.classList.contains("is-hidden")) {
        closeRssSettingsModalPanel();
        return;
      }
      if (!metadataModalBackdrop.classList.contains("is-hidden")) {
        closeMetadataSearchModal();
        return;
      }
      closeDetails();
      closeAddGamePanel();
    }
  });
}

async function ensureTermsAccepted() {
  const appDoc = await window.electronAPI.getApp();
  if (appDoc && appDoc.termsAccepted) {
    return true;
  }

  const terms = await window.electronAPI.getTerms();
  termsContent.textContent = terms || "";
  termsModalBackdrop.classList.remove("is-hidden");
  termsModalBackdrop.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    termsModalBackdrop.addEventListener("terms-accepted", () => resolve(true), { once: true });
  });
}

async function ensureIgdbSettingsReady() {
  const appDoc = await window.electronAPI.getApp();
  const igdbStatus = await window.electronAPI.getIgdbStatus();
  setIgdbStatus(igdbStatus);

  if (igdbStatus.ok) {
    return true;
  }

  const credentials = appDoc && appDoc.settings && appDoc.settings.igdb ? appDoc.settings.igdb : {};
  const hasClientId = Boolean(String(credentials.clientId || "").trim());
  const hasClientSecret = Boolean(String(credentials.clientSecret || "").trim());

  if (appDoc && appDoc.showTips !== false && !hasClientId && !hasClientSecret) {
    await openIgdbInfoModal(getIgdbSetupMessage(igdbStatus.reason));
  }

  return true;
}

async function init() {
  bindControls();

  try {
    await ensureTermsAccepted();
    await ensureIgdbSettingsReady();
    const appDoc = await window.electronAPI.getApp();
    try {
      const scale = appDoc && appDoc.settings && appDoc.settings.uiScale ? Number(appDoc.settings.uiScale) : 1;
      if (window.electronAPI && typeof window.electronAPI.setZoomFactor === 'function') {
        await window.electronAPI.setZoomFactor(scale);
      }
    } catch (err) {
      console.warn('Could not apply saved UI scale:', err);
    }
    applyEnabledAutoscanSources(appDoc && appDoc.settings ? appDoc.settings.autoscan : undefined);
    applyLibraryViewSettings(appDoc && appDoc.settings ? appDoc.settings.libraryView : {});
    applyFavoritesViewSettings(appDoc && appDoc.settings ? appDoc.settings.favoritesView : {});

    await loadGames();
  } catch (error) {
    console.error(error);
    setLibraryIntroVisible(false);
    heroDock.innerHTML = "";
    shelvesContent.innerHTML = "";
    libraryContent.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Could not load games</strong>
          <p>Check the Electron console for the IPC error.</p>
        </div>
      </div>`;
    librarySummary.textContent = "Library unavailable";
    setHeaderStatus("Error", "error");
  }
}

init();
