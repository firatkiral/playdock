const https = require('https');

let igdbCredentialsProvider = () => ({ clientId: '', clientSecret: '' });

function getCurrentCredentials() {
    const credentials = igdbCredentialsProvider() || {};
    return {
        clientId: credentials.clientId || '',
        clientSecret: credentials.clientSecret || '',
    };
}

function httpsRequest(options, requestBody = '') {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            // Concatenate data chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Resolve the promise once the response ends
            res.on('end', () => {
                const respond = {
                    statusCode: res.statusCode,
                    body: data
                };
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(respond);
                } else {
                    reject(respond);
                }
            });
        });

        req.on('error', (e) => {
            reject({
                message: e.message,
                statusCode: 500
            });
        });

        // Write request body if present
        if (requestBody) {
            req.write(requestBody);
        }

        req.end();
    });
}

// --- Similarity helpers for fuzzy matching ---
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'with', '&'
]);

function normalizeTitle(s) {
    if (!s) return '';
    return s
        .toString()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[\u00AE\u2122]/g, ' ') // remove ® ™
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizeTitle(s) {
    const normalized = normalizeTitle(s);
    if (!normalized) return [];
    return [...new Set(normalized.split(' ').filter(t => t && t.length > 1 && !STOP_WORDS.has(t)))];
}

function levenshteinDistance(a, b) {
    // iterative DP, memory-optimized
    if (a === b) return 0;
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    let prev = new Array(bl + 1);
    let cur = new Array(bl + 1);
    for (let j = 0; j <= bl; j++) prev[j] = j;
    for (let i = 1; i <= al; i++) {
        cur[0] = i;
        const ai = a.charAt(i - 1);
        for (let j = 1; j <= bl; j++) {
            const cost = ai === b.charAt(j - 1) ? 0 : 1;
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        const tmp = prev; prev = cur; cur = tmp;
    }
    return prev[bl];
}

function levenshteinRatio(a, b) {
    const A = a || '';
    const B = b || '';
    const maxLen = Math.max(A.length, B.length);
    if (maxLen === 0) return 1;
    const d = levenshteinDistance(A, B);
    return 1 - (d / maxLen);
}

function tokenOverlapScore(a, b) {
    const ta = tokenizeTitle(a);
    const tb = tokenizeTitle(b);
    if (ta.length === 0 && tb.length === 0) return 0;
    const setB = new Set(tb);
    const intersection = ta.filter(t => setB.has(t)).length;
    const union = new Set([...ta, ...tb]).size || 1;
    return intersection / union;
}

function similarityScore(a, b) {
    // combine token overlap and edit-distance (levenshtein ratio)
    const ta = tokenizeTitle(a).join(' ');
    const tb = tokenizeTitle(b).join(' ');
    const tokenScore = tokenOverlapScore(a, b);
    const levScore = levenshteinRatio(ta || normalizeTitle(a), tb || normalizeTitle(b));

    // short titles rely more on edit-distance; longer on token overlap
    const combined = (tokenScore * 0.7) + (levScore * 0.3);
    const normA = normalizeTitle(a);
    const normB = normalizeTitle(b);

    // give strong boost if normalized strings are identical
    if (normA && normA === normB) return 1;
    return combined;
}

const tokenCache = {
    token: null,
    expiresAt: 0
};

async function requestIgdbToken() {
    const credentials = getCurrentCredentials();
    const IGDB_CLIENT_ID = credentials.clientId;
    const IGDB_CLIENT_SECRET = credentials.clientSecret;
    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
        throw new Error("IGDB Client ID or Client Secret not set in settings.");
    }
    const body = `client_id=${encodeURIComponent(IGDB_CLIENT_ID)}&client_secret=${encodeURIComponent(IGDB_CLIENT_SECRET)}&grant_type=client_credentials`;
    const options = {
        hostname: 'id.twitch.tv',
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    const res = await httpsRequest(options, body);
    const { access_token, expires_in, token_type } = JSON.parse(res.body);

    tokenCache.token = access_token;
    const expiresInMs = (expires_in || 0) * 1000;
    tokenCache.expiresAt = Date.now() + expiresInMs - (24 * 60 * 60 * 1000); // Refresh 1 day before expiry
    return tokenCache.token;
}

async function validateCredentials(credentials = {}) {
    const clientId = credentials.clientId || '';
    const clientSecret = credentials.clientSecret || '';

    if (!clientId || !clientSecret) {
        throw new Error("IGDB Client ID or Client Secret not set in settings.");
    }

    const body = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
    const options = {
        hostname: 'id.twitch.tv',
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    return httpsRequest(options, body);
}

async function getIgdbToken() {
    if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }
    return await requestIgdbToken();
}

const IGDB_QUEUE = {
    queue: [],
    tokens: 4,
    maxTokens: 4,
    currentConcurrency: 0,
    maxConcurrency: 8,
    interval: null,
    startInterval() {
        if (this.interval) return;
        // refill tokens at 250ms intervals (4 tokens/sec)
        this.interval = setInterval(() => {
            if (this.tokens < this.maxTokens) {
                this.tokens++;
                this.process();
            }
        }, 250);
    },
    stopInterval() {
        if (!this.interval) return;
        clearInterval(this.interval);
        this.interval = null;
    },
    enqueue(options, body) {
        // Skip queuing duplicate queries: if same body already queued, return its promise
        const existing = this.queue.find(j => j.body === body);
        if (existing && existing.promise) {
            return existing.promise;
        }

        let resolveRef, rejectRef;
        const promise = new Promise((resolve, reject) => {
            resolveRef = resolve;
            rejectRef = reject;
        });

        const job = { options, body, resolve: resolveRef, reject: rejectRef, promise };
        this.queue.push(job);
        // start/refill processing when work arrives
        this.process();
        return promise;
    },
    process() {
        while (this.tokens > 0 && this.currentConcurrency < this.maxConcurrency && this.queue.length > 0) {
            const job = this.queue.shift();
            this.tokens--;
            this.currentConcurrency++;
            httpsRequest(job.options, job.body)
                .then(res => job.resolve(res))
                .catch(err => job.reject(err))
                .finally(() => {
                    this.currentConcurrency--;
                    // try to process more in case tokens or concurrency freed
                    this.process();
                });
        }

        // If there is no queued work, stop the refill interval to save resources
        if (this.queue.length === 0) {
            this.stopInterval();
        }
        else {
            this.startInterval();
        }
    }
};

async function igdbRequest(query, endpoint = '/v4/games') {
    const token = await getIgdbToken();
    const credentials = getCurrentCredentials();

    const body = query;
    const options = {
        hostname: 'api.igdb.com',
        path: endpoint,
        method: 'POST',
        headers: {
            'Client-ID': credentials.clientId,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    // Use the IGDB queue to respect rate and concurrency limits
    const res = await IGDB_QUEUE.enqueue(options, body);
    return JSON.parse(res.body);
}

async function searchGames(query) {
    const igdbQuery = `search "${query}"; where release_dates.platform = 6 & game_type != (1,5,11,12,13); fields name,summary,slug,genres.name,involved_companies.company.name,involved_companies.publisher,involved_companies.developer,game_modes.name,first_release_date,age_ratings.organization.name,age_ratings.rating_category.rating,keywords.name,cover.image_id,screenshots.image_id,videos.name,videos.video_id,url,websites.type.type,websites.url; limit 5;`;
    // const igdbQuery = `search "${query}"; where release_dates.platform = 6 & game_type != (1,5,11,12,13); fields *; limit 5;`;
    const games = await igdbRequest(igdbQuery, '/v4/games');
    return games;
}

async function fetchGameMetadata(gameName) {
    const igdbGames = await searchGames(gameName);

    if (igdbGames.length === 0) {
        return null;
    }
    let igdbGame = igdbGames[0];
    const normalizedQuery = normalizeTitle(gameName);

    const exactMatch = igdbGames.find(g => normalizeTitle(g.name) === normalizedQuery);
    if (exactMatch) {
        igdbGame = exactMatch;
    } else {
        let bestScore = -1;
        let bestGame = igdbGame;
        for (const g of igdbGames) {
            const score = similarityScore(g.name, gameName);
            if (score > bestScore) {
                bestScore = score;
                bestGame = g;
            }
        }
        // apply only if score passes a modest threshold, otherwise keep first result
        if (bestScore >= 0.45) {
            igdbGame = bestGame;
        }
    }

    let ageRatings = [];
    if (igdbGame.age_ratings && igdbGame.age_ratings.length > 0) {
        ageRatings = igdbGame.age_ratings.map(r => {
            if (r.organization && r.rating_category) {
                if (r.organization.name === 'PEGI') {
                    return `PEGI ${r.rating_category.rating}`;
                }
            }
            return null;
        }).filter(Boolean);
    }

    let coverImage, icon = "";
    if (igdbGame.cover) {
        icon = `https://images.igdb.com/igdb/image/upload/t_thumb/${igdbGame.cover.image_id}.png`;
        coverImage = `https://images.igdb.com/igdb/image/upload/t_1080p/${igdbGame.cover.image_id}.jpg`;
    }

    let screenshots = [];
    if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
        screenshots = igdbGame.screenshots.map(s => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`);
    }

    let videos = [];
    if (igdbGame.videos && igdbGame.videos.length > 0) {
        videos = igdbGame.videos.map(v => {
            return {
                name: v.name,
                url: `https://www.youtube.com/watch?v=${v.video_id}`
            };
        });
    }

    links = [];
    if (igdbGame.websites && igdbGame.websites.length > 0) {
        links = igdbGame.websites.map(w => {
            return {
                name: w.type.type,
                url: w.url
            };
        });
    }

    const inv = igdbGame.involved_companies || [];
    const publiherNames = inv
        .filter(ic => ic && ic.publisher)
        .map(ic => (ic && ic.company && ic.company.name) ? ic.company.name : null)
        .filter(Boolean);
    const uniquePublishers = Array.from(new Set(publiherNames));

    const developerNames = inv
        .filter(ic => ic && ic.developer)
        .map(ic => (ic.company && ic.company.name) ? ic.company.name : null)
        .filter(Boolean);
    const uniqueDevelopers = Array.from(new Set(developerNames));

    return {
        handle: igdbGame.slug || "",
        igdbId: igdbGame.id,
        igdbUrl: igdbGame.url || "",
        name: igdbGame.name || "",
        description: igdbGame.summary || "",
        genres: (igdbGame.genres || []).map(g => g.name),
        publishers: uniquePublishers,
        developers: uniqueDevelopers,
        modes: (igdbGame.game_modes || []).map(m => m.name),
        tags: (igdbGame.keywords || []).map(k => k.name),
        releaseDate: igdbGame.first_release_date ? igdbGame.first_release_date * 1000 : null,
        ageRatings,
        criticScore: igdbGame.aggregated_rating || null,
        communityScore: igdbGame.rating || null,
        icon,
        coverImage,
        screenshots,
        videos,
        links
    };
}

async function searchGameMetadataSuggestions(gameName) {
    const igdbGames = await searchGames(gameName);
    return igdbGames.map(toMetadataObject);
}

function toMetadataObject(igdbGame) {
    let ageRatings = [];
    if (igdbGame.age_ratings && igdbGame.age_ratings.length > 0) {
        ageRatings = igdbGame.age_ratings.map(r => {
            if (r.organization && r.rating_category) {
                if (r.organization.name === 'PEGI') {
                    return `PEGI ${r.rating_category.rating}`;
                }
            }
            return null;
        }).filter(Boolean);
    }

    let coverImage, icon = "";
    if (igdbGame.cover) {
        icon = `https://images.igdb.com/igdb/image/upload/t_thumb/${igdbGame.cover.image_id}.png`;
        coverImage = `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${igdbGame.cover.image_id}.jpg`;
    }

    let screenshots = [];
    if (igdbGame.screenshots && igdbGame.screenshots.length > 0) {
        screenshots = igdbGame.screenshots.map(s => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`);
    }

    let videos = [];
    if (igdbGame.videos && igdbGame.videos.length > 0) {
        videos = igdbGame.videos.map(v => {
            return {
                name: v.name,
                url: `https://www.youtube.com/watch?v=${v.video_id}`
            };
        });
    }

    let links = [];
    if (igdbGame.websites && igdbGame.websites.length > 0) {
        links = igdbGame.websites.map(w => {
            return {
                name: w.type.type,
                url: w.url
            };
        });
    }

    const inv = igdbGame.involved_companies || [];
    const publiherNames = inv
        .filter(ic => ic && ic.publisher)
        .map(ic => (ic && ic.company && ic.company.name) ? ic.company.name : null)
        .filter(Boolean);
    const uniquePublishers = Array.from(new Set(publiherNames));

    const developerNames = inv
        .filter(ic => ic && ic.developer)
        .map(ic => (ic.company && ic.company.name) ? ic.company.name : null)
        .filter(Boolean);
    const uniqueDevelopers = Array.from(new Set(developerNames));

    return {
        handle: igdbGame.slug || "",
        igdbId: igdbGame.id,
        igdbUrl: igdbGame.url || "",
        name: igdbGame.name || "",
        description: igdbGame.summary || "",
        genres: (igdbGame.genres || []).map(g => g.name),
        publishers: uniquePublishers,
        developers: uniqueDevelopers,
        modes: (igdbGame.game_modes || []).map(m => m.name),
        tags: (igdbGame.keywords || []).map(k => k.name),
        releaseDate: igdbGame.first_release_date ? igdbGame.first_release_date * 1000 : null,
        ageRatings,
        criticScore: igdbGame.aggregated_rating || null,
        communityScore: igdbGame.rating || null,
        icon,
        coverImage,
        screenshots,
        videos,
        links
    };
}

async function initIgdb() {
    try {
        await requestIgdbToken();
        return true;
    } catch (err) {
        return false;
    }
}

function setCredentialsProvider(provider) {
    igdbCredentialsProvider = typeof provider === 'function' ? provider : igdbCredentialsProvider;
    tokenCache.token = null;
    tokenCache.expiresAt = 0;
}

exports.fetchGameMetadata = fetchGameMetadata;
exports.searchGameMetadataSuggestions = searchGameMetadataSuggestions;
exports.initIgdb = initIgdb;
exports.requestIgdbToken = requestIgdbToken;
exports.validateCredentials = validateCredentials;
exports.setCredentialsProvider = setCredentialsProvider;
