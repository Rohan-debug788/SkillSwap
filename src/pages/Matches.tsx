import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, User, Check, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL, DEFAULT_AVATAR } from '../config';

interface Match {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  matchDate: string;
  lastMessageDate?: string;
  teachSkills: string[];
  learnSkills: string[];
}

interface SwapRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  message?: string;
  createdAt: string;
  teachSkills: string[];
  learnSkills: string[];
}

const Matches: React.FC = () => {
  const { user } = useAuth();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<Match[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'matches' | 'requests' | 'potential'>('matches');
  
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!user) return;
      
      try {
        // Fetch matches
        const matchesResponse = await axios.get(`${API_URL}/api/matches`);
        setMatches(matchesResponse.data);
        
        // Fetch incoming requests
        const incomingResponse = await axios.get(`${API_URL}/api/matches/requests/incoming`);
        setIncomingRequests(incomingResponse.data);
        
        // Fetch outgoing requests
        const outgoingResponse = await axios.get(`${API_URL}/api/matches/requests/outgoing`);
        setOutgoingRequests(outgoingResponse.data);
        
        // Fetch potential matches
        const potentialResponse = await axios.get(`${API_URL}/api/matches/potential`);
        setPotentialMatches(potentialResponse.data);
      } catch (err) {
        setError('Failed to load matches. Please try again later.');
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [user]);
  
  const acceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await axios.post(`${API_URL}/api/matches/accept/${requestId}`);
      
      // Refresh data
      const incomingResponse = await axios.get(`${API_URL}/api/matches/requests/incoming`);
      setIncomingRequests(incomingResponse.data);
      
      const matchesResponse = await axios.get(`${API_URL}/api/matches`);
      setMatches(matchesResponse.data);
    } catch (err) {
      setError('Failed to accept request. Please try again.');
      console.error('Error accepting request:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const declineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await axios.post(`${API_URL}/api/matches/decline/${requestId}`);
      
      // Refresh incoming requests
      const incomingResponse = await axios.get(`${API_URL}/api/matches/requests/incoming`);
      setIncomingRequests(incomingResponse.data);
    } catch (err) {
      setError('Failed to decline request. Please try again.');
      console.error('Error declining request:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const cancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await axios.delete(`${API_URL}/api/matches/requests/${requestId}`);
      
      // Refresh outgoing requests
      const outgoingResponse = await axios.get(`${API_URL}/api/matches/requests/outgoing`);
      setOutgoingRequests(outgoingResponse.data);
    } catch (err) {
      setError('Failed to cancel request. Please try again.');
      console.error('Error canceling request:', err);
    } finally {
      setActionLoading(null);
    }
  };
  
  const sendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await axios.post(`${API_URL}/api/matches/request`, {
        recipientId: userId,
        message: `I'm interested in swapping skills with you!`
      });
      
      // Refresh potential matches and outgoing requests
      const potentialResponse = await axios.get(`${API_URL}/api/matches/potential`);
      setPotentialMatches(potentialResponse.data);
      
      const outgoingResponse = await axios.get(`${API_URL}/api/matches/requests/outgoing`);
      setOutgoingRequests(outgoingResponse.data);
    } catch (err) {
      setError('Failed to send request. Please try again.');
      console.error('Error sending request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your matches.</p>
        <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex-1 ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Matches
              {matches.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {matches.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex-1 ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests
              {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {incomingRequests.length + outgoingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('potential')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex-1 ${
                activeTab === 'potential'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Potential Matches
              {potentialMatches.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {potentialMatches.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">My Matches</h2>
          
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="p-4 flex items-center">
                    <img 
                      src={match.userProfilePicture || DEFAULT_AVATAR} 
                      alt={match.userName} 
                      className="w-16 h-16 rounded-full mr-4 object-cover"
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{match.userName}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.teachSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            Teaches: {skill}
                          </span>
                        ))}
                        {match.learnSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                            Learns: {skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Matched on {new Date(match.matchDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/chat/${match.userId}`}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                        title="Chat"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </Link>
                      <Link 
                        to={`/profile/${match.userId}`}
                        className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200"
                        title="View Profile"
                      >
                        <User className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You don't have any matches yet.</p>
              <button
                onClick={() => setActiveTab('potential')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Find Potential Matches
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
            
            {incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <img 
                          src={request.senderProfilePicture || DEFAULT_AVATAR} 
                          alt={request.senderName} 
                          className="w-12 h-12 rounded-full mr-3 object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{request.senderName}</h3>
                          <p className="text-sm text-gray-500">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-gray-700 mb-3 p-3 bg-gray-50 rounded-md italic">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {request.teachSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            Teaches: {skill}
                          </span>
                        ))}
                        {request.learnSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                            Learns: {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          disabled={actionLoading === request.id}
                          className={`flex-1 flex justify-center items-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition ${
                            actionLoading === request.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => declineRequest(request.id)}
                          disabled={actionLoading === request.id}
                          className={`flex-1 flex justify-center items-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition ${
                            actionLoading === request.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No incoming requests at the moment.</p>
            )}
          </div>
          
          {/* Outgoing Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Outgoing Requests</h2>
            
            {outgoingRequests.length > 0 ? (
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <img 
                          src={request.senderProfilePicture || DEFAULT_AVATAR} 
                          alt={request.senderName} 
                          className="w-12 h-12 rounded-full mr-3 object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">{request.senderName}</h3>
                          <p className="text-sm text-gray-500">
                            Sent {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-gray-700 mb-3 p-3 bg-gray-50 rounded-md italic">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {request.teachSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            Teaches: {skill}
                          </span>
                        ))}
                        {request.learnSkills.slice(0, 3).map((skill, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                            Learns: {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex">
                        <button
                          onClick={() => cancelRequest(request.id)}
                          disabled={actionLoading === request.id}
                          className={`flex justify-center items-center bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition ${
                            actionLoading === request.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel Request
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No outgoing requests at the moment.</p>
            )}
          </div>
        </div>
      )}

      {/* Potential Matches Tab */}
      {activeTab === 'potential' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Potential Matches</h2>
          
          {potentialMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {potentialMatches.map((match) => (
                <div key={match.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <img 
                        src={match.userProfilePicture || DEFAULT_AVATAR} 
                        alt={match.userName} 
                        className="w-12 h-12 rounded-full mr-3 object-cover"
                      />
                      <h3 className="font-semibold">{match.userName}</h3>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Teaches:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.teachSkills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Wants to Learn:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.learnSkills.map((skill, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => sendRequest(match.id)}
                        disabled={actionLoading === match.id}
                        className={`flex-1 flex justify-center items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
                          actionLoading === match.id ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        Send Request
                      </button>
                      <Link 
                        to={`/profile/${match.id}`}
                        className="bg-gray-100 text-gray-700 p-2 rounded-full hover:bg-gray-200"
                        title="View Profile"
                      >
                        <User className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No potential matches found. Try adding more skills to your profile!
              </p>
              <Link 
                to="/profile/edit?tab=teach"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition mr-3"
              >
                Add Teaching Skills
              </Link>
              <Link 
                to="/profile/edit?tab=learn"
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
              >
                Add Learning Skills
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Matches;