import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Sliders as SlidersIcon,
  Shield,
  Clock,
  CreditCard,
  Save,
  Check,
  Settings as SettingsIcon,
  Bell,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../App";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

interface SettingsProps {
  session: any;
}

interface UserSettings {
  [key: string]: any;
}

const Settings = ({ session }: SettingsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [toneSettings, setToneSettings] = useState({
    formality: 70,
    emojiUsage: 30,
    brevity: 80
  });
  const [thresholdSettings, setThresholdSettings] = useState<{
    autoReplyRisk: "low" | "medium" | "high";
    escalationRisk: "low" | "medium" | "high";
    digestFrequency: "hourly" | "daily" | "weekly";
  }>({
    autoReplyRisk: "medium",
    escalationRisk: "high",
    digestFrequency: "daily"
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: false,
    digestTime: "09:00"
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Gmail connection status
  const { data: gmailTokens, isLoading: gmailLoading } = useQuery({
    queryKey: ['gmailTokens', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('provider', 'google')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!session,
  });

  const connectGmail = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/capture-google-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: session.user.id }),
      });

      const data = await response.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({ title: "Error connecting Gmail", description: "Please try again", variant: "destructive" });
    }
  };

  // Fetch settings from Supabase
  const { data: userSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['userSettings', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single(); // Assume one row per user
      if (error && error.code !== 'PGRST116') throw error; // Ignore no-row error
      return data || {}; // Default empty if no row
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (userSettings) {
      setToneSettings({
        formality: userSettings.formality || 70,
        emojiUsage: userSettings.emoji_usage || 30,
        brevity: userSettings.brevity || 80
      });
      setThresholdSettings({
        autoReplyRisk: userSettings.risk_threshold_low || "medium",
        escalationRisk: userSettings.risk_threshold_medium || "high",
        digestFrequency: userSettings.digest_schedule ? "daily" : "daily" // Map timestamp to frequency if needed
      });
      // Map other fields as needed
    }
    if (settingsError) toast({ title: "Error loading settings", description: settingsError.message, variant: "destructive" });
  }, [userSettings, settingsError, toast]);

  // Mutation for saving all settings (upsert to user_preferences)
  const saveMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: session.user.id, ...newSettings }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      setIsSaving(false);
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: Error) => {
      setIsSaving(false);
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  // Test Functions
  const testSetupWatch = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/setup-watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: "Gmail Watch Setup Successful!", 
          description: `Gmail will now notify us of new emails. Expiration: ${new Date(parseInt(data.expiration)).toLocaleString()}` 
        });
      } else {
        throw new Error(data.error || 'Setup watch failed');
      }
    } catch (error) {
      console.error('Error setting up Gmail watch:', error);
      toast({ 
        title: "Gmail Watch Setup Failed", 
        description: error.message || "Please check your Gmail connection", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testClassifyEmail = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/classify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message_id: `test_${Date.now()}`,
          subject: "Urgent: Budget Approval Needed by EOD",
          sender: "finance@company.com",
          body: "Hi there, I need your approval on the Q2 budget proposal. The board meeting is tomorrow and we need your sign-off by end of day. Please review the attached spreadsheet and let me know if you have any concerns. Thanks!"
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: "Email Classification Successful!", 
          description: `Category: ${data.category}, Urgency: ${data.urgency}, Action: ${data.required_action}` 
        });
        // Refresh the dashboard data
        queryClient.invalidateQueries({ queryKey: ['emails'] });
      } else {
        throw new Error(data.error || 'Classification failed');
      }
    } catch (error) {
      console.error('Error classifying email:', error);
      toast({ 
        title: "Email Classification Failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testGenerateDraft = async () => {
    setIsSaving(true);
    try {
      // First get the latest email to generate a draft for
      const { data: emails, error: emailError } = await supabase
        .from('emails')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (emailError || !emails || emails.length === 0) {
        throw new Error('No emails found. Try classifying an email first.');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email_id: emails[0].id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: "Draft Generation Successful!", 
          description: `Draft: "${data.draft.substring(0, 100)}..." Status: ${data.status}` 
        });
        // Refresh the dashboard data
        queryClient.invalidateQueries({ queryKey: ['emails'] });
      } else {
        throw new Error(data.error || 'Draft generation failed');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      toast({ 
        title: "Draft Generation Failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testUpdateTone = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/update-tone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          formality: toneSettings.formality,
          emoji_usage: toneSettings.emojiUsage,
          brevity: toneSettings.brevity
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: "Tone Function Test Successful!", 
          description: `Updated: Formality ${data.preferences.formality}%, Emoji ${data.preferences.emoji_usage}%, Brevity ${data.preferences.brevity}%` 
        });
        // Refresh settings data
        queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      } else {
        throw new Error(data.error || 'Update tone function failed');
      }
    } catch (error) {
      console.error('Error testing update-tone function:', error);
      toast({ 
        title: "Tone Function Test Failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToneSettings = () => {
    setIsSaving(true);
    saveMutation.mutate(toneSettings);
  };

  const handleSaveThresholds = () => {
    setIsSaving(true);
    saveMutation.mutate(thresholdSettings);
  };

  const handleSaveNotifications = () => {
    setIsSaving(true);
    saveMutation.mutate(notificationSettings); // Adjust fields as per table
  };

  if (settingsLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      {/* Gmail Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Gmail Connection
          </CardTitle>
          <CardDescription>Manage your Gmail account connection for email automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Gmail Account Status</p>
              <p className="text-sm text-muted-foreground">
                {gmailLoading ? 'Checking connection...' : 
                 gmailTokens ? 'Connected and authorized' : 'Not connected'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {gmailLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : gmailTokens ? (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm" onClick={connectGmail}>
                    Reconnect
                  </Button>
                </>
              ) : (
                <Button onClick={connectGmail}>
                  Connect Gmail
                </Button>
              )}
            </div>
          </div>
          {gmailTokens && (
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date(gmailTokens.updated_at).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tone Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersIcon className="h-5 w-5" />
            Tone Preferences
          </CardTitle>
          <CardDescription>Customize the writing style of automated responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Formality</span>
              <span>{toneSettings.formality}%</span>
            </Label>
            <Slider
              value={[toneSettings.formality]}
              onValueChange={([value]) => setToneSettings({ ...toneSettings, formality: value })}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Emoji Usage</span>
              <span>{toneSettings.emojiUsage}%</span>
            </Label>
            <Slider
              value={[toneSettings.emojiUsage]}
              onValueChange={([value]) => setToneSettings({ ...toneSettings, emojiUsage: value })}
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Brevity</span>
              <span>{toneSettings.brevity}%</span>
            </Label>
            <Slider
              value={[toneSettings.brevity]}
              onValueChange={([value]) => setToneSettings({ ...toneSettings, brevity: value })}
              max={100}
              step={1}
            />
          </div>
          <Button onClick={handleSaveToneSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save Tone Settings
          </Button>
        </CardContent>
      </Card>

      {/* Threshold Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Thresholds & Automation
          </CardTitle>
          <CardDescription>Set levels for auto-actions and escalations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Auto-Reply Risk Threshold</Label>
            <Select value={thresholdSettings.autoReplyRisk} onValueChange={(value: "low" | "medium" | "high") => setThresholdSettings({ ...thresholdSettings, autoReplyRisk: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Escalation Risk Threshold</Label>
            <Select value={thresholdSettings.escalationRisk} onValueChange={(value: "low" | "medium" | "high") => setThresholdSettings({ ...thresholdSettings, escalationRisk: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Digest Frequency</Label>
            <Select value={thresholdSettings.digestFrequency} onValueChange={(value: "hourly" | "daily" | "weekly") => setThresholdSettings({ ...thresholdSettings, digestFrequency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveThresholds} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save Thresholds
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Digest
          </CardTitle>
          <CardDescription>Manage how and when you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Email Notifications</Label>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Sound Alerts</Label>
            <Switch
              checked={notificationSettings.soundEnabled}
              onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, soundEnabled: checked })}
            />
          </div>
          <div>
            <Label>Digest Delivery Time</Label>
            <Input
              type="time"
              value={notificationSettings.digestTime}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, digestTime: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveNotifications} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Test Functions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Test Functions
          </CardTitle>
          <CardDescription>Test your email processing pipeline end-to-end</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={testSetupWatch} 
              disabled={!gmailTokens || isSaving}
              className="w-full"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Bell className="mr-2 h-4 w-4" />}
              Setup Gmail Watch (Real-time notifications)
            </Button>
            {!gmailTokens && (
              <p className="text-sm text-muted-foreground">Connect Gmail first to test functions</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testClassifyEmail} 
              disabled={!gmailTokens || isSaving}
              variant="outline"
              className="w-full"
            >
              Test Email Classification
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testGenerateDraft} 
              disabled={!gmailTokens || isSaving}
              variant="outline"
              className="w-full"
            >
              Test Draft Generation
            </Button>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={testUpdateTone} 
              disabled={!gmailTokens || isSaving}
              variant="outline"
              className="w-full"
            >
              Test Update Tone Function
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              These functions test your real email processing pipeline with live data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing Placeholder (static for now) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
          <CardDescription>Manage your subscription and payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Current Plan</span>
              <Badge variant="secondary">Pro</Badge>
            </div>
            <div className="flex justify-between">
              <span>Next Billing Date</span>
              <span>July 1, 2025</span>
            </div>
            <Button variant="outline">Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;