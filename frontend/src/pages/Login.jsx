import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Battery, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/constants';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await axios.post(`${API_ENDPOINTS.AUTH}/login`, { username, password });
            login(res.data.token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data || 'Invalid credentials. Please check your username and password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
                <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-700"></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md p-8 m-4">
                <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* Logo & Title */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-in spin-in duration-1000 relative overflow-hidden">
                                <Battery className="w-9 h-9 text-white relative z-10" />
                                {/* Charging animation overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent animate-pulse"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    style={{
                                        animation: 'slide 2s ease-in-out infinite',
                                    }}
                                ></div>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {APP_CONFIG.SHOP_NAME}
                        </h2>
                        <h3 className="text-lg text-gray-400">{APP_CONFIG.APP_SUBTITLE}</h3>
                        <p className="text-sm text-gray-500">Sign in to continue</p>
                    </div>

                    {/* Add keyframe animation */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes slide {
                            0% {
                                transform: translateX(-100%);
                            }
                            100% {
                                transform: translateX(100%);
                            }
                        }
                    `}} />

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-in slide-in-from-top duration-300">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg 
                                         focus:ring-2 focus:ring-cyan-500 focus:border-transparent 
                                         outline-none transition-all duration-200 text-white
                                         placeholder-gray-500"
                                placeholder="Enter your username"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-lg 
                                             focus:ring-2 focus:ring-cyan-500 focus:border-transparent 
                                             outline-none transition-all duration-200 text-white
                                             placeholder-gray-500"
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 font-bold text-gray-900 bg-gradient-to-r from-cyan-400 to-blue-400 
                                     rounded-lg hover:from-cyan-300 hover:to-blue-300 
                                     transition-all duration-200 shadow-lg shadow-cyan-500/50 
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center pt-4 border-t border-gray-700">
                        <p className="text-xs text-gray-500">
                            Contact your administrator for account access
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
