import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Trash2,
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sessionReminders: true,
    messages: true,
    communityUpdates: false,
    reviewNotifications: true,
  });

  const handleSaveNotifications = () => {
    localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
    toast.success('Notification preferences saved!');
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message || 'Failed to change password');
      } else {
        toast.success('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    toast.info('Please contact support to delete your account.');
    setShowDeleteConfirm(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-text-primary">
          Settings
        </h1>
        <p className="text-brand-text-secondary mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="bg-white border border-gray-100 p-1">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <p className="text-sm text-brand-text-secondary">
                These preferences will be applied when the notification system is enabled.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Email Notifications
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Receive updates via email
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Push Notifications
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Receive push notifications in browser
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Session Reminders
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Get notified before sessions start
                  </div>
                </div>
                <Switch
                  checked={notifications.sessionReminders}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, sessionReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    New Messages
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Get notified when you receive a message
                  </div>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, messages: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Community Updates
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Get notified about community news
                  </div>
                </div>
                <Switch
                  checked={notifications.communityUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, communityUpdates: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Review Notifications
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Get notified when you receive reviews
                  </div>
                </div>
                <Switch
                  checked={notifications.reviewNotifications}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, reviewNotifications: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                className="w-full btn-primary"
              >
                {isSavingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-brand-text-primary">
                    Enable 2FA
                  </div>
                  <div className="text-sm text-brand-text-secondary">
                    Add an extra layer of security to your account
                  </div>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading">
                Display Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Language</Label>
                <select className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20">
                  <option>English</option>
                  <option>Arabic</option>
                  <option>French</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div>
                <Label>Time Zone</Label>
                <select className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20">
                  <option>Africa/Casablanca</option>
                  <option>Europe/London</option>
                  <option>Europe/Paris</option>
                  <option>UTC</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex justify-end gap-3">
          <Button onClick={handleSaveNotifications} className="btn-primary border-0">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border-0 shadow-card border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg font-heading text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-900">Delete Account</div>
                <div className="text-sm text-red-700">
                  Permanently delete your account and all associated data
                </div>
              </div>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-red-200">
              <div>
                <div className="font-medium text-brand-text-primary">Sign Out</div>
                <div className="text-sm text-brand-text-secondary">
                  Sign out from your account
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <CardHeader>
              <CardTitle className="text-red-700">Delete Account?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-brand-text-secondary">
                This action cannot be undone. Please contact support to delete your account.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Understood
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
