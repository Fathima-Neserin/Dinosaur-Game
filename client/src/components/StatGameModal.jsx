import React from "react";

const StartGameModal = ({ playerName, onStart, onNameChange, playerCount }) => (
  <div className="text-center p-8 bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-inner shadow-cyan-400/20 max-w-sm w-full border border-gray-700">
    <h2 className="text-3xl font-extrabold mb-6 text-yellow-400 border-b border-yellow-400/50 pb-2">
      Begin Your Run
    </h2>
    <div className="mb-6">
      <label htmlFor="player-name" className="block mb-2 text-lg text-white/90">
        Player Name:
      </label>
      <input
        id="player-name"
        type="text"
        value={playerName}
        onChange={onNameChange}
        placeholder="Enter your name"
        className="p-3 rounded text-gray-900 w-64 border-2 border-cyan-400 focus:border-yellow-500 focus:outline-none transition-all duration-300 font-bold"
        maxLength={15}
      />
    </div>
    <p className="mb-8 text-xl text-white/80">
      Active Runners Globally:{" "}
      <span className="text-green-400 font-extrabold text-2xl">
        {playerCount}
      </span>
    </p>
    <button
      onClick={onStart}
      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 text-white font-black rounded-lg text-xl shadow-lg hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
      disabled={!playerName}
    >
      Start Run
    </button>
  </div>
);

export default StartGameModal;
