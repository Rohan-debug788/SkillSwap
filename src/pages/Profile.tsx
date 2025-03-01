import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Plus, Trash2, BookOpen, Lightbulb } from 'lucide-react';
import { DEFAULT_AVATAR } from '../config';

const Profile: React.FC = () => {
  const { user, removeSkill } = useAuth();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your profile.</p>
        <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleRemoveSkill = async (skillId: string, type: 'teach' | 'learn') => {
    setIsDeleting(skillId);
    try {
      await removeSkill(skillId, type);
    } catch (error) {
      console.error('Failed to remove skill:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <img 
            src={user.profilePicture || DEFAULT_AVATAR} 
            alt={user.name} 
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
          />
          
          <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left flex-grow">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-600 mt-1">{user.location || 'No location set'}</p>
            <p className="mt-3 text-gray-700">{user.bio || 'No bio yet'}</p>
            
            <div className="mt-4">
              <Link 
                to="/profile/edit" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills I Teach */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Skills I Teach
            </h2>
            <Link 
              to="/profile/edit?tab=teach" 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </div>
          
          {user.teachSkills && user.teachSkills.length > 0 ? (
            <ul className="space-y-3">
              {user.teachSkills.map((skill) => (
                <li 
                  key={skill.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h3 className="font-medium">{skill.name}</h3>
                    <p className="text-sm text-gray-600">
                      {skill.category} • {skill.experienceLevel || 'No level specified'}
                    </p>
                    {skill.description && (
                      <p className="text-sm text-gray-700 mt-1">{skill.description}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleRemoveSkill(skill.id, 'teach')}
                    disabled={isDeleting === skill.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">You haven't added any skills to teach yet.</p>
          )}
        </div>
        
        {/* Skills I Want to Learn */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              Skills I Want to Learn
            </h2>
            <Link 
              to="/profile/edit?tab=learn" 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </div>
          
          {user.learnSkills && user.learnSkills.length > 0 ? (
            <ul className="space-y-3">
              {user.learnSkills.map((skill) => (
                <li 
                  key={skill.id} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <h3 className="font-medium">{skill.name}</h3>
                    <p className="text-sm text-gray-600">
                      {skill.category}
                    </p>
                    {skill.description && (
                      <p className="text-sm text-gray-700 mt-1">{skill.description}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleRemoveSkill(skill.id, 'learn')}
                    disabled={isDeleting === skill.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">You haven't added any skills to learn yet.</p>
          )}
        </div>
      </div>
      
      {/* Matches Preview */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Matches</h2>
          <Link 
            to="/matches" 
            className="text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>
        
        <p className="text-gray-500 italic">
          Add skills to see potential matches!
        </p>
      </div>
    </div>
  );
};

export default Profile;