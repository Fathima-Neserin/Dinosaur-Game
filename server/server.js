const express = require("express");
require("dotenv").config();
const cors = require("cors");
const dbConnection = require("./config/db.config");
const { app, server, io } = require("./socket/socket");
const ScoreRoutes = require("./routes/scoreroutes");
const gameState = require("./config/gamestate.config");
const updateGameState = require("./utils/gamePhysics");

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

// Game loop runs 60 times per second
const GAME_TICK_RATE = 60;

// --- Game Logic Timer ---
setInterval(() => {
  updateGameState(gameState.players);

  io.emit("players:count", gameState.players.size);
}, 1000 / GAME_TICK_RATE);

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // PLAYER JOIN GAME
  socket.on("player:join", ({ playerName }) => {
    if (!playerName) return;

    gameState.players.set(socket.id, {
      playerName,
      score: 0,
      isJumping: false,
      lastUpdateTime: Date.now(),
    });

    console.log(`Player ${playerName} joined the game.`);

    io.emit("player:join", { socketId: socket.id, playerName });
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
