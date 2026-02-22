# Backend Template by Nerob

A Node.js (Express 5) REST API with **Docker**, **MongoDB**, **Redis**, and **GitHub Actions CI/CD**.

## 🛠 Tech Stack

* Node.js, Express.js v5
* MongoDB (Mongoose)
* Redis
* JWT Authentication
* Bcryptjs, Joi
* Multer (File Upload)
* Nodemailer (Email)
* Docker & Docker Compose
* GitHub Actions CI/CD

## 📦 Project Structure

```
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── validation/
│   └── index.js
├── Dockerfile
├── docker-compose.yml
├── .env
├── package.json
└── README.md
```

## ⚙️ Setup

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm start
```

3. Run with Docker:

```bash
docker-compose up --build
```

App runs at `http://localhost:5000`.

## 🔐 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://mongo:27017/dockerwithcicd
JWT_SECRET=your_secret_key
REDIS_HOST=redis
REDIS_PORT=6379
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## 🧪 API Response Format

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {}
}
```

## 🧠 Features

* Dockerized Node.js app
* MongoDB + Redis
* JWT Authentication
* Validation with Joi
* File upload with Multer
* Email with Nodemailer
* GitHub Actions CI/CD

## 👨‍💻 Author

**Nimur Rahman Nerob**
MERN Stack & Backend Developer

## 📄 License

ISC
