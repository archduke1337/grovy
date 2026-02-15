const fs = require('fs');
const path = require('path');

const SONGS_DIR = path.join(process.cwd(), 'public', 'songs'); // Source
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'songs.json'); // Destination

console.log(`🎵 Scanning for songs in: ${SONGS_DIR}`);

if (!fs.existsSync(SONGS_DIR)) {
  console.log("⚠️ No 'public/songs' directory found. Creating empty manifest.");
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]));
  process.exit(0);
}

const files = fs.readdirSync(SONGS_DIR);
const songs = files
  .filter(file => /\.(mp3|wav|ogg|m4a)$/i.test(file))
  .map((file, index) => {
    // Generate a clean title
    const title = file
      .replace(/\.(mp3|wav|ogg|m4a)$/i, "") // Remove extension
      .replace(/[-_]/g, " "); // Replace dashes with spaces

    return {
      id: `local-${index}`,
      title: title,
      url: `/songs/${file}`, // Path relative to public
      artist: "Local Library",
      cover: null,
      genre: "Local",
      duration: 0
    };
  });

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(songs, null, 2));

console.log(`✅ Generated manifest with ${songs.length} songs at ${OUTPUT_FILE}`);
