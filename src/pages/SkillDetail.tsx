import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, User, ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import axios from 'axios';
import { API_URL, DEFAULT_AVATAR } from '../config';

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  experienceLevel?: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  userBio?: string;
  type: 'teach' | 'learn';
  createdAt: string;
}

interface MatchStatus {
  isMatched: boolean;
  isPending: boolean;
  requestSent: boolean;
  requestReceived: boolean;
  matchId?: string;
  requestId?: string;
}

const SkillDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [skill, setSkill] = useState<Skill | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    const fetchSkillDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/skills/${id}`);
        setSkill(response.data);
        
        // If user is logged in, check match status
        if (user) {
          const matchResponse = await axios.get(`${API_URL}/api/matches/status/${response.data.userId}`);
          setMatchStatus(matchResponse.data);
        }
      } catch (err) {
        setError('Failed to load skill details. Please try again later.');
        console.error('Error fetching skill details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkillDetails();
  }, [id, user]);
  
  const sendSwapRequest = async () => {
    if (!user || !skill) return;
    
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/matches/request`, {
        recipientId: skill.userId,
        message: `I'm interested in swapping skills with you!`
      });
      
      // Update match status
      const matchResponse = await axios.get(`${API_URL}/api/matches/status/${skill.userId}`);
      setMatchStatus(matchResponse.data);
    } catch (err) {
      setError('Failed to send swap request. Please try again.');
      console.error('Error sending swap request:', err);
    } finally {
      setActionLoading(false);
    }
  };
  
  const acceptSwapRequest = async () => {
    if (!matchStatus?.requestId) return;
    
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/matches/accept/${matchStatus.requestId}`);
      
      // Update match status
      const matchResponse = await axios.get(`${API_URL}/api/matches/status/${skill?.userId}`);
      setMatchStatus(matchResponse.data);
    } catch (err) {
      setError('Failed to accept swap request. Please try again.');
      console.error('Error accepting swap request:', err);
    } finally {
      setActionLoading(false);
    }
  };
  
  const declineSwapRequest = async () => {
    if (!matchStatus?.requestId) return;
    
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/matches/decline/${matchStatus.requestId}`);
      
      // Update match status
      const matchResponse = await axios.get(`${API_URL}/api/matches/status/${skill?.userId}`);
      setMatchStatus(matchResponse.data);
    } catch (err) {
      setError('Failed to decline swap request. Please try again.');
      console.error('Error declining swap request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'Skill not found'}</p>
        <Link to="/skills" className="text-red-700 font-medium hover:underline mt-2 inline-block">
          Back to Skills
        </Link>
      </div>
    );
  }

  const isOwnSkill = user && user.id === skill.userId;
  const formattedDate = new Date(skill.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Skills
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Skill Header */}
        <div className={`p-2 text-center text-white font-medium ${
          skill.type === 'teach' ? 'bg-blue-600' : 'bg-yellow-500'
        }`}>
          {skill.type === 'teach' ? 'TEACHING SKILL' : 'LEARNING SKILL'}
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{skill.name}</h1>
          <div className="flex flex-wrap items-center text-gray-600 mb-6">
            <span className="mr-4">{skill.category}</span>
            {skill.experienceLevel && (
              <>
                <span className="mr-4">•</span>
                <span className="mr-4">{skill.experienceLevel}</span>
              </>
            )}
            <span className="mr-4">•</span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formattedDate}
            </span>
          </div>
          
          {skill.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{skill.description}</p>
            </div>
          )}
          
          {/* User Profile */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">About the User</h2>
            <div className="flex items-start">
              <img 
                src={skill.userProfilePicture || DEFAULT_AVATAR} 
                alt={skill.userName} 
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
              <div>
                <h3 className="font-semibold text-lg">{skill.userName}</h3>
                {skill.userBio && (
                  <p className="text-gray-700 mt-2">{skill.userBio}</p>
                )}
                
                {!isOwnSkill && user && (
                  <div className="mt-4 space-x-3">
                    {matchStatus?.isMatched ? (
                      <Link 
                        to={`/chat/${skill.userId}`}
                        className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat Now
                      </Link>
                    ) : matchStatus?.requestSent ? (
                      <button 
                        disabled
                        className="inline-flex items-center bg-gray-300 text-gray-700 px-4 py-2 rounded-md cursor-not-allowed"
                      >
                        Request Sent
                      </button>
                    ) : matchStatus?.requestReceived ? (
                      <div className="flex space-x-2">
                        <button 
                          onClick={acceptSwapRequest}
                          disabled={actionLoading}
                          className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                        >
                          Accept Request
                        </button>
                        <button 
                          onClick={declineSwapRequest}
                          disabled={actionLoading}
                          className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={sendSwapRequest}
                        disabled={actionLoading}
                        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Swap Request
                      </button>
                    )}
                    
                    <Link 
                      to={`/profile/${skill.userId}`}
                      className="inline-flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Skills */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">
          {isOwnSkill ? 'Your Other Skills' : `${skill.userName}'s Other Skills`}
        </h2>
        
        <p className="text-gray-500 italic">
          {isOwnSkill 
            ? 'Add more skills to your profile to see them here.' 
            : `No other skills from ${skill.userName} yet.`}
        </p>
      </div>
    </div>
  );
};

export default SkillDetail;