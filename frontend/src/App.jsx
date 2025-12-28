import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import AddBattery from './pages/AddBattery';
import POS from './pages/POS';
import Sales from './pages/Sales';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import Customers from './pages/Customers';
import Returns from './pages/Returns';
import ReturnHistory from './pages/ReturnHistory';
import { useContext, useState, useEffect } from 'react';
import AuthContext from './context/AuthContext';
import { Package, ShoppingCart, BarChart3, TrendingUp, DollarSign, Battery } from 'lucide-react';
import { USER_ROLES, API_ENDPOINTS } from './constants/constants';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role || 'Unknown';
  const [stats, setStats] = useState({
    totalInventory: 0,
    todaysSales: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    totalInventoryValue: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch batteries
        const batteriesRes = await fetch(API_ENDPOINTS.BATTERY, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const batteries = await batteriesRes.json();

        // Fetch sales
        const salesRes = await fetch(API_ENDPOINTS.SALE, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const sales = await salesRes.json();

        // Calculate total inventory
        const totalInventory = batteries.reduce((sum, b) => sum + b.stockQuantity, 0);

        // Calculate total inventory value (selling price × stock quantity)
        const totalInventoryValue = batteries.reduce((sum, b) => sum + (b.sellingPrice * b.stockQuantity), 0);

        // Calculate today's sales count
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // Get YYYY-MM-DD

        const todaysSales = sales.filter(sale => {
          if (!sale.date) return false;
          const saleDate = new Date(sale.date);
          if (isNaN(saleDate.getTime())) return false;
          const saleDateStr = saleDate.toISOString().split('T')[0];
          return saleDateStr === todayStr;
        }).length;

        // Calculate expiring soon items
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiringSoon = batteries.filter(battery => {
          const purchaseDate = new Date(battery.purchaseDate);
          const expiryDate = new Date(purchaseDate);
          expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));
          return expiryDate <= oneMonthFromNow && expiryDate > new Date();
        }).length;

        // Calculate total revenue
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        setStats({
          totalInventory,
          todaysSales,
          expiringSoon,
          totalRevenue,
          totalInventoryValue
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (user?.token) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Here's what's happening with your battery shop today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Inventory - Links to View Inventory */}
          <a href="/inventory/view" className="bg-white p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Inventory</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalInventory}</h3>
              </div>
              <Battery size={40} className="text-blue-500" />
            </div>
          </a>

          {/* Today's Sales - Links to Sales Page */}
          <a href="/sales" className="bg-white p-6 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Sales</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.todaysSales}</h3>
              </div>
              <DollarSign size={40} className="text-green-500" />
            </div>
          </a>

          {/* Expiring Soon - Links to Inventory with Expiring Filter */}
          <a href="/inventory/view?filter=expiring" className="bg-white p-6 rounded-xl shadow-md border border-orange-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Expiring Soon</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.expiringSoon}</h3>
              </div>
              <TrendingUp size={40} className="text-orange-500" />
            </div>
          </a>

          {/* Total Revenue - Links to Sales Page */}
          <a href="/sales" className="bg-white p-6 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">LKR {stats.totalRevenue.toLocaleString()}</h3>
              </div>
              <BarChart3 size={40} className="text-purple-500" />
            </div>
          </a>

          {/* Total Inventory Value */}
          <a href="/inventory/view" className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Inventory Value</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">LKR {stats.totalInventoryValue.toLocaleString()}</h3>
              </div>
              <Package size={40} className="text-indigo-500" />
            </div>
          </a>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {role === 'Admin' && (
              <a href="/inventory/view" className="block p-6 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all">
                <Package size={32} className="mb-3 text-blue-500" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Inventory</h3>
                <p className="text-gray-600 text-sm">Add, edit, or remove battery stock</p>
              </a>
            )}

            <a href="/pos" className="block p-6 bg-white border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all">
              <ShoppingCart size={32} className="mb-3 text-green-500" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Process Sale</h3>
              <p className="text-gray-600 text-sm">Complete a customer transaction</p>
            </a>

            {role === 'Admin' && (
              <a href="/sales" className="block p-6 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all">
                <BarChart3 size={32} className="mb-3 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">View Sales</h3>
                <p className="text-gray-600 text-sm">Analyze sales reports and history</p>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <Dashboard />
              </Layout>
            </RoleBasedRoute>
          } />
          <Route path="/inventory/view" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <Inventory />
              </Layout>
            </RoleBasedRoute>
          } />
          <Route path="/inventory/add" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <AddBattery />
              </Layout>
            </RoleBasedRoute>
          } />
          <Route path="/inventory" element={<Navigate to="/inventory/view" replace />} />
          <Route path="/pos" element={
            <PrivateRoute>
              <Layout>
                <POS />
              </Layout>
            </PrivateRoute>
          } />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.CASHIER]}>
                  <Layout><Sales /></Layout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <Layout><Customers /></Layout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </RoleBasedRoute>
              </PrivateRoute>
            }
          />
          <Route path="/change-password" element={
            <PrivateRoute>
              <Layout>
                <ChangePassword />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/returns" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <Returns />
              </Layout>
            </RoleBasedRoute>
          } />
          <Route path="/return-history" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <ReturnHistory />
              </Layout>
            </RoleBasedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
