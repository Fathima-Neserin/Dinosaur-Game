import React, { useRef, useEffect, useState, useCallback } from "react";
import throttle from "lodash.throttle";

// --- CONSTANTS ---
const GAME_WIDTH = 800;
const GAME_HEIGHT = 300;
const DINO_Y_START = 40;
const DINO_WIDTH = 80;
const DINO_HEIGHT = 80;
const DINO_X_POSITION = 40;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPAWN_INTERVAL = 1500;
const INITIAL_GROUND_SPEED = 6;
const GRAVITY = 1.0;
const DINO_JUMP_VELOCITY = 18;
const SPEED_INCREMENT = 0.2;
const THROTTLE_RATE = 100;

// Generates a new session ID
const generateSessionId = () =>
  `session-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

// Creates fresh game state on each new run
const createInitialGameState = () => ({
  dinoY: DINO_Y_START,
  velocityY: 0,
  isJumping: false,
  isGameOver: false,
  score: 0,
  groundSpeed: INITIAL_GROUND_SPEED,
  obstacles: [],
  lastObstacleTime: Date.now(),
  sessionId: generateSessionId(),
});

const DinosaurGame = ({ onGameOver, updatePlayerState, ghostPlayers }) => {
  const [gameState, setGameState] = useState(createInitialGameState);
  const gameStateRef = useRef(gameState);

  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Keep ref synced
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Throttled socket state sync
  const throttledUpdate = useCallback(
    throttle(
      (score, isJumping) => {
        updatePlayerState(score, isJumping);
      },
      THROTTLE_RATE,
      { leading: false, trailing: true }
    ),
    [updatePlayerState]
  );

  // Jump handler
  const handleJump = useCallback(() => {
    setGameState((prev) => {
      if (prev.isJumping || prev.isGameOver) return prev;

      return {
        ...prev,
        isJumping: true,
        velocityY: DINO_JUMP_VELOCITY,
      };
    });
  }, []);

  // Main game loop
  const gameLoop = useCallback(
    (time) => {
      const prev = gameStateRef.current;
      const delta = time - lastTimeRef.current;

      if (!delta) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (prev.isGameOver) return;

      let newState = { ...prev };

      // Score
      newState.score += delta * 0.01;

      if (
        Math.floor(newState.score) % 100 === 0 &&
        newState.score > 50 &&
        newState.groundSpeed < 16
      ) {
        newState.groundSpeed += SPEED_INCREMENT;
      }

      // Jump physics
      if (newState.isJumping) {
        newState.dinoY += newState.velocityY * (delta / 16);
        newState.velocityY -= GRAVITY * (delta / 16);

        if (newState.dinoY <= DINO_Y_START) {
          newState.dinoY = DINO_Y_START;
          newState.velocityY = 0;
          newState.isJumping = false;
        }
      }

      // --- Spawn new obstacles ---
      if (
        newState.obstacles.length === 0 ||
        time - newState.lastObstacleTime > OBSTACLE_SPAWN_INTERVAL
      ) {
        const newObs = {
          id: Date.now(),
          x: GAME_WIDTH,
          width: Math.max(OBSTACLE_WIDTH, 24),
          height: Math.max(OBSTACLE_HEIGHT, 56),
        };
        newState.obstacles.push(newObs);
        newState.lastObstacleTime = time;

        console.log(
          "Spawned obstacle at x=",
          newObs.x,
          "height=",
          newObs.height
        );
      }

      newState.obstacles = newState.obstacles
        .map((obs) => ({
          ...obs,
          x: obs.x - newState.groundSpeed, // pixels per frame
        }))
        .filter((obs) => obs.x > -Math.max(OBSTACLE_WIDTH, 24) - 50);

      // Collision detection
      const playerBox = {
        left: DINO_X_POSITION,
        right: DINO_X_POSITION + DINO_WIDTH,
        bottom: newState.dinoY,
        top: newState.dinoY + DINO_HEIGHT,
      };

      const hit = newState.obstacles.some((obs) => {
        const box = {
          left: obs.x,
          right: obs.x + obs.width,
          bottom: DINO_Y_START,
          top: DINO_Y_START + obs.height,
        };

        return (
          playerBox.right > box.left &&
          playerBox.left < box.right &&
          playerBox.top > box.bottom &&
          playerBox.bottom < box.top
        );
      });

      if (hit) {
        newState.isGameOver = true;
        cancelAnimationFrame(animationRef.current);
        throttledUpdate.cancel();
        onGameOver(newState.score, newState.sessionId);
        return;
      }

      throttledUpdate(Math.floor(newState.score), newState.isJumping);

      setGameState(newState);
      lastTimeRef.current = time;

      animationRef.current = requestAnimationFrame(gameLoop);
    },
    [onGameOver, throttledUpdate]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [gameLoop]);

  // Keyboard jump
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [handleJump]);

  return (
    <div
      onClick={handleJump}
      className={`
    relative bg-gray-100 border-b-4 border-gray-600
    ${gameState.isGameOver ? "opacity-50" : "cursor-pointer"}
  `}
      style={{
        width: GAME_WIDTH + "px",
        height: GAME_HEIGHT + "px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Score */}
      <div className="absolute top-2 right-4 text-2xl font-mono text-gray-700 z-50">
        Timer: {Math.floor(gameState.score)}
      </div>

      {/* Obstacles - RENDER FIRST so they appear behind dino */}
      {gameState.obstacles.map((obs) => (
        <div
          key={obs.id}
          className="absolute bg-red-600 border-2 border-red-800"
          style={{
            left: obs.x + "px",
            bottom: DINO_Y_START + "px",
            width: obs.width + "px",
            height: obs.height + "px",
            zIndex: 1,
          }}
        />
      ))}

      {/* Dino (Facing Right) */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: DINO_X_POSITION,
          bottom: gameState.dinoY,
          width: DINO_WIDTH,
          height: DINO_HEIGHT,
          zIndex: 10,
        }}
      >
        <span
          className="absolute flex items-center justify-center"
          style={{
            fontSize: "70px",
            transform: "scaleX(-1)",
            lineHeight: 1,
            display: "inline-block",
          }}
        >
          🦖
        </span>
      </div>

      {/* Ghost Players */}
      {[...ghostPlayers.entries()].map(([id, ghost]) => (
        <div
          key={id}
          className="absolute bg-gray-400 opacity-50 rounded-full"
          style={{
            left: DINO_X_POSITION,
            bottom: ghost.isJumping ? DINO_Y_START + 80 : DINO_Y_START,
            width: DINO_WIDTH,
            height: DINO_HEIGHT,
            transition: "bottom 0.15s ease",
            zIndex: 5,
          }}
        >
          <span className="text-2xl absolute inset-0 flex items-center justify-center">
            👤
          </span>
        </div>
      ))}

      {/* Overlay */}
      {gameState.isGameOver && (
        <div
          className="absolute inset-0 bg-black/50 flex items-center justify-center"
          style={{ zIndex: 100 }}
        >
          <h2 className="text-4xl text-white font-bold">GAME OVER</h2>
        </div>
      )}
    </div>
  );
};

export default DinosaurGame;
