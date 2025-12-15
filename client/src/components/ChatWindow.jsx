import React, { useState, useRef, useEffect } from "react";
import { MdSend } from "react-icons/md";

const ChatWindow = ({
  messages,
  onSend,
  onReact,
  currentSocketId,
  playerName,
}) => {
  const [input, setInput] = useState("");
  const [activeReactionId, setActiveReactionId] = useState(null);
  const chatEndRef = useRef(null);

  const acceptedEmojis = ["👍", "👎", "😂", "🔥", "🎉", "❤️", "🤯", "😴", "💯"];

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
    setActiveReactionId(null);
  };

  const handleMessageClick = (messageId) => {
    if (playerName) {
      setActiveReactionId((prevId) =>
        prevId === messageId ? null : messageId
      );
    }
  };

  const getSenderColor = (senderId) => {
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) {
      hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00ffffff).toString(16).toUpperCase();
    const hex = "00000".substring(0, 6 - color.length) + color;
    return `#${hex.slice(0, 2)}80${hex.slice(4)}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto space-y-4 p-2 bg-gray-900/50 rounded-lg mb-3">
        {messages.map((msg) => {
          const isSender = msg.senderId === currentSocketId;
          return (
            <div
              key={msg.id}
              className={`relative max-w-[90%] flex flex-col ${
                isSender ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`p-3 rounded-xl shadow-md transition-shadow duration-200 cursor-pointer ${
                  isSender
                    ? "bg-blue-600/90 rounded-br-none"
                    : "bg-gray-700/90 rounded-tl-none"
                } hover:shadow-lg`}
                onClick={() => handleMessageClick(msg.id)}
                title={new Date(msg.timeStamp).toLocaleTimeString()}
              >
                <p
                  className={`text-xs font-bold mb-1 ${
                    isSender ? "text-right" : "text-left"
                  }`}
                  style={{ color: getSenderColor(msg.senderId) }}
                >
                  {msg.playerName}
                </p>

                <p className="text-sm break-words text-white">{msg.message}</p>
              </div>

              <div className="mt-1 flex space-x-1">
                {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                  if (userIds.length === 0) return null;
                  const isUserReaction = userIds.includes(currentSocketId);
                  return (
                    <span
                      key={emoji}
                      className={`text-xs px-2 py-[2px] rounded-full flex items-center transition-all duration-300 ${
                        isUserReaction
                          ? "bg-cyan-500 text-gray-900 font-bold border border-white"
                          : "bg-gray-600/70 text-white border border-gray-700"
                      }`}
                    >
                      {emoji} {userIds.length}
                    </span>
                  );
                })}
              </div>

              {activeReactionId === msg.id && (
                <div
                  className={`absolute z-10 p-2 bg-gray-800 border border-blue-500/50 rounded-lg shadow-xl flex space-x-1 bottom-full mb-1 ${
                    isSender ? "right-0" : "left-0"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {acceptedEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className={`text-xl p-1 rounded-full hover:bg-gray-700 transition-all duration-200 ${
                        msg.reactions[emoji]?.includes(currentSocketId)
                          ? "ring-2 ring-yellow-400"
                          : ""
                      }`}
                      onClick={() => handleReact(msg.id, emoji)}
                      disabled={!playerName}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            playerName ? "Type a message..." : "Enter name to chat..."
          }
          className="flex-grow p-3 rounded-lg bg-gray-700/80 text-white placeholder-gray-500 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
          maxLength={100}
          disabled={!playerName}
        />

        <button
          type="submit"
          className="px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg shadow-md hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          disabled={!input.trim() || !playerName}
        >
          <MdSend className="text-2xl" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
