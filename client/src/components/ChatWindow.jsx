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
  const chatEndRef = useRef(null);
  const acceptedEmojis = ["👍", "🔥", "😂", "🎉"];

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
    return reactions[emoji] && reactions[emoji].includes(currentSocketId);
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-bold text-cyan-400 mb-2 pb-2 border-b border-gray-700">
        Discourse Chat
      </h3>

      {/* Message Log */}
      <div className="flex-grow overflow-y-auto mb-3 space-y-3 p-3 custom-scrollbar">
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === currentSocketId;
          const senderName = msg.playerName || "Ghost Runner";
          const messageText = msg.text || msg.message || msg.content || "";
          const hasReactions =
            msg.reactions &&
            acceptedEmojis.some(
              (emoji) => getReactionCount(msg.reactions, emoji) > 0
            );

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isOwnMessage ? "items-end" : "items-start" // Alignment
              }`}
            >
              {/* Message Bubble Container - Holds message and reactions */}
              <div className="max-w-[80%] relative">
                
                {/* MESSAGE BUBBLE: This div holds ALL styling and content */}
                <div
                  className={`relative p-3 text-sm leading-relaxed break-words shadow-lg rounded-2xl ${
                    isOwnMessage
                      ? "bg-cyan-600 text-white rounded-br-md"
                      : "bg-white text-gray-900 rounded-bl-md"
                  }`}
                >
                  {/* Bubble Tail (Optional, but included for complete look) */}
                  <span
                    className={`absolute bottom-2 w-3 h-3 rotate-45 ${
                      isOwnMessage
                        ? "right-[-6px] bg-cyan-600"
                        : "left-[-6px] bg-white"
                    }`}
                  />

                  {/* Sender Name (CAPITALS, Bold) */}
                  <p
                    className={`text-xs font-extrabold mb-1 uppercase ${
                      isOwnMessage ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {senderName}
                  </p>

                  {/* Message Text */}
                  <p>{messageText}</p>
                </div>

                {/* Reactions Overlay (Floating Badge) */}
                {hasReactions && (
                  <div
                    className={`absolute bottom-[-10px] ${
                      isOwnMessage ? "left-[-10px]" : "right-[-10px]"
                    } flex gap-1 bg-gray-800 border border-gray-700 rounded-full py-0.5 px-1 shadow-md`}
                  >
                    {acceptedEmojis.map((emoji) => {
                      const count = getReactionCount(msg.reactions, emoji);
                      const reacted = hasUserReacted(msg.reactions, emoji);

                      if (count > 0) {
                        return (
                          <div
                            key={emoji}
                            className={`flex items-center text-xs font-semibold ${
                              reacted ? "ring-2 ring-cyan-500 rounded-full" : ""
                            }`}
                          >
                            <span className="text-sm">{emoji}</span>
                            <span className="ml-0.5 text-white">{count}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* Reaction Buttons (Manual trigger visible for self if no reactions) */}
              {isOwnMessage && !hasReactions && (
                <div className="flex gap-1 mt-2">
                  <p className="text-xs font-semibold text-gray-400 mr-1">
                    React:
                  </p>
                  {acceptedEmojis.map((emoji) => (
                    <button
                      key={`react-${msg.id}-${emoji}`}
                      onClick={() => handleReact(msg.id, emoji)}
                      className={`text-sm p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition`}
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
          className="p-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition disabled:opacity-50 flex items-center justify-center text-xl"
          disabled={!input.trim() || !playerName}
        >
          <MdSend />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;