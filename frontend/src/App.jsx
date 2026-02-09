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
import ActivityLog from './pages/ActivityLog';
import ScannerPage from './pages/Scanner';
import { ScannerProvider } from './context/ScannerContext';
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
  const [timePeriod, setTimePeriod] = useState('today'); // 'today', 'yesterday', 'week', 'month', 'year'
  const [stats, setStats] = useState({
    totalInventory: 0,
    todaysSales: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    totalInventoryValue: 0,
    periodRevenue: 0,
    periodProfit: 0
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

        // Calculate sales based on selected time period
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate, endDate;
        switch (timePeriod) {
          case 'today':
            startDate = today;
            endDate = new Date();
            break;
          case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            endDate = new Date(today);
            endDate.setMilliseconds(-1);
            break;
          case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
            endDate = new Date();
            break;
          case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date();
            break;
          case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date();
            break;
          default:
            startDate = today;
            endDate = new Date();
        }

        const periodSales = sales.filter(sale => {
          if (!sale.date) return false;
          const saleDate = new Date(sale.date);
          if (isNaN(saleDate.getTime())) return false;
          return saleDate >= startDate && saleDate <= endDate;
        });

        const todaysSales = periodSales.length;

        // Calculate period revenue and profit
        const periodRevenue = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const periodProfit = periodSales.reduce((sum, sale) => {
          const saleProfit = sale.items?.reduce((itemSum, item) => {
            const itemProfit = (item.unitPrice - (item.purchasePrice || item.unitPrice * 0.7)) * item.quantity;
            return itemSum + itemProfit;
          }, 0) || 0;
          return sum + saleProfit;
        }, 0);

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
          totalInventoryValue,
          periodRevenue,
          periodProfit
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (user?.token) {
      fetchDashboardData();
    }
  }, [user, timePeriod]);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Here's what's happening with your battery shop today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          {/* Sales with Period Selector */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-1">Total Sales</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.todaysSales}</h3>
              </div>
              <DollarSign size={40} className="text-green-500" />
            </div>
            <div className="flex gap-1 mt-3 flex-wrap">
              <button onClick={() => setTimePeriod('today')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'today' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Today</button>
              <button onClick={() => setTimePeriod('yesterday')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'yesterday' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Yesterday</button>
              <button onClick={() => setTimePeriod('week')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'week' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Week</button>
              <button onClick={() => setTimePeriod('month')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'month' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Month</button>
              <button onClick={() => setTimePeriod('year')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'year' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Year</button>
            </div>
          </div>

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

          {/* Total Revenue with Period Selector */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-800">LKR {stats.periodRevenue.toLocaleString()}</h3>
              </div>
              <BarChart3 size={40} className="text-purple-500" />
            </div>
            <div className="flex gap-1 mt-3 flex-wrap">
              <button onClick={() => setTimePeriod('today')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'today' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Today</button>
              <button onClick={() => setTimePeriod('yesterday')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'yesterday' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Yesterday</button>
              <button onClick={() => setTimePeriod('week')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'week' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Week</button>
              <button onClick={() => setTimePeriod('month')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'month' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Month</button>
              <button onClick={() => setTimePeriod('year')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'year' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Year</button>
            </div>
          </div>

          {/* Total Profit with Period Selector */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-1">Total Profit</p>
                <h3 className="text-3xl font-bold text-gray-800">LKR {stats.periodProfit.toLocaleString()}</h3>
              </div>
              <Package size={40} className="text-indigo-500" />
            </div>
            <div className="flex gap-1 mt-3 flex-wrap">
              <button onClick={() => setTimePeriod('today')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'today' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Today</button>
              <button onClick={() => setTimePeriod('yesterday')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'yesterday' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Yesterday</button>
              <button onClick={() => setTimePeriod('week')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'week' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Week</button>
              <button onClick={() => setTimePeriod('month')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'month' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Month</button>
              <button onClick={() => setTimePeriod('year')} className={`px-2 py-1 text-xs rounded transition-colors ${timePeriod === 'year' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Year</button>
            </div>
          </div>

          {/* Total Inventory Value */}
          <a href="/inventory/view" className="bg-white p-6 rounded-xl shadow-md border border-teal-100 hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Inventory Value</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">LKR {stats.totalInventoryValue.toLocaleString()}</h3>
              </div>
              <Battery size={40} className="text-teal-500" />
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
        <ScannerProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/scanner/:sessionId" element={<ScannerPage />} />
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
          <Route path="/activity-log" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <Layout>
                  <ActivityLog />
                </Layout>
              </RoleBasedRoute>
            </PrivateRoute>
          } />
        </Routes>
        </ScannerProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
