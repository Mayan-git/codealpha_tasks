# ShopEasy — Basic E-commerce Site

A basic e-commerce web app: product listings, product detail pages, a shopping cart,
user registration/login, and order processing.

- **Backend:** Node.js + Express, MongoDB (Mongoose), JWT auth, bcrypt password hashing
- **Frontend:** Plain HTML, CSS, JavaScript (served as static files by Express, talks to the API via `fetch`)

## Project structure

```
config/db.js          MongoDB connection
models/                Mongoose schemas: User, Product, Cart, Order
controllers/            Route handlers (auth, products, cart, orders)
routes/                 Express routers, mounted under /api
middleware/auth.js      JWT "protect" middleware
seed/                   Sample product data + seed script
public/                 Static frontend (HTML/CSS/JS)
  index.html             Product listing (search + category filter)
  product.html            Product detail page
  cart.html                Shopping cart
  checkout.html            Shipping address + place order
  orders.html               Order history
  order-detail.html          Single order view
  login.html / register.html Auth forms
  js/                        api.js (fetch client), nav.js (shared header/cart badge), one file per page
server.js               Express app entrypoint
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (default `mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the env file and adjust if needed:
   ```
   cp .env.example .env
   ```
   `.env` contains `PORT`, `MONGO_URI`, and `JWT_SECRET` — change `JWT_SECRET` to a random string for real use.
3. Seed sample products:
   ```
   npm run seed
   ```
   (`npm run seed:destroy` removes all products.)
4. Start the server:
   ```
   npm start
   ```
   or, for auto-reload during development:
   ```
   npm run dev
   ```
5. Open **http://localhost:5000** in your browser.

## Features

- **Product listings** — grid view with search-as-you-type and category filtering.
- **Product details** — full description, stock level, quantity picker.
- **Shopping cart** — server-side cart tied to the logged-in user; update quantities, remove items, running total. Cart badge in the nav updates live.
- **User registration/login** — JWT-based auth; token stored in `localStorage` and sent as `Authorization: Bearer <token>`. Passwords hashed with bcrypt.
- **Order processing** — checkout collects a shipping address and payment method, converts the cart into an order, decrements product stock, and clears the cart. Order history and a per-order detail page are available under "My Orders".

## API overview

All endpoints are under `/api`.

| Method | Path                     | Auth | Description                        |
|--------|--------------------------|------|-------------------------------------|
| POST   | /auth/register           | No   | Create an account                   |
| POST   | /auth/login              | No   | Log in, returns JWT                 |
| GET    | /auth/profile            | Yes  | Current user's profile              |
| GET    | /products                | No   | List products (`?keyword=&category=`) |
| GET    | /products/categories     | No   | Distinct category list              |
| GET    | /products/:id            | No   | Single product                      |
| GET    | /cart                    | Yes  | Get current user's cart             |
| POST   | /cart                    | Yes  | Add item `{ productId, quantity }`  |
| PUT    | /cart/:productId         | Yes  | Update item quantity                |
| DELETE | /cart/:productId         | Yes  | Remove item                         |
| DELETE | /cart                    | Yes  | Clear cart                          |
| POST   | /orders                  | Yes  | Place order from current cart       |
| GET    | /orders/myorders         | Yes  | List current user's orders          |
| GET    | /orders/:id              | Yes  | Single order (owner only)           |

## Notes

- This is a demo/learning project: no payment gateway integration (payment method is recorded but not processed), and there's no admin UI for managing products (use the seed script or MongoDB directly).
- Product images are placeholder URLs from picsum.photos.
