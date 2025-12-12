import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5000";
const LEADERBOARD_URL = `${SERVER_URL}/api/score/leaderboard`;

const useSocket = (playerName) => {
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [ghostPlayers, setGhostPlayers] = useState(new Map());
  const socketRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(LEADERBOARD_URL);

      if (Array.isArray(response.data)) {
        setLeaderboard(response.data);
      } else {
        console.warn(
          "Leaderboard API returned non-array data. State set to []."
        );
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Failed to fetch initial leaderboard:", error.message);
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    const socket = io(SERVER_URL, { query: { playerName } });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      fetchLeaderboard();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("player:count", setPlayerCount);
    socket.on("leaderboard:update", (data) => {
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    });

    // Player state updates
    socket.on("player:update", ({ socketId, isJumping }) => {
      setGhostPlayers((prev) => {
        const newGhostPlayers = new Map(prev);
        newGhostPlayers.set(socketId, { isJumping });
        return newGhostPlayers;
      });
    });

    // Player leaving the session
    socket.on("player:leave", (socketId) => {
      setGhostPlayers((prev) => {
        const newGhostPlayers = new Map(prev);
        newGhostPlayers.delete(socketId);
        return newGhostPlayers;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [playerName, fetchLeaderboard]);

  // Public Emitters (updates)
  const joinGame = useCallback(
    (sessionId) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("player:join", { playerName, sessionId });
      }
    },
    [playerName]
  );

  const updatePlayerState = useCallback((score, isJumping) => {
    if (socketRef.current) {
      socketRef.current.emit("player:update", { score, isJumping });
    }
  }, []);

  return {
    isConnected,
    leaderboard,
    playerCount,
    ghostPlayers,
    joinGame,
    updatePlayerState,
  };
};

export default useSocket;
