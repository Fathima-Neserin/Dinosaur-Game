const http = require("http");
const { Server } = require("socket.io");
const express = require("express");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

module.exports = {
  server,
  app,
  io,
};
