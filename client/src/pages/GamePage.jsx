import React, { useState, useCallback } from "react";
import useSocket from "../hooks/useSocket";
import GameOverModal from "../components/GameOverModal";
import StartGameModal from "../components/StatGameModal";
import DinosaurGame from "../components/DinosaurGame";
import axios from "axios";
import ChatWindow from "../components/ChatWindow";

const generateSessionId = () =>
  `session-${Date.now().toString(36) + Math.random().toString(36).substr(2)}`;

const GamePage = () => {
  const [playerName, setPlayerName] = useState("");
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);

  const {
    isConnected,
    leaderboard,
    playerCount,
    ghostPlayers,
    joinGame,
    updatePlayerState,
    socketId,
    chatMessages,
    sendMessage,
    sendReaction,
    sharedObstacles,
  } = useSocket(playerName);

  // console.log("Leaderboard", leaderboard);

  const handleStartGame = () => {
    const sessionId = generateSessionId();
    setGameOverData(null);
    setIsGameActive(true);
    joinGame(sessionId);
  };

  const handleGameOver = useCallback(
    (score, sessionId) => {
      setIsGameActive(false);
      setGameOverData({ playerName, score, sessionId });

      axios
        .post("http://localhost:5000/api/score/scores", {
          player_name: playerName,
          score: Math.floor(score),
          session_id: sessionId,
        })
        .then((res) => {
          console.log("Score Submitted:", res.data);
        })
        .catch((err) => {
          console.error("Score Submission Failed:", err);
          if (err.response) {
            console.error("Error response:", err.response.data);
          }
        });
    },
    [playerName]
  );

  const handleNameChange = (e) => setPlayerName(e.target.value);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex p-8">
      <div className="flex-1 flex flex-col items-center p-4">
        <h1 className="text-4xl font-extrabold text-yellow-500 mb-6">
          Dino Runner Multiplayer
        </h1>
        <p
          className={`text-sm mb-4 ${
            isConnected ? "text-green-400" : "text-red-400"
          }`}
        >
          Status: {isConnected ? "Connected" : "Connecting..."} | Active
          Runners: {playerCount}
        </p>

        {isGameActive ? (
          <div className="flex flex-col items-center">
            <DinosaurGame
              updatePlayerState={updatePlayerState}
              onGameOver={handleGameOver}
              ghostPlayers={ghostPlayers}
              sharedObstacles={sharedObstacles}
            />

            <button
              onClick={() => {
                setIsGameActive(false);
                setGameOverData(null);
              }}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-200 text-2xl"
            >
              Quit Game
            </button>
          </div>
        ) : (
          <div className="w-[800px] h-[300px] bg-gray-800 flex flex-col items-center justify-center border-4 border-yellow-500">
            {gameOverData ? (
              <GameOverModal
                score={gameOverData.score}
                onRestart={handleStartGame}
              />
            ) : (
              <StartGameModal
                playerName={playerName}
                onStart={handleStartGame}
                onNameChange={handleNameChange}
                playerCount={playerCount}
              />
            )}
          </div>
        )}
      </div>

      <div className="w-full md:w-96 flex flex-col bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 shadow-2xl rounded-lg mt-8 md:mt-0">
        <div className="h-[450px] p-4 overflow-y-auto bg-black/30 backdrop-blur-xl rounded-t-lg">
          {" "}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 border-b border-cyan-400/50">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl text-cyan-400">🏆</span>
              <h3 className="text-3xl font-extrabold text-white tracking-wider">
                Live Scores
              </h3>
            </div>
            <p className="text-center text-gray-400 font-medium">
              {playerCount} Players Online
            </p>
          </div>
          <div className="p-6">
            <ol className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              <li className="flex justify-between text-xs font-semibold uppercase text-cyan-400 pb-2 border-b border-gray-700">
                <span className="w-8 text-left">Rank</span>
                <span className="flex-1 text-left">Player</span>
                <span className="text-right mr-[20px]">Score</span>
              </li>

              {leaderboard &&
              Array.isArray(leaderboard) &&
              leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <li
                    key={entry._id || index}
                    className={`
                p-3 rounded-xl flex items-center justify-between
                transition-colors duration-200
                ${
                  index === 0
                    ? "bg-yellow-800/50 text-white shadow-xl"
                    : index === 1
                    ? "bg-gray-500/50 text-white"
                    : index === 2
                    ? "bg-orange-700/50 text-white"
                    : "bg-white/5 text-white hover:bg-white/10"
                }
              `}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`text-xl font-bold w-8 text-left ${
                          index < 3 ? "text-yellow-300" : "text-gray-400"
                        }`}
                      >
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${entry.rank}`}
                      </span>

                      <span
                        className={`font-semibold truncate flex-auto text-left`}
                        title={entry.player_name}
                      >
                        {entry.player_name || "Unknown"}
                      </span>
                    </div>

                    <span
                      className={`font-extrabold text-lg ml-4 ${
                        index < 3 ? "text-yellow-300" : "text-cyan-400"
                      } mr-[20px]`}
                    >
                      {entry.score}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-center text-white/60 py-8">
                  {isConnected ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                      <span>Loading scores...</span>
                    </div>
                  ) : (
                    "Connecting..."
                  )}
                </li>
              )}
            </ol>
          </div>
        </div>
        <div className="flex-grow p-4 border-t border-gray-700 overflow-hidden flex flex-col bg-gray-900 rounded-b-lg">
          <ChatWindow
            messages={chatMessages}
            onSend={sendMessage}
            onReact={sendReaction}
            currentSocketId={socketId}
            playerName={playerName}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
