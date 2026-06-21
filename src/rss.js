const RSSParser = require('rss-parser');
const db = require('./db');

let rssUrlsProvider = () => [];

function youtubeThumbnailUrl(value) {
    if (!value) {
        return "";
    }

    const idMatch = String(value).match(/[?&]v=([^&#]+)/i)
        || String(value).match(/youtube\.com\/embed\/([^?&#/]+)/i)
        || String(value).match(/youtube\.com\/v\/([^?&#/]+)/i)
        || String(value).match(/youtu\.be\/([^?&#/]+)/i);

    return idMatch && idMatch[1] ? `https://i.ytimg.com/vi/${idMatch[1]}/hqdefault.jpg` : "";
}

async function fetchRssFeeds() {
    const rssUrls = rssUrlsProvider() || [];
    if (Array.isArray(rssUrls) === false || rssUrls.length === 0) {
        return;
    }
    // implement a simple RSS fetcher and parser
    // Parse the RSS feeds and add to database if not already present
    const parser = new RSSParser({
        customFields: {
            item: [
                ['media:content', 'mediaContent', { keepArray: true }],
                ['media:group', 'mediaGroup', { keepArray: true }],
            ]
        }
    });

    for (const url of rssUrls) {
        try {
            const feed = await parser.parseURL(url);

            const source = (new URL(url)).hostname.replace('www.', '');
            const items = feed && feed.items ? feed.items : [];
            for (const item of items) {
                const link = item.link || (item.enclosure && item.enclosure.url) || item.guid || null;
                if (!link) continue;
                const existing = db.instance.Feed && db.instance.Feed.exists({ link: link });
                if (existing) continue;

                const pubDate = item.isoDate ? (new Date(item.isoDate)).getTime() : (item.pubDate ? (new Date(item.pubDate)).getTime() : Date.now());

                // robust media extraction: enclosure, namespaced media fields, or images in content
                function extractMedia(it) {
                    if (it.enclosure) {
                        return { url: it.enclosure.url, type: it.enclosure.type || "" };
                    }

                    if (it.mediaGroup) {
                        const group = Array.isArray(it.mediaGroup) ? it.mediaGroup[0] : it.mediaGroup;
                        const thumbnails = group && group['media:thumbnail'];
                        const thumbnail = Array.isArray(thumbnails) ? thumbnails[0] : thumbnails;
                        const thumbnailUrl = thumbnail && thumbnail.$ && thumbnail.$.url ? thumbnail.$.url : "";
                        if (thumbnailUrl) {
                            return { url: thumbnailUrl, type: "image/youtube" };
                        }
                    }

                    // 2. Media RSS - media:content
                    if (it.mediaContent) {
                        const mf = Array.isArray(it.mediaContent) ? it.mediaContent[0] : it.mediaContent;
                        const url = (mf && (mf.url || (mf.$ && mf.$.url))) || (typeof mf === 'string' ? mf : null);
                        const type = (mf && (mf.type || (mf.$ && mf.$.type))) || "";
                        if (url) {
                            return { url, type };
                        }
                    }

                    // 3. YouTube feed fields
                    if (it.link && it.link.includes('youtube.com')) {
                        const thumbnailUrl = youtubeThumbnailUrl(it.link);
                        if (thumbnailUrl) {
                            return { url: thumbnailUrl, type: "image/youtube" };
                        }
                    }

                    // pull first image from content as fallback
                    const imgRegex = /<img[^>]+src="([^">]+)"/i;
                    const match = imgRegex.exec(it.content || '');
                    if (match && match[1]) {
                        return { url: match[1], type: "image/unknown" };
                    }
                }
                const media = extractMedia(item);

                const doc = {
                    title: item.title || "",
                    link,
                    content: item.contentSnippet || item.content || "",
                    pubDate: pubDate,
                    source: source,
                    author: item.creator || item.author || "",
                    media
                };

                try {
                    db.instance.Feed.insert(doc);
                } catch (err) {
                    // ignore duplicate race conditions
                }
            }
        } catch (err) {
            console.warn("Failed to fetch/parse RSS:", url, err && err.message ? err.message : err);
        }
    }

    // remove old feeds (over 10 days)
    const cutoff = Date.now() - (1000 * 60 * 60 * 24 * 10);
    db.instance.Feed.findAndRemove({ pubDate: { $lt: cutoff } });
}

function setRssUrlsProvider(provider) {
    rssUrlsProvider = typeof provider === 'function' ? provider : rssUrlsProvider;
}

exports.fetchRssFeeds = fetchRssFeeds;
exports.setRssUrlsProvider = setRssUrlsProvider;