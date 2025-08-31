"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  AlignLeft,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Database,
  Edit3,
  FileText,
  Filter,
  Inbox,
  LineChart,
  Loader2,
  Mail,
  MailCheck,
  MailQuestion,
  Play,
  Search,
  Settings,
  ShieldCheck,
  StopCircle,
  Upload,
  Users2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

// ----------------------------------------------
// Helper types & mock data
// ----------------------------------------------

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  title?: string;
  website?: string;
  linkedin?: string;
  status: "new" | "enriched" | "generated" | "approved" | "rejected" | "sent";
}

interface GeneratedEmail {
  leadId: string;
  subject: string;
  body: string;
}

type EnrichOptions = {
  linkedin: boolean;
  company: boolean;
  news: boolean;
  tech: boolean;
};

const initialLeads: Lead[] = [
  {
    id: "1",
    firstName: "Jade",
    lastName: "Saunders",
    company: "Sunway Safaris",
    email: "jade@sunway-safaris.com",
    title: "Marketing & HR Admin",
    website: "https://www.sunway-safaris.com",
    linkedin: "https://linkedin.com/in/jade-saunders",
    status: "new",
  },
  {
    id: "2",
    firstName: "Monique",
    lastName: "Coetzee",
    company: "Associated Automotive Distributors",
    email: "vos@atlantismotors.co.za",
    title: "Procurement & Logistics",
    website: "https://atlantismotors.co.za",
    linkedin: "https://linkedin.com/in/monique-coetzee",
    status: "new",
  },
];

const chartData = [
  { day: "Mon", sent: 40, opened: 18, replied: 3 },
  { day: "Tue", sent: 80, opened: 42, replied: 9 },
  { day: "Wed", sent: 60, opened: 33, replied: 6 },
  { day: "Thu", sent: 120, opened: 76, replied: 12 },
  { day: "Fri", sent: 100, opened: 51, replied: 10 },
];

// ----------------------------------------------
// Utility functions
// ----------------------------------------------

const tokenFill = (template: string, lead: Lead) =>
  template
    .replaceAll("{{firstName}}", lead.firstName)
    .replaceAll("{{lastName}}", lead.lastName)
    .replaceAll("{{company}}", lead.company)
    .replaceAll("{{title}}", lead.title || "")
    .replaceAll("{{website}}", lead.website || "");

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

// ----------------------------------------------
// Subcomponents
// ----------------------------------------------

function Sidebar({ current, onChange }: { current: string; onChange: (v: string) => void }) {
  const items: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "import", label: "Import", icon: <CloudUpload className="h-4 w-4" /> },
    { key: "enrich", label: "Enrich", icon: <Database className="h-4 w-4" /> },
    { key: "generate", label: "Generate", icon: <BrainCircuit className="h-4 w-4" /> },
    { key: "review", label: "Review", icon: <FileText className="h-4 w-4" /> },
    { key: "send", label: "Send", icon: <Mail className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <LineChart className="h-4 w-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="h-full w-[240px] border-r bg-background/60 backdrop-blur p-3 hidden md:block">
      <div className="flex items-center gap-2 px-2 pb-4">
        <Image 
          src="/salesMattertm (1).png" 
          alt="SalesMatter Logo" 
          width={180} 
          height={60}
          className="h-12 w-auto"
          priority
        />
      </div>
      <nav className="space-y-1">
        {items.map((it) => (
          <Button
            key={it.key}
            variant={current === it.key ? "secondary" : "ghost"}
            className={cx(
              "w-full justify-start gap-2 rounded-xl",
              current === it.key && "shadow"
            )}
            onClick={() => onChange(it.key)}
          >
            {it.icon}
            {it.label}
          </Button>
        ))}
      </nav>
      <Separator className="my-4" />
      <div className="px-2 text-xs text-muted-foreground">
        v1.0 · Shadcn UI · Tailwind
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/70 backdrop-blur px-4 py-2">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="text-sm text-muted-foreground hidden sm:block">
          AI-Driven Sales Automation Tool
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem className="gap-2"><Checkbox /> New</DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Checkbox /> Enriched</DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Checkbox /> Generated</DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Checkbox /> Approved</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://i.pravatar.cc/100?img=12" alt="User" />
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  const steps = [
    { key: "Import", icon: <CloudUpload className="h-4 w-4" /> },
    { key: "Enrich", icon: <Database className="h-4 w-4" /> },
    { key: "Generate", icon: <BrainCircuit className="h-4 w-4" /> },
    { key: "Review", icon: <FileText className="h-4 w-4" /> },
    { key: "Send", icon: <Mail className="h-4 w-4" /> },
    { key: "Analytics", icon: <LineChart className="h-4 w-4" /> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/30 p-2">
      {steps.map((s, i) => (
        <Button
          key={s.key}
          variant={i === step ? "secondary" : "ghost"}
          size="sm"
          className="rounded-xl"
          onClick={() => onStep(i)}
        >
          <span className="mr-2">{s.icon}</span>
          <span className="hidden sm:inline">{i + 1}. {s.key}</span>
          <span className="sm:hidden">{i + 1}</span>
        </Button>
      ))}
    </div>
  );
}

// ----------------------------------------------
// Main screens
// ----------------------------------------------

function ImportScreen({
  leads,
  onImportCSV,
  onConnectCRM,
}: {
  leads: Lead[];
  onImportCSV: (file: File) => void;
  onConnectCRM: (provider: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>Import leads from spreadsheets. Column mapping is automatic with manual override.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input ref={fileRef} type="file" accept=".csv" className="rounded-xl" />
            <Button
              className="rounded-xl"
              onClick={() => {
                const f = fileRef.current?.files?.[0];
                if (f) onImportCSV(f);
              }}
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>
          <Separator />
          <div>
            <div className="text-sm font-medium mb-2">Detected Columns</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {["firstName", "lastName", "email", "company", "title", "website", "linkedin"].map((field) => (
                <div key={field} className="flex items-center justify-between rounded-xl border p-2">
                  <div className="text-sm">{field}</div>
                  <Select>
                    <SelectTrigger className="w-[140px] rounded-xl">
                      <SelectValue placeholder="Map to" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="ignore">Ignore</SelectItem>
                      <SelectItem value="custom">Custom…</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Connect CRM</CardTitle>
          <CardDescription>Pull leads directly via API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Provider</Label>
          <Select onValueChange={onConnectCRM}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Choose CRM" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="hubspot">HubSpot</SelectItem>
              <SelectItem value="pipedrive">Pipedrive</SelectItem>
              <SelectItem value="salesforce">Salesforce</SelectItem>
              <SelectItem value="airtable">Airtable</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" className="w-full rounded-xl">
            <ShieldCheck className="mr-2 h-4 w-4" /> OAuth Connect
          </Button>
          <Separator />
          <div className="text-sm text-muted-foreground">Leads in workspace: {leads.length}</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl lg:col-span-3">
        <CardHeader>
          <CardTitle>Lead Preview</CardTitle>
          <CardDescription>Recently imported leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[240px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{l.firstName[0]}{l.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{l.firstName} {l.lastName}</div>
                          <div className="text-xs text-muted-foreground">{l.title}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{l.company}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-xl capitalize">{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function EnrichScreen({
  enrichOptions,
  setEnrichOptions,
  onRunEnrichment,
}: {
  enrichOptions: EnrichOptions;
  setEnrichOptions: (v: EnrichOptions) => void;
  onRunEnrichment: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Enrichment Sources</CardTitle>
          <CardDescription>Choose data sources to augment each lead.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            { key: "linkedin", label: "LinkedIn Profiles" },
            { key: "company", label: "Company Website" },
            { key: "news", label: "Recent News" },
            { key: "tech", label: "Tech Stack" },
          ] as { key: keyof EnrichOptions; label: string }[]).map((o) => (
            <div key={o.key} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <div className="font-medium">{o.label}</div>
                <div className="text-xs text-muted-foreground">Enable to fetch {o.label.toLowerCase()}.</div>
              </div>
              <Switch
                checked={enrichOptions[o.key]}
                onCheckedChange={(v: boolean) => setEnrichOptions({ ...enrichOptions, [o.key]: v })}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-xs text-muted-foreground">API usage estimated: 0.02 credits/lead</div>
          <Button className="rounded-xl" onClick={onRunEnrichment}>
            <Database className="mr-2 h-4 w-4" /> Run Enrichment
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Keys & Providers</CardTitle>
          <CardDescription>Store encrypted in workspace vault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>LinkedIn Cookie (li_at) / API</Label>
            <Input placeholder="••••••••••" className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>News API Key</Label>
            <Input placeholder="••••••••••" className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Tech Stack (BuiltWith) Key</Label>
            <Input placeholder="••••••••••" className="rounded-xl" />
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">Keys are masked and never exposed to clients.</div>
        </CardContent>
      </Card>
    </div>
  );
}

function GenerateScreen({
  template,
  setTemplate,
  subject,
  setSubject,
  preview,
  onGenerate,
}: {
  template: string;
  setTemplate: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  preview: string;
  onGenerate: () => void;
}) {
  const tokens = ["firstName", "lastName", "company", "title", "website"];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Prompt Template</CardTitle>
          <CardDescription>Use tokens like {`{{firstName}}`}, {`{{company}}`} etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl" placeholder="Quick idea for {{company}}" />
          </div>
          <div className="grid gap-2">
            <Label>Body</Label>
            <Textarea value={template} onChange={(e) => setTemplate(e.target.value)} className="min-h-[220px] rounded-2xl" placeholder={"Hi {{firstName}},\n\nI noticed {{company}} ..."} />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tokens:</span>
              {tokens.map((t) => (
                <Badge key={t} variant="outline" className="rounded-xl">{`{${t}}`}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-xs text-muted-foreground">Model: GPT-4 class · Avg ~180 tokens / email</div>
          <Button onClick={onGenerate} className="rounded-xl">
            <BrainCircuit className="mr-2 h-4 w-4" /> Generate for all leads
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>Example output using the first lead.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap rounded-2xl border p-3 bg-muted/30">{preview || "(Preview will appear here)"}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewScreen({
  leads,
  emails,
  onApprove,
  onEdit,
}: {
  leads: Lead[];
  emails: Record<string, GeneratedEmail>;
  onApprove: (leadId: string, approved: boolean) => void;
  onEdit: (leadId: string, value: GeneratedEmail) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Generated Emails</CardTitle>
          <CardDescription>Review & approve before sending.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[360px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => {
                  const ge = emails[l.id];
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarFallback>{l.firstName[0]}{l.lastName[0]}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium">{l.firstName} {l.lastName}</div>
                            <div className="text-xs text-muted-foreground">{l.company}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="truncate max-w-[240px]">{ge?.subject || "—"}</TableCell>
                      <TableCell>
                        <Dialog open={open === l.id} onOpenChange={(v) => setOpen(v ? l.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl">Open</Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{ge?.subject}</DialogTitle>
                              <DialogDescription>To: {l.email}</DialogDescription>
                            </DialogHeader>
                            <div className="rounded-2xl border p-3 bg-muted/30 whitespace-pre-wrap">
                              {ge?.body}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setDrawerLead(l)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => onApprove(l.id, true)}
                          >
                            <BadgeCheck className="mr-2 h-4 w-4" /> Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Drawer open={!!drawerLead} onOpenChange={(v) => !v && setDrawerLead(null)}>
        <DrawerContent className="rounded-t-2xl p-0">
          {drawerLead && (
            <>
              <DrawerHeader className="space-y-1">
                <DrawerTitle>Edit Email – {drawerLead.firstName} {drawerLead.lastName}</DrawerTitle>
                <div className="text-sm text-muted-foreground">{drawerLead.company} · {drawerLead.email}</div>
              </DrawerHeader>
              <div className="p-4 grid gap-3">
                <Label>Subject</Label>
                <Input
                  defaultValue={emails[drawerLead.id]?.subject}
                  className="rounded-xl"
                  onChange={(e) => onEdit(drawerLead.id, { ...emails[drawerLead.id], subject: e.target.value })}
                />
                <Label>Body</Label>
                <Textarea
                  defaultValue={emails[drawerLead.id]?.body}
                  className="min-h-[220px] rounded-2xl"
                  onChange={(e) => onEdit(drawerLead.id, { ...emails[drawerLead.id], body: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setDrawerLead(null)}>Close</Button>
                  <Button className="rounded-xl" onClick={() => { onApprove(drawerLead.id, true); setDrawerLead(null); }}>
                    <BadgeCheck className="mr-2 h-4 w-4" /> Approve & Save
                  </Button>
                </div>
              </div>
              <DrawerFooter />
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function SendScreen({
  approvedCount,
  onStart,
  onStop,
  sending,
  progress,
  batchSize,
  setBatchSize,
  schedule,
  setSchedule,
}: {
  approvedCount: number;
  onStart: () => void;
  onStop: () => void;
  sending: boolean;
  progress: number;
  batchSize: number;
  setBatchSize: (n: number) => void;
  schedule: Date | null;
  setSchedule: (d: Date | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Batch Sending</CardTitle>
          <CardDescription>Send approved emails in small batches to protect sender reputation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Batch size</Label>
              <Input type="number" className="rounded-xl" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value || "1"))} />
            </div>
            <div className="grid gap-2">
              <Label>Delay between batches (min)</Label>
              <Select defaultValue="15">
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  { [5,10,15,20,30,45,60].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>) }
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Provider</Label>
              <Select defaultValue="sendgrid">
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="gmail">Gmail API</SelectItem>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>From name</Label>
              <Input placeholder="Neo from SalesMatter" className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label>From email</Label>
              <Input placeholder="neo@salesmatter.co" className="rounded-xl" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Approved emails: {approvedCount}</div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    <CalendarDays className="mr-2 h-4 w-4" /> {schedule ? format(schedule, "PP") : "Schedule"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-auto rounded-2xl" align="end">
                  <Calendar mode="single" selected={schedule ?? undefined} onSelect={(d) => setSchedule(d ?? null)} />
                </PopoverContent>
              </Popover>
              {!sending ? (
                <Button disabled={approvedCount === 0} onClick={onStart} className="rounded-xl">
                  <Play className="mr-2 h-4 w-4" /> Start sending
                </Button>
              ) : (
                <Button variant="destructive" onClick={onStop} className="rounded-xl">
                  <StopCircle className="mr-2 h-4 w-4" /> Stop
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Progress</Label>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>Deliverability & opt-out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="font-medium">Include unsubscribe link</div>
              <div className="text-xs text-muted-foreground">Required for CAN-SPAM / POPIA.</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="grid gap-2">
            <Label>Unsubscribe URL</Label>
            <Input placeholder="https://salesmatter.co/unsubscribe/{token}" className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Sending domain</Label>
            <Input placeholder="mailer.salesmatter.co" className="rounded-xl" />
            <div className="text-xs text-muted-foreground">Remember to set up SPF, DKIM, DMARC.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Daily sending vs opens & replies</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <RTooltip />
              <Area type="monotone" dataKey="sent" stroke="currentColor" fill="url(#sent)" />
              <Area type="monotone" dataKey="opened" stroke="currentColor" fillOpacity={0.1} />
              <Area type="monotone" dataKey="replied" stroke="currentColor" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>KPIs</CardTitle>
          <CardDescription>Summary metrics</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Open rate</div>
              <div className="text-xl font-semibold">42%</div>
            </div>
            <MailCheck className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Reply rate</div>
              <div className="text-xl font-semibold">9%</div>
            </div>
            <AlignLeft className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Bounce rate</div>
              <div className="text-xl font-semibold">1.2%</div>
            </div>
            <Inbox className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>SMTP & Provider</CardTitle>
          <CardDescription>Credentials are stored securely.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Provider</Label>
            <Select defaultValue="sendgrid">
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="gmail">Gmail API</SelectItem>
                <SelectItem value="ses">Amazon SES</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>API Key</Label>
            <Input placeholder="SG.••••••••" className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Sending limit (emails/day)</Label>
            <Input type="number" defaultValue={300} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label>Warm-up</Label>
            <Select defaultValue="on">
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="on">On</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Team & permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Neo Sekaleli", "Onalerona Maine", "Khutso Moleleki", "Motheo Modisaesi", "Thato Seekoei"].map((name, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border p-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8"><AvatarFallback>{name.split(" ").map(n=>n[0]).join("")}</AvatarFallback></Avatar>
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-muted-foreground">Editor</div>
                </div>
              </div>
              <Select defaultValue="editor">
                <SelectTrigger className="w-[120px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------
// Root component
// ----------------------------------------------

export default function SalesAutomationUI() {
  const [section, setSection] = useState<string>("import");
  const [step, setStep] = useState<number>(0);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [enrichOptions, setEnrichOptions] = useState({ linkedin: true, company: true, news: false, tech: false });
  const [template, setTemplate] = useState<string>(
    `Hi {{firstName}},\n\nI came across {{company}} and noticed your work in {{title}}. We help teams like yours automate outbound so you get more replies with fewer sends.\n\nWould you be open to a quick chat this week?\n\nBest,\nNeo\n`
  );
  const [subject, setSubject] = useState<string>("Quick idea for {{company}}");
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({});
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(20);
  const [schedule, setSchedule] = useState<Date | null>(null);

  // Preview using the first lead
  const preview = useMemo(() => {
    const first = leads[0];
    if (!first) return "";
    return `${tokenFill(subject, first)}\n\n${tokenFill(template, first)}`;
  }, [subject, template, leads]);

  const onImportCSV = async (file: File) => {
    // Demo: append a mock row after a brief delay
    const text = await file.text();
    console.log("Imported CSV sample:", text.slice(0, 80));
    const id = String(Date.now());
    setLeads((prev) => [
      ...prev,
      { id, firstName: "Taylor", lastName: "Nkosi", company: "Example Pty", email: "taylor@example.com", title: "Ops Manager", website: "https://example.com", status: "new" },
    ]);
  };

  const onConnectCRM = (provider: string) => {
    console.log("Connect to:", provider);
  };

  const runEnrichment = () => {
    // Demo: mark all as enriched
    setLeads((prev) => prev.map((l) => ({ ...l, status: "enriched" })));
  };

  const runGeneration = () => {
    const map: Record<string, GeneratedEmail> = {};
    leads.forEach((l) => {
      map[l.id] = {
        leadId: l.id,
        subject: tokenFill(subject, l),
        body: tokenFill(template, l),
      };
    });
    setEmails(map);
    setLeads((prev) => prev.map((l) => ({ ...l, status: "generated" })));
  };

  const handleApprove = (leadId: string, approved: boolean) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: approved ? "approved" : "rejected" } : l)));
  };

  const handleEdit = (leadId: string, value: GeneratedEmail) => {
    setEmails((prev) => ({ ...prev, [leadId]: { ...prev[leadId], ...value } }));
  };

  const approvedCount = leads.filter((l) => l.status === "approved").length;

  // Simulate sending with batches
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (sending) {
      const total = approvedCount || 1;
      let sent = 0;
      timer = setInterval(() => {
        sent = Math.min(total, sent + Math.max(1, Math.floor(batchSize / 4)));
        setProgress(Math.round((sent / total) * 100));
        if (sent >= total) {
          if (timer) clearInterval(timer);
          setSending(false);
          setLeads((prev) => prev.map((l) => (l.status === "approved" ? { ...l, status: "sent" } : l)));
        }
      }, 800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sending, approvedCount, batchSize]);

  const startSending = () => {
    if (approvedCount === 0) return;
    setProgress(0);
    setSending(true);
  };

  const stopSending = () => setSending(false);

  // Sync side nav & stepper
  useEffect(() => {
    const map: Record<number, string> = { 0: "import", 1: "enrich", 2: "generate", 3: "review", 4: "send", 5: "analytics" };
    setSection(map[step] || "import");
  }, [step]);

  useEffect(() => {
    const map: Record<string, number> = { import: 0, enrich: 1, generate: 2, review: 3, send: 4, analytics: 5, settings: 5 };
    setStep(map[section] ?? 0);
  }, [section]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="flex">
        <Sidebar current={section} onChange={setSection} />
        <div className="flex-1">
          <Topbar />
          <main className="mx-auto max-w-[1200px] px-4 py-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Stepper step={step} onStep={setStep} />
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ChevronRight className="mr-2 h-4 w-4" /> Quick tour
                </Button>
                <Button size="sm" className="rounded-xl">
                  <ArrowRight className="mr-2 h-4 w-4" /> Next step
                </Button>
              </div>
            </div>

            {section === "import" && (
              <ImportScreen leads={leads} onImportCSV={onImportCSV} onConnectCRM={onConnectCRM} />
            )}

            {section === "enrich" && (
              <EnrichScreen enrichOptions={enrichOptions} setEnrichOptions={setEnrichOptions} onRunEnrichment={runEnrichment} />
            )}

            {section === "generate" && (
              <GenerateScreen
                template={template}
                setTemplate={setTemplate}
                subject={subject}
                setSubject={setSubject}
                preview={preview}
                onGenerate={runGeneration}
              />
            )}

            {section === "review" && (
              <ReviewScreen leads={leads} emails={emails} onApprove={handleApprove} onEdit={handleEdit} />
            )}

            {section === "send" && (
              <SendScreen
                approvedCount={approvedCount}
                sending={sending}
                progress={progress}
                onStart={startSending}
                onStop={stopSending}
                batchSize={batchSize}
                setBatchSize={setBatchSize}
                schedule={schedule}
                setSchedule={setSchedule}
              />
            )}

            {section === "analytics" && <AnalyticsScreen />}

            {section === "settings" && <SettingsScreen />}

            <Separator className="my-6" />

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>How this UI maps to your requirements</CardTitle>
                <CardDescription>Import → Enrich → Generate → Review → Send → Analytics</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground grid gap-2">
                <div className="flex items-center gap-2"><CloudUpload className="h-4 w-4" /> Import leads from CSV/CRM</div>
                <div className="flex items-center gap-2"><Database className="h-4 w-4" /> Enrichment toggles & provider keys</div>
                <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Prompt-based generation with tokens</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Review, edit, approve per-lead emails</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Batch sending, schedule, compliance</div>
                <div className="flex items-center gap-2"><LineChart className="h-4 w-4" /> KPIs & charts for outcomes</div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
