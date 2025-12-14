// components/ChatWindow.jsx
import React, { useState, useRef, useEffect } from "react";

const ChatWindow = ({
  messages,
  onSend,
  onReact,
  currentSocketId,
  playerName,
}) => {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const acceptedEmojis = ["👍", "🔥", "😂", "🎉"];

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleReact = (messageId, emoji) => {
    onReact(messageId, emoji);
  };

  const getReactionCount = (reactions, emoji) => {
    return reactions[emoji] ? reactions[emoji].length : 0;
  };

  const hasUserReacted = (reactions, emoji) => {
    // Check if the reactions array for this emoji includes the current user's socket ID
    return reactions[emoji] && reactions[emoji].includes(currentSocketId);
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-bold text-cyan-400 mb-2 pb-2 border-b border-gray-700">
        Discourse Chat
      </h3>

      {/* Message Log */}
      <div className="flex-grow overflow-y-auto mb-3 space-y-3 p-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            // Styles messages based on sender
            className={`flex flex-col p-2 rounded-lg text-sm max-w-[90%] 
                  ${
                    msg.senderId === currentSocketId
                      ? "ml-auto bg-cyan-700/80"
                      : "mr-auto bg-gray-600"
                  }`}
          >
            <div
              className={`font-bold ${
                msg.senderId === currentSocketId
                  ? "text-cyan-200"
                  : "text-yellow-400"
              }`}
            >
              {msg.playerName || "Ghost Runner"}
            </div>
            <p className="text-white break-words">{msg.text}</p>

            {/* Reactions Section */}
            <div className="flex gap-1 mt-1 flex-wrap">
              {acceptedEmojis.map((emoji) => {
                const count = getReactionCount(msg.reactions, emoji);
                const reacted = hasUserReacted(msg.reactions, emoji);

                // Only show the button if there is a reaction, or if the user is the sender/has a name (for easy reaction application)
                if (
                  count > 0 ||
                  (playerName && msg.senderId === currentSocketId)
                ) {
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      className={`
                                  flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors
                                  ${
                                    reacted
                                      ? "bg-white text-black font-bold"
                                      : "bg-gray-700 text-white hover:bg-gray-500"
                                  }
                              `}
                      disabled={!playerName} // Disable reacting if no name is set
                    >
                      {emoji}
                      <span
                        className={`text-xs ${
                          reacted ? "text-black" : "text-gray-300"
                        }`}
                      >
                        {count > 0 ? count : ""}
                      </span>
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            playerName ? "Send a message..." : "Enter name to chat..."
          }
          className="flex-grow p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          maxLength={100}
          disabled={!playerName}
        />
        <button
          type="submit"
          className="p-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition disabled:opacity-50"
          disabled={!input.trim() || !playerName}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
