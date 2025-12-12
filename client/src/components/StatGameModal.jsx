import React from "react";

const StartGameModal = ({ playerName, onStart, onNameChange, playerCount }) => (
  <div className="text-center">
    <h2 className="text-2xl mb-4 text-yellow-500">Welcome!</h2>
    <div className="mb-4">
      <label htmlFor="player-name" className="block mb-2">
        Player Name Input:
      </label>
      <input
        id="player-name"
        type="text"
        value={playerName}
        onChange={onNameChange}
        placeholder="Enter your name"
        className="p-2 rounded text-black w-64"
        maxLength={15}
      />
    </div>
    <p className="mb-6 text-lg">
      Active Runners Globally:{" "}
      <span className="text-green-400">{playerCount}</span>
    </p>
    <button
      onClick={onStart}
      className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition disabled:opacity-50"
      disabled={!playerName}
    >
      Start Run
    </button>
  </div>
);

export default StartGameModal;
