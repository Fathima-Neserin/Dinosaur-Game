import React, { useState, useCallback } from "react";
import useSocket from "../hooks/useSocket";
import GameOverModal from "../components/GameOverModal";
import StartGameModal from "../components/StatGameModal";
import DinosaurGame from "../components/DinosaurGame";
import axios from "axios";
import ChatWindow from "../components/ChatWindow";

const API_SERVER_URL = "https://dinosaur-game-2.onrender.com";

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
        .post(`${API_SERVER_URL}/api/score`, {
          player_name: playerName,
          score: Math.floor(score),
          session_id: sessionId,
        })
        .then((res) => console.log("Score Submitted:", res.data))
        .catch((err) => console.error("Score Submission Failed:", err));
    },
    [playerName]
  );

  const handleRestart = () => {
    setGameOverData(null);
    setIsGameActive(true);
  };

  const gameContent = isGameActive ? (
    <DinosaurGame
      onGameOver={handleGameOver}
      updatePlayerState={updatePlayerState}
      ghostPlayers={ghostPlayers}
      sharedObstacles={sharedObstacles}
    />
  ) : gameOverData ? (
    <GameOverModal score={gameOverData.score} onRestart={handleRestart} />
  ) : (
    <StartGameModal
      playerName={playerName}
      onStart={handleStartGame}
      onNameChange={(e) => setPlayerName(e.target.value)}
      playerCount={playerCount}
    />
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-mono flex flex-col items-center p-4">
      <h1 className="text-5xl font-extrabold mb-4 text-yellow-400 tracking-widest border-b-4 border-yellow-600 pb-2 shadow-lg">
        Dino Runner Multiplayer
      </h1>

      <div className="flex gap-6 max-w-7xl w-full h-[calc(100vh-120px)] mx-auto items-start">
        <div className="w-[900px] flex-shrink-0 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-2xl relative">
          {gameContent}
        </div>

        <div className="w-96 flex-shrink-0 flex flex-col bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 bg-gray-700/50 rounded-t-lg border-b border-gray-700">
            <h3 className="text-2xl font-bold mb-3 text-cyan-400 text-center border-b border-cyan-400/50 pb-1">
              Live Leaderboard
            </h3>
            <p className="text-sm text-white/70 mb-4 text-center">
              Total Active Players:{" "}
              <span className="text-green-400">{playerCount}</span>
            </p>

            <ol className="space-y-2">
              {leaderboard &&
              Array.isArray(leaderboard) &&
              leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <li
                    key={entry._id || index}
                    className={`p-2 rounded flex justify-between items-center transition-all duration-300 ${
                      index === 0
                        ? "bg-yellow-600 text-gray-900 border-2 border-yellow-400"
                        : index === 1
                        ? "bg-gray-400 text-gray-900 border-2 border-gray-300"
                        : index === 2
                        ? "bg-yellow-800 text-white border-2 border-yellow-900"
                        : "bg-gray-900 hover:bg-gray-700 border border-gray-600"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-extrabold mr-2 w-6 text-center">
                        #{index + 1}
                      </span>
                      <span
                        className={`truncate ${
                          index < 3 ? "text-lg" : "text-base"
                        }`}
                        title={entry.player_name}
                      >
                        {entry.player_name || "Unknown"}
                      </span>
                    </div>

                    <span
                      className={`font-extrabold text-lg ml-4 ${
                        index < 3 ? "text-gray-900" : "text-cyan-400"
                      } mr-[2px]`}
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

          <div className="flex-1 p-4 overflow-hidden flex flex-col bg-gray-900 rounded-b-lg">
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
    </div>
  );
};

export default GamePage;
