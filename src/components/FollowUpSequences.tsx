'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Play,
  Pause,
  StopCircle,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface SequenceStep {
  id: string;
  step_number: number;
  delay_days: number;
  delay_hours: number;
  subject_template: string;
  body_template: string;
  is_active: boolean;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  sequence_steps: SequenceStep[];
}

interface SentEmail {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
  status: string;
  is_follow_up: boolean;
  follow_up_number: number | null;
  next_follow_up_due_at: string | null;
  response_received_at: string | null;
  response: any;
}

interface LeadSequence {
  id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  lead: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company: string;
  };
  sequence: Sequence;
  sent_emails: SentEmail[];
}

interface FollowUpSequencesProps {
  companyId: string;
  leadId?: string; // Optional: if viewing for a specific lead
}

export function FollowUpSequences({ companyId, leadId }: FollowUpSequencesProps) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [leadSequences, setLeadSequences] = useState<LeadSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Form state for creating new sequence
  const [newSequenceName, setNewSequenceName] = useState('');
  const [newSequenceDescription, setNewSequenceDescription] = useState('');
  const [newSequenceSteps, setNewSequenceSteps] = useState<Array<{
    delayDays: number;
    delayHours: number;
    subjectTemplate: string;
    bodyTemplate: string;
  }>>([
    {
      delayDays: 3,
      delayHours: 0,
      subjectTemplate: 'Following up on my previous email',
      bodyTemplate: 'Hi {{firstName}},\n\nJust wanted to follow up...',
    },
  ]);

  useEffect(() => {
    fetchSequences();
    fetchLeadSequences();
  }, [companyId, leadId]);

  const fetchSequences = async () => {
    try {
      const response = await fetch(`/api/sequences?companyId=${companyId}`);
      const data = await response.json();
      setSequences(data.sequences || []);
    } catch (error) {
      console.error('Error fetching sequences:', error);
    }
  };

  const fetchLeadSequences = async () => {
    try {
      setLoading(true);
      const url = leadId
        ? `/api/lead-sequences?leadId=${leadId}`
        : `/api/lead-sequences?status=active`;
      const response = await fetch(url);
      const data = await response.json();
      setLeadSequences(data.leadSequences || []);
    } catch (error) {
      console.error('Error fetching lead sequences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async () => {
    try {
      const response = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: newSequenceName,
          description: newSequenceDescription,
          steps: newSequenceSteps,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewSequenceName('');
        setNewSequenceDescription('');
        setNewSequenceSteps([
          {
            delayDays: 3,
            delayHours: 0,
            subjectTemplate: 'Following up on my previous email',
            bodyTemplate: 'Hi {{firstName}},\n\nJust wanted to follow up...',
          },
        ]);
        fetchSequences();
      }
    } catch (error) {
      console.error('Error creating sequence:', error);
    }
  };

  const toggleSequenceStatus = async (sequenceId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceId,
          isActive: !currentStatus,
        }),
      });
      fetchSequences();
    } catch (error) {
      console.error('Error toggling sequence status:', error);
    }
  };

  const updateLeadSequenceStatus = async (
    leadSequenceId: string,
    newStatus: 'active' | 'paused' | 'completed' | 'cancelled'
  ) => {
    try {
      await fetch('/api/lead-sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadSequenceId,
          status: newStatus,
        }),
      });
      fetchLeadSequences();
    } catch (error) {
      console.error('Error updating lead sequence status:', error);
    }
  };

  const addSequenceStep = () => {
    setNewSequenceSteps([
      ...newSequenceSteps,
      {
        delayDays: 3,
        delayHours: 0,
        subjectTemplate: '',
        bodyTemplate: '',
      },
    ]);
  };

  const removeSequenceStep = (index: number) => {
    setNewSequenceSteps(newSequenceSteps.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'replied':
        return 'bg-green-500';
      case 'sent':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sequences" className="w-full">
        <TabsList>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="active">Active Leads</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>

        {/* Sequences Tab */}
        <TabsContent value="sequences" className="space-y-4">
          {/* Create Sequence Form */}
          {showCreateForm && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Create New Follow-up Sequence</CardTitle>
                    <CardDescription>
                      Define a multi-step follow-up sequence for your leads
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Sequence Name</Label>
                        <Input
                          id="name"
                          value={newSequenceName}
                          onChange={(e) => setNewSequenceName(e.target.value)}
                          placeholder="e.g., Cold Outreach Sequence"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newSequenceDescription}
                          onChange={(e) => setNewSequenceDescription(e.target.value)}
                          placeholder="Brief description of this sequence"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Follow-up Steps</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSequenceStep}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Step
                          </Button>
                        </div>

                        {newSequenceSteps.map((step, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">Step {index + 1}</h4>
                                {newSequenceSteps.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSequenceStep(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Delay (Days)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={step.delayDays}
                                    onChange={(e) => {
                                      const newSteps = [...newSequenceSteps];
                                      newSteps[index].delayDays = parseInt(e.target.value) || 0;
                                      setNewSequenceSteps(newSteps);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Delay (Hours)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={step.delayHours}
                                    onChange={(e) => {
                                      const newSteps = [...newSequenceSteps];
                                      newSteps[index].delayHours = parseInt(e.target.value) || 0;
                                      setNewSequenceSteps(newSteps);
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Subject Template</Label>
                                <Input
                                  value={step.subjectTemplate}
                                  onChange={(e) => {
                                    const newSteps = [...newSequenceSteps];
                                    newSteps[index].subjectTemplate = e.target.value;
                                    setNewSequenceSteps(newSteps);
                                  }}
                                  placeholder="Use {{firstName}}, {{company}}, etc."
                                />
                              </div>

                              <div>
                                <Label>Body Template</Label>
                                <Textarea
                                  value={step.bodyTemplate}
                                  onChange={(e) => {
                                    const newSteps = [...newSequenceSteps];
                                    newSteps[index].bodyTemplate = e.target.value;
                                    setNewSequenceSteps(newSteps);
                                  }}
                                  placeholder="Email body with {{firstName}}, {{company}}, etc."
                                  rows={4}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createSequence}>Create Sequence</Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Sequences List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Follow-up Sequences</CardTitle>
                <CardDescription>
                  Manage your automated follow-up sequences
                </CardDescription>
              </div>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequences.map((sequence) => (
                    <TableRow key={sequence.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sequence.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {sequence.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sequence.sequence_steps?.length || 0} steps
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={sequence.is_active ? 'bg-green-500' : 'bg-gray-500'}
                        >
                          {sequence.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTimeAgo(sequence.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSequence(sequence)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleSequenceStatus(sequence.id, sequence.is_active)
                            }
                          >
                            {sequence.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Leads Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads in Active Sequences</CardTitle>
              <CardDescription>Monitor and manage leads in follow-up sequences</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : leadSequences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads in active sequences
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadSequences.map((ls) => {
                      const lastEmail = ls.sent_emails?.[ls.sent_emails.length - 1];
                      const isExpanded = expandedLeadId === ls.id;
                      return (
                        <React.Fragment key={ls.id}>
                          <TableRow>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {ls.lead.first_name} {ls.lead.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {ls.lead.company}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {ls.lead.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{ls.sequence.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                Step {ls.current_step} of {ls.sequence.sequence_steps?.length || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(ls.status)}>
                                {ls.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTimestamp(ls.started_at)}</TableCell>
                            <TableCell>
                              {lastEmail?.next_follow_up_due_at ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">
                                    {getTimeAgo(lastEmail.next_follow_up_due_at)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedLeadId(isExpanded ? null : ls.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {ls.status === 'active' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateLeadSequenceStatus(ls.id, 'paused')}
                                  >
                                    <Pause className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateLeadSequenceStatus(ls.id, 'active')}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateLeadSequenceStatus(ls.id, 'cancelled')}
                                >
                                  <StopCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-muted/30">
                                <div className="p-4">
                                  <h4 className="font-semibold mb-3">Email Timeline</h4>
                                  {ls.sent_emails && ls.sent_emails.length > 0 ? (
                                    <div className="space-y-3">
                                      {ls.sent_emails.map((email) => (
                                        <Card key={email.id}>
                                          <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-base">{email.subject}</CardTitle>
                                              <Badge className={getStatusColor(email.status)}>{email.status}</Badge>
                                            </div>
                                          </CardHeader>
                                          <CardContent className="space-y-2">
                                            <div className="text-sm">
                                              <strong>Sent:</strong> {formatTimestamp(email.sent_at)} ({getTimeAgo(email.sent_at)})
                                            </div>
                                            {email.is_follow_up && (
                                              <div className="text-sm">
                                                <strong>Follow-up:</strong> #{email.follow_up_number}
                                              </div>
                                            )}
                                            {email.response_received_at && (
                                              <div className="text-sm text-green-600">
                                                <strong>Response:</strong> {formatTimestamp(email.response_received_at)} ({getTimeAgo(email.response_received_at)})
                                              </div>
                                            )}
                                            {email.next_follow_up_due_at && !email.response && (
                                              <div className="text-sm text-orange-600">
                                                <strong>Next Follow-up:</strong> {formatTimestamp(email.next_follow_up_due_at)} ({getTimeAgo(email.next_follow_up_due_at)})
                                              </div>
                                            )}
                                            <div className="mt-3 p-3 bg-background rounded-md border">
                                              <div className="text-sm whitespace-pre-wrap">{email.body}</div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No emails sent yet
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Timeline</CardTitle>
              <CardDescription>View all sent emails and follow-ups with timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              {leadSequences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No email history to display
                </div>
              ) : (
                <div className="space-y-6">
                  {leadSequences.map((ls) => (
                    <div key={ls.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">
                            {ls.lead.first_name} {ls.lead.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {ls.sequence.name}
                          </p>
                        </div>
                        <Badge className={getStatusColor(ls.status)}>{ls.status}</Badge>
                      </div>

                      {ls.sent_emails && ls.sent_emails.length > 0 ? (
                        <div className="space-y-3">
                          {ls.sent_emails.map((email, index) => (
                            <div
                              key={email.id}
                              className="flex items-start gap-4 border-l-2 pl-4 py-2"
                              style={{
                                borderLeftColor: email.response
                                  ? '#22c55e'
                                  : '#94a3b8',
                              }}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {email.response ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Mail className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{email.subject}</div>
                                  <Badge variant="outline" className={getStatusColor(email.status)}>
                                    {email.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {email.is_follow_up && (
                                    <span className="font-medium">
                                      Follow-up #{email.follow_up_number} •{' '}
                                    </span>
                                  )}
                                  Sent {formatTimestamp(email.sent_at)}
                                  {' • '}
                                  {getTimeAgo(email.sent_at)}
                                </div>
                                {email.response_received_at && (
                                  <div className="text-sm text-green-600 mt-1">
                                    ✓ Response received {getTimeAgo(email.response_received_at)}
                                  </div>
                                )}
                                {email.next_follow_up_due_at && !email.response && (
                                  <div className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Next follow-up due {getTimeAgo(email.next_follow_up_due_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No emails sent yet
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

