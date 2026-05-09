import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/lib/t';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useI18nContext } from '@/contexts/I18nProvider';
import { Bell, Lock, Eye, EyeOff, Save, LogOut, Trash2 } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { locale, changeLocale } = useI18nContext();
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<'notifications' | 'security' | 'preferences'>('notifications');
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
    if (!newPassword || !confirmPassword) { toast.error('Please fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message || 'Failed to change password'); }
      else { toast.success('Password changed successfully!'); setNewPassword(''); setConfirmPassword(''); }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'notifications' as const, label: t('Notifications') },
    { id: 'security' as const, label: t('Security') },
    { id: 'preferences' as const, label: t('Preferences') },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-navy">{t`Settings`}</h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {t('Manage your account settings and preferences.')}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-bg)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold font-body transition-colors"
            style={activeTab === tab.id
              ? { background: 'white', color: 'var(--color-navy)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: 'var(--color-text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="sc-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>{t`Notification Preferences`}</h3>
            </div>
            <p className="text-xs font-body mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              {t('These preferences will be applied when the notification system is enabled.')}
            </p>
            <div className="space-y-4">
              {([
                { key: 'email', label: t('Email Notifications'), desc: t('Receive updates via email') },
                { key: 'push', label: t('Push Notifications'), desc: t('Receive push notifications in browser') },
                { key: 'sessionReminders', label: t('Session Reminders'), desc: t('Get notified before sessions start') },
                { key: 'messages', label: t('New Messages'), desc: t('Get notified when you receive a message') },
                { key: 'communityUpdates', label: t('Community Updates'), desc: t('Get notified about community news') },
                { key: 'reviewNotifications', label: t('Review Notifications'), desc: t('Get notified when you receive reviews') },
              ] as { key: keyof typeof notifications; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold font-body text-sm text-navy">{label}</div>
                    <div className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{desc}</div>
                  </div>
                  <Switch
                    checked={notifications[key]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveNotifications}
            className="w-full flex items-center justify-center gap-2 btn-amber"
            style={{ padding: '0.875rem 1rem' }}
          >
            <Save className="w-4 h-4" />
            {t('Save Preferences')}
          </button>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="sc-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
              <h3 className="font-heading text-navy" style={{ fontSize: '1.05rem' }}>{t`Change Password`}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold font-body text-navy mb-1">{t`New Password`}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('Enter new password')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm font-body focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)', background: 'var(--color-bg)', ['--tw-ring-color' as string]: 'var(--color-amber)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-navy mb-1">{t`Confirm New Password`}</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-body focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)', background: 'var(--color-bg)' }}
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={isSavingPassword}
                className="w-full btn-amber disabled:opacity-50"
                style={{ padding: '0.875rem 1rem' }}
              >
                {isSavingPassword ? t('Changing...') : t('Change Password')}
              </button>
            </div>
          </div>

          <div className="sc-card p-5">
            <h3 className="font-heading text-navy mb-3" style={{ fontSize: '1.05rem' }}>{t`Two-Factor Authentication`}</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold font-body text-sm text-navy">{t`Enable 2FA`}</div>
                <div className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {t('Add an extra layer of security to your account')}
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg border text-xs font-semibold font-body" style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)' }}>
                {t('Enable')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences tab */}
      {activeTab === 'preferences' && (
        <div className="sc-card p-5">
          <h3 className="font-heading text-navy mb-4" style={{ fontSize: '1.05rem' }}>{t`Display Preferences`}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold font-body text-navy mb-1">{t`Language`}</label>
              <select
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-body focus:outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)', background: 'var(--color-bg)' }}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold font-body text-navy mb-1">{t`Time Zone`}</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-body focus:outline-none"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)', background: 'var(--color-bg)' }}
              >
                <option>Africa/Casablanca</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone — always visible */}
      <div className="sc-card p-5 border" style={{ borderColor: '#FECACA', background: '#FFF5F5' }}>
        <h3 className="font-heading text-red-700 mb-4" style={{ fontSize: '1.05rem' }}>{t`Danger Zone`}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold font-body text-sm text-navy">{t`Sign Out`}</div>
              <div className="text-xs font-body mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{t`Sign out from your account`}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold font-body"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)' }}
            >
              <LogOut className="w-3.5 h-3.5" /> {t('Sign Out')}
            </button>
          </div>
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #FECACA' }}>
            <div>
              <div className="font-semibold font-body text-sm text-red-700">{t`Delete Account`}</div>
              <div className="text-xs font-body mt-0.5 text-red-600">{t`Permanently delete your account and all data`}</div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body"
              style={{ background: '#FEE2E2', color: '#DC2626' }}
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('Delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sc-card p-6 max-w-sm w-full">
            <h3 className="font-heading text-red-700 text-lg mb-2">{t`Delete Account?`}</h3>
            <p className="font-body text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
              {t('This action cannot be undone. Please contact support to delete your account.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl border text-sm font-semibold font-body"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-navy)' }}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={() => { toast.info('Please contact support to delete your account.'); setShowDeleteConfirm(false); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold font-body text-white"
                style={{ background: '#DC2626' }}
              >
                {t('Understood')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
