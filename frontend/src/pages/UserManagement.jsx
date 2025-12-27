import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import { UserPlus, Lock, User, Loader2, Users, Shield, Trash2 } from 'lucide-react';
import { API_ENDPOINTS, USER_ROLES, PAGE_TITLES } from '../constants/constants';

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'Cashier'
    });
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Fetch all users
    const fetchUsers = async () => {
        try {
            setIsLoadingUsers(true);
            const response = await axios.get(
                `${API_ENDPOINTS.AUTH}/users`,
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId, username) => {
        setDialog({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete(
                        `${API_ENDPOINTS.AUTH}/users/${userId}`,
                        {
                            headers: { Authorization: `Bearer ${user.token}` }
                        }
                    );

                    // Refresh users list immediately
                    await fetchUsers();

                    setDialog({
                        isOpen: true,
                        title: 'Success',
                        message: `User "${username}" deleted successfully!`,
                        type: 'success'
                    });
                } catch (err) {
                    setDialog({
                        isOpen: true,
                        title: 'Error',
                        message: err.response?.data?.message || 'Failed to delete user',
                        type: 'error'
                    });
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setDialog({
                isOpen: true,
                title: 'Error',
                message: 'Passwords do not match!',
                type: 'error'
            });
            return;
        }

        if (formData.password.length < 6) {
            setDialog({
                isOpen: true,
                title: 'Error',
                message: 'Password must be at least 6 characters long!',
                type: 'error'
            });
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await axios.post(
                API_ENDPOINTS.REGISTER,
                {
                    username: formData.username,
                    password: formData.password,
                    role: formData.role
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            // Reset form immediately
            setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                role: 'Cashier'
            });

            // Refresh users list immediately
            await fetchUsers();

            setDialog({
                isOpen: true,
                title: 'Success',
                message: `User "${formData.username}" created successfully as ${formData.role}!`,
                type: 'success'
            });
        } catch (err) {
            setDialog({
                isOpen: true,
                title: 'Error',
                message: err.response?.data || 'Failed to create user. Username may already exist.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-6 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {PAGE_TITLES.USER_MANAGEMENT}
                            </h1>
                            <p className="text-gray-600 mt-1">{PAGE_TITLES.USER_MANAGEMENT_SUBTITLE}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Existing Users List */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Users size={24} className="text-blue-600" />
                            Existing Users
                        </h2>

                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={48} className="animate-spin text-blue-600" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500 text-center">
                                <Users size={48} className="mx-auto mb-2 text-gray-400" />
                                <p className="font-medium">No users found</p>
                                <p className="text-sm mt-1">Create a new user to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {users.map((userItem) => (
                                    <div
                                        key={userItem.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${userItem.role === 'Admin'
                                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                                                }`}>
                                                {userItem.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{userItem.username}</p>
                                                <p className="text-xs text-gray-500">ID: {userItem.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {userItem.role === 'Admin' ? (
                                                <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                                                    <Shield size={14} />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                                    Cashier
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add User Form */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <UserPlus size={24} className="text-blue-600" />
                            Add New User
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Enter password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Confirm password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    User Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    required
                                >
                                    <option value={USER_ROLES.CASHIER}>Cashier (POS Access Only)</option>
                                    <option value={USER_ROLES.ADMIN}>Admin (Full Access)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formData.role === USER_ROLES.CASHIER
                                        ? '✓ Can access POS system only'
                                        : '✓ Can access all features and manage users'}
                                </p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Creating User...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={20} />
                                            Create User
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Dialog Component */}
            <Dialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
            />
        </div>
    );
};

export default UserManagement;
