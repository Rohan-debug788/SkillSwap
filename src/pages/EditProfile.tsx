import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { SKILL_CATEGORIES, EXPERIENCE_LEVELS } from '../config';

const EditProfile: React.FC = () => {
  const { user, updateProfile, addSkill } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  // Skill form state
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState(SKILL_CATEGORIES[0]);
  const [skillDescription, setSkillDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[0]);
  
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        name,
        bio,
        location,
        profilePicture
      });
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      await addSkill({
        name: skillName,
        category: skillCategory,
        description: skillDescription,
        experienceLevel: activeTab === 'teach' ? experienceLevel : undefined
      }, activeTab as 'teach' | 'learn');
      
      // Reset form
      setSkillName('');
      setSkillDescription('');
      
      // Redirect to profile
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/profile')}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('teach')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teach'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Skills I Teach
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'learn'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Skills I Want to Learn
            </button>
          </nav>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Profile Information Form */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture URL
              </label>
              <input
                id="profilePicture"
                type="url"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a URL for your profile picture. You can use services like Unsplash for free images.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
        
        {/* Skills I Teach Form */}
        {activeTab === 'teach' && (
          <form onSubmit={handleSkillSubmit} className="space-y-4">
            <div>
              <label htmlFor="skillName" className="block text-sm font-medium text-gray-700 mb-1">
                Skill Name
              </label>
              <input
                id="skillName"
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., JavaScript Programming, Spanish Language"
              />
            </div>
            
            <div>
              <label htmlFor="skillCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="skillCategory"
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="skillDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="skillDescription"
                value={skillDescription}
                onChange={(e) => setSkillDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your experience and what you can teach"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Adding Skill...' : 'Add Teaching Skill'}
            </button>
          </form>
        )}
        
        {/* Skills I Want to Learn Form */}
        {activeTab === 'learn' && (
          <form onSubmit={handleSkillSubmit} className="space-y-4">
            <div>
              <label htmlFor="skillName" className="block text-sm font-medium text-gray-700 mb-1">
                Skill Name
              </label>
              <input
                id="skillName"
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Guitar, Photography, Public Speaking"
              />
            </div>
            
            <div>
              <label htmlFor="skillCategory" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="skillCategory"
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {SKILL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="skillDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="skillDescription"
                value={skillDescription}
                onChange={(e) => setSkillDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what aspects of this skill you're interested in learning"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Adding Skill...' : 'Add Learning Skill'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfile;