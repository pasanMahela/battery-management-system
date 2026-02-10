import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import PageHeader from '../components/PageHeader';
import { UserPlus, Lock, User, Loader2, Users, Shield, Trash2 } from 'lucide-react';
import { API_ENDPOINTS, USER_ROLES, PAGE_TITLES, BUSINESS_DEFAULTS } from '../constants/constants';

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

        if (formData.password.length < BUSINESS_DEFAULTS.MIN_PASSWORD_LENGTH) {
            setDialog({
                isOpen: true,
                title: 'Error',
                message: `Password must be at least ${BUSINESS_DEFAULTS.MIN_PASSWORD_LENGTH} characters long!`,
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
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title={PAGE_TITLES.USER_MANAGEMENT} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Existing Users List */}
                    <div className="bg-white rounded shadow-sm border border-gray-300 p-4">
                        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Users size={16} className="text-[#2563eb]" />
                            Existing Users
                        </h2>

                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={32} className="animate-spin text-[#2563eb]" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-500 text-center">
                                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                                <p className="font-bold text-sm">No users found</p>
                                <p className="text-xs mt-1">Create a new user to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {users.map((userItem) => (
                                    <div
                                        key={userItem.id}
                                        className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded border border-gray-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded flex items-center justify-center text-white font-bold text-sm ${userItem.role === 'Admin'
                                                ? 'bg-purple-600'
                                                : 'bg-[#2563eb]'
                                                }`}>
                                                {userItem.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{userItem.username}</p>
                                                <p className="text-[10px] text-gray-500">ID: {userItem.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {userItem.role === 'Admin' ? (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                                    <Shield size={12} />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                    Cashier
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add User Form */}
                    <div className="bg-white rounded shadow-sm border border-gray-300 p-4">
                        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <UserPlus size={16} className="text-[#2563eb]" />
                            Add New User
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                                        placeholder="Enter username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                                        placeholder="Enter password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Minimum 6 characters</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                                        placeholder="Confirm password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    User Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                                    required
                                >
                                    <option value={USER_ROLES.CASHIER}>Cashier (POS Access Only)</option>
                                    <option value={USER_ROLES.ADMIN}>Admin (Full Access)</option>
                                </select>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {formData.role === USER_ROLES.CASHIER
                                        ? '✓ Can access POS system only'
                                        : '✓ Can access all features and manage users'}
                                </p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-4 py-2 border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Creating...</>
                                    ) : (
                                        <><UserPlus size={16} /> Create User</>
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
