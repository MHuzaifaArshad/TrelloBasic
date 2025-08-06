import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Send } from 'lucide-react';

export default function Chatbox({ messages, onSendMessage, user }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-inner border-2 border-gray-600 font-sans">
      <h3 className="text-xl font-bold text-yellow-400 p-4 border-b-2 border-gray-600 font-mono uppercase text-shadow-retro">
        PROJECT CHAT
      </h3>
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center py-4 font-mono text-sm">NO MESSAGES YET. START THE CONVERSATION!</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`mb-3 p-3 rounded-lg max-w-[80%] break-words shadow-md ${
                user && msg.sender._id === user._id
                  ? 'bg-blue-700 text-white ml-auto rounded-br-none'
                  : 'bg-gray-700 text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="font-bold text-sm font-mono mb-1">
                {user && msg.sender._id === user._id ? 'YOU' : msg.sender.username.toUpperCase()}
              </p>
              <p className="text-base font-sans">{msg.content}</p>
              <p className="text-xs text-right mt-1 opacity-75 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t-2 border-gray-600 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="TYPE YOUR MESSAGE HERE..."
          className="flex-1 p-2.5 bg-gray-900 text-yellow-400 border-2 border-green-500 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 font-mono placeholder-gray-500"
        />
        <Button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 border-2 border-green-500 shadow-md transition duration-200 ease-in-out flex items-center justify-center font-mono"
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
}
