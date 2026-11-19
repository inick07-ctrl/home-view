# Home View

Live: https://home-view-one.vercel.app

Keep your home projects (floor plans, renders, photos, notes) in one place and explore them in interactive 3D.

- Sign up / log in with email + password (bcrypt hashes, signed httpOnly session cookie).
- Private projects with image uploads and an optional 3D model (.glb / .gltf, or a Home View .json plan model).
- Optional read-only share link per project (`/s/<token>`).
- Optional **site photos** on each project (owner upload): a 360° equirectangular panorama becomes the walk-through sky and surroundings, and a top-down aerial becomes the ground under the house. Heading, height, scale, rotation and offset are saved on the project. About 25 MB per photo; JPG, PNG or WebP.
- Optional **lot lines** from a US county parcel: import GeoJSON or KML, or paste latitude/longitude corners (anywhere in the United States). Help text points people to their county GIS parcel viewer, plus the assessor or recorder plat, a survey, and local zoning setbacks.
- Public **Examples** page with the Smith 01–11 home models. Signed-in visitors can **Save to my projects**; the project references that built-in example (name, plan, thumbnail, 3D model, and style) and opens in the viewer from My projects.

## Stack
- Static pages in `public/` (no build step); three.js viewer in `public/3d/`.
- One Vercel Function, `api/router.js`, for the JSON API.
- Storage: a **private Vercel Blob** store holds both the JSON records (`db/…`) and uploads (`files/…`).

## Environment variables (set in Vercel, never committed)
- `BLOB_READ_WRITE_TOKEN` – added automatically when the Blob store is connected to the project.
- `SESSION_SECRET` – random string, 32+ characters, used to sign session cookies.

## Local dev
`npm install`, put the two env vars in `.env.local`, then `node scripts/dev-server.mjs` (serves on :3000).
