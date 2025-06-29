<div className=""></div>import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ChatMessage {
  _id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ recipientId, recipientName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to socket
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    // Join room
    socketRef.current.emit('joinRoom', user._id);

    // Receive message
    socketRef.current.on('receiveMessage', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    // Fetch chat history
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${SOCKET_URL}/api/chat/messages/${recipientId}`, {
          withCredentials: true,
        });
        setMessages(response.data.data);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    fetchMessages();

    return () => {
      socketRef.current.disconnect();
    };
  }, [recipientId, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      senderId: user._id,
      recipientId,
      content: newMessage,
      type: 'text',
    };

    socketRef.current.emit('sendMessage', messageData);
    setMessages((prev) => [...prev, { ...messageData, _id: Date.now().toString(), createdAt: new Date().toISOString() }]);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md flex flex-col h-96">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Chat with {recipientName}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`p-2 rounded max-w-xs ${msg.senderId === user._id ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 self-start'}`}
            >
              {msg.content}
              <div className="text-xs text-gray-700 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t flex space-x-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          />
          <Button onClick={handleSendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
