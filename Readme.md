# 🎬 StreamCore API — Production-Grade Video Streaming Backend

A scalable, production-style backend for a video streaming platform featuring secure authentication, video uploads, subscriptions, and optimized data querying.

Built using a clean **MVC architecture** with industry practices like **JWT authentication**, **centralized error handling**, **middleware layering**, and **cloud-based media storage**.

This project reflects **real backend engineering patterns** used in modern **MERN applications**.

---

## 🧱 Backend Architecture (MVC + Layered Design)
![StreamCore](https://www.coreycleary.me/_next/static/media/Express-REST-API-Struc.aa7ecaa0c41dbb7344c70665a5f5e259.png)
![StreamCore](https://iq.opengenus.org/content/images/2019/08/Add-a-subheading--2-.png)
![StreamCore](https://static.wixstatic.com/media/205393_efa92d0e19be45a09f30f92c08648395~mv2.png/v1/fill/w_752%2Ch_410%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/205393_efa92d0e19be45a09f30f92c08648395~mv2.png)


The project follows a strict **MVC pattern** with additional utility and middleware layers for scalability and maintainability.

### Structure Overview

- **Models** → MongoDB schema design (`User`, `Video`, `Subscription`)
- **Controllers** → Business logic (auth, upload, subscriptions)
- **Routes** → Clean endpoint definitions
- **Middlewares** → Auth protection, file handling
- **Utils** → Error handling, API responses, async wrapper, Cloudinary config
- **db** → Dedicated database connection layer
- **app.js / index.js** → Server bootstrap separation (production practice)

This separation ensures the codebase is **easy to scale, debug, and maintain**.

---

## 🔐 Authentication & Security Flow (JWT + Cookies)
![StreamCore](https://media2.dev.to/dynamic/image/width%3D1000%2Cheight%3D420%2Cfit%3Dcover%2Cgravity%3Dauto%2Cformat%3Dauto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvw7tr0hzoj02e7kq6daj.webp)
![StreamCore](https://images.openai.com/static-rsc-1/cv7y1OJGThAj5hzzpKwk_Uyjyhu3bXKRqfvJYAVLtjm7jxQIH8BKr7GBMtsTI5XiOvnVXOjooDePlCEWz6MEiZU5rG_RDOEwFg0iwb5TwdKT31Wsv4B_z7no0YxEy5VbNjEli8AgQSNLVru0r3F0Tg)
![StreamCore](https://miro.medium.com/v2/resize%3Afit%3A1082/1%2AEf42xreQtP_E0AEvpOVSKQ.png)

A complete production-style authentication mechanism is implemented:

- Password hashing using **bcrypt**
- Login returns **Access Token** and **Refresh Token**
- Tokens stored securely in **HTTP-only cookies**
- Auth middleware protects private routes
- Refresh token mechanism for session continuity

This mimics how **real-world production apps** handle authentication securely.

---

## ☁️ Media Upload & Storage (Multer + Cloudinary)
![StreamCore](https://cloudinary-res.cloudinary.com/image/upload/f_auto/q_auto/w_750%2Cdpr_2/docs/service_architecture.png)
![StreamCore](https://miro.medium.com/1%2AhVd4Nbviz8rs1S7swOq0zg.jpeg)


To keep the server lightweight and scalable:

- Files handled via **Multer middleware**
- Media uploaded directly to **Cloudinary**
- Only media URLs stored in **MongoDB**
- Prevents server from storing heavy video files

This is a **widely used scalable pattern** in media platforms.

---

## 🗄️ Database Modeling with Mongoose

- **User Schema** with authentication hooks
- **Video Schema** linked with users
- **Subscription Schema** for channel following
- Usage of **Mongoose hooks** and **aggregation pipelines**
- Pagination using `mongoose-aggregate-paginate-v2`

Advanced MongoDB querying is used instead of basic CRUD operations.

---

## 🧰 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **JSON Web Token (jsonwebtoken)**
- **Multer**
- **Cloudinary**
- **Bcrypt**
- **Cookie-Parser**
- **CORS**
- **dotenv**

---

## ✨ Core Features Implemented

- User Register / Login / Update
- Access & Refresh token flow
- Video upload & metadata storage
- Subscription system
- Protected routes via middleware
- Centralized API error & response format
- Aggregation pipelines for complex queries
- Clean and scalable folder structure

---

## 📂 Project Structure

src/
├── controllers/
├── db/
├── middlewares/
├── models/
├── routes/
├── utils/
├── app.js
└── index.js


---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
▶️ Run Locally
npm install
npm run dev
🧠 What This Project Demonstrates
This is not a CRUD backend. It demonstrates:

Real backend folder structuring

Secure authentication patterns

Media handling at scale

Advanced MongoDB usage

Middleware-driven architecture

Production-level error handling

🙌 Learning Reference
Inspired by backend engineering concepts from Chai aur Code, extended with custom structure and improvements.

👨‍💻 Author
Hardeep Singh
Aspiring Software Engineer | Backend Developer | MERN Stack Enthusiast
