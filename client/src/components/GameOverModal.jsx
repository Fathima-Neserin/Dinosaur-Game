
import React from 'react';

const GameOverModal = ({ score, onRestart }) => (
    <div className="text-center">
        <h2 className="text-4xl font-extrabold text-red-500 mb-4">GAME OVER!</h2>
        <p className="text-2xl mb-6">Final Score: <span className="text-yellow-400">{Math.floor(score)}</span></p>
        <button
            onClick={onRestart}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition"
        >
            Restart Run
        </button>
    </div>
);

export default GameOverModal;