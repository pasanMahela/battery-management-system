import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { APP_CONFIG, LOCALE_CONFIG, TIMER_CONFIG } from '../constants/constants';

const SalesChart = ({ sales, days = TIMER_CONFIG.DEFAULT_CHART_DAYS }) => {
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const daySales = sales.filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= date && saleDate < nextDate;
            });

            const revenue = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
            const count = daySales.length;

            data.push({
                date,
                label: date.toLocaleDateString(LOCALE_CONFIG.locale, { weekday: 'short' }),
                fullDate: date.toLocaleDateString(),
                revenue,
                count
            });
        }

        return data;
    }, [sales, days]);

    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalSales = chartData.reduce((sum, d) => sum + d.count, 0);
    
    // Calculate trend (compare last half to first half)
    const midpoint = Math.floor(chartData.length / 2);
    const firstHalfRevenue = chartData.slice(0, midpoint).reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = chartData.slice(midpoint).reduce((sum, d) => sum + d.revenue, 0);
    const trend = firstHalfRevenue > 0 
        ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Sales Trend</h3>
                    <p className="text-sm text-gray-500">Last {days} days performance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{APP_CONFIG.CURRENCY} {totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{totalSales} transactions</p>
                    </div>
                    {trend !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
                            trend > 0 
                                ? 'bg-green-100 text-green-700' 
                                : trend < 0 
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                        }`}>
                            {trend > 0 ? <TrendingUp size={16} /> : trend < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex gap-2 h-40">
                {chartData.map((day, index) => {
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue * 100) : 0;
                    const isToday = index === chartData.length - 1;
                    
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center group relative">
                            {/* Bar area - fills remaining space */}
                            <div className="flex-1 w-full flex items-end relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                                    <p className="font-bold">{day.fullDate}</p>
                                    <p>Revenue: {APP_CONFIG.CURRENCY} {day.revenue.toLocaleString()}</p>
                                    <p>Sales: {day.count}</p>
                                </div>
                                
                                {/* Bar */}
                                <div 
                                    className={`w-full rounded-t-lg transition-all cursor-pointer ${
                                        isToday 
                                            ? 'bg-gradient-to-t from-blue-600 to-blue-400' 
                                            : 'bg-gradient-to-t from-blue-400 to-blue-300 hover:from-blue-500 hover:to-blue-400'
                                    }`}
                                    style={{ height: `${Math.max(height, 4)}%` }}
                                />
                            </div>
                            
                            {/* Label */}
                            <span className={`text-xs font-medium mt-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                {day.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-300" />
                    <span className="text-gray-600">Daily Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-600 to-blue-400" />
                    <span className="text-gray-600">Today</span>
                </div>
            </div>
        </div>
    );
};

export default SalesChart;


