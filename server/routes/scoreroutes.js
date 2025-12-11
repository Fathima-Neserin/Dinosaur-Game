const express = require("express");
const { newScore, leaderboard } = require("../controllers/scorecontroller");
const router = express.Router();

router.post("/scores", newScore);
router.get("/leaderboard", leaderboard);
module.exports = router;