'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MouseIcon from '@mui/icons-material/Mouse';
import ShareIcon from '@mui/icons-material/Share';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LanguageIcon from '@mui/icons-material/Language';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import MonitorIcon from '@mui/icons-material/Monitor';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LinkIcon from '@mui/icons-material/Link';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Icon aliases
const ArrowLeft = ArrowBackIcon;
const Eye = VisibilityIcon;
const MousePointer = MouseIcon;
const Share2 = ShareIcon;
const Users = GroupsIcon;
const TrendingUp = TrendingUpIcon;
const TrendingDown = TrendingDownIcon;
const Calendar = CalendarTodayIcon;
const Download = CloudDownloadIcon;
const Filter = FilterListIcon;
const BarChart = BarChartIcon;
const PieChart = PieChartIcon;
const Activity = ShowChartIcon;
const Globe = LanguageIcon;
const Smartphone = SmartphoneIcon;
const Monitor = MonitorIcon;
const MapPin = LocationOnIcon;
const Clock = AccessTimeIcon;
const Link2 = LinkIcon;
const ExternalLink = OpenInNewIcon;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalClicks: number;
    totalShares: number;
    uniqueVisitors: number;
    avgTimeOnPage: string;
    bounceRate: number;
    conversionRate: number;
  };
  trends: {
    period: string;
    views: number;
    clicks: number;
    shares: number;
  }[];
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  topLocations: {
    country: string;
    city: string;
    visits: number;
    percentage: number;
  }[];
  topReferrers: {
    source: string;
    visits: number;
    percentage: number;
  }[];
  linkClicks: {
    link: string;
    clicks: number;
  }[];
  recentActivity: {
    action: string;
    timestamp: string;
    location: string;
    device: string;
  }[];
}

export default function ProfileAnalytics() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // Load analytics data
    const loadAnalytics = async () => {
      // Mock data for demonstration
      setAnalyticsData({
        overview: {
          totalViews: 12543,
          totalClicks: 3421,
          totalShares: 892,
          uniqueVisitors: 8932,
          avgTimeOnPage: '2m 34s',
          bounceRate: 42.3,
          conversionRate: 27.3
        },
        trends: [
          { period: 'Mon', views: 1523, clicks: 421, shares: 89 },
          { period: 'Tue', views: 1876, clicks: 512, shares: 112 },
          { period: 'Wed', views: 2134, clicks: 589, shares: 134 },
          { period: 'Thu', views: 1987, clicks: 534, shares: 123 },
          { period: 'Fri', views: 2234, clicks: 623, shares: 156 },
          { period: 'Sat', views: 1456, clicks: 389, shares: 98 },
          { period: 'Sun', views: 1333, clicks: 353, shares: 180 }
        ],
        devices: {
          desktop: 45,
          mobile: 48,
          tablet: 7
        },
        topLocations: [
          { country: 'United States', city: 'New York', visits: 3421, percentage: 27.3 },
          { country: 'United Kingdom', city: 'London', visits: 2134, percentage: 17.0 },
          { country: 'Canada', city: 'Toronto', visits: 1876, percentage: 15.0 },
          { country: 'Australia', city: 'Sydney', visits: 1523, percentage: 12.1 },
          { country: 'Germany', city: 'Berlin', visits: 1234, percentage: 9.8 }
        ],
        topReferrers: [
          { source: 'LinkedIn', visits: 4523, percentage: 36.0 },
          { source: 'Direct', visits: 3421, percentage: 27.3 },
          { source: 'Google', visits: 2134, percentage: 17.0 },
          { source: 'Twitter', visits: 1523, percentage: 12.1 },
          { source: 'Facebook', visits: 956, percentage: 7.6 }
        ],
        linkClicks: [
          { link: 'Website', clicks: 892 },
          { link: 'LinkedIn', clicks: 756 },
          { link: 'Email', clicks: 623 },
          { link: 'Phone', clicks: 512 },
          { link: 'Portfolio', clicks: 438 }
        ],
        recentActivity: [
          { action: 'Profile View', timestamp: '2 minutes ago', location: 'New York, US', device: 'iPhone 13' },
          { action: 'Link Click (LinkedIn)', timestamp: '5 minutes ago', location: 'London, UK', device: 'Chrome Desktop' },
          { action: 'Profile Share', timestamp: '12 minutes ago', location: 'Toronto, CA', device: 'Android' },
          { action: 'Contact Download', timestamp: '15 minutes ago', location: 'Sydney, AU', device: 'Safari iPad' }
        ]
      });
      setLoading(false);
    };

    loadAnalytics();
  }, [profileId, timeRange]);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Chart configurations
  const viewsChartData = {
    labels: analyticsData.trends.map(t => t.period),
    datasets: [
      {
        label: 'Views',
        data: analyticsData.trends.map(t => t.views),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Clicks',
        data: analyticsData.trends.map(t => t.clicks),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const devicesChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [analyticsData.devices.desktop, analyticsData.devices.mobile, analyticsData.devices.tablet],
      backgroundColor: ['#3B82F6', '#EF4444', '#10B981'],
      borderWidth: 0
    }]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/profile-dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Analytics</h1>
              <p className="text-gray-600 mt-2">Track your profile performance and engagement</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>

              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalViews.toLocaleString()}</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <MousePointer className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalClicks.toLocaleString()}</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+8.3%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Shares</p>
              <Share2 className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalShares.toLocaleString()}</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+15.7%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
              <Users className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.uniqueVisitors.toLocaleString()}</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">-2.1%</span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Overview</h2>
            <Line
              data={viewsChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h2>
            <Doughnut
              data={devicesChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  }
                }
              }}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2 text-blue-600" />
                  <span>Desktop</span>
                </div>
                <span className="font-medium">{analyticsData.devices.desktop}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Smartphone className="h-4 w-4 mr-2 text-red-600" />
                  <span>Mobile</span>
                </div>
                <span className="font-medium">{analyticsData.devices.mobile}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Monitor className="h-4 w-4 mr-2 text-green-600" />
                  <span>Tablet</span>
                </div>
                <span className="font-medium">{analyticsData.devices.tablet}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Locations */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-600" />
              Top Locations
            </h2>
            <div className="space-y-3">
              {analyticsData.topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {location.city}, {location.country}
                      </span>
                      <span className="text-sm text-gray-600">{location.visits.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Top Referrers
            </h2>
            <div className="space-y-3">
              {analyticsData.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{referrer.source}</span>
                      <span className="text-sm text-gray-600">{referrer.visits.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${referrer.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Link Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Link2 className="h-5 w-5 mr-2 text-green-600" />
              Link Performance
            </h2>
            <div className="space-y-3">
              {analyticsData.linkClicks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-900">{link.link}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{link.clicks} clicks</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{activity.timestamp}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{activity.location}</span>
                      <span className="mx-2">•</span>
                      <Smartphone className="h-3 w-3 mr-1" />
                      <span>{activity.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.avgTimeOnPage}</p>
              <p className="text-sm text-gray-600 mt-1">Avg. Time on Page</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.bounceRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Bounce Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.conversionRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-gray-600 mt-1">Engagement Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}