import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Mail, Lock, User, Sparkles, AlertCircle } from 'lucide-react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Assuming this is your import path

const AuthComponent = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // Error handling
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    setError('');
  };

  const handleAuthError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setError('This email is already registered. Try signing in instead.');
        break;
      case 'auth/invalid-email':
        setError('Please enter a valid email address.');
        break;
      case 'auth/weak-password':
        setError('Password should be at least 6 characters long.');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email. Try signing up instead.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      default:
        setError('An error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignIn) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        setSuccess('Successfully signed in!');
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        
        // Update profile with name
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
        
        setSuccess('Account created successfully!');
      }
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-4 overflow-hidden">
      {/* Background elements remain the same */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 animate-pulse" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-float"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's',
            }}
          />
        ))}
      </div>

      <div className={`relative w-full max-w-md p-8 rounded-xl backdrop-blur-xl 
        bg-gradient-to-br from-white/10 to-white/5
        border border-white/20 shadow-2xl transition-all duration-700 transform
        hover:shadow-cyan-500/20 
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-pink-500/30 rounded-br-xl" />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-cyan-400/30 animate-float">
            <Sparkles size={24} />
          </div>
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 mb-3">
            {isSignIn ? 'Welcome Back' : 'Join Us'}
          </h2>
          <p className="text-white/80 text-lg">
            Let's get you started on your journey to awesomeness 🚀
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-200 flex items-center gap-2 animate-slideIn">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 text-green-200 flex items-center gap-2 animate-slideIn">
            <Sparkles size={20} />
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isSignIn && (
            <div className="relative group">
              <User className={`absolute left-3 top-3 transition-colors duration-300
                ${focusedInput === 'name' ? 'text-cyan-400' : 'text-white/60'}`} size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                className={`w-full p-3 pl-10 rounded-lg bg-white/5 border border-white/10 text-white 
                placeholder-white/60 outline-none transition-all duration-300
                focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent
                group-hover:bg-white/10 group-hover:border-white/20`}
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
            </div>
          )}

          <div className="relative group">
            <Mail className={`absolute left-3 top-3 transition-colors duration-300
              ${focusedInput === 'email' ? 'text-cyan-400' : 'text-white/60'}`} size={20} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              className={`w-full p-3 pl-10 rounded-lg bg-white/5 border border-white/10 text-white 
              placeholder-white/60 outline-none transition-all duration-300
              focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent
              group-hover:bg-white/10 group-hover:border-white/20`}
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
          </div>

          <div className="relative group">
            <Lock className={`absolute left-3 top-3 transition-colors duration-300
              ${focusedInput === 'password' ? 'text-cyan-400' : 'text-white/60'}`} size={20} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              className={`w-full p-3 pl-10 rounded-lg bg-white/5 border border-white/10 text-white 
              placeholder-white/60 outline-none transition-all duration-300
              focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent
              group-hover:bg-white/10 group-hover:border-white/20`}
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 rounded-lg relative overflow-hidden group
            bg-gradient-to-r from-[#00F5FF] to-[#FF00F5] 
            text-white font-semibold shadow-lg
            transition-all duration-300 transform hover:scale-105 
            hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]
            active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            <div className="absolute inset-0 bg-white/20 transform group-hover:translate-x-full transition-transform duration-700" />
            <div className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isSignIn ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-white/80">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsSignIn(!isSignIn);
                setError('');
                setSuccess('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400 
              hover:from-pink-400 hover:to-cyan-400 transition-all duration-300"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 text-white/60 hover:text-white 
          transition-all duration-300 hover:rotate-90 hover:scale-110"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

// Add required keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  @keyframes slideIn {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);

export default AuthComponent;