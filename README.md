# Server Speedtest

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A web app for measuring network performance **against the server that hosts it**: download, upload, latency, jitter, packet loss, and a channel quality score. Built with **Next.js** (App Router), **WebRTC** (`@roamhq/wrtc`) for load-style measurements, **HTTP** for ping/jitter, **React** + **Tailwind CSS** for the UI, and **Leaflet** for the map. **English** and **Russian** locales.

## Screenshot

<p align="center">
  <img src="docs/screenshot.png" alt="Server Speedtest UI: live results, chart, and server location map" width="920">
</p>

## Features

- **Download / upload** over a WebRTC data channel with a real-time chart  
- **Latency**, **jitter**, and **packet loss**  
- **Network Quality Score** and session summary  
- **Server vs. you** map (great-circle path; the UI explains the straight map segment)  
- Dark/light theme and language switcher  

## Quick start (development)

Requires **Node.js 22+** (same major as the Docker image) and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build and run:

```bash
npm run build
npm start
```

Lint:

```bash
npm run lint
```

## Docker

Build and run with Compose (HTTP on the port from `.env` or **3000**, UDP **10000–10099** for ICE, as in `docker-compose.yaml`):

```bash
docker compose up --build
```

Optionally set `HOST_PORT` in `.env` and align **`WRTC_ICE_UDP_PORT_MIN`** / **`WRTC_ICE_UDP_PORT_MAX`** with your published UDP range on the host and in Compose.

## API layout (overview)

Routes under `src/app/api/` power the measurements (including `webrtc/offer`, `download`, `upload`, `ping`, `server-info`, and others)—see the repository code for details.

## License

[MIT](LICENSE)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=StateByte/server-speedtest&type=Date)](https://star-history.com/#StateByte/server-speedtest&Date)

Author in `package.json`: **@statebyte**.
