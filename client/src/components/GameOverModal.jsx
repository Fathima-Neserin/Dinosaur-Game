import React from "react";

const GameOverModal = ({ score, onRestart }) => (
  <div className="text-center p-10 bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-inner shadow-red-500/30 max-w-md w-full border border-red-700">
    <h2 className="text-5xl font-black mb-4 text-red-500 tracking-widest animate-pulse drop-shadow-lg shadow-red-900">
      GAME OVER!
    </h2>
    <p className="text-3xl mb-8 text-white/90">
      Final Score:{" "}
      <span className="text-yellow-400 font-extrabold text-4xl">
        {Math.floor(score)}
      </span>
    </p>
    <button
      onClick={onRestart}
      className="w-3/4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg text-xl shadow-md hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-[1.05]"
    >
      Restart Run
    </button>
  </div>
);

export default GameOverModal;
