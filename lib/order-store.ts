// Order management system
// In production, this should be replaced with a database

export type OrderStatus = 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string; // Link to users table
  status: OrderStatus;
  customerName: string;
  email: string;
  phoneNumber: string;
  cardConfig: {
    firstName: string;
    lastName: string;
    title?: string;
    mobile?: string;
    whatsapp?: boolean;
    logo?: string;
    quantity?: number;
  };
  shipping: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phoneNumber: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  createdAt: number;
  updatedAt: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  emailsSent: {
    confirmation?: { sent: boolean; timestamp?: number; messageId?: string };
    receipt?: { sent: boolean; timestamp?: number; messageId?: string };
    production?: { sent: boolean; timestamp?: number; messageId?: string };
    shipped?: { sent: boolean; timestamp?: number; messageId?: string };
    delivered?: { sent: boolean; timestamp?: number; messageId?: string };
  };
  proofImages?: string[];
  notes?: string;
  voucherCode?: string;
  voucherDiscount?: number;
  // Printer notification tracking
  printerEmailSent?: boolean;
  printerEmailSentAt?: number | null;
}

// Global in-memory store - replace with database in production
const orderStore = new Map<string, Order>();

export const OrderStore = {
  create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order => {
    const id = 'ord_' + Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    
    const newOrder: Order = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now,
    };

    orderStore.set(id, newOrder);
    return newOrder;
  },

  getById: (id: string): Order | undefined => {
    return orderStore.get(id);
  },

  getByOrderNumber: (orderNumber: string): Order | undefined => {
    for (const order of orderStore.values()) {
      if (order.orderNumber === orderNumber) {
        return order;
      }
    }
    return undefined;
  },

  getAll: (): Order[] => {
    return Array.from(orderStore.values()).sort((a, b) => b.createdAt - a.createdAt);
  },

  getByEmail: (email: string): Order[] => {
    return Array.from(orderStore.values())
      .filter(order => order.email === email)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  update: (id: string, updates: Partial<Order>): Order | undefined => {
    const existingOrder = orderStore.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder: Order = {
      ...existingOrder,
      ...updates,
      updatedAt: Date.now(),
    };

    orderStore.set(id, updatedOrder);
    return updatedOrder;
  },

  updateStatus: (id: string, status: OrderStatus, additionalData?: Partial<Order>): Order | undefined => {
    return OrderStore.update(id, { status, ...additionalData });
  },

  delete: (id: string): boolean => {
    return orderStore.delete(id);
  },

  // Admin functions
  getByStatus: (status: OrderStatus): Order[] => {
    return Array.from(orderStore.values())
      .filter(order => order.status === status)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getRecentOrders: (limit: number = 10): Order[] => {
    return Array.from(orderStore.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  searchOrders: (query: string): Order[] => {
    const lowerQuery = query.toLowerCase();
    return Array.from(orderStore.values())
      .filter(order => 
        order.orderNumber.toLowerCase().includes(lowerQuery) ||
        order.customerName.toLowerCase().includes(lowerQuery) ||
        order.email.toLowerCase().includes(lowerQuery) ||
        order.cardConfig.firstName.toLowerCase().includes(lowerQuery) ||
        order.cardConfig.lastName.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // Statistics
  getStats: () => {
    const orders = Array.from(orderStore.values());
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const totalRevenue = orders.reduce((sum, order) => sum + order.pricing.total, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(order => order.createdAt >= today.getTime());

    return {
      totalOrders: orders.length,
      statusCounts,
      totalRevenue,
      todaysOrders: todaysOrders.length,
      todaysRevenue: todaysOrders.reduce((sum, order) => sum + order.pricing.total, 0),
    };
  },

  // Development helper to clear all data
  clearAll: (): void => {
    orderStore.clear();
  },

  // Development helper to seed with sample data
  seedSampleData: (): void => {
    const sampleOrders = [
      {
        orderNumber: 'ORD-ABC123',
        status: 'confirmed' as OrderStatus,
        customerName: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        phoneNumber: '+1 (555) 123-4567',
        cardConfig: {
          firstName: 'Alex',
          lastName: 'Morgan',
          title: 'Senior Designer',
          mobile: '+1 555-123-4567',
          whatsapp: true,
          quantity: 1,
        },
        shipping: {
          fullName: 'Alex Morgan',
          addressLine1: '123 Main Street',
          city: 'New York',
          state: 'NY',
          country: 'United States',
          postalCode: '10001',
          phoneNumber: '+1 555-123-4567',
        },
        pricing: {
          subtotal: 29.99,
          shipping: 5.00,
          tax: 1.72,
          total: 36.71,
        },
        estimatedDelivery: 'Sep 06, 2025',
        emailsSent: {
          confirmation: { sent: true, timestamp: Date.now() - 3600000, messageId: 'msg_123' },
          receipt: { sent: true, timestamp: Date.now() - 3600000, messageId: 'msg_124' },
        },
      },
      {
        orderNumber: 'ORD-DEF456',
        status: 'production' as OrderStatus,
        customerName: 'Sarah Chen',
        email: 'sarah.chen@example.com',
        phoneNumber: '+1 (555) 987-6543',
        cardConfig: {
          firstName: 'Sarah',
          lastName: 'Chen',
          title: 'Product Manager',
          mobile: '+1 555-987-6543',
          quantity: 2,
        },
        shipping: {
          fullName: 'Sarah Chen',
          addressLine1: '456 Oak Avenue',
          addressLine2: 'Apt 2B',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States',
          postalCode: '94103',
          phoneNumber: '+1 555-987-6543',
        },
        pricing: {
          subtotal: 59.98,
          shipping: 5.00,
          tax: 3.24,
          total: 68.22,
        },
        estimatedDelivery: 'Sep 08, 2025',
        emailsSent: {
          confirmation: { sent: true, timestamp: Date.now() - 86400000, messageId: 'msg_125' },
          receipt: { sent: true, timestamp: Date.now() - 86400000, messageId: 'msg_126' },
          production: { sent: true, timestamp: Date.now() - 3600000, messageId: 'msg_127' },
        },
        proofImages: ['/images/proofs/proof-1.jpg', '/images/proofs/proof-2.jpg'],
      },
    ];

    sampleOrders.forEach(order => OrderStore.create(order));
  },
};

// Generate a new order number (deprecated - use async version from supabase-order-store)
// Kept for backward compatibility, but will generate random numbers instead of sequential
export const generateOrderNumber = (): string => {
  console.warn('⚠️ Using deprecated generateOrderNumber(). Please use async version from supabase-order-store for sequential numbers.');
  const prefix = 'LFND'; // Linkist Founder order prefix
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return prefix + suffix;
};

// Helper to format order for email templates
export const formatOrderForEmail = (order: Order) => ({
  orderNumber: order.orderNumber,
  customerName: order.customerName,
  email: order.email,
  cardConfig: order.cardConfig,
  shipping: order.shipping,
  pricing: order.pricing,
  estimatedDelivery: order.estimatedDelivery,
  trackingNumber: order.trackingNumber,
  trackingUrl: order.trackingUrl,
});