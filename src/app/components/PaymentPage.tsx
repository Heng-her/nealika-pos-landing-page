import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Filter, Search, XCircle } from "lucide-react";
import {
  getErrorMessage,
  getPaymentHistory,
  normalizePaymentStatus,
  type PaymentHistoryItem,
} from "../services/posApi";

interface PaymentPageProps {
  refreshKey?: number;
}

interface TransactionRow {
  id: number | string;
  date: string;
  customer: string;
  service: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed";
  paymentMethod: string;
}

function mapTransaction(
  transaction: PaymentHistoryItem,
  index: number,
): TransactionRow {
  const normalizedStatus = normalizePaymentStatus(transaction.status);
  const mappedStatus =
    normalizedStatus === "paid"
      ? "completed"
      : normalizedStatus === "pending"
        ? "pending"
        : "failed";

  return {
    id: transaction.id || transaction.transaction_id || index + 1,
    date: transaction.paid_at || transaction.created_at || "-",
    customer: transaction.package_name || "Package",
    service: transaction.type || "Subscription",
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || "USD",
    status: mappedStatus,
    paymentMethod: transaction.method || "N/A",
  };
}

function formatAmount(amount: number, currency: string) {
  if (currency === "USD") {
    return `$${amount.toFixed(2)}`;
  }

  return `${amount.toFixed(2)} ${currency}`;
}

export default function PaymentPage({ refreshKey = 0 }: PaymentPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending" | "failed"
  >("all");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const history = await getPaymentHistory();
        if (!isMounted) {
          return;
        }

        setTransactions(history.map(mapTransaction));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(getErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || transaction.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, searchTerm, transactions]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Payment History
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(event) =>
                setFilterStatus(
                  event.target.value as "all" | "completed" | "pending" | "failed",
                )
              }
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-lg bg-slate-100 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No payment history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Package
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Method
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
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
                      {formatAmount(transaction.amount, transaction.currency)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {transaction.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.status === "completed" && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {transaction.status === "pending" && (
                          <Clock className="w-3 h-3" />
                        )}
                        {transaction.status === "failed" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {transaction.status.charAt(0).toUpperCase() +
                          transaction.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
