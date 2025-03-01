import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, MessageSquare, Star } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Share Knowledge, Grow Together</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            SkillSwap connects people who want to teach and learn from each other. No money involved, just pure knowledge exchange.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/register" 
              className="bg-white text-blue-600 hover:bg-blue-100 px-6 py-3 rounded-md font-semibold transition"
            >
              Join SkillSwap
            </Link>
            <Link 
              to="/skills" 
              className="bg-transparent border-2 border-white hover:bg-white/10 px-6 py-3 rounded-md font-semibold transition"
            >
              Explore Skills
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How SkillSwap Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-gray-600">
                Sign up and list the skills you can teach and the ones you want to learn.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Your Match</h3>
              <p className="text-gray-600">
                Our algorithm matches you with people who can teach what you want to learn and learn what you can teach.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Swapping</h3>
              <p className="text-gray-600">
                Connect with your matches, schedule sessions, and start exchanging knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills */}
      <section className="py-12 bg-gray-100 rounded-xl">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Skills on SkillSwap</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Programming', 'Languages', 'Music', 'Cooking', 'Photography', 'Design', 'Fitness', 'Business'].map((skill, index) => (
              <div key={index} className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2">{skill}</h3>
                <p className="text-gray-600 text-sm mb-3">
                  {`${Math.floor(Math.random() * 100) + 50}+ people offering`}
                </p>
                <Link to="/skills" className="text-blue-600 text-sm hover:underline">
                  Browse {skill} skills →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                skill: "Spanish for Programming",
                quote: "I taught programming basics to a Spanish teacher who helped me become conversational in Spanish. Win-win!",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              },
              {
                name: "Michael Chen",
                skill: "Piano for Cooking",
                quote: "I've always wanted to learn piano, and in exchange, I taught my match how to make authentic Chinese dumplings!",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              },
              {
                name: "Aisha Patel",
                skill: "Yoga for Web Design",
                quote: "As a yoga instructor, I was able to swap my skills for web design lessons. Now I have a beautiful website for my studio!",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.skill}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-blue-600 rounded-xl text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Swapping Skills?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of lifelong learners and share your knowledge today.
          </p>
          <Link 
            to="/register" 
            className="bg-white text-blue-600 hover:bg-blue-100 px-8 py-3 rounded-md font-semibold text-lg transition inline-block"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;