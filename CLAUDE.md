# KeKos — Sistem Pencarian dan Booking Kos

Aplikasi web untuk mempertemukan pencari kos dengan pemilik kos. Booking gratis dan tidak ada pembayaran di dalam aplikasi; pembayaran lewat WhatsApp pemilik.
Status kode: **Sprint 2**. Baru fitur pencari kos yang ada (login, daftar, dashboard + peta, detail + ulasan, booking, notifikasi). Login pemilik dan admin masih ditolak oleh backend.

## Stack (sesuai kode)
- `KeKos/frontend`: React 19 + Vite + Tailwind 3 (JS/JSX), react-router 7, Leaflet/OpenStreetMap (Google Maps hanya jika `VITE_GOOGLE_MAPS_API_KEY` diisi)
- `KeKos/backend`: Node.js >= 20.6 + Express 5, mysql2, JWT Bearer (`jsonwebtoken`), bcryptjs
- `KeKos/database`: MySQL >= 8.0.16, `schema.sql` + `seed.sql` (`arsip/` tidak dipakai)

## Menjalankan
Langkah lengkap dan troubleshooting ada di `KeKos/README.md`.
1. DB: `mysql -u root -p < KeKos/database/schema.sql` lalu `seed.sql` (database `kekos` lama ikut terhapus)
2. Backend: `cd KeKos/backend`, salin `.env.example` ke `.env` (isi `DB_PASSWORD` dan `JWT_SECRET`), lalu `npm install && npm run dev` → http://localhost:3000
3. Frontend: `cd KeKos/frontend`, lalu `npm install && npm run dev` → http://localhost:5173 (`/api` di-proxy ke :3000). Untuk cek kode: `npm run lint`
4. Akun demo: `pencari@kekos.test` / `password123`

## Dokumen — baca sesuai kebutuhan, jangan dimuat semua
| File | Isi | Baca saat |
|---|---|---|
| `prd.md` | FR-01..16, aturan bisnis, daftar halaman UI-01..11, NFR, rencana sprint | Mengerjakan fitur baru atau mengecek kriteria penerimaan |
| `architecture.md` | Rancangan target: API lengkap, sesi, alur booking, deployment | Merancang endpoint atau fitur Sprint 3+. **Banyak bagian belum sesuai kode** (lihat bawah) |
| `KeKos/README.md` | Setup Windows/Workbench, akun contoh, alur demo, troubleshooting | Menjalankan app atau saat setup bermasalah |
| `KeKos/backend/README.md` | Daftar API yang **benar-benar ada** + struktur `src/` | Mengubah atau memanggil backend |
| `KeKos/frontend/README.md` | Route ke halaman/frame Figma, struktur `src/`, setup Google Maps | Mengubah UI |
| `KeKos/database/README.md` | Isi skema (tabel, view, prosedur, trigger), cara import, akun seed | Menyentuh SQL atau data |
| `graphify-out/GRAPH_REPORT.md` | Peta arsitektur hasil graphify | Hanya untuk review arsitektur luas (lihat aturan graphify) |

`prd.md`, `architecture.md`, dan `graphify-out/` hanya ada di lokal (di-ignore oleh `.gitignore`).
Kalau dokumen bertentangan: kode dan README di `KeKos/` = kondisi sekarang; `prd.md` = target produk; `architecture.md` = usulan.

## ⚠ Ketidaksesuaian yang diketahui (per 2026-11-10)
1. **Auth**: architecture.md §6 memakai sesi server (`express-session` + cookie). Kode memakai **JWT Bearer** (`JWT_SECRET`). Tidak ada helmet, rate limit, atau zod.
2. **Struktur repo**: architecture.md §3 memakai `client/`, `server/` dengan lapisan routes/controllers/services/repositories, `database/kekos_database.sql`, dan `docs/`. Kode sebenarnya: `KeKos/frontend`, `KeKos/backend/src/routes` + `format.js`, `database/schema.sql`.
3. **API**: architecture.md §7 ≠ kode. `POST /kos/:id/rating {nilai, ulasan}` di kode menjadi `POST /kos/:id/ulasan {rating, isi}` (ditambah DELETE ulasan); `{idTipeKamar}` menjadi `{kamar_id}`; `hargaMin/hargaMax` menjadi `min/max`; `PATCH /notifikasi/:id/baca` menjadi `PATCH /notifikasi/baca` (tandai semua). `/preview-kos`, `/rating`, `/fasilitas`, dan `/rekomendasi` belum ada.
4. **Format error**: `sendError` mengirim `{message, code, error:{kode,pesan}}`, tetapi `requireAuth`/`requirePeran` hanya mengirim `{message}`. Format ini tidak seragam dengan architecture.md maupun antar bagian kode.
5. **Peta & jarak**: architecture.md menyebut Google Maps + geocoding di server + Haversine di SQL dengan env `KAMPUS_LAT/LNG`, dan nama env `VITE_GOOGLE_MAPS_BROWSER_KEY`. Di kode: Leaflet/OSM dengan Google opsional (`VITE_GOOGLE_MAPS_API_KEY`), jarak dihitung di JS (`backend/src/format.js`) dari titik kampus yang di-hardcode (Telkom University Surabaya). Ini sekaligus menjawab pertanyaan terbuka PRD §12.
6. **Nomor sprint**: PRD §10 menaruh fitur pemilik di Sprint 2 dan pencari di Sprint 4. Kode/README menaruh fitur pencari di Sprint 2 dan pemilik/admin di Sprint 3.
7. **Teks pesan**: PRD FR-02 "Akun Anda dinonaktifkan", kode "Akun ini sudah dinonaktifkan".

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
