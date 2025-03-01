import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Send, ArrowLeft, User, Star } from 'lucide-react';
import axios from 'axios';
import { API_URL, DEFAULT_AVATAR } from '../config';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface ChatPartner {
  id: string;
  name: string;
  profilePicture?: string;
  lastSeen?: string;
}

const Chat: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch chat history and partner info
  useEffect(() => {
    const fetchChatData = async () => {
      if (!user || !userId) return;
      
      try {
        // Fetch chat partner info
        const partnerResponse = await axios.get(`${API_URL}/api/users/${userId}`);
        setPartner(partnerResponse.data);
        
        // Fetch message history
        const messagesResponse = await axios.get(`${API_URL}/api/messages/${userId}`);
        setMessages(messagesResponse.data);
        
        // Mark messages as read
        await axios.post(`${API_URL}/api/messages/read/${userId}`);
      } catch (err) {
        setError('Failed to load chat. Please try again later.');
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatData();
  }, [user, userId]);
  
  // Socket event listeners
  useEffect(() => {
    if (!socket || !userId) return;
    
    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages(prev => [...prev, message]);
        
        // Mark message as read if we're the receiver
        if (message.senderId === userId) {
          socket.emit('mark_read', { messageId: message.id });
        }
      }
    });
    
    // Listen for read receipts
    socket.on('message_read', (messageId: string) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    });
    
    // Listen for user online status
    socket.on('user_status', (data: { userId: string, status: 'online' | 'offline', lastSeen?: string }) => {
      if (data.userId === userId) {
        setPartner(prev => 
          prev ? { ...prev, lastSeen: data.status === 'online' ? undefined : data.lastSeen } : null
        );
      }
    });
    
    // Clean up
    return () => {
      socket.off('new_message');
      socket.off('message_read');
      socket.off('user_status');
    };
  }, [socket, userId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !userId || !socket) return;
    
    try {
      // Emit message through socket
      socket.emit('send_message', {
        receiverId: userId,
        content: newMessage
      });
      
      // Clear input
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  const submitRating = async () => {
    if (!userId || rating === 0) return;
    
    setSubmittingRating(true);
    try {
      await axios.post(`${API_URL}/api/ratings`, {
        userId,
        rating,
        comment: ratingComment
      });
      
      setShowRating(false);
      // Show success notification or feedback
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'User not found'}</p>
        <Link to="/matches" className="text-red-700 font-medium hover:underline mt-2 inline-block">
          Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        {/* Chat Header */}
        <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/matches" className="mr-3 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img 
              src={partner.profilePicture || DEFAULT_AVATAR} 
              alt={partner.name} 
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h2 className="font-semibold">{partner.name}</h2>
              <p className="text-xs text-gray-500">
                {partner.lastSeen 
                  ? `Last seen ${new Date(partner.lastSeen).toLocaleString()}` 
                  : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowRating(true)}
              className="text-gray-600 hover:text-gray-800"
              title="Rate this user"
            >
              <Star className="h-5 w-5" />
            </button>
            <Link 
              to={`/profile/${partner.id}`}
              className="text-gray-600 hover:text-gray-800"
              title="View profile"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => {
                const isMine = message.senderId === user?.id;
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                        isMine 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white border rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className={`text-xs mt-1 flex justify-between items-center ${
                        isMine ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && (
                          <span className="ml-2">
                            {message.read ? 'Read' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="mb-2">No messages yet</p>
                <p>Send a message to start the conversation!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className={`bg-blue-600 text-white p-2 rounded-full ${
                !newMessage.trim() || !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {!isConnected && (
            <p className="text-red-500 text-xs mt-1">
              You're currently offline. Reconnecting...
            </p>
          )}
        </form>
      </div>
      
      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Rate Your Experience</h2>
            <p className="text-gray-600 mb-6">
              How was your skill swap experience with {partner.name}?
            </p>
            
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="mx-1 focus:outline-none"
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Comments (Optional)
              </label>
              <textarea
                id="comment"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRating(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0 || submittingRating}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                  rating === 0 || submittingRating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;