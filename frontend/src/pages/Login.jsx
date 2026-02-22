import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
            const msg = err.response?.data;
            if (typeof msg === 'string' && msg.length < 200) {
                setError(msg);
            } else if (err.response?.status === 503) {
                setError('Server is temporarily unavailable. Please try again in a moment.');
            } else if (err.response?.status >= 500) {
                setError('Something went wrong. Please try again later.');
            } else {
                setError('Invalid credentials. Please check your username and password.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* Login Card */}
            <div className="w-full max-w-sm m-4">
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#CC0000] px-6 py-5 text-center">
                        <div className="w-12 h-12 bg-white rounded mx-auto mb-3 flex items-center justify-center">
                            <span className="text-[#CC0000] font-extrabold text-2xl">R</span>
                        </div>
                        <h2 className="text-lg font-extrabold text-white">{APP_CONFIG.SHOP_NAME}</h2>
                        <p className="text-xs text-red-200 font-bold mt-0.5">{APP_CONFIG.APP_SUBTITLE}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Sign in label */}
                        <p className="text-sm text-gray-500 font-bold text-center">Sign in to continue</p>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-xs font-bold">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username Field */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#CC0000] outline-none transition-all text-sm"
                                    placeholder="Enter your username"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:border-[#CC0000] outline-none transition-all text-sm"
                                        placeholder="Enter your password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 font-bold text-gray-800 bg-gray-200 rounded hover:bg-gray-300 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="text-center pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 font-bold">
                                Contact your administrator for account access
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
