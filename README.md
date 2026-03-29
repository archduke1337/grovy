# 🎵 Grovy - Premium Web Music Player

> A stunning, high-performance web music player crafted with Next.js, Tailwind CSS, and Framer Motion. Experience the vibe.

![Grovy Banner](public/icons/icon.png)

## ✨ Features

- **🎨 Dynamic Theme Engine**: Interface colors automatically extract and adapt to the current song's album artwork.
- **🌊 Cinematic UI**: Glassmorphism, fluid animations (Framer Motion), and a layout that breathes.
- **📱 Mobile-First Design**: Full-screen "Apple-tier" mobile menu and touch-optimized controls.
- **🔊 Professional Audio**:
  - 5-Band Equalizer
  - Spatial Audio (3D Soundstage) simulation
  - Real-time Audio Visualizer
- **🔍 Smart Search**: Integrated command palette (`Cmd+K`) and global search for local and remote tracks.
- **💾 Local & Remote Playback**: Play your own files or stream from the cloud.
- **🌑 Dark/Light Mode**: Seamless theme switching with persistent preferences.
- **⚡ PWA Ready**: Installable as a native app on fast, modern devices.
- **🔒 Privacy-First Storage**: Playlists, favorites, and history are stored locally in `localStorage` + `IndexedDB`; only search/stream requests hit API endpoints.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Context + Hooks
- **Audio Processing**: Web Audio API
- **Color Extraction**: ColorThief
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/archduke1337/grovy.git
   cd grovy
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎹 Keyboard Shortcuts

| Key        | Action         |
| ---------- | -------------- |
| `Space`    | Play / Pause   |
| `→`        | Next Track     |
| `←`        | Previous Track |
| `↑`        | Volume Up      |
| `↓`        | Volume Down    |
| `Ctrl + K` | Open Search    |
| `L`        | Toggle Loop    |
| `S`        | Toggle Shuffle |

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**Gaurav Ram Yadav**

- GitHub: [@archduke](https://github.com/archduke)
- Website: [grovy.archduke.is-a.dev](https://grovy.archduke.is-a.dev)

---

Playing correctly with the **Web Audio API** requires user interaction first. Click anywhere on the page to start the audio engine.

## 🛡️ Privacy Notes

- Grovy does not require accounts or ad trackers.
- Playback state and user libraries are persisted in your browser (`localStorage` and `IndexedDB`).
- Search and streaming metadata requests are proxied through Grovy API routes to upstream music providers.
- If deployed on Vercel, aggregated site analytics may be collected via Vercel Web Analytics.
