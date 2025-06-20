"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Package, 
  Ticket, 
  Users, 
  Trash2, 
  Wrench,
  Search,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus,
  Mail
} from 'lucide-react';

// Check if user is admin (now uses database + fallback)
const checkIsAdmin = async (userEmail: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/admin/emails');
    if (response.ok) {
      const data = await response.json();
      return data.adminEmails?.some((admin: any) => admin.email === userEmail.toLowerCase()) || false;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  return false;
};

interface AdminStats {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingTickets: number;
  activeCoupons: number;
  inventoryIssues: number;
}

interface AdminEmail {
  email: string;
  addedBy: string;
  addedAt: Date;
  isSystemAdmin: boolean;
}

const AdminCard = ({ 
  title, 
  description, 
  href, 
  icon: Icon, 
  color = "blue",
  badge,
  stats
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  color?: string;
  badge?: string;
  stats?: string;
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    green: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    orange: "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Link href={href}>
        <div className={`
          bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} 
          rounded-xl p-6 text-white shadow-lg hover:shadow-xl 
          transition-all duration-300 ease-in-out border border-white/20
          relative overflow-hidden group
        `}>
          {badge && (
            <div className="absolute top-2 right-2">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                {badge}
              </span>
            </div>
          )}
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="ml-4">
              <Icon className="w-8 h-8 text-white/90 group-hover:text-white transition-colors" />
            </div>
          </div>
          
          {stats && (
            <div className="text-2xl font-bold text-white/90 group-hover:text-white transition-colors">
              {stats}
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>
    </motion.div>
  );
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAdminSection, setShowAdminSection] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoaded) {
        if (!user) {
          router.push('/sign-in?redirect_url=/admin');
          return;
        }

        const userEmail = user.emailAddresses[0]?.emailAddress;
        if (!userEmail) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        const authorized = await checkIsAdmin(userEmail);
        setIsAuthorized(authorized);
        
        if (!authorized) {
          setTimeout(() => {
            router.push('/');
          }, 3000);
        } else {
          // Fetch admin stats and admin emails if authorized
          fetchAdminStats();
          fetchAdminEmails();
        }
        
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoaded, user, router]);

  const fetchAdminStats = async () => {
    try {
      // Fetch real stats from your APIs
      const [couponsRes, inventoryRes, supportRes] = await Promise.allSettled([
        fetch('/api/admin/coupons'),
        fetch('/api/admin/inventory/init?check=all'),
        fetch('/api/support')
      ]);

      let activeCoupons = 0;
      let inventoryIssues = 0;
      let pendingTickets = 0;
      let totalProducts = 0;
      const totalOrders = 0; // Will be 0 until we implement order counting API
      const totalUsers = 0; // Will be 0 until we implement user counting API

      // Process coupons data
      if (couponsRes.status === 'fulfilled' && couponsRes.value.ok) {
        const couponsData = await couponsRes.value.json();
        const now = new Date();
        activeCoupons = couponsData.coupons?.filter((coupon: any) => 
          coupon.isActive && 
          new Date(coupon.expirationDate) > now &&
          coupon.usedCount < coupon.totalAvailable
        ).length || 0;
      }

      // Process inventory data - get actual products count and issues
      if (inventoryRes.status === 'fulfilled' && inventoryRes.value.ok) {
        const inventoryData = await inventoryRes.value.json();
        inventoryIssues = inventoryData.productsNeedingInit || 0;
        totalProducts = inventoryData.totalProducts || 0;
      }

      // Process support tickets data
      if (supportRes.status === 'fulfilled' && supportRes.value.ok) {
        const supportData = await supportRes.value.json();
        pendingTickets = supportData.tickets?.filter((ticket: any) => 
          ticket.status === 'open' || ticket.status === 'pending'
        ).length || 0;
      }

      // Try to get additional stats via propagation API (for products)
      try {
        const productsResponse = await fetch('/api/propagation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ every: true })
        });
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          if (Array.isArray(productsData)) {
            totalProducts = productsData.length;
          }
        }
      } catch (productsError) {
        console.log('Could not fetch products via propagation API');
      }

      // Try to get user and order stats from cleanup API
      try {
        const cleanupResponse = await fetch('/api/cleanup-pending-orders');
        if (cleanupResponse.ok) {
          const cleanupData = await cleanupResponse.json();
          // This doesn't give us total orders/users but we can at least show some data
        }
      } catch (cleanupError) {
        console.log('Could not fetch cleanup stats');
      }

      setStats({
        totalOrders, // Will be 0 for now - would need a dedicated API
        totalUsers, // Will be 0 for now - would need a dedicated API  
        totalProducts,
        pendingTickets,
        activeCoupons,
        inventoryIssues
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Fallback to zeros on error
      setStats({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        pendingTickets: 0,
        activeCoupons: 0,
        inventoryIssues: 0
      });
    }
  };

  const fetchAdminEmails = async () => {
    try {
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        setAdminEmails(data.adminEmails || []);
      }
    } catch (error) {
      console.error('Error fetching admin emails:', error);
    }
  };

  const addAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setAddingAdmin(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Successfully added ${data.adminEmail} as admin!`);
        setNewAdminEmail('');
        fetchAdminEmails(); // Refresh the list
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Failed to add admin email');
    } finally {
      setAddingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#DB4444] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You are not authorized to access the admin panel.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Email: {user.emailAddresses[0]?.emailAddress}
          </p>
          <div className="text-sm text-gray-400">
            Redirecting to home page in 3 seconds...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Authorized</span>
              </div>
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProducts}</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingTickets}</div>
              <div className="text-sm text-gray-600">Support Tickets</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-indigo-600">{stats.activeCoupons}</div>
              <div className="text-sm text-gray-600">Active Coupons</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-red-600">{stats.inventoryIssues}</div>
              <div className="text-sm text-gray-600">Inventory Issues</div>
            </div>
          </div>
        )}

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Inventory Management */}
          <AdminCard
            title="Inventory Management"
            description="Manage product inventory, stock levels, and initialize inventory for new products"
            href="/admin/inventory"
            icon={Package}
            color="blue"
            badge="Essential"
            stats={stats ? `${stats.inventoryIssues} issues` : undefined}
          />

          {/* Coupon Management */}
          <AdminCard
            title="Coupon Management"
            description="Create, edit, and manage discount coupons and promotional codes"
            href="/admin/coupons"
            icon={Ticket}
            color="green"
            stats={stats ? `${stats.activeCoupons} active` : undefined}
          />

          {/* Order Tracing */}
          <AdminCard
            title="Order Tracing"
            description="Trace missing orders, recover payments from Razorpay, and sync order data"
            href="/admin/trace-orders"
            icon={Search}
            color="purple"
            badge="Recovery"
          />

          {/* Update Orders */}
          <AdminCard
            title="Update Orders"
            description="Update recovered orders with missing product details and shipping information"
            href="/admin/update-order"
            icon={Wrench}
            color="orange"
            badge="Manual"
          />

          {/* Data Cleanup */}
          <AdminCard
            title="Data Cleanup"
            description="Clean up duplicate orders, remove orphaned data, and maintain database integrity"
            href="/admin/cleanup"
            icon={Trash2}
            color="red"
            badge="Maintenance"
          />

          {/* User Debug */}
          <AdminCard
            title="User Debug"
            description="Debug user profiles, sync user data, and resolve account issues"
            href="/admin/user-debug"
            icon={Users}
            color="indigo"
            badge="Debug"
          />

          {/* Email Automation */}
          <AdminCard
            title="Email Automation"
            description="Manage email templates, automate customer communications, and track email delivery"
            href="/admin/email-automation"
            icon={Mail}
            color="green"
            badge="New"
          />

        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions & Hidden Links</h2>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* API Endpoints */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  API Endpoints
                </h3>
                <div className="space-y-2 text-sm">
                  <a href="/api/admin/coupons" target="_blank" className="block text-blue-600 hover:text-blue-800">
                    /api/admin/coupons
                  </a>
                  <a href="/api/admin/inventory" target="_blank" className="block text-blue-600 hover:text-blue-800">
                    /api/admin/inventory
                  </a>
                  <a href="/api/trace-orders" target="_blank" className="block text-blue-600 hover:text-blue-800">
                    /api/trace-orders
                  </a>
                  <a href="/api/cleanup-pending-orders" target="_blank" className="block text-blue-600 hover:text-blue-800">
                    /api/cleanup-pending-orders
                  </a>
                </div>
              </div>

              {/* Database Operations */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Database Operations
                </h3>
                <div className="space-y-2 text-sm">
                  <button 
                    onClick={() => window.open('/api/admin/cleanup-duplicates', '_blank')}
                    className="block text-blue-600 hover:text-blue-800 text-left"
                  >
                    Check Duplicates
                  </button>
                  <button 
                    onClick={() => window.open('/api/admin/inventory/init', '_blank')}
                    className="block text-blue-600 hover:text-blue-800 text-left"
                  >
                    Check Inventory Status
                  </button>
                  <button 
                    onClick={() => window.open('/api/support', '_blank')}
                    className="block text-blue-600 hover:text-blue-800 text-left"
                  >
                    Support Tickets
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  System Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-gray-600">Database Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-gray-600">Payment Gateway Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-600">Background Jobs Running</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Admin Email Management */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Admin Access Management</h2>
            <button
              onClick={() => setShowAdminSection(!showAdminSection)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {showAdminSection ? 'Hide' : 'Manage Admins'}
            </button>
          </div>

          {showAdminSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              {/* Add New Admin Form */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Add New Admin
                </h3>
                <form onSubmit={addAdminEmail} className="flex gap-4">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter admin email address"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={addingAdmin || !newAdminEmail.trim()}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingAdmin ? 'Adding...' : 'Add Admin'}
                  </button>
                </form>
                <p className="text-sm text-gray-600 mt-2">
                  ⚠️ New admins will have full access to the admin panel. Only add trusted emails.
                </p>
              </div>

              {/* Current Admin Emails List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Current Admin Emails ({adminEmails.length})
                </h3>
                <div className="space-y-3">
                  {adminEmails.map((admin, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${admin.isSystemAdmin ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{admin.email}</div>
                          <div className="text-sm text-gray-600">
                            {admin.isSystemAdmin ? 'System Admin' : `Added by ${admin.addedBy}`} • 
                            {admin.isSystemAdmin ? 'Built-in' : new Date(admin.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin.isSystemAdmin ? (
                          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Protected
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Added
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {adminEmails.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No admin emails loaded</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">Security Notice</h4>
                    <ul className="text-blue-700 text-sm mt-1 space-y-1">
                      <li>• System admins (green dot) cannot be removed and have permanent access</li>
                      <li>• Added admins (blue dot) have full admin panel access</li>
                      <li>• Only add emails of trusted team members</li>
                      <li>• Admin deletion is not available for security reasons</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Warning Notice */}
        <div className="mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Admin Access Notice</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  You have administrative access to sensitive operations. Please use these tools responsibly and always backup data before making bulk changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 