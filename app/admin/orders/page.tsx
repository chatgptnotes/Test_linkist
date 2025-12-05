'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PrintIcon from '@mui/icons-material/Print';

// Icon aliases
const Search = SearchIcon;
const Filter = FilterListIcon;
const Eye = VisibilityIcon;
const Mail = EmailIcon;
const Truck = LocalShippingIcon;
const CheckCircle = CheckCircleIcon;
const Clock = AccessTimeIcon;
const AlertCircle = ErrorOutlineIcon;
const RefreshCw = RefreshIcon;
const Download = CloudDownloadIcon;
const Edit = EditIcon;
const MoreHorizontal = MoreHorizIcon;
const Package = Inventory2Icon;
const User = PersonIcon;
const Calendar = CalendarTodayIcon;
const DollarSign = AttachMoneyIcon;
const Print = PrintIcon;

interface Payment {
  id: string;
  orderId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
  paymentMethod?: string;
  failureReason?: string;
  createdAt: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  cardConfig: {
    cardFirstName: string;
    cardLastName: string;
    title?: string;
    quantity?: number;
    baseMaterial?: string;
    color?: string;
    pattern?: string | number;
    texture?: string;
  };
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  createdAt: number;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  emailsSent: any;
  proofImages?: string[];
  notes?: string;
  payment?: Payment | null;
  voucherCode?: string | null;
  voucherDiscount?: number;
  printerEmailSent?: boolean;
  printerEmailSentAt?: number | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('🔍 Frontend: Fetching orders from API...');
      const response = await fetch('/api/admin/orders');
      console.log('📡 Frontend: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Frontend: Received API data:', data);
        console.log(`📊 Frontend: Setting ${data.orders?.length || 0} orders`);
        
        // Debug: Log the first order's structure
        if (data.orders && data.orders.length > 0) {
          console.log('🔍 Frontend: First order structure:', data.orders[0]);
          console.log('👤 Frontend: Customer name:', data.orders[0].customerName);
          console.log('📧 Frontend: Email:', data.orders[0].email);
          console.log('🆔 Frontend: Order number:', data.orders[0].orderNumber);
        }
        
        setOrders(data.orders || []);
      } else {
        console.error('❌ Frontend: API response not ok:', response.status);
      }
    } catch (error) {
      console.error('❌ Frontend: Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'production': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'production': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getPaymentStatusBadge = (payment: Payment | null | undefined) => {
    if (!payment) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="h-3 w-3" />
          <span>No Payment</span>
        </span>
      );
    }

    switch (payment.status) {
      case 'succeeded':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            <span>Paid</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-purple-100 text-purple-800 border-purple-200">
            <RefreshCw className="h-3 w-3" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3" />
            <span>{payment.status}</span>
          </span>
        );
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({...selectedOrder, status: newStatus});
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const resendEmail = async (orderId: string, emailType: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/resend-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailType })
      });

      if (response.ok) {
        alert('Email sent successfully!');
        fetchOrders();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Failed to resend email:', error);
      alert('Failed to send email');
    }
  };

  const resendToPrinter = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/resend-printer`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order sent to printer successfully!`);
        fetchOrders();
      } else {
        alert(data.error || 'Failed to send to printer');
      }
    } catch (error) {
      console.error('Failed to resend to printer:', error);
      alert('Failed to send to printer');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage all customer orders, track status, and handle fulfillment</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 w-80 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 appearance-none bg-white min-w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="production">Production</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={fetchOrders}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Config
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Printer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-red-500 text-xs font-bold">L</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span>Qty: {order.cardConfig.quantity || 1}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {order.cardConfig.cardFirstName} {order.cardConfig.cardLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.cardConfig.title || 'Professional'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.cardConfig.baseMaterial && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {order.cardConfig.baseMaterial}
                            </span>
                          )}
                          {order.cardConfig.color && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {order.cardConfig.color}
                            </span>
                          )}
                          {order.cardConfig.texture && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 capitalize">
                              {order.cardConfig.texture}
                            </span>
                          )}
                          {order.cardConfig.pattern && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                              {typeof order.cardConfig.pattern === 'string' ? order.cardConfig.pattern : `Pattern ${order.cardConfig.pattern}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {getPaymentStatusBadge(order.payment)}
                        {order.payment && (
                          <div className="text-xs text-gray-500">
                            {order.payment.paymentMethod && (
                              <span className="capitalize">{order.payment.paymentMethod}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.voucherCode ? (
                        <div className="space-y-1">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 border border-green-200">
                            <span className="text-xs font-mono font-medium text-green-800">
                              {order.voucherCode}
                            </span>
                          </div>
                          {order.voucherDiscount && (
                            <div className="text-xs text-gray-500">
                              {order.voucherDiscount}% off
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {order.payment?.amount
                              ? (order.payment.amount / 100).toFixed(2)
                              : order.pricing.total.toFixed(2)}
                          </span>
                        </div>
                        {/* Show warning if payment amount doesn't match order total */}
                        {order.payment?.amount && Math.abs((order.payment.amount / 100) - order.pricing.total) > 1 && (
                          <div className="flex items-center space-x-1">
                            <ErrorOutlineIcon className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600" title={`Order total: $${order.pricing.total.toFixed(2)}, Paid: $${(order.payment.amount / 100).toFixed(2)}`}>
                              Price mismatch
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.printerEmailSent ? (
                        <div className="flex items-center space-x-1">
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="h-3 w-3" />
                            <span>Sent</span>
                          </span>
                          {order.printerEmailSentAt && (
                            <span className="text-xs text-gray-400" title={new Date(order.printerEmailSentAt).toLocaleString()}>
                              {new Date(order.printerEmailSentAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resendEmail(order.id, 'confirmation')}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                          title="Resend Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resendToPrinter(order.id)}
                          className={`p-2 rounded-lg ${
                            order.printerEmailSent
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                              : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                          }`}
                          title={order.printerEmailSent ? 'Resend to Printer' : 'Send to Printer'}
                        >
                          <Print className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                          title="More Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter to find what you\'re looking for.'
                    : 'Orders will appear here once customers start placing them.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-lg bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Order Details - {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Status and Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      updateOrderStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({...selectedOrder, status: e.target.value});
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="production">In Production</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={selectedOrder.trackingNumber || ''}
                    onChange={(e) => {
                      if (selectedOrder) {
                        setSelectedOrder({
                          ...selectedOrder,
                          trackingNumber: e.target.value
                        });
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="text-gray-500">Email:</span> {selectedOrder.email}</p>
                    <p><span className="text-gray-500">Phone:</span> {selectedOrder.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                  <div className="text-sm text-gray-700">
                    <p>{selectedOrder.shipping.fullName}</p>
                    <p>{selectedOrder.shipping.addressLine1}</p>
                    {selectedOrder.shipping.addressLine2 && <p>{selectedOrder.shipping.addressLine2}</p>}
                    <p>{selectedOrder.shipping.city}, {selectedOrder.shipping.state} {selectedOrder.shipping.postalCode}</p>
                    <p>{selectedOrder.shipping.country}</p>
                  </div>
                </div>
              </div>

              {/* Card Configuration */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-base flex items-center gap-2">
                  <span className="text-blue-600">📋</span>
                  Manufacturing Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2 bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Name on Card</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.cardConfig.cardFirstName} {selectedOrder.cardConfig.cardLastName}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Title</p>
                    <p className="font-medium text-gray-900">{selectedOrder.cardConfig.title || 'Professional'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <p className="font-medium text-gray-900">{selectedOrder.cardConfig.quantity || 1}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-gray-500 mb-1">Base Material</p>
                    <p className="font-semibold text-purple-900 capitalize">{selectedOrder.cardConfig.baseMaterial || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Color</p>
                    <p className="font-semibold text-blue-900 capitalize">{selectedOrder.cardConfig.color || 'N/A'}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Texture</p>
                    <p className="font-semibold text-green-900 capitalize">{selectedOrder.cardConfig.texture || 'N/A'}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-gray-500 mb-1">Pattern</p>
                    <p className="font-semibold text-orange-900 capitalize">{selectedOrder.cardConfig.pattern ? (typeof selectedOrder.cardConfig.pattern === 'string' ? selectedOrder.cardConfig.pattern : `Pattern ${selectedOrder.cardConfig.pattern}`) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Total */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Order Total</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>${selectedOrder.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping:</span>
                    <span>${selectedOrder.pricing.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax:</span>
                    <span>${selectedOrder.pricing.tax.toFixed(2)}</span>
                  </div>
                  {selectedOrder.voucherCode && selectedOrder.voucherDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Voucher ({selectedOrder.voucherCode}):</span>
                      <span>-{selectedOrder.voucherDiscount}%</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total:</span>
                    <span>${selectedOrder.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Email Actions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Email Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => resendEmail(selectedOrder.id, 'confirmation')}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    Resend Confirmation
                  </button>
                  <button
                    onClick={() => resendEmail(selectedOrder.id, 'receipt')}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-red-600"
                  >
                    Resend Receipt
                  </button>
                  <button
                    onClick={() => resendEmail(selectedOrder.id, 'production')}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    Send Production Update
                  </button>
                  <button
                    onClick={() => resendEmail(selectedOrder.id, 'shipped')}
                    className="px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                  >
                    Send Shipped Notification
                  </button>
                  <button
                    onClick={() => resendEmail(selectedOrder.id, 'delivered')}
                    className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                  >
                    Send Delivered Confirmation
                  </button>
                </div>
              </div>

              {/* Printer Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Print className="h-4 w-4 mr-2 text-purple-600" />
                  Printer Status
                </h4>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-3">
                    {selectedOrder.printerEmailSent ? (
                      <>
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="h-4 w-4" />
                          <span>Sent to Printer</span>
                        </span>
                        {selectedOrder.printerEmailSentAt && (
                          <span className="text-sm text-gray-500">
                            on {new Date(selectedOrder.printerEmailSentAt).toLocaleString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Clock className="h-4 w-4" />
                        <span>Not Sent to Printer</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => resendToPrinter(selectedOrder.id)}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Print className="h-4 w-4" />
                    <span>{selectedOrder.printerEmailSent ? 'Resend to Printer' : 'Send to Printer'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}