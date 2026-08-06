/**
 * Pandora "Thumbs Up" Exporter
 * --------------------------------
 * Run this in your browser's DevTools console while on YOUR OWN
 * Pandora profile "Thumbs Up" page (the page listing songs you've liked).
 *
 * What it does:
 *  - Scrolls down the page to trigger lazy-loading of your liked songs
 *  - Reads song/artist/station info directly from the page DOM
 *  - Stores collected items in localStorage (so you can stop/resume)
 *  - Downloads the final collection as an Obsidian-ready Markdown file
 *    (## Station headers, "- Artist - Song" bullets) to your Downloads folder
 *
 * It does NOT send any data anywhere else, and does not touch your
 * account, cookies, or auth tokens.
 */

function runPandoraExporter() {
  const proceed = confirm(
    "Make sure you're on your Pandora 'Thumbs Up' page, scrolled to the top.\n\n" +
    "Click OK to start collecting your liked songs, or Cancel to stop."
  );
  if (!proceed) {
    console.log("Cancelled by user.");
    return;
  }

  const STORAGE_KEY = "pandoraLikesExport";
  const ITEM_SELECTOR = ".UserProfile__ThumbUps__list__item";

  let totalThumbsUp = 0;
  let processedCount = 0;
  let progressEnabled = false;
  let scrollSpeedMs = 500;
  let scrollTimer = null;

  function chooseScrollSpeed() {
    const choice = (prompt(
      "Scroll speed? SLOW (2s) / NORMAL (0.5s) / FAST (0.15s)\n" +
      "Use FAST only on a good connection.",
      "NORMAL"
    ) || "NORMAL").toUpperCase();

    scrollSpeedMs = choice === "SLOW" ? 2000 : choice === "FAST" ? 150 : 500;
    console.log(`Scroll speed: ${choice} (${scrollSpeedMs}ms)`);
  }

  function detectTotalThumbsUp() {
    try {
      const el = document.querySelector('[data-qa="thumbs_up_link"] .ProfileNav__count');
      if (el) {
        totalThumbsUp = parseInt(el.innerText, 10) || 0;
        progressEnabled = totalThumbsUp > 0;
        console.log(`Detected total thumbs up: ${totalThumbsUp}`);
      } else {
        console.log("Couldn't detect total count — progress % will be disabled.");
      }
    } catch (e) {
      console.error("Error detecting total thumbs up:", e);
    }
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { stations: [] };
    } catch (e) {
      console.error("Error reading localStorage, resetting store:", e);
      return { stations: [] };
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function alreadyCollected(store, trackUri, stationName) {
    const station = store.stations.find(s => s.stationName === stationName);
    if (!station) return false;
    return station.likes.some(item => item.pandoraTrackUri === trackUri);
  }

  function addItem(store, item) {
    let station = store.stations.find(s => s.stationName === item.stationName);
    if (!station) {
      station = { stationName: item.stationName, likes: [] };
      store.stations.push(station);
    }
    station.likes.push(item);
  }

  function countItems(store) {
    return store.stations.reduce((sum, s) => sum + s.likes.length, 0);
  }

  function localStorageSizeLabel() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const bytes = raw ? new Blob([raw]).size : 0;
    if (bytes < 1024) return `${bytes} bytes`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  function logProgress() {
    console.clear();
    if (progressEnabled) {
      const pct = Math.min((processedCount / totalThumbsUp) * 100, 100).toFixed(1);
      console.log(`%cProgress: ${pct}% (${processedCount}/${totalThumbsUp})`, "color:#fff;background:#2563eb;padding:2px 6px;");
    } else {
      console.log(`%cCollected so far: ${processedCount}`, "color:#fff;background:#2563eb;padding:2px 6px;");
    }
    console.log(`%cStorage size: ${localStorageSizeLabel()}`, "color:#fff;background:#16a34a;padding:2px 6px;");
  }

  function collectVisibleItems() {
    const store = loadStore();
    const items = document.querySelectorAll(ITEM_SELECTOR);

    items.forEach(el => {
      try {
        const trackLink = el.querySelector('[data-qa="track_name_link"]');
        const artistLink = el.querySelector('[data-qa="track_artist_name_link"]');
        const stationLink = el.querySelector('[data-qa="track_station_name_link"]');
        if (!trackLink || !artistLink || !stationLink) return;

        const pandoraTrackUri = "https://www.pandora.com" + trackLink.getAttribute("href");
        const stationName = stationLink.innerText.replace("Thumbed on ", "");

        if (alreadyCollected(store, pandoraTrackUri, stationName)) return;

        const albumCoverEl = el.querySelector(".ImageLoader__cover");
        const albumCover = albumCoverEl
          ? albumCoverEl.getAttribute("src")?.replace("_90W_90H", "_1080W_1080H")
          : null;

        addItem(store, {
          albumCover,
          pandoraTrackUri,
          songName: trackLink.innerText,
          pandoraArtistUri: "https://www.pandora.com" + artistLink.getAttribute("href"),
          artist: artistLink.innerText,
          stationName,
        });

        processedCount++;
      } catch (e) {
        console.error("Error processing an item:", e);
      }
    });

    saveStore(store);
    logProgress();
  }

  function buildMarkdown(store) {
    const lines = ["# Pandora Thumbs Up — By Station", ""];
    store.stations.forEach(station => {
      lines.push(`## ${station.stationName}`);
      station.likes.forEach(item => {
        lines.push(`- ${item.artist} - ${item.songName}`);
      });
      lines.push("");
    });
    return lines.join("\n");
  }

  function downloadMarkdown() {
    const store = loadStore();
    if (!store.stations.length) {
      console.log("Nothing collected — nothing to download.");
      return;
    }
    const markdown = buildMarkdown(store);
    const blobUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "pandora_thumbs_up_by_station.md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    console.log("Downloaded Markdown file to your Downloads folder.");
  }

  function tick() {
    const items = document.querySelectorAll(ITEM_SELECTOR);
    const doneByCount = progressEnabled && processedCount >= totalThumbsUp;
    const doneByNoMoreItems = items.length === 0;

    if (doneByCount || doneByNoMoreItems) {
      clearTimeout(scrollTimer);
      logProgress();
      console.log("Done scrolling — finalizing export.");
      downloadMarkdown();
      return;
    }

    collectVisibleItems();
    window.scrollBy(0, 400);
    scrollTimer = setTimeout(tick, scrollSpeedMs);
  }

  // Reset any previous run so counts start clean
  localStorage.removeItem(STORAGE_KEY);
  chooseScrollSpeed();
  detectTotalThumbsUp();
  tick();
}

runPandoraExporter();
