const fs = require('fs-extra');
const controldb = require('controldb');
const lfsa = require("controldb/src/controldb-fs-structured-adapter.js");
const crypto = require('crypto');
const path = require('path');
const os = require("os");

const db = {};

function generateId(length = 16, letterOnly = false) {
    let id = crypto.randomBytes(length).toString('hex').slice(0, length);
    if (letterOnly) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
        id = id.replace(/[0-9]/g, (match) => {
            match = + match + (Math.random() > .5 ? 10 : 0);
            return letters[match];
        });
    }
    return id;
};

db.init = function () {
    const dbPath = path.join(process.env.LOCALAPPDATA, 'PlayDock', 'db');
    fs.ensureDirSync(dbPath, { recursive: true });

    var controlDB = new controldb(path.join(dbPath, 'db.json'), {
        adapter: new lfsa(),
        verbose: true,
        autosave: true,
        autosaveInterval: 5000,
        serializationMethod: 'normal',
    });

    db.instance = controlDB;

    return new Promise((resolve, reject) => {
        function addOrGetCollection(name, options) {
            let collection = controlDB.getCollection(name, options);
            if (!collection) {
                collection = controlDB.addCollection(name, options);
            }
            // collection.on('insert', function (input) { input.id = generateId(); collection.update(input); });
            return collection;
        };
        controlDB.loadDatabase({}, function (err) {
            if (err) {
                reject(err);
            }
            else {
                controlDB.App = addOrGetCollection("app", { unique: ["id", "name"], indices: ["id", "name"], schema: appShema });
                controlDB.Game = addOrGetCollection("game", { unique: ["id"], indices: ["id", "name"], schema: gameSchema });
                controlDB.Feed = addOrGetCollection("feed", { unique: ["id", "link"], indices: ["id", "link", "pubDate"], schema: feedSchema });


                // controlDB.App.clear();
                // controlDB.Game.clear();
                // controlDB.Feed.clear();

                console.log("Database loaded.");
                resolve(controlDB);
            }
        });
    });
};

const appShema = {
    id: { type: "String", required: true, default: function () { return generateId(); } },
    name: { type: "String", required: true, default: "PlayDock" },
    termsAccepted: { type: "Boolean", default: false },
    showTips: { type: "Boolean", default: true },
    settings: {
        type: "Object",
        schema: {
            runOnStartup: { type: "Boolean", default: false },
            closeToTray: { type: "Boolean", default: false },
            igdb: {
                type: "Object",
                schema: {
                    clientId: { type: "String", default: "" },
                    clientSecret: { type: "String", default: "" },
                },
                default: {},
            },
            rssUrls: { type: ["String"], default: [] },
            windowBounds: {
                type: "Object",
                schema: {
                    x: { type: "Number" },
                    y: { type: "Number" },
                    width: { type: "Number", default: 1280 },
                    height: { type: "Number", default: 720 },
                    isMaximized: { type: "Boolean", default: false },
                },
                default: {},
            },
            autoscan: { type: ["String"], default: ["steam", "epic", "ubisoft", "gog"] },
            libraryView: {
                type: "Object",
                schema: {
                    source: { type: "String", default: "all" },
                    sort: { type: "String", default: "name" },
                    groupedBySource: { type: "Boolean", default: false },
                },
                default: {},
            },
            favoritesView: {
                type: "Object",
                schema: {
                    sort: { type: "String", default: "favoritedAt" },
                },
                default: {},
            },
        },
        required: true,
        default: {},
    }
};

const gameSchema = {
    id: {
        type: "String", required: true, default: function () { return generateId(); },
    },
    name: { type: "String", required: true },
    sortingName: { type: "String", default: "" },
    lastPlayed: { type: "Number" }, // timestamp
    playtime: { type: "Number", default: 0 }, // in minutes
    playCount: { type: "Number", default: 0 },
    status: { type: "String", enum: ["", "abandoned", "beaten", "completed", "not played", "on hold", "plan to play", "played", "playing"], default: "" },
    userRating: { type: "Number" }, // 0-5
    hidden: { type: "Boolean", default: false },
    favorite: { type: "Boolean", default: false },
    favoritedAt: { type: "Number" },
    launch: {
        type: "Object",
        schema: {
            appId: { type: "String", default: "" }, // steam appId, epic product id, etc.
            source: { type: "String", default: "local" }, // steam, epic, gog, local, etc.
            installDir: { type: "String", default: "" },
            cmd: { type: "String", default: "" },
            exe: { type: "String", default: "" },
            args: { type: "String", default: "" },
        },
        default: {}
    },
    metadata: {
        type: "Object",
        schema: {
            igdbId: { type: "Number" }, // IGDB game ID
            igdbUrl: { type: "String", default: "" },
            name: { type: "String", default: "" },
            description: { type: "String", default: "" },
            genres: { type: ["String"], default: [] }, // action, rpg, etc.
            publishers: { type: ["String"], default: [] },
            developers: { type: ["String"], default: [] },
            modes: { type: ["String"], default: [] }, // single-player, multi-player, coop, etc.
            tags: { type: ["String"], default: [] },
            releaseDate: { type: "Number" },
            ageRatings: { type: ["String"], default: [] },
            criticScore: { type: "Number" },
            communityScore: { type: "Number" },
            icon: { type: "String", default: "" },
            coverImage: { type: "String", default: "" },
            screenshots: { type: ["String"], default: [] },
            videos: {
                type: ["Object"],
                schema: {
                    name: { type: "String", required: true }, // store, wiki, forum, etc.
                    url: { type: "String", required: true },
                },
                default: [],
            },
            links: {
                type: ["Object"],
                schema: {
                    name: { type: "String", required: true }, // store, wiki, forum, etc.
                    url: { type: "String", required: true },
                },
                default: [],
            },
        },
    },
    customData: {
        type: "String",
        default: "{}",
        required: true
    }
};

const feedSchema = {
    id: {
        type: "String",
        required: true,
        default: function () {
            return generateId();
        },
    },
    title: { type: "String", default: "" },
    link: { type: "String", required: true },
    content: { type: "String", default: "" },
    pubDate: { type: "Number" },
    source: { type: "String", default: "" },
    author: { type: "String", default: "" },
    media: {
        type: "Object",
        schema: {
            url: { type: "String", required: true },
            type: { type: "String", default: "" },
        },
    }
};

module.exports = db;
