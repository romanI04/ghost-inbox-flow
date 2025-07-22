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
  Sliders,
  Shield,
  Clock,
  CreditCard,
  Save,
  Check,
  Settings as SettingsIcon,
  Bell,
  Volume2,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ToneSettings {
  formality: number;
  emojiUsage: number;
  brevity: number;
}

interface ThresholdSettings {
  autoReplyRisk: "low" | "medium" | "high";
  escalationRisk: "low" | "medium" | "high";
  digestFrequency: "hourly" | "daily" | "weekly";
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  digestTime: string;
}

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toneSettings, setToneSettings] = useState<ToneSettings>({
    formality: 70,
    emojiUsage: 30,
    brevity: 80
  });
  const [thresholdSettings, setThresholdSettings] = useState<ThresholdSettings>({
    autoReplyRisk: "medium",
    escalationRisk: "high",
    digestFrequency: "daily"
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: false,
    digestTime: "09:00"
  });
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        // Placeholder API calls
        // const toneResponse = await fetch('/api/settings/tone');
        // const thresholdResponse = await fetch('/api/settings/thresholds');
        // const notificationResponse = await fetch('/api/settings/notifications');
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock loaded settings - in real app these would come from API
        setToneSettings({
          formality: 75,
          emojiUsage: 25,
          brevity: 85
        });
        
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "Please refresh the page to try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  const handleSaveToneSettings = async () => {
    setIsSaving(true);
    
    try {
      // Placeholder API call
      // await fetch('/api/update-tone', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(toneSettings)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Tone settings saved",
        description: "Your AI assistant will use the new tone preferences.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveThresholds = async () => {
    setIsSaving(true);
    
    try {
      // Placeholder API call
      // await fetch('/api/update-thresholds', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(thresholdSettings)
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Threshold settings saved",
        description: "Updated automation rules and risk levels.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save thresholds",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    
    try {
      // Placeholder API call for digest schedule
      // await fetch('/api/update-schedule', {
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ digestTime: notificationSettings.digestTime })
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save notifications",
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-success/10 text-success border-success/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your AI email assistant</p>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-card">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI email assistant to match your preferences
        </p>
      </div>

      {/* Tone Settings */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sliders className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Tone & Style</CardTitle>
              <CardDescription>
                Customize how your AI assistant communicates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Formality Level</Label>
                <Badge variant="outline">{toneSettings.formality}%</Badge>
              </div>
              <Slider
                value={[toneSettings.formality]}
                onValueChange={(value) => setToneSettings(prev => ({ ...prev, formality: value[0] }))}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Casual</span>
                <span>Professional</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Emoji Usage</Label>
                <Badge variant="outline">{toneSettings.emojiUsage}%</Badge>
              </div>
              <Slider
                value={[toneSettings.emojiUsage]}
                onValueChange={(value) => setToneSettings(prev => ({ ...prev, emojiUsage: value[0] }))}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Minimal</span>
                <span>Frequent</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-sm font-medium">Response Brevity</Label>
                <Badge variant="outline">{toneSettings.brevity}%</Badge>
              </div>
              <Slider
                value={[toneSettings.brevity]}
                onValueChange={(value) => setToneSettings(prev => ({ ...prev, brevity: value[0] }))}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Detailed</span>
                <span>Concise</span>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSaveToneSettings}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-primary to-primary-light"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Tone Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Threshold Settings */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle>Risk Thresholds</CardTitle>
              <CardDescription>
                Set automation confidence levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Auto-Reply Risk Level</Label>
              <Select 
                value={thresholdSettings.autoReplyRisk} 
                onValueChange={(value: "low" | "medium" | "high") => 
                  setThresholdSettings(prev => ({ ...prev, autoReplyRisk: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("low")}>Low</Badge>
                      <span>Conservative - Manual review for most emails</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("medium")}>Medium</Badge>
                      <span>Balanced - Auto-reply to common patterns</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("high")}>High</Badge>
                      <span>Aggressive - Auto-reply to most emails</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Escalation Threshold</Label>
              <Select 
                value={thresholdSettings.escalationRisk} 
                onValueChange={(value: "low" | "medium" | "high") => 
                  setThresholdSettings(prev => ({ ...prev, escalationRisk: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("low")}>Low</Badge>
                      <span>Escalate urgent emails immediately</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("medium")}>Medium</Badge>
                      <span>Escalate high-priority emails</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskBadgeColor("high")}>High</Badge>
                      <span>Minimal escalation</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Digest Frequency</Label>
              <Select 
                value={thresholdSettings.digestFrequency} 
                onValueChange={(value: "hourly" | "daily" | "weekly") => 
                  setThresholdSettings(prev => ({ ...prev, digestFrequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="daily">Daily summary</SelectItem>
                  <SelectItem value="weekly">Weekly roundup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSaveThresholds}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-warning to-warning/80"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-warning-foreground border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Threshold Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle>Notifications & Schedule</CardTitle>
              <CardDescription>
                Manage how and when you receive updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive email summaries and urgent alerts
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Browser notifications for real-time updates
                </p>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">Sound Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Audio alerts for important emails
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {notificationSettings.soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={notificationSettings.soundEnabled}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Daily Digest Time</Label>
              <Input
                type="time"
                value={notificationSettings.digestTime}
                onChange={(e) => 
                  setNotificationSettings(prev => ({ ...prev, digestTime: e.target.value }))
                }
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                When to receive your daily email summary
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSaveNotifications}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-accent to-accent-light"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card className="glass-card hover-lift">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <CreditCard className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your Inghost subscription
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-card-glass border border-border/50">
            <div>
              <h3 className="font-semibold">Pro Plan</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI features, unlimited emails, priority support
              </p>
            </div>
            <Badge className="bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-xs text-muted-foreground">Emails processed this month</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">98.7%</p>
              <p className="text-xs text-muted-foreground">Accuracy rate</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1">
              Manage Billing
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;