import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import AddBattery from './pages/AddBattery';
import EditBattery from './pages/EditBattery';
import POS from './pages/POS';
import Sales from './pages/Sales';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';
import Customers from './pages/Customers';
import Returns from './pages/Returns';
import ReturnHistory from './pages/ReturnHistory';
import ActivityLog from './pages/ActivityLog';
import PurchaseHistory from './pages/PurchaseHistory';
import ScannerPage from './pages/Scanner';
import { ScannerProvider } from './context/ScannerContext';
import { useContext, useState, useEffect } from 'react';
import AuthContext from './context/AuthContext';
import { Package, ShoppingCart, BarChart3, TrendingUp, DollarSign, Battery } from 'lucide-react';
import { USER_ROLES, API_ENDPOINTS } from './constants/constants';
import SalesChart from './components/SalesChart';
import PageHeader from './components/PageHeader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role || 'Unknown';
  const [timePeriod, setTimePeriod] = useState('today'); // 'today', 'yesterday', 'week', 'month', 'year'
  const [salesData, setSalesData] = useState([]);
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
        setSalesData(sales);

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
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
        <PageHeader title="Dashboard" />

        <div className="bg-white border border-gray-300 rounded shadow-sm p-3">
          <p className="text-sm text-gray-600">Welcome back, <span className="font-bold text-gray-800">{user?.username}</span>. Here's what's happening with your battery shop.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Inventory */}
          <a href="/inventory/view" className="bg-white p-4 rounded shadow-sm border border-gray-300 hover:border-[#2563eb] transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Total Inventory</p>
                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stats.totalInventory}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded"><Battery size={24} className="text-[#2563eb]" /></div>
            </div>
          </a>

          {/* Sales with Period Selector */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Sales</p>
                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stats.todaysSales}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded"><DollarSign size={24} className="text-green-600" /></div>
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {['today','yesterday','week','month','year'].map(p => (
                <button key={p} onClick={() => setTimePeriod(p)} className={`px-2 py-0.5 text-[10px] rounded font-bold transition-colors ${timePeriod === p ? 'bg-[#2563eb] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* Expiring Soon */}
          <a href="/inventory/view?filter=expiring" className="bg-white p-4 rounded shadow-sm border border-gray-300 hover:border-orange-400 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Expiring Soon</p>
                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{stats.expiringSoon}</h3>
              </div>
              <div className="p-2 bg-orange-50 rounded"><TrendingUp size={24} className="text-orange-500" /></div>
            </div>
          </a>

          {/* Revenue */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Revenue</p>
                <h3 className="text-xl font-extrabold text-gray-800 mt-1">LKR {stats.periodRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded"><BarChart3 size={24} className="text-purple-500" /></div>
            </div>
          </div>

          {/* Profit */}
          <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Profit</p>
                <h3 className="text-xl font-extrabold text-gray-800 mt-1">LKR {stats.periodProfit.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-indigo-50 rounded"><Package size={24} className="text-indigo-500" /></div>
            </div>
          </div>

          {/* Inventory Value */}
          <a href="/inventory/view" className="bg-white p-4 rounded shadow-sm border border-gray-300 hover:border-teal-400 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Inventory Value</p>
                <h3 className="text-xl font-extrabold text-gray-800 mt-1">LKR {stats.totalInventoryValue.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-teal-50 rounded"><Battery size={24} className="text-teal-500" /></div>
            </div>
          </a>
        </div>

        {/* Sales Analytics Chart */}
        {salesData.length > 0 && (
          <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-[#2563eb]" />
              Sales Analytics (Last 7 Days)
            </h3>
            <SalesChart sales={salesData} days={7} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {role === 'Admin' && (
              <a href="/inventory/view" className="block p-4 bg-white border-2 border-gray-300 rounded hover:border-[#2563eb] transition-all">
                <Package size={24} className="mb-2 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-gray-800 mb-1">Manage Inventory</h3>
                <p className="text-xs text-gray-500">Add, edit, or remove battery stock</p>
              </a>
            )}

            <a href="/pos" className="block p-4 bg-white border-2 border-gray-300 rounded hover:border-green-500 transition-all">
              <ShoppingCart size={24} className="mb-2 text-green-600" />
              <h3 className="text-sm font-bold text-gray-800 mb-1">Process Sale</h3>
              <p className="text-xs text-gray-500">Complete a customer transaction</p>
            </a>

            {role === 'Admin' && (
              <a href="/sales" className="block p-4 bg-white border-2 border-gray-300 rounded hover:border-purple-500 transition-all">
                <BarChart3 size={24} className="mb-2 text-purple-500" />
                <h3 className="text-sm font-bold text-gray-800 mb-1">View Sales</h3>
                <p className="text-xs text-gray-500">Analyze sales reports and history</p>
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
          <Route path="/inventory/edit" element={
            <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Layout>
                <EditBattery />
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
          <Route path="/purchase-history" element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <Layout>
                  <PurchaseHistory />
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
