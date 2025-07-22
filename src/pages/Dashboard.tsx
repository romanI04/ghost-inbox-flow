import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Archive, 
  Eye, 
  CheckCircle,
  Clock,
  Mail,
  FileText,
  Sparkles
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

interface AutoSentEmail {
  id: string;
  subject: string;
  sender: string;
  autoReply: string;
  timestamp: string;
  category: "urgent" | "normal" | "low";
}

interface PendingDraft {
  id: string;
  subject: string;
  sender: string;
  originalMessage: string;
  draftReply: string;
  category: "urgent" | "normal" | "low";
}

interface DigestItem {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  timestamp: string;
  unreadCount: number;
}

const Dashboard = () => {
  const [autoSentOpen, setAutoSentOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [digestsOpen, setDigestsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSentEmails, setAutoSentEmails] = useState<AutoSentEmail[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<PendingDraft[]>([]);
  const [digests, setDigests] = useState<DigestItem[]>([]);
  const [editingDrafts, setEditingDrafts] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  // Simulated API calls
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data
      setAutoSentEmails([
        {
          id: "1",
          subject: "Re: Q4 Budget Review",
          sender: "finance@company.com",
          autoReply: "Thanks for the budget review. I'll review the document and get back to you by Friday.",
          timestamp: "2 hours ago",
          category: "normal"
        },
        {
          id: "2", 
          subject: "Re: Meeting Confirmation",
          sender: "client@example.com",
          autoReply: "Confirmed for Tuesday at 3 PM. Looking forward to our discussion.",
          timestamp: "4 hours ago",
          category: "urgent"
        }
      ]);
      
      setPendingDrafts([
        {
          id: "1",
          subject: "Re: Project Timeline Discussion",
          sender: "pm@company.com",
          originalMessage: "Hi, I wanted to discuss the timeline for the new feature rollout. Are we still on track for the end of Q1?",
          draftReply: "Hi! Yes, we're still on track for Q1. The development team has made excellent progress, and we're currently at 85% completion.",
          category: "urgent"
        },
        {
          id: "2",
          subject: "Re: Conference Speaker Proposal",
          sender: "events@techconf.com", 
          originalMessage: "Would you be interested in speaking at our upcoming tech conference? The topic would be AI automation in productivity tools.",
          draftReply: "Thank you for the invitation! I'd be honored to speak about AI automation. Could you share more details about the expected audience and presentation format?",
          category: "normal"
        }
      ]);
      
      setDigests([
        {
          id: "1",
          title: "Daily FYI Digest",
          summary: "15 newsletters, 8 notifications, 3 social updates",
          keyPoints: [
            "New feature announcements from 3 SaaS tools",
            "Industry news about AI developments",
            "Team updates and internal communications"
          ],
          timestamp: "Today, 9:00 AM",
          unreadCount: 15
        },
        {
          id: "2",
          title: "Weekly Industry Roundup", 
          summary: "Key developments in automation and productivity",
          keyPoints: [
            "Major funding rounds in AI sector",
            "New productivity tool launches",
            "Remote work trend analysis"
          ],
          timestamp: "Yesterday, 6:00 PM",
          unreadCount: 0
        }
      ]);
      
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  const handleEditDraft = (draftId: string, newContent: string) => {
    setEditingDrafts(prev => ({
      ...prev,
      [draftId]: newContent
    }));
  };

  const handleSendDraft = async (draftId: string) => {
    try {
      // Placeholder API call
      // await fetch('/api/send-draft', { method: 'POST', body: JSON.stringify({ draftId, content: editingDrafts[draftId] }) });
      
      toast({
        title: "Draft sent successfully",
        description: "Your email has been sent.",
      });
      
      setPendingDrafts(prev => prev.filter(draft => draft.id !== draftId));
      setEditingDrafts(prev => {
        const updated = { ...prev };
        delete updated[draftId];
        return updated;
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send draft",
        description: "Please try again.",
      });
    }
  };

  const handleRejectDraft = async (draftId: string) => {
    try {
      // Placeholder API call
      // await fetch('/api/reject-draft', { method: 'POST', body: JSON.stringify({ draftId }) });
      
      toast({
        title: "Draft rejected",
        description: "The draft has been archived.",
      });
      
      setPendingDrafts(prev => prev.filter(draft => draft.id !== draftId));
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Failed to reject draft",
        description: "Please try again.",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "urgent": return "bg-destructive/10 text-destructive border-destructive/20";
      case "normal": return "bg-primary/10 text-primary border-primary/20";
      case "low": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Today's Activity</h1>
          <p className="text-muted-foreground">AI-powered email management dashboard</p>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
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
        <h1 className="text-3xl font-bold mb-2 gradient-text">Today's Activity</h1>
        <p className="text-muted-foreground">
          AI-powered email management dashboard • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Auto-Sent Section */}
      <Card className="glass-card hover-lift">
        <Collapsible open={autoSentOpen} onOpenChange={setAutoSentOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/50 smooth-transition rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Auto-Sent</span>
                      <Badge variant="secondary">{autoSentEmails.length}</Badge>
                    </CardTitle>
                    <CardDescription>Emails automatically handled by AI</CardDescription>
                  </div>
                </div>
                {autoSentOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {autoSentEmails.map((email) => (
                <div key={email.id} className="p-4 rounded-lg border border-border/50 bg-card-glass space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{email.subject}</h3>
                        <Badge className={getCategoryColor(email.category)}>
                          {email.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">From: {email.sender}</p>
                      <p className="text-xs text-muted-foreground">{email.timestamp}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-sm"><strong>Auto-reply:</strong> {email.autoReply}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Pending Drafts Section */}
      <Card className="glass-card hover-lift">
        <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/50 smooth-transition rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Pending Drafts</span>
                      <Badge variant="secondary">{pendingDrafts.length}</Badge>
                    </CardTitle>
                    <CardDescription>Emails requiring your approval</CardDescription>
                  </div>
                </div>
                {pendingOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {pendingDrafts.map((draft) => (
                <div key={draft.id} className="p-4 rounded-lg border border-border/50 bg-card-glass space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{draft.subject}</h3>
                        <Badge className={getCategoryColor(draft.category)}>
                          {draft.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">From: {draft.sender}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Original message:</p>
                      <p className="text-sm">{draft.originalMessage}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">AI-generated reply:</p>
                      <Textarea
                        value={editingDrafts[draft.id] ?? draft.draftReply}
                        onChange={(e) => handleEditDraft(draft.id, e.target.value)}
                        className="min-h-[120px] resize-none"
                        placeholder="Edit the draft reply..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        onClick={() => handleSendDraft(draft.id)}
                        className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Approve & Send
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectDraft(draft.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Digests Section */}
      <Card className="glass-card hover-lift">
        <Collapsible open={digestsOpen} onOpenChange={setDigestsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/50 smooth-transition rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Digests</span>
                      <Badge variant="secondary">{digests.length}</Badge>
                    </CardTitle>
                    <CardDescription>Summarized email bundles and updates</CardDescription>
                  </div>
                </div>
                {digestsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {digests.map((digest) => (
                <div key={digest.id} className="p-4 rounded-lg border border-border/50 bg-card-glass space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{digest.title}</h3>
                        {digest.unreadCount > 0 && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {digest.unreadCount} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{digest.summary}</p>
                      <p className="text-xs text-muted-foreground">{digest.timestamp}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Key points:</p>
                    <ul className="space-y-1">
                      {digest.keyPoints.map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                          <Sparkles className="h-3 w-3 mt-0.5 text-accent flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Digest
                  </Button>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default Dashboard;