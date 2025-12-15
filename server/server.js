const express = require("express");
require("dotenv").config();
const cors = require("cors");
const dbConnection = require("./config/db.config");
const { app, server, io } = require("./socket/socket");
const ScoreRoutes = require("./routes/scoreroutes");
const gameState = require("./config/gamestate.config");
const updateGameState = require("./utils/gamePhysics");
const acceptedEmojis = require("./utils/emojis");

app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_URL,
      "https://dinosaur-game-rho.vercel.app/"]
    
  })
);

const chatHistory = [];
let messageIdCounter = 1;

// Authoritative Obstacle constants
const GAME_WIDTH = 800;
const OBSTACLE_SPAWN_INTERVAL = 1500;
let prevObstacleTime = Date.now();
let obstacleIdCounter = 1;

// Game loop runs 60 times per second
const GAME_TICK_RATE = 60;

// --- Game Logic Timer ---
setInterval(() => {
  updateGameState(gameState.players);

  // Authoritative obstacle spawn logic
  const currentTime = Date.now();
  if (currentTime - prevObstacleTime >= OBSTACLE_SPAWN_INTERVAL) {
    const newObstacle = {
      id: obstacleIdCounter++,
      x: GAME_WIDTH,
      type: Math.random() > 0.5 ? "cactus-small" : "cactus-large",
      width: Math.random() > 0.5 ? 20 : 30,
      height: Math.random() > 0.5 ? 40 : 60,
    };

    io.emit("game:obstacle:spawn", newObstacle);
    prevObstacleTime = currentTime;
  }
  io.emit("players:count", gameState.players.size);
}, 1000 / GAME_TICK_RATE);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // chat history immediatley upon connect
  socket.emit("chat:history", chatHistory);

  // PLAYER JOIN GAME
  socket.on("player:join", ({ playerName }) => {
    if (!playerName) return;

    gameState.players.set(socket.id, {
      playerName,
      score: 0,
      isJumping: false,
      lastUpdateTime: Date.now(),
    });

    console.log(
      `Player ${playerName} joined the game. Total players: ${gameState.players.size}`
    );

    // Broadcast to all clients including sender
    io.emit("player:join", { socketId: socket.id, playerName });

    // Broadcast updated count (connected sockets, not just active players)
    io.emit("player:count", io.engine.clientsCount);
  });

  // chat message

  socket.on("chat:message", ({ text, playerName }) => {
    if (!text) return;

    const newMessage = {
      id: messageIdCounter++,
      senderId: socket.id,
      playerName: playerName,
      message: text,
      timeStamp: Date.now(),
      reactions: {},
    };

    chatHistory.push(newMessage);
    //  if there is 51 chats, the 1st one will be deleted  before pushing the newMessage
    if (chatHistory.length > 50) {
      chatHistory.shift();
    }

    io.emit("chat:message", newMessage);
  });

  // emoji reaction handle

  socket.on("chat:react", ({ messageId, emoji }) => {
    const message = chatHistory.find((m) => m.id === messageId);

    if (!message || !acceptedEmojis.includes(emoji)) return;

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }

    const reactions = message.reactions[emoji];
    const reactionIndex = reactions.indexOf(socket.id);

    if (reactionIndex > -1) {
      // User already reacted, so remove it (toggle off)
      reactions.splice(reactionIndex, 1);
      if (reactions.length === 0) {
        delete message.reactions[emoji];
      }
    } else {
      // User hasn't reacted, so add it (toggle on)
      reactions.push(socket.id);
    }

    // Broadcast the updated reactions for this message
    io.emit("chat:react", { messageId, reactions: message.reactions });
  });

  socket.on("player:update", ({ score, isJumping }) => {
    if (gameState.players.has(socket.id)) {
      const player = gameState.players.get(socket.id);

      // Update the authoritative state
      player.score = score;
      player.isJumping = isJumping;
      player.lastUpdateTime = Date.now();

      // Broadcast throttled update to everyone else for "ghosting"
      socket.broadcast.emit("player:update", {
        socketId: socket.id,
        score: score,
        isJumping: isJumping,
      });
    }
  });

  // PLAYER DISCONNECT / LEAVE
  socket.on("disconnect", () => {
    if (gameState.players.has(socket.id)) {
      const player = gameState.players.get(socket.id);
      console.log(`Player ${player.playerName} disconnected.`);

      gameState.players.delete(socket.id);

      //  player leaving
      io.emit("player:leave", socket.id);
    }
  });
});

// Routes
app.use("/api/score", ScoreRoutes);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  try {
    console.log(`Server is listening on ${PORT}`);
    dbConnection();
  } catch (error) {
    console.error("Server Error:", error);
  }
});
