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

// PHYSICS & GAMEPLAY
const INITIAL_GROUND_SPEED = 6;
const GRAVITY = 1.0;
const DINO_JUMP_VELOCITY = 18;
const SPEED_INCREMENT = 0.2;

// NETWORK SYNCHRONIZATION
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
  sessionId: generateSessionId(),
});

const DinosaurGame = ({
  onGameOver,
  updatePlayerState,
  ghostPlayers,
  sharedObstacles,
}) => {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [localObstacles, setLocalObstacles] = useState([]);

  const gameStateRef = useRef(gameState);
  const localObstaclesRef = useRef(localObstacles);

  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Keep ref synced
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    localObstaclesRef.current = localObstacles;
  }, [localObstacles]);

  // Add new obstacles when server sends them
  useEffect(() => {
    if (sharedObstacles && sharedObstacles.length > 0) {
      const latestObstacle = sharedObstacles[sharedObstacles.length - 1];

      setLocalObstacles((prev) => {
        // Check if this obstacle already exists
        if (prev.find((obs) => obs.id === latestObstacle.id)) {
          return prev;
        }
        // Add the new obstacle
        return [...prev, latestObstacle];
      });
    }
  }, [sharedObstacles]);

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
      const currentObstacles = localObstaclesRef.current;
      const delta = time - lastTimeRef.current;

      if (!delta) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (prev.isGameOver) return;

      let newState = { ...prev };

      // Score and Speed Logic
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

      // Move obstacles and filter off-screen ones
      const updatedObstacles = currentObstacles
        .map((obs) => ({
          ...obs,
          x: obs.x - newState.groundSpeed,
        }))
        .filter((obs) => obs.x > -Math.max(OBSTACLE_WIDTH, 24) - 50);

      // Update local obstacles state
      setLocalObstacles(updatedObstacles);

      // Collision detection
      const playerBox = {
        left: DINO_X_POSITION,
        right: DINO_X_POSITION + DINO_WIDTH,
        bottom: newState.dinoY,
        top: newState.dinoY + DINO_HEIGHT,
      };

      const hit = updatedObstacles.some((obs) => {
        const box = {
          left: obs.x,
          right: obs.x + (obs.width || OBSTACLE_WIDTH),
          bottom: DINO_Y_START,
          top: DINO_Y_START + (obs.height || OBSTACLE_HEIGHT),
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

      {/* Render obstacles from localObstacles */}
      {localObstacles.map((obs) => (
        <div
          key={obs.id}
          className="absolute bg-red-600 border-2 border-red-800"
          style={{
            left: obs.x + "px",
            bottom: DINO_Y_START + "px",
            width: (obs.width || OBSTACLE_WIDTH) + "px",
            height: (obs.height || OBSTACLE_HEIGHT) + "px",
            zIndex: 1,
          }}
        />
      ))}

      {/* Your Dino - Green with glow effect */}
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
        <div className="relative">
          {/* Glow effect */}
          <div
            className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-40"
            style={{
              width: "90px",
              height: "90px",
              left: "-5px",
              top: "-5px",
            }}
          />
          {/* Main dino */}
          <span
            className="relative"
            style={{
              fontSize: "70px",
              transform: "scaleX(-1)",
              lineHeight: 1,
              display: "inline-block",
              filter:
                "drop-shadow(0 0 8px #4ade80) drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
            }}
          >
            🦖
          </span>
        </div>
      </div>

      {/* Ghost Players - Cyan transparent with hologram effect */}
      {[...ghostPlayers.entries()].map(([id, ghost]) => (
        <div
          key={id}
          className="absolute"
          style={{
            left: DINO_X_POSITION,
            bottom: ghost.isJumping ? DINO_Y_START + 80 : DINO_Y_START,
            width: DINO_WIDTH,
            height: DINO_HEIGHT,
            transition: "bottom 0.15s ease",
            zIndex: 5,
          }}
        >
          <div className="relative w-full h-full">
            {/* Outer glow */}
            <div
              className="absolute inset-0 bg-cyan-400 rounded-lg blur-lg opacity-30 animate-pulse"
              style={{
                width: "85px",
                height: "85px",
                left: "-2px",
                top: "-2px",
              }}
            />
            {/* Border effect */}
            <div className="absolute inset-0 border-2 border-cyan-400/60 rounded-lg" />
            {/* Background */}
            <div className="absolute inset-0 bg-cyan-500/15 rounded-lg backdrop-blur-sm" />
            {/* Ghost dino */}
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                fontSize: "60px",
                transform: "scaleX(-1)",
                lineHeight: 1,
                filter: "drop-shadow(0 0 12px cyan)",
                opacity: 0.75,
              }}
            >
              🦖
            </span>
            {/* Scanline effect for hologram look */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)",
                borderRadius: "0.5rem",
              }}
            />
          </div>
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
