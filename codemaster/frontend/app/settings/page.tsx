import { RootLayout } from '@/components/layout/RootLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Shield, Zap, Moon, Code2, LogOut } from 'lucide-react';

export default function SettingsPage() {
  return (
    <RootLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-foreground/60">Manage your preferences and account settings</p>
        </div>

        {/* Account Settings */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                defaultValue="student@example.com"
                readOnly
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Name</label>
              <input
                type="text"
                defaultValue="Alex Student"
                className="w-full px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-foreground/60">Receive updates about new problems</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
              <div>
                <p className="font-medium text-foreground">Streak Reminders</p>
                <p className="text-sm text-foreground/60">Daily reminder to practice</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
              <div>
                <p className="font-medium text-foreground">Achievement Alerts</p>
                <p className="text-sm text-foreground/60">Celebrate your milestones</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Language</label>
              <select className="w-full px-4 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Python</option>
                <option>C++</option>
                <option>Java</option>
                <option>JavaScript</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-foreground/60">Currently enabled</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 cursor-pointer" />
            </div>
          </div>
        </Card>

        {/* Integration Settings */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Integrations
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded border border-border">
              <div>
                <p className="font-medium text-foreground">Wecode Sync</p>
                <p className="text-sm text-foreground/60">Connected • Last sync: 2h ago</p>
              </div>
              <Button variant="outline" size="sm" className="border-border">Disconnect</Button>
            </div>
          </div>
        </Card>

        {/* Privacy & Security */}
        <Card className="p-6 bg-card border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Security
          </h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start border-border h-10">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start border-border h-10">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start border-border h-10">
              Download Your Data
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 bg-red-500/5 border border-red-500/30">
          <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            Danger Zone
          </h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 h-10"
            >
              Sign Out
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 h-10"
            >
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </RootLayout>
  );
}
