import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users } from 'lucide-react';
import { SKILL_CATEGORIES } from '../config';
import axios from 'axios';
import { API_URL } from '../config';

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  experienceLevel?: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  type: 'teach' | 'learn';
}

const SkillDirectory: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'teach' | 'learn' | ''>('');
  
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/skills`);
        setSkills(response.data);
        setFilteredSkills(response.data);
      } catch (err) {
        setError('Failed to load skills. Please try again later.');
        console.error('Error fetching skills:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkills();
  }, []);
  
  useEffect(() => {
    // Apply filters
    let result = skills;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        skill => 
          skill.name.toLowerCase().includes(term) || 
          skill.description?.toLowerCase().includes(term) ||
          skill.userName.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(skill => skill.category === selectedCategory);
    }
    
    if (selectedType) {
      result = result.filter(skill => skill.type === selectedType);
    }
    
    setFilteredSkills(result);
  }, [searchTerm, selectedCategory, selectedType, skills]);
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedType('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Skill Directory</h1>
        <p className="text-gray-600">
          Browse skills that users are teaching and learning. Find your perfect skill match!
        </p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Skills or Users
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by skill name, description, or user..."
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          {/* Type Filter */}
          <div className="w-full md:w-48">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Type
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'teach' | 'learn' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="teach">Teaching</option>
              <option value="learn">Learning</option>
            </select>
          </div>
          
          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {filteredSkills.length} {filteredSkills.length === 1 ? 'Skill' : 'Skills'} Found
          </h2>
        </div>
        
        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <div key={skill.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                <div className={`p-1 text-center text-white text-xs font-medium ${
                  skill.type === 'teach' ? 'bg-blue-600' : 'bg-yellow-500'
                }`}>
                  {skill.type === 'teach' ? 'TEACHING' : 'LEARNING'}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{skill.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {skill.category} {skill.experienceLevel ? `• ${skill.experienceLevel}` : ''}
                  </p>
                  
                  {skill.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {skill.description}
                    </p>
                  )}
                  
                  <div className="flex items-center mt-4 pt-3 border-t">
                    <img 
                      src={skill.userProfilePicture || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                      alt={skill.userName} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="text-sm font-medium">{skill.userName}</span>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 text-right">
                  <Link 
                    to={`/skills/${skill.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find more results.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillDirectory;