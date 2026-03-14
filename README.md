# Aimdeed - NEET & JEE Preparation Platform

Aimdeed is a comprehensive educational platform designed to help students prepare for NEET and JEE examinations. It provides premium study materials, mentorship programs, an AI chatbot for study assistances, and a JEE rank predictor.

## 🚀 Features
- **User Authentication**: Secure signup, login, and robust password reset functionality.
- **Role-based Access**: Protected routes for premium content, tools, and mentors.
- **AI Chatbot**: Integrated study assistant powered by OpenRouter/OpenAI.
- **Rank Predictor**: Data-driven JEE rank prediction using historical JOSAA data.
- **Payment Gateway**: Built-in UPI-based payment system for premium access.
- **Modern UI/UX**: Distinctive, stunning blue-theme interface featuring glassmorphism and smooth animations.

---

## 🛠️ Prerequisites

To run this project locally, ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x recommended)
- **npm** (comes with Node.js)
- **MongoDB** (running locally on port 27017, or a MongoDB Atlas URI)
- **Docker & Docker Compose** (Optional, if you prefer running via containers)

---

## 💻 Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/pijush008/Aimdeed.git
cd Aimdeed
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root directory of the project and define the required configuration variables. You can use the following template:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URL=mongodb://127.0.0.1:27017/aimdeed
SESSION_SECRET=your_super_secret_session_key

# Email Details (For Password Reset / Contact Forms)
# Use a Gmail account with an "App Password"
EMAIL_USERNAME=your.email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password

# Artificial Intelligence (Chatbot)
OPENROUTER_API_KEY=your_openrouter_api_key

# Payments
UPI_ID=your_merchant_upi_id@bank
```

### 4. Start MongoDB
Ensure that your MongoDB service is running locally on your computer.
```bash
# On Linux
sudo systemctl start mongod

# On macOS (using Homebrew)
brew services start mongodb-community
```

### 5. Start the Application
You can start the server using npm:
```bash
npm start
```
The application will be accessible at `http://localhost:3000`.

---

## 🐳 Docker Setup (Alternative)

If you do not want to configure Node.js and MongoDB natively on your machine, you can run the entire application stack using Docker.

1. Ensure **Docker Desktop** or the Docker Engine is running.
2. Ensure you have created the `.env` file in the root directory.
3. Build and spin up the containers:
```bash
docker-compose up --build
```
This automatically sets up the Node.js application and a MongoDB database, linking them together on a virtual network. The app will be heavily cached and bound to `http://localhost:3000`.

---

## 🤝 Contribution Guidelines
1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔄 CI/CD Pipeline — GitHub → Docker → Render
This project uses **Render's native GitHub integration** for fully automated deployments. Every code push is automatically picked up by Render, which builds a fresh Docker image and deploys it — no manual steps required.

```mermaid
graph TD;
  A["🧑‍💻 Code Change"] --> B["📤 Push to GitHub"];
  B --> C["👀 Render detects change"];
  C --> D["🐳 Docker image builds"];
  D --> E["🚀 Container runs"];
  E --> F["✅ AIMDEED updated"];
```

**How to connect Render to your GitHub repo:**
1. Go to [render.com](https://render.com) and create a new **Web Service**.
2. Select **"Connect a Repository"** and link your GitHub `Aimdeed` repo.
3. In the **Environment** setting, set it to **Docker** — Render will automatically use the `Dockerfile` included in this repo.
4. Every push to `main` will now **automatically trigger a new Docker build and live deployment** with zero manual intervention!

## 📝 License
Distributed under the ISC License.
