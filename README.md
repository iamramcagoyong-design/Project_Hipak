# Puffin Dose Vape Shop
Node.js + Express backend (MVC), vanilla JS frontend.

## Run
1. Install Node.js 18+
2. `npm install`
3. `npm start`  (or `npm run dev` for auto-restart)
- Shop:  http://localhost:3000   (age gate, no login)
- Admin: http://localhost:3000/admin   (default password: puffin2022, change it in config.js)

## Structure (MVC)
- Model:      src/models      (db.js JSON store, productModel, orderModel)
- View:       public/         (index.html, admin.html, css, js)
- Controller: src/controllers (auth, product, order)
- Routes:     src/routes/api.js, auth middleware in src/middleware
Data is saved in data/db.json (auto-created).
