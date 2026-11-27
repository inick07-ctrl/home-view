# PeakStead Designs

Live: https://home-view-one.vercel.app

Design your homestead at its peak.

Keep projects for homes, tiny homes, and trailer homes (floor plans, renders, photos, notes) in one place and explore them in interactive 3D.

- Sign up / log in with email + password (bcrypt hashes, signed httpOnly session cookie).
- Private projects with image uploads and an optional 3D model (.glb / .gltf, or a PeakStead Designs .json plan model).
- Optional read-only share link per project (`/s/<token>`).
- Optional **site photos** on each project (owner upload): a 360° equirectangular panorama becomes the walk-through sky and surroundings, and a top-down aerial becomes the ground under the house. Heading, height, scale, rotation and offset are saved on the project. About 25 MB per photo; JPG, PNG or WebP.
- Optional **lot lines** from a US county parcel (any location in the United States): import GeoJSON or KML, paste latitude/longitude corners, enter a survey as bearing/distance calls or side lengths and interior angles, or draw and drag corners on a top-down map (tracing an aerial photo if one is uploaded). Front, side, and rear setbacks draw as a dashed buildable envelope with low posts in the 3D view and walk-through. Move and rotate the house on the lot; a warning appears if it crosses a setback or the lot line. Lot area (square feet and acres) and lot coverage % are saved with the project. Help text points people to their county GIS parcel viewer, the assessor or recorder plat, a survey, local zoning setbacks, and (where used) a county Datafi or land-records portal.
- Each project has a **Build type** (Home, Tiny home, Trailer / Mobile home, or ADU / Cabin), chosen when the project is created and editable later.
- Public **Examples** page with named homes (Willow Court, Poolside Gables, The Back Forty, Twin Oaks, Triple Gable, Breezeway Hearth, Porchlight Farm, Limewash Hall, The Prairie Lantern, Ember Ranch, Hearth Patio, Twin Porch Homestead), plus **Pine Nook** (tiny house on wheels, 8.5′ × 24′ with a loft), **Duskfen Loft**, **Tamarack Porch**, and **Wrenwood Cabin** (tiny homes), **Fernhollow A-Frame**, **Lodgepole A-Frame**, and **Whitepine Homestead** (steep-roof A-frames with glass gables), **Lakeshore Longhouse** (16′ × 76′ single-wide), and **Meadow Glen** (28′ × 56′ double-wide). IDs and URLs such as `?ex=smith-01` stay the same. A **Builder** tab at `/builder` lets you snap standard rooms together like Lego blocks, preview the house in the same 3D engine, and save it to My projects. Filter by type. Signed-in visitors can **Save to my projects**; the project references that built-in example (name, plan, thumbnail, 3D model, style, and build type) and opens in the viewer from My projects. Tiny and trailer examples work with lot lines and site photos the same way as the homes. Projects saved earlier with a default name like “Smith 08” pick up the new display name unless the owner already renamed them.
- A **Free Draw** tab at `/freedraw` lets you sketch a house freehand (mouse, touch, or Apple Pencil): outside walls, inside walls, optional door and window marks, and room labels. **Make my plan** straightens the lines to a square grid (45° corners are squared off), closes small gaps, finds the rooms, scales them to the width × depth or total square feet you enter, and adds doors, windows, kitchen counters, and roofs. Toggle **Sketch / 2D Plan / 3D Model** (the same plan view and 3D viewer, with furnishing), see the square-foot estimate, and **Save to My Projects** to keep going in Edit Plan. `scripts/check-freedraw.py` runs the furniture placement validator on several test sketches in every style.
- Optional **sponsors** are hidden unless a record is marked active. There is no placeholder branding. An admin (the PeakStead Designs login email listed in `ADMIN_EMAIL` or `ADMIN_EMAILS`) can add companies and products at `/admin`. A public [Advertise with PeakStead Designs](/advertise) page collects interest (stored for the admin; the app does not send email). Set `CONTACT_EMAIL` if you also want a mailto link on that page.

## Look (Nordic Modern)
- Site: light theme in `public/css/nordic.css` (viewer chrome in `public/css/viewer-nordic.css`), Inter (self-hosted in `public/fonts/`), white/#f4f4f4 bands, near-black type, blue #3d6ce1 pill buttons.
- Renders: the **Nordic Modern** designer style (`nordic-modern` in `public/3d/engine.js`) adds larch batten cladding and roof, oak window frames, limestone floors with oak inlay, pale spruce wall panels and clay ceiling panels, warm low sun. `DEFAULT_LOOK` makes it the default for every home; set it to `null` to go back to each home's own `defaultStyle`.
- Example thumbnails (`public/img/<id>.jpg`) and the homepage hero (`public/img/hero-nordic*.jpg`) are renders in this style.

## Stack
- Static pages in `public/` (no build step); three.js viewer in `public/3d/`.
- One Vercel Function, `api/router.js`, for the JSON API.
- Storage: a **private Vercel Blob** store holds both the JSON records (`db/…`) and uploads (`files/…`).

## Environment variables (set in Vercel, never committed)
- `BLOB_READ_WRITE_TOKEN` – added automatically when the Blob store is connected to the project.
- `SESSION_SECRET` – random string, 32+ characters, used to sign session cookies.
- `ADMIN_EMAIL` or `ADMIN_EMAILS` – the PeakStead Designs login email (or a comma-separated list) allowed to manage sponsors at `/admin`. Leave unset so nobody is an admin.
- `CONTACT_EMAIL` – optional public address shown as a mailto on `/advertise`. If unset, only the interest form is shown.

## Local dev
`npm install`, put the two env vars in `.env.local`, then `node scripts/dev-server.mjs` (serves on :3000).
