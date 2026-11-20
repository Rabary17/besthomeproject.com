// Recherche d'images libres de droit (Unsplash en priorité, Pexels puis Pixabay en repli)
// pour illustrer les articles générés automatiquement.
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env.local") });

async function searchUnsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } }
  );
  const json = await res.json();
  return (json.results || []).map((r) => ({
    source: "unsplash",
    url: r.urls.regular,
    download_location: r.links.download_location,
    width: r.width,
    height: r.height,
    author: r.user.name,
    authorUrl: r.user.links.html,
    alt: r.alt_description,
  }));
}

async function searchPexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
    { headers: { Authorization: key } }
  );
  const json = await res.json();
  return (json.photos || []).map((p) => ({
    source: "pexels",
    url: p.src.large,
    width: p.width,
    height: p.height,
    author: p.photographer,
    authorUrl: p.photographer_url,
    alt: p.alt,
  }));
}

async function searchPixabay(query) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`
  );
  const json = await res.json();
  return (json.hits || []).map((h) => ({
    source: "pixabay",
    url: h.largeImageURL,
    width: h.imageWidth,
    height: h.imageHeight,
    author: h.user,
    authorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`,
    alt: h.tags,
  }));
}

// Essaie Unsplash, puis Pexels, puis Pixabay — retourne le premier résultat non vide.
async function findImage(query) {
  for (const search of [searchUnsplash, searchPexels, searchPixabay]) {
    const results = await search(query);
    if (results && results.length > 0) return results;
  }
  return [];
}

module.exports = { searchUnsplash, searchPexels, searchPixabay, findImage };

if (require.main === module) {
  const query = process.argv[2] || "intelligence artificielle ordinateur";
  findImage(query)
    .then((results) => {
      console.log(`${results.length} résultat(s) pour "${query}" :`);
      for (const r of results) {
        console.log(`- [${r.source}] ${r.url} — ${r.author} (${r.width}x${r.height})`);
      }
    })
    .catch((err) => {
      console.error("Erreur recherche image :", err.message);
      process.exit(1);
    });
}
