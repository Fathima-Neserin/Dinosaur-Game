const Scores = require("../models/scoremodels");
const { io } = require("../socket/socket");

const getLeaderboard = async (limit = 10) => {
  const topScores = await Scores.find({})
    .sort({ score: -1, timestamp: 1 })
    .limit(limit)
    .lean();

  return topScores.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
};
exports.newScore = async (req, res) => {
  const { player_name, score, session_id } = req.body;

  if (!player_name || typeof score !== "number" || score < 0 || !session_id) {
    return res.status(400).json({ message: "Invalid input data." });
  }

  try {
    const newScore = await Scores.create({ player_name, score, session_id });

    // 1. Fetch and broadcast the updated leaderboard
    const leaderboard = await getLeaderboard();
    io.emit("leaderboard:update", leaderboard); // Broadcast to all connected clients
    io.emit("score:new", { player_name, score }); // Broadcast new score notification

    res.status(201).json(newScore);
  } catch (error) {
    console.error("Score submission error:", error);
    res.status(500).json({ message: "Server error saving score." });
  }
};

exports.leaderboard = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const leaderboard = await getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching leaderboard." });
  }
};
