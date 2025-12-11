const mongoose = require("mongoose");

const ScoreModel = new mongoose.Schema(
  {
    player_name: { type: String, required: true },
    score: { type: Number, default: 0, min: 0 },
    session_id: { type: String, required: true },
    time_stamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Score", ScoreModel);
