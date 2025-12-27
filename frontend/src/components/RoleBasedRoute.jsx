import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { USER_ROLES } from '../constants/constants';

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user.role || user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    // Check if user's role is in the allowed roles
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate page based on role
        if (userRole === USER_ROLES.CASHIER) {
            return <Navigate to="/pos" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RoleBasedRoute;
