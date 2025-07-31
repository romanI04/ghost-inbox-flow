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
  Sparkles,
  Loader2
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast"; // Adjusted to shadcn use-toast
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../App"; // Import from App.tsx

interface DashboardProps {
  session: any;
}

interface ApprovePayload {
  id: string;
  draftReply: string;
}

const Dashboard = ({ session }: DashboardProps) => {
  const [autoSentOpen, setAutoSentOpen] = useState(true);
  const [pendingOpen, setPendingOpen] = useState(true);
  const [classifiedOpen, setClassifiedOpen] = useState(true);
  const [digestsOpen, setDigestsOpen] = useState(true);
  const [editingDrafts, setEditingDrafts] = useState<Record<string, string>>({}); // For inline editing
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch auto-sent emails from Supabase
  const { data: autoSentEmails, isLoading: autoLoading, error: autoError } = useQuery({
    queryKey: ['autoSent', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'auto_sent')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!session, // Only run if logged in
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch pending drafts
  const { data: pendingDrafts, isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ['pendingDrafts', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!session,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch classified emails (processed but no action needed)
  const { data: classifiedEmails, isLoading: classifiedLoading, error: classifiedError } = useQuery({
    queryKey: ['classifiedEmails', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'classified')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!session,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch digests
  const { data: digests, isLoading: digestLoading, error: digestError } = useQuery({
    queryKey: ['digests', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!session,
  });

  // Mutation for approving and sending draft
  const approveMutation = useMutation({
    mutationFn: async ({ id, draftReply }: ApprovePayload) => {
      const { error } = await supabase
        .from('emails')
        .update({ status: 'sent', draft_reply: draftReply })
        .eq('id', id)
        .eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDrafts'] });
      queryClient.invalidateQueries({ queryKey: ['autoSent'] });
      toast({ title: "Draft approved and sent" });
    },
    onError: (error: Error) => toast({ title: "Error sending draft", description: error.message, variant: "destructive" }),
  });

  // Mutation for rejecting (archive)
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('emails')
        .update({ status: 'archived' })
        .eq('id', id)
        .eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDrafts'] });
      toast({ title: "Draft rejected and archived" });
    },
    onError: (error: Error) => toast({ title: "Error archiving", description: error.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (autoError) toast({ title: "Error loading auto-sent", description: autoError.message, variant: "destructive" });
    if (pendingError) toast({ title: "Error loading pending", description: pendingError.message, variant: "destructive" });
    if (classifiedError) toast({ title: "Error loading classified", description: classifiedError.message, variant: "destructive" });
    if (digestError) toast({ title: "Error loading digests", description: digestError.message, variant: "destructive" });
  }, [autoError, pendingError, classifiedError, digestError, toast]);

  const handleEditDraft = (id: string, text: string) => {
    setEditingDrafts((prev) => ({ ...prev, [id]: text }));
  };

  const handleApprove = (id: string) => {
    const draftReply = editingDrafts[id] || pendingDrafts?.find((d: any) => d.id === id)?.draft_reply;
    approveMutation.mutate({ id, draftReply });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Today's Activity</h1>

      {/* Auto-Sent Section */}
      <Collapsible open={autoSentOpen} onOpenChange={setAutoSentOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Auto-Sent Replies</CardTitle>
                <CardDescription>{autoSentEmails?.length || 0} emails handled automatically today</CardDescription>
              </div>
              {autoSentOpen ? <ChevronUp /> : <ChevronDown />}
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-4">
            {autoLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : autoSentEmails.length === 0 ? (
              <p className="text-center text-muted-foreground">No auto-sent emails yet</p>
            ) : (
              autoSentEmails.map((email) => (
                <Card key={email.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{email.subject}</CardTitle>
                      <Badge variant={email.urgency === 'high' ? 'destructive' : email.urgency === 'medium' ? 'default' : 'secondary'}>{email.category}</Badge>
                    </div>
                    <CardDescription>From: {email.sender} • {new Date(email.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Auto-reply: {email.draft_reply}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Pending Drafts Section */}
      <Collapsible open={pendingOpen} onOpenChange={setPendingOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approval</CardTitle>
                <CardDescription>{pendingDrafts?.length || 0} drafts waiting for your review</CardDescription>
              </div>
              {pendingOpen ? <ChevronUp /> : <ChevronDown />}
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-4">
            {pendingLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : pendingDrafts.length === 0 ? (
              <p className="text-center text-muted-foreground">No pending drafts</p>
            ) : (
              pendingDrafts.map((draft) => (
                <Card key={draft.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{draft.subject}</CardTitle>
                      <Badge variant={draft.urgency === 'high' ? 'destructive' : draft.urgency === 'medium' ? 'default' : 'secondary'}>{draft.category}</Badge>
                    </div>
                    <CardDescription>From: {draft.sender}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium mb-2">Email Details:</p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Category:</strong> {draft.category} | <strong>Urgency:</strong> {draft.urgency} | <strong>Sentiment:</strong> {draft.sentiment}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Draft Reply:</p>
                      <Textarea 
                        value={editingDrafts[draft.id] || draft.draft_reply}
                        onChange={(e) => handleEditDraft(draft.id, e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleApprove(draft.id)} disabled={approveMutation.isPending}>
                        {approveMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                        Approve & Send
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(draft.id)} disabled={rejectMutation.isPending}>
                        {rejectMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                        Reject & Archive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Activity Section (Classified Emails) */}
      <Collapsible open={classifiedOpen} onOpenChange={setClassifiedOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>{classifiedEmails?.length || 0} emails processed and classified</CardDescription>
              </div>
              {classifiedOpen ? <ChevronUp /> : <ChevronDown />}
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-4">
            {classifiedLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : classifiedEmails?.length === 0 ? (
              <p className="text-center text-muted-foreground">No classified emails yet</p>
            ) : (
              classifiedEmails?.map((email) => (
                <Card key={email.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{email.subject}</CardTitle>
                      <Badge variant={email.urgency === 'high' ? 'destructive' : email.urgency === 'medium' ? 'default' : 'secondary'}>{email.category}</Badge>
                    </div>
                    <CardDescription>From: {email.sender} • {new Date(email.created_at).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Archive className="h-4 w-4" />
                      <span>Classified as {email.category} • {email.urgency} urgency • No action needed</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Digests Section */}
      <Collapsible open={digestsOpen} onOpenChange={setDigestsOpen}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Digests</CardTitle>
                <CardDescription>{digests?.length || 0} FYI summaries available</CardDescription>
              </div>
              {digestsOpen ? <ChevronUp /> : <ChevronDown />}
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 mt-4">
            {digestLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : digests.length === 0 ? (
              <p className="text-center text-muted-foreground">No digests yet</p>
            ) : (
              digests.map((digest) => (
                <Card key={digest.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{digest.title || 'Untitled Digest'}</CardTitle>
                    <CardDescription>{digest.date} • {digest.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-4 space-y-2">
                      {(digest.key_points || []).map((point, idx) => (
                        <li key={idx} className="text-sm">{point}</li>
                      ))}
                    </ul>
                    <Button variant="ghost" className="mt-4">View Full Digest</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Dashboard;