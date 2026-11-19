# Home View

Live: https://home-view-one.vercel.app

Keep projects for homes, tiny homes, and trailer homes (floor plans, renders, photos, notes) in one place and explore them in interactive 3D.

- Sign up / log in with email + password (bcrypt hashes, signed httpOnly session cookie).
- Private projects with image uploads and an optional 3D model (.glb / .gltf, or a Home View .json plan model).
- Optional read-only share link per project (`/s/<token>`).
- Optional **site photos** on each project (owner upload): a 360° equirectangular panorama becomes the walk-through sky and surroundings, and a top-down aerial becomes the ground under the house. Heading, height, scale, rotation and offset are saved on the project. About 25 MB per photo; JPG, PNG or WebP.
- Optional **lot lines** from a US county parcel (any location in the United States): import GeoJSON or KML, paste latitude/longitude corners, enter a survey as bearing/distance calls or side lengths and interior angles, or draw and drag corners on a top-down map (tracing an aerial photo if one is uploaded). Front, side, and rear setbacks draw as a dashed buildable envelope with low posts in the 3D view and walk-through. Move and rotate the house on the lot; a warning appears if it crosses a setback or the lot line. Lot area (square feet and acres) and lot coverage % are saved with the project. Help text points people to their county GIS parcel viewer, the assessor or recorder plat, a survey, local zoning setbacks, and (where used) a county Datafi or land-records portal.
- Each project has a **Build type** (Home, Tiny home, Trailer / Mobile home, or ADU / Cabin), chosen when the project is created and editable later.
- Public **Examples** page with the Smith 01–11 homes plus **Tiny 01** (THOW, 8.5′ × 24′ with a loft), **Single-Wide 01** (16′ × 76′, 3 bed / 2 bath), and **Double-Wide 01** (28′ × 56′). Filter by type. Signed-in visitors can **Save to my projects**; the project references that built-in example (name, plan, thumbnail, 3D model, style, and build type) and opens in the viewer from My projects. Tiny and trailer examples work with lot lines and site photos the same way as the homes.
- Optional **sponsors** are hidden unless a record is marked active. There is no placeholder branding. An admin (the Home View login email listed in `ADMIN_EMAIL` or `ADMIN_EMAILS`) can add companies and products at `/admin`. A public [Advertise with Home View](/advertise) page collects interest (stored for the admin; the app does not send email). Set `CONTACT_EMAIL` if you also want a mailto link on that page.

## Stack
- Static pages in `public/` (no build step); three.js viewer in `public/3d/`.
- One Vercel Function, `api/router.js`, for the JSON API.
- Storage: a **private Vercel Blob** store holds both the JSON records (`db/…`) and uploads (`files/…`).

## Environment variables (set in Vercel, never committed)
- `BLOB_READ_WRITE_TOKEN` – added automatically when the Blob store is connected to the project.
- `SESSION_SECRET` – random string, 32+ characters, used to sign session cookies.
- `ADMIN_EMAIL` or `ADMIN_EMAILS` – the Home View login email (or a comma-separated list) allowed to manage sponsors at `/admin`. Leave unset so nobody is an admin.
- `CONTACT_EMAIL` – optional public address shown as a mailto on `/advertise`. If unset, only the interest form is shown.

## Local dev
`npm install`, put the two env vars in `.env.local`, then `node scripts/dev-server.mjs` (serves on :3000).
