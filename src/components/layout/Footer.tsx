import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-8 w-8" />
              <span className="text-xl font-bold">SkillSwap</span>
            </div>
            <p className="text-gray-300 mb-4">
              SkillSwap is a platform for peer-to-peer skill exchange. Teach what you know, learn what you don't - all without money changing hands.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/skills" className="text-gray-300 hover:text-white transition">Skills</Link>
              </li>
              <li>
                <Link to="/matches" className="text-gray-300 hover:text-white transition">Matches</Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-white transition">Profile</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-300">
                <span className="block">Email:</span>
                <a href="mailto:info@skillswap.com" className="hover:text-white transition">info@skillswap.com</a>
              </li>
              <li className="text-gray-300">
                <span className="block">Support:</span>
                <a href="mailto:support@skillswap.com" className="hover:text-white transition">support@skillswap.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;