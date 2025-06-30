# Blog-App
📝 Full-stack Blog App with Spring Boot &amp; React. 🔒 Secure backend with Spring Security (JWT) for user login, post creation, and viewing. ⚛️ Frontend built in React with protected routes and clean UI. 💾 MySQL + JPA for data persistence.
# 📝 Full-Stack Blog App

A secure and modern **blog application** built with **Spring Boot (backend)** and **React (frontend)**. Users can register, log in with JWT authentication, create posts, and view blogs. The app follows RESTful principles and features protected routes, clean UI, and MySQL database integration.

---

## 🚀 Features

### 🔒 Backend (Spring Boot)
- User Registration & Login
- Spring Security with JWT Authentication
- Role-based access control (optional)
- Create and view blog posts
- RESTful API structure
- MySQL + Spring Data JPA

### ⚛️ Frontend (React)
- React 18 with Vite
- JWT token storage in localStorage
- Login & Registration forms
- Protected routes for authenticated users
- Post creation and viewing
- Axios for API calls
- Clean and responsive UI

---

## 🛠️ Tech Stack

- **Backend:** Java 21, Spring Boot 3.x, Spring Security, Spring Data JPA, MySQL, Maven
- **Frontend:** React 18, Vite, React Router v6, Axios, Tailwind CSS (optional)

---

## 📦 Getting Started

### 🔧 Backend Setup

1. Clone the repo and navigate to the backend folder:
   ```bash
   git clone https://github.com/NandhaCode54/Blog-App.git
   cd blog-app/backend
2.application.properties
  spring.datasource.url=jdbc:mysql://localhost:3306/blogdb
  spring.datasource.username=your_username
  spring.datasource.password=your_password
  jwt.secret=your_256_bit_secret_key

