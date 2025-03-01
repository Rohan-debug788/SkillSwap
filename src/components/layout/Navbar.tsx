import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Users, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Users className="h-8 w-8" />
            <span className="text-xl font-bold">SkillSwap</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200 transition">Home</Link>
            <Link to="/skills" className="hover:text-blue-200 transition">Skills</Link>
            
            {user ? (
              <>
                <Link to="/matches" className="hover:text-blue-200 transition">Matches</Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-blue-200 transition">
                    <span>{user.name}</span>
                    <User className="h-5 w-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white transition"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-500 hover:text-white transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200 transition">Login</Link>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link 
              to="/" 
              className="block py-2 hover:bg-blue-700 px-3 rounded transition flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link 
              to="/skills" 
              className="block py-2 hover:bg-blue-700 px-3 rounded transition flex items-center space-x-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Users className="h-5 w-5" />
              <span>Skills</span>
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/matches" 
                  className="block py-2 hover:bg-blue-700 px-3 rounded transition flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Matches</span>
                </Link>
                <Link 
                  to="/profile" 
                  className="block py-2 hover:bg-blue-700 px-3 rounded transition flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left block py-2 hover:bg-blue-700 px-3 rounded transition flex items-center space-x-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 hover:bg-blue-700 px-3 rounded transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 bg-white text-blue-600 px-3 rounded transition hover:bg-blue-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;