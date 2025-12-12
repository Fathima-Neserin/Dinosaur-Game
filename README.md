🦖 Dino Runner Multiplayer
A real-time multiplayer dinosaur runner game built with React, Node.js, Socket.IO, and MongoDB. Players compete to achieve the highest scores while seeing ghost players run alongside them in real-time.
✨ Features

Real-time multiplayer with ghost players
Live leaderboard with instant updates
Persistent score tracking in MongoDB
Active player count display

🛠️ Tech Stack
Frontend

React.js
Axios (API requests)
Socket.IO Client (WebSocket communication)
Tailwind CSS (Styling)

Backend

Node.js
Express.js
Socket.IO (Real-time communication)
MongoDB (Database)
Mongoose (ODM)

📋 Prerequisites
Before running this project, make sure you have:

Node.js (v14 or higher)
npm or yarn
MongoDB (local or MongoDB Atlas)

🚀 Installation
1. Clone the Repository
bashgit clone <your-repo-url>
cd dino-runner-multiplayer
2. Backend Setup
bash# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
touch .env
Add the following to your .env file:
envPORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/dino-game
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dino-game
3. Frontend Setup
bash# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
🎮 Running the Application
Start Backend Server
bashcd backend
npm start
# or for development with nodemon:
npm run dev
Server will run on http://localhost:5000
Start Frontend
bashcd frontend
npm run dev
Frontend will run on http://localhost:5173

Happy Gaming! 🎮🦖