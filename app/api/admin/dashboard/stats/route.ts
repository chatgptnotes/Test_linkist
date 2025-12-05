import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7days';
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // Get total revenue from pricing JSON field
    const { data: revenueData } = await supabase
      .from('orders')
      .select('pricing')
      .neq('status', 'cancelled');
    
    const totalRevenue = revenueData?.reduce((sum, order) => {
      const pricing = order.pricing as any;
      return sum + (pricing?.total || 0);
    }, 0) || 0;

    // Get total customers from profiles table
    const { count: totalCustomers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get pending orders
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get today's orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { count: todaysOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    // Get today's revenue
    const { data: todaysRevenueData } = await supabase
      .from('orders')
      .select('pricing')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString())
      .neq('status', 'cancelled');

    const todaysRevenue = todaysRevenueData?.reduce((sum, order) => {
      const pricing = order.pricing as any;
      return sum + (pricing?.total || 0);
    }, 0) || 0;

    // Calculate weekly growth
    const weekAgoStart = new Date();
    weekAgoStart.setDate(weekAgoStart.getDate() - 14);
    weekAgoStart.setHours(0, 0, 0, 0);
    const weekAgoEnd = new Date();
    weekAgoEnd.setDate(weekAgoEnd.getDate() - 7);
    weekAgoEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);

    const [thisWeek, lastWeek] = await Promise.all([
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisWeekStart.toISOString()),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoStart.toISOString())
        .lte('created_at', weekAgoEnd.toISOString())
    ]);

    const thisWeekOrders = thisWeek.count || 0;
    const lastWeekOrders = lastWeek.count || 0;

    const weeklyGrowth = lastWeekOrders > 0 
      ? Math.round(((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100)
      : 0;

    // Calculate monthly growth - simplified approach
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const [thisMonth, lastMonth] = await Promise.all([
      supabase
        .from('orders')
        .select('pricing')
        .gte('created_at', thisMonthStart.toISOString())
        .neq('status', 'cancelled'),
      supabase
        .from('orders')
        .select('pricing')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonthStart.toISOString())
        .neq('status', 'cancelled')
    ]);

    const thisMonthRevenueValue = thisMonth.data?.reduce((sum, order) => {
      const pricing = order.pricing as any;
      return sum + (pricing?.total || 0);
    }, 0) || 0;

    const lastMonthRevenueValue = lastMonth.data?.reduce((sum, order) => {
      const pricing = order.pricing as any;
      return sum + (pricing?.total || 0);
    }, 0) || 0;

    const monthlyGrowth = lastMonthRevenueValue > 0 
      ? Math.round(((thisMonthRevenueValue - lastMonthRevenueValue) / lastMonthRevenueValue) * 100)
      : 0;

    // Get status counts - we'll need to fetch all orders and group them manually
    const { data: allOrders } = await supabase
      .from('orders')
      .select('status');

    const statusCountsObj = allOrders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const stats = {
      totalOrders: totalOrders ?? 0,
      totalRevenue: Number(totalRevenue) || 0,
      totalCustomers: totalCustomers ?? 0,
      pendingOrders: pendingOrders ?? 0,
      todaysOrders: todaysOrders ?? 0,
      todaysRevenue: Number(todaysRevenue) || 0,
      weeklyGrowth: weeklyGrowth ?? 0,
      monthlyGrowth: monthlyGrowth ?? 0,
      statusCounts: statusCountsObj
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}