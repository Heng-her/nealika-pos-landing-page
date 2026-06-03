import {useState} from 'react';
import {CheckCircle, Clock, Filter, Search, XCircle} from 'lucide-react';

interface Transaction {
    id: number;
    date: string;
    customer: string;
    service: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    paymentMethod: string;
}

export default function PaymentPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

    // Transactions
    const [transactions] = useState<Transaction[]>([
        {
            id: 1,
            date: '2026-05-07 14:30',
            customer: 'Starter Package',
            service: 'Monthly Subscription',
            amount: 29,
            status: 'completed',
            paymentMethod: 'ABA KHQR'
        },
        {
            id: 2,
            date: '2026-04-07 13:15',
            customer: 'Starter Package',
            service: 'Monthly Subscription',
            amount: 29,
            status: 'completed',
            paymentMethod: 'Credit Card'
        },
        {
            id: 3,
            date: '2026-03-07 12:00',
            customer: 'Starter Package',
            service: 'Monthly Subscription',
            amount: 29,
            status: 'completed',
            paymentMethod: 'ABA KHQR'
        },
        {
            id: 4,
            date: '2026-02-07 16:45',
            customer: 'Starter Package',
            service: 'Monthly Subscription',
            amount: 29,
            status: 'completed',
            paymentMethod: 'Credit Card'
        },
        {
            id: 5,
            date: '2026-01-07 15:30',
            customer: 'Starter Package',
            service: 'Monthly Subscription',
            amount: 29,
            status: 'completed',
            paymentMethod: 'ABA KHQR'
        },
    ]);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.service.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const todayRevenue = transactions
        .filter(t => t.status === 'completed' && t.date.startsWith('2026-05-07'))
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6">

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Payment History</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search transactions..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400"/>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date & Time</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Package</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Method</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4"/>
                                        {transaction.date}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-900 font-medium">
                                    {transaction.customer}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                    {transaction.service}
                                </td>
                                <td className="py-3 px-4 text-sm font-semibold text-slate-900">
                                    ${transaction.amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">
                                    {transaction.paymentMethod}
                                </td>
                                <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.status === 'completed' && <CheckCircle className="w-3 h-3"/>}
                        {transaction.status === 'pending' && <Clock className="w-3 h-3"/>}
                        {transaction.status === 'failed' && <XCircle className="w-3 h-3"/>}
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
