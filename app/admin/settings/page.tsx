'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EmailIcon from '@mui/icons-material/Email';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import PaletteIcon from '@mui/icons-material/Palette';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StorageIcon from '@mui/icons-material/Storage';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GroupsIcon from '@mui/icons-material/Groups';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrintIcon from '@mui/icons-material/Print';
import SendIcon from '@mui/icons-material/Send';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';

// Icon aliases
const Settings = SettingsIcon;
const Save = SaveIcon;
const Upload = CloudUploadIcon;
const Mail = EmailIcon;
const CreditCard = CreditCardIcon;
const Shield = SecurityIcon;
const Globe = LanguageIcon;
const Palette = PaletteIcon;
const Bell = NotificationsIcon;
const Database = StorageIcon;
const Key = VpnKeyIcon;
const Users = GroupsIcon;
const Package = Inventory2Icon;
const Truck = LocalShippingIcon;
const Printer = PrintIcon;
const Send = SendIcon;
const Schedule = ScheduleIcon;
const Copy = ContentCopyIcon;
const Eye = VisibilityIcon;
const EyeOff = VisibilityOffIcon;
const Check = CheckIcon;
const X = CloseIcon;
const RefreshCw = RefreshIcon;
const AlertTriangle = WarningIcon;

interface PrinterSettings {
  printerEmail: string;
  scheduledHour: number;
  scheduledMinute: number;
  timezone: string;
  isEnabled: boolean;
  lastSentAt: string | null;
}

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  branding: {
    logo: string;
    favicon: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    templates: {
      orderConfirmation: boolean;
      orderShipped: boolean;
      orderDelivered: boolean;
      orderCancelled: boolean;
    };
  };
  payment: {
    stripePublicKey: string;
    stripeSecretKey: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    paypalClientSecret: string;
    currency: string;
    taxRate: number;
  };
  shipping: {
    freeShippingThreshold: number;
    domesticRate: number;
    internationalRate: number;
    processingDays: number;
    carriers: string[];
  };
  security: {
    twoFactorEnabled: boolean;
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    ipWhitelist: string[];
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    orderAlerts: boolean;
    lowStockAlerts: boolean;
    newCustomerAlerts: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [changes, setChanges] = useState(false);

  // Printer settings state
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    printerEmail: '',
    scheduledHour: 18,
    scheduledMinute: 0,
    timezone: 'Asia/Dubai',
    isEnabled: false,
    lastSentAt: null,
  });
  const [printerLoading, setPrinterLoading] = useState(false);
  const [printerSaving, setPrinterSaving] = useState(false);
  const [sendingToPrinter, setSendingToPrinter] = useState(false);
  const [printerChanges, setPrinterChanges] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPrinterSettings();
  }, []);

  const fetchPrinterSettings = async () => {
    try {
      setPrinterLoading(true);
      const response = await fetch('/api/admin/printer/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setPrinterSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Failed to fetch printer settings:', error);
    } finally {
      setPrinterLoading(false);
    }
  };

  const savePrinterSettings = async () => {
    try {
      setPrinterSaving(true);
      const response = await fetch('/api/admin/printer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerSettings)
      });

      if (response.ok) {
        setPrinterChanges(false);
        alert('Printer settings saved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save printer settings');
      }
    } catch (error) {
      console.error('Failed to save printer settings:', error);
      alert('Failed to save printer settings');
    } finally {
      setPrinterSaving(false);
    }
  };

  const sendToPrinterNow = async () => {
    try {
      setSendingToPrinter(true);
      const response = await fetch('/api/admin/printer/send', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        if (data.orderCount === 0) {
          alert('No pending orders to send to printer.');
        } else {
          alert(`Successfully sent ${data.orderCount} order(s) to printer!`);
          fetchPrinterSettings(); // Refresh to show updated lastSentAt
        }
      } else {
        alert(data.error || data.message || 'Failed to send orders to printer');
      }
    } catch (error) {
      console.error('Failed to send to printer:', error);
      alert('Failed to send orders to printer');
    } finally {
      setSendingToPrinter(false);
    }
  };

  const updatePrinterSettings = (field: keyof PrinterSettings, value: any) => {
    setPrinterSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setPrinterChanges(true);
  };

  const copyEndpointUrl = () => {
    const url = `${window.location.origin}/api/admin/printer/send`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setChanges(false);
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    try {
      setTestingEmail(true);
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST'
      });

      if (response.ok) {
        alert('Test email sent successfully!');
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Failed to test email:', error);
      alert('Failed to send test email');
    } finally {
      setTestingEmail(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
    setChanges(true);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'branding', name: 'Branding', icon: Palette },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'printer', name: 'Printer', icon: Printer },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'shipping', name: 'Shipping', icon: Truck },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Settings not available</h3>
            <p className="mt-1 text-sm text-gray-500">Unable to load system settings.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-500">Configure your application settings and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            {changes && (
              <div className="flex items-center text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Unsaved changes
              </div>
            )}
            <button
              onClick={saveSettings}
              disabled={saving || !changes}
              className="flex items-center space-x-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#b91c1c',
                color: '#ffffff',
                border: 'none',
                cursor: saving || !changes ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#ffffff' }} />
              ) : (
                <Save className="h-4 w-4" style={{ color: '#ffffff' }} />
              )}
              <span style={{ color: '#ffffff', fontWeight: 500 }}>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.siteName}
                          onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={(e) => updateSettings('general', 'adminEmail', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.general.timezone}
                          onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.general.currency}
                          onChange={(e) => updateSettings('general', 'currency', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Description
                      </label>
                      <textarea
                        value={settings.general.siteDescription}
                        onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                      />
                    </div>
                  </div>
                )}

                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
                      <button
                        onClick={testEmail}
                        disabled={testingEmail}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        {testingEmail ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span>{testingEmail ? 'Testing...' : 'Test Email'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtpHost}
                          onChange={(e) => updateSettings('email', 'smtpHost', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSettings('email', 'smtpPort', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                          placeholder="587"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtpUser}
                          onChange={(e) => updateSettings('email', 'smtpUser', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? "text" : "password"}
                            value={settings.email.smtpPassword}
                            onChange={(e) => updateSettings('email', 'smtpPassword', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-red-600 focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={settings.email.fromName}
                          onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Email Templates</h4>
                      <div className="space-y-3">
                        {Object.entries(settings.email.templates).map(([key, enabled]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <button
                              onClick={() => updateSettings('email', 'templates', {
                                ...settings.email.templates,
                                [key]: !enabled
                              })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                enabled ? 'bg-red-700' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Printer Settings */}
                {activeTab === 'printer' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Printer Email Settings</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Configure automatic email notifications to your card printer
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {printerChanges && (
                          <span className="text-sm text-orange-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Unsaved
                          </span>
                        )}
                        <button
                          onClick={savePrinterSettings}
                          disabled={printerSaving || !printerChanges}
                          className="flex items-center space-x-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#b91c1c',
                            color: '#ffffff',
                            border: 'none',
                            cursor: printerSaving || !printerChanges ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {printerSaving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#ffffff' }} />
                          ) : (
                            <Save className="h-4 w-4" style={{ color: '#ffffff' }} />
                          )}
                          <span style={{ color: '#ffffff', fontWeight: 500 }}>{printerSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    {printerLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading printer settings...</span>
                      </div>
                    ) : (
                      <>
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Enable Printer Notifications
                            </span>
                            <p className="text-sm text-gray-500">
                              When enabled, the cron service will send daily emails to the printer
                            </p>
                          </div>
                          <button
                            onClick={() => updatePrinterSettings('isEnabled', !printerSettings.isEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              printerSettings.isEnabled ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                printerSettings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Printer Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Printer Email Address
                            </label>
                            <input
                              type="email"
                              value={printerSettings.printerEmail}
                              onChange={(e) => updatePrinterSettings('printerEmail', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                              placeholder="printer@example.com"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              All order details will be sent to this email address
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Scheduled Hour (24-hour format)
                            </label>
                            <select
                              value={printerSettings.scheduledHour}
                              onChange={(e) => updatePrinterSettings('scheduledHour', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}:00 ({i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Scheduled Minute
                            </label>
                            <select
                              value={printerSettings.scheduledMinute}
                              onChange={(e) => updatePrinterSettings('scheduledMinute', parseInt(e.target.value))}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                            >
                              {[0, 15, 30, 45].map((min) => (
                                <option key={min} value={min}>
                                  :{min.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Timezone
                            </label>
                            <select
                              value={printerSettings.timezone}
                              onChange={(e) => updatePrinterSettings('timezone', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                            >
                              <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">America/New_York</option>
                              <option value="Europe/London">Europe/London</option>
                              <option value="Asia/Kolkata">Asia/Kolkata</option>
                            </select>
                          </div>
                        </div>

                        {/* Last Sent Info */}
                        {printerSettings.lastSentAt && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center">
                              <Schedule className="h-5 w-5 text-blue-600 mr-2" />
                              <span className="text-sm text-blue-800">
                                Last sent: {new Date(printerSettings.lastSentAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Manual Send Button */}
                        <div className="border-t pt-6">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Manual Actions</h4>
                          <button
                            onClick={sendToPrinterNow}
                            disabled={sendingToPrinter || !printerSettings.printerEmail}
                            className="flex items-center space-x-2 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              cursor: sendingToPrinter || !printerSettings.printerEmail ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {sendingToPrinter ? (
                              <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#ffffff' }} />
                            ) : (
                              <Send className="h-4 w-4" style={{ color: '#ffffff' }} />
                            )}
                            <span style={{ color: '#ffffff', fontWeight: 500 }}>{sendingToPrinter ? 'Sending...' : 'Send All Pending Orders Now'}</span>
                          </button>
                          <p className="text-sm text-gray-500 mt-2">
                            This will immediately send all unsent orders to the printer email
                          </p>
                        </div>

                        {/* Cron Setup Instructions */}
                        <div className="border-t pt-6">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Cron Job Setup</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-3">
                              To automate daily emails, set up an external cron job (e.g., cron-job.org) with these settings:
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex-1 mr-3">
                                  <span className="text-xs text-gray-500">Endpoint URL:</span>
                                  <code className="block text-sm text-gray-800 truncate">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/admin/printer/send` : '/api/admin/printer/send'}
                                  </code>
                                </div>
                                <button
                                  onClick={copyEndpointUrl}
                                  className="flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50"
                                >
                                  {copiedUrl ? (
                                    <>
                                      <Check className="h-4 w-4 text-green-600 mr-1" />
                                      <span className="text-green-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p><strong>Method:</strong> POST</p>
                                <p><strong>Headers:</strong> Authorization: Bearer YOUR_CRON_API_KEY</p>
                                <p><strong>Schedule:</strong> {printerSettings.scheduledHour.toString().padStart(2, '0')}:{printerSettings.scheduledMinute.toString().padStart(2, '0')} {printerSettings.timezone}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stripe Public Key
                        </label>
                        <input
                          type="text"
                          value={settings.payment.stripePublicKey}
                          onChange={(e) => updateSettings('payment', 'stripePublicKey', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                          placeholder="pk_live_..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stripe Secret Key
                        </label>
                        <input
                          type={showPasswords ? "text" : "password"}
                          value={settings.payment.stripeSecretKey}
                          onChange={(e) => updateSettings('payment', 'stripeSecretKey', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                          placeholder="sk_live_..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.payment.taxRate}
                          onChange={(e) => updateSettings('payment', 'taxRate', parseFloat(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Minimum Length
                        </label>
                        <input
                          type="number"
                          min="6"
                          max="50"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="10"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-600 focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Two-Factor Authentication
                        </span>
                        <button
                          onClick={() => updateSettings('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.security.twoFactorEnabled ? 'bg-red-700' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Require two-factor authentication for admin users
                      </p>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(settings.notifications).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <p className="text-sm text-gray-500">
                              {key === 'emailNotifications' && 'Receive notifications via email'}
                              {key === 'orderAlerts' && 'Get notified when new orders are placed'}
                              {key === 'lowStockAlerts' && 'Get notified when inventory is low'}
                              {key === 'newCustomerAlerts' && 'Get notified when new customers register'}
                            </p>
                          </div>
                          <button
                            onClick={() => updateSettings('notifications', key, !enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              enabled ? 'bg-red-700' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}