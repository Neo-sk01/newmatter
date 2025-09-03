"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import Papa from "papaparse";
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
import FooterSection from "@/components/footer-section";
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
  Sun,
  Moon,
  Linkedin,
} from "lucide-react";
import { useTheme } from "next-themes";
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

// System prompt for AI email generation (MambaOnline Email Marketing Agent)
const SYSTEM_PROMPT = `I'm giving you three information.
Firstly will be the prompt
Secondly will be the linkedIn description
Thirdly will be the blog posts

I want you to write an email using that info

Always start pointing out the info you have about the receiver

Company Name - ClarinsMen

1.

# MambaOnline Email Marketing Agent - Single-Shot Prompt

You are an expert email marketing agent for MambaOnline, South Africa's longest-running LGBTIQ+ digital media platform (23+ years). Your mission is to create compelling, human-like cold outreach emails that connect brands with South Africa's underserved but lucrative LGBTIQ+ market.

## WRITING STYLE REQUIREMENTS

Human-Like Authenticity:

* Vary sentence structure with mix of long and short sentences
* Add subtle imperfections: slight redundancy, hesitations ("perhaps," "I think"), cautious qualifiers
* Avoid perfect symmetry - let some thoughts feel unfinished or tangential
* Include light personalization with reactions, small experiences, or opinions
* Introduce mild ambiguity or contradiction for realism
* Use natural paragraph breaks, avoid rigid textbook structure
* Skip slang/regionalisms but maintain natural, conversational tone

## ORGANIZATION BACKGROUND

MambaOnline Core Identity:

* South Africa's most authoritative LGBTIQ+ digital voice
* 23+ years of community trust and media advocacy
* 40,000+ unique monthly visitors, 33,000+ social followers
* Weekly newsletter (1,600+ subscribers)
* Recognized by Human Rights Watch for hate crime reporting
* Official media partner for 2024 ILGA World Conference
  Target Market Power:
* R250 billion annual purchasing power
* 60%+ hold degrees or postgrad qualifications
* 44% in management roles
* 33% earn over R30,000/month
* 76% prefer brands advertising on LGBTIQ+ platforms
* 83% want more brands actively identifying with LGBTIQ+ communities
* 57% feel ignored by mainstream brands
  Services Offered:
* Daily LGBTIQ+ news and editorial content
* Digital advertising (leaderboards, rectangles, mobile headers, skyscrapers)
* Pride Month campaign packages (June)
* Advertorial content and social media amplification
* Newsletter visibility and community engagement
* Past clients: FASHION BRANDZ

## MANDATORY EMAIL STRUCTURE: IP = XYZ FORMULA

X: Value Proposition + Benefit + Hook

* Brief organization introduction
* Clear value proposition relevant to recipient
* Immediate benefit statement (what's in it for them)
* Emotional/logical hook connecting to their context
  Y: Reason + Cross-Reference
* Specific reason for outreach
* Evidence of research (recent news, achievements, challenges)
* Explicit alignment between your solution and their goals/needs
  Z: Clear Call to Action
* Precise, low-friction action request
* Time-bound and easy to execute
* Based on X and Y connection established

## EMAIL COMPONENTS

Subject Line:

* 1-2 concise options
* Curiosity-driven or benefit-focused
* Reference community size, buying power, or specific opportunities
  Structure (120-150 words 3 paragraphs, don't use dashes - in text ):

1. Personalized greeting
2. Value proposition with MambaOnline's authority positioning – us this specifically I'm with MambaOnline, South Africa's leading LGBTIQ+ digital platform serving 40,000+ monthly visitors across Southern Africa
3. Strategic inputs about recipient's specific work/campaigns
4. Layered opportunity presentation (editorial + digital + ongoing)
5. Clear, time-bound call to action
6. Professional closing with contact info

## KEY MESSAGING ANGLES

Authority Positioning:

* "23 years of community trust"
* "South Africa's #1 LGBTIQ+ platform"
  Market Opportunity:
* "R250B+ annual buying power"
* "40,000+ engaged monthly readers"
* "76% prefer brands on LGBTIQ+ platforms"
* "83% want more brand representation"
  Credibility Markers:
* Mention specific audience demographics

## SAMPLE EXECUTION FRAMEWORK

Opening Hook Examples:

* "While most brands are missing South Africa's R250B LGBTIQ+ market..."
* "Your [specific campaign] caught our attention because..."
* "23 years of community trust has taught us..."
  Value Bridge Examples: listed below
  I'm with
  MambaOnline, South Africa's leading LGBTIQ+ digital platform serving 40,000+
  monthly visitors across Southern Africa. We help forward-thinking SaaS companies like Xero eliminate wasted spend on broad SME campaigns while maximizing authentic engagement with high-value business communities that actually convert to premium plans.
  Your recent post about the vibrant energy at your Johannesburg and Cape Town roadshows really resonated (4,000 attendees—incredible!). That community-building approach aligns perfectly with our audience: LGBTIQ+ business owners represent a significant portion of SA's R250 billion community purchasing power, with 60% holding degrees, 44% in management roles, and 33% earning over R30,000 monthly. These are exactly the sophisticated SMEs who need robust accounting solutions.
  I'm reaching out because your Beautiful Business Fund initiative shows you understand the importance of supporting underrepresented entrepreneurs. We help cut down on generic SME marketing and boost targeted reach where it matters—83% of our community actively seeks brands that identify with queer businesses, and they're typically early adopters of innovative business tools- "We can help you reach [specific outcome] through..."
  Action Phrases:
* "Can we explore commercial partnership opportunities this week?"
* "Would a 20-minute call work to discuss possibilities?"

## EXECUTION INSTRUCTIONS

When given a target company/recipient:

1. Research Integration: Reference specific campaigns, values, or recent achievements
2. Opportunity Sizing: Quantify potential reach, engagement, or conversion
3. Urgency Creation: Reference market trends or find a connection to secure a meeting
  Tone Balance:

* Professional yet approachable
* Confident but not pushy
* Informed and research-backed, where possible site recent articles or public information that tie in with custom campaigns
* Results-focused with ROI for the specific brand
  Your goal is to create emails that feel personally crafted, demonstrate deep understanding of both the recipient's business and the LGBTIQ+ market opportunity, while positioning MambaOnline as the essential bridge between brands and this powerful community that clearly demonstrates value and a commercial opportunity or relationship that is mutually beneficial.`;

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

// Apply LLM-provided mapping rules to a CSV row
function applyMapping(
  row: Record<string, any>,
  headerMapping: Record<string, string>,
  rules?: { splitFullName?: { column: string; firstNameFirst?: boolean } }
) {
  const out: {
    firstName?: string;
    lastName?: string;
    company?: string;
    email?: string;
    title?: string | null;
    website?: string | null;
    linkedin?: string | null;
  } = {};

  const get = (k: string) => {
    const v = row[k];
    if (v == null) return "";
    return String(v).trim();
  };

  const normalizeUrl = (v: string) => {
    if (!v) return "";
    let s = v.trim();
    if (!/^https?:\/\//i.test(s)) {
      s = s.startsWith("www.") ? `https://${s}` : `https://${s}`;
    }
    return s;
  };

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [col, field] of Object.entries(headerMapping || {})) {
    if (!field || field === "ignore") continue;
    const value = get(col);
    if (!value) continue;
    switch (field) {
      case "firstName":
        out.firstName = value;
        break;
      case "lastName":
        out.lastName = value;
        break;
      case "company":
        out.company = value;
        break;
      case "email":
        if (emailRe.test(value.toLowerCase())) out.email = value.toLowerCase();
        break;
      case "title":
        out.title = value;
        break;
      case "website":
        out.website = normalizeUrl(value);
        break;
      case "linkedin":
        out.linkedin = normalizeUrl(value);
        break;
    }
  }

  if ((!out.firstName || !out.lastName) && rules?.splitFullName?.column) {
    const full = get(rules.splitFullName.column);
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        out.firstName ??= parts[0];
      } else if (parts.length >= 2) {
        const firstIdx = rules.splitFullName.firstNameFirst === false ? parts.length - 1 : 0;
        const lastIdx = rules.splitFullName.firstNameFirst === false ? 0 : parts.length - 1;
        out.firstName ??= parts[firstIdx];
        out.lastName ??= parts.slice(lastIdx).join(" ");
      }
    }
  }

  return out;
}

// Heuristic fallback if LLM mapping is unavailable
function guessHeaderMapping(columns: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const candidates: Record<string, string[]> = {
    firstName: ["firstname", "first", "givenname", "fname"],
    lastName: ["lastname", "last", "surname", "lname"],
    company: ["company", "organisation", "organization", "org", "employer"],
    email: ["email", "e-mail", "mail"],
    title: ["title", "role", "position", "jobtitle"],
    website: ["website", "site", "url", "domain"],
    linkedin: ["linkedin", "linkedinurl", "linkedinprofile", "li"],
  };
  for (const col of columns) {
    const n = norm(col);
    let matched = false;
    for (const [field, syns] of Object.entries(candidates)) {
      if (syns.some((s) => n.includes(s))) {
        map[col] = field;
        matched = true;
        break;
      }
    }
    if (!matched) map[col] = "ignore";
  }
  return map;
}

// ----------------------------------------------
// Subcomponents
// ----------------------------------------------

function Sidebar({ current, onChange }: { current: string; onChange: (v: string) => void }) {
  const items: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "import", label: "Import", icon: <CloudUpload className="h-6 w-6" /> },
    { key: "enrich", label: "Enrich", icon: <Database className="h-6 w-6" /> },
    { key: "generate", label: "Generate", icon: <BrainCircuit className="h-6 w-6" /> },
    { key: "review", label: "Review", icon: <FileText className="h-6 w-6" /> },
    { key: "send", label: "Send", icon: <Mail className="h-6 w-6" /> },
    { key: "analytics", label: "Analytics", icon: <LineChart className="h-6 w-6" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-6 w-6" /> },
  ];

  return (
    <div className="h-full w-[360px] border-r bg-background/60 backdrop-blur p-[18px] hidden md:block">
      <div className="flex items-center gap-2 px-3 pb-6">
        <Image 
          src="/salesMattertm (1).png" 
          alt="SalesMatter Logo" 
          width={180} 
          height={60}
          className="h-12 w-auto"
          priority
        />
      </div>
      <nav className="space-y-2">
        {items.map((it) => (
          <Button
            key={it.key}
            variant={current === it.key ? "secondary" : "ghost"}
            size="lg"
            className={cx(
              "w-full justify-start gap-3 rounded-xl text-xl",
              current === it.key && "shadow"
            )}
            onClick={() => onChange(it.key)}
          >
            {it.icon}
            {it.label}
          </Button>
        ))}
      </nav>
      <Separator className="my-6" />
      <div className="px-3 text-xs text-muted-foreground">
        v1.0 · Shadcn UI · Tailwind
      </div>
    </div>
  );
}

function Topbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onImportCSV(f);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <Card className="rounded-2xl lg:col-span-4 xl:col-span-6">
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>Import leads from spreadsheets. Column mapping is automatic with manual override.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cx(
              "rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
              "bg-muted/20 hover:bg-muted/30",
              dragActive && "border-ring bg-accent/40"
            )}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            aria-label="Drop CSV file here or click to browse"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="font-medium">Drag & drop CSV here</div>
              <div className="text-xs text-muted-foreground">or click to browse · .csv only</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="rounded-xl"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) onImportCSV(f);
              }}
            />
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

      {/* Removed: Connect CRM container as requested */}

      <Card className="rounded-2xl lg:col-span-4 xl:col-span-6 lg:col-start-1 xl:col-start-1">
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
  leads,
  onSetLinkedIn,
  onBulkMarkEnriched,
}: {
  leads: Lead[];
  onSetLinkedIn: (leadId: string, url: string) => void;
  onBulkMarkEnriched: () => void;
}) {
  const googleQuery = (l: Lead) => {
    let domain = "";
    try {
      if (l.website) {
        domain = new URL(l.website).hostname.replace(/^www\./, "");
      }
    } catch {}
    const q = `site:linkedin.com/in "${l.firstName} ${l.lastName}" ${l.company}${domain ? ` ${domain}` : ""}`;
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  };
  const linkedinPeopleQuery = (l: Lead) =>
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
      `${l.firstName} ${l.lastName} ${l.company}`
    )}`;
  const [showLinkedInCard, setShowLinkedInCard] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showLinkedInCard && (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>LinkedIn Enrichment</CardTitle>
              <CardDescription>
                Use the uploaded CSV fields (first name, last name, company name, company URL) to find and attach each lead's LinkedIn profile.
              </CardDescription>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowLinkedInCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="space-y-4 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Search</TableHead>
                <TableHead>LinkedIn URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {l.firstName[0]}
                          {l.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {l.firstName} {l.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{l.title}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {l.website ? (
                      <a
                        href={l.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {l.website}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => window.open(googleQuery(l), "_blank")}
                      >
                        <Search className="mr-2 h-4 w-4" /> Google
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => window.open(linkedinPeopleQuery(l), "_blank")}
                      >
                        <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://www.linkedin.com/in/..."
                        defaultValue={l.linkedin || ""}
                        onBlur={(e) => onSetLinkedIn(l.id, e.currentTarget.value)}
                        className="rounded-xl w-[320px]"
                      />
                      <Badge variant="outline" className="rounded-xl capitalize">
                        {l.status}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
          <CardFooter className="justify-between">
          <div className="text-xs text-muted-foreground">
            Tip: Paste the exact profile URL (starts with https://www.linkedin.com/in/...). Leads with URLs can be bulk-marked as enriched.
          </div>
          <Button className="rounded-xl" onClick={onBulkMarkEnriched}>
            <BadgeCheck className="mr-2 h-4 w-4" /> Mark all with URLs as Enriched
          </Button>
          </CardFooter>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>How matching works</CardTitle>
          <CardDescription>Human-in-the-loop enrichment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            We generate search links using the uploaded CSV fields: first name, last name, company name, and company URL. Use these to find the correct LinkedIn profile and paste the URL to attach it to the lead.
          </p>
          <p>
            This demo does not call LinkedIn APIs. In production, integrate a compliant people search provider or your internal enrichment service.
          </p>
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
  lead,
}: {
  template: string;
  setTemplate: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  preview: string;
  onGenerate: () => void;
  lead: Lead | null;
}) {
  const tokens = ["firstName", "lastName", "company", "title", "website"];
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  // Inputs for the MambaOnline AI flow
  const [companyName, setCompanyName] = useState("ClarinsMen");
  const [customPrompt, setCustomPrompt] = useState("");
  const [linkedinDescription, setLinkedinDescription] = useState("");
  const [blogPosts, setBlogPosts] = useState("");
  const [showTemplateCard, setShowTemplateCard] = useState(true);

  const handleAIGenerate = async () => {
    setAiError(null);
    setAiText("");
    setAiLoading(true);
    // Compose "three information" content per the provided instructions
    const prompt = `Receiver information:\nCompany Name: ${companyName}\nKnown lead context: ${lead?.firstName ?? ""} ${lead?.lastName ?? ""} at ${lead?.company ?? ""}\n\nFirstly (prompt):\n${customPrompt}\n\nSecondly (LinkedIn description):\n${linkedinDescription}\n\nThirdly (blog posts):\n${blogPosts}`;
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, system: SYSTEM_PROMPT }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value || new Uint8Array(), { stream: true });
        if (chunkValue) setAiText((prev) => prev + chunkValue);
      }
    } catch (e) {
      setAiError("Failed to generate. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showTemplateCard && (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Prompt Template</CardTitle>
              <CardDescription>Use tokens like {`{{firstName}}`}, {`{{company}}`} etc.</CardDescription>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowTemplateCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="space-y-4 overflow-auto">
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
      )}

      <section className="lg:col-span-3 xl:col-span-4 space-y-3">
        <div>
          <div className="text-base font-semibold">Live Preview</div>
          <div className="text-sm text-muted-foreground">AI stream or token-filled preview</div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-xl" placeholder="ClarinsMen" />
          </div>
          <div className="grid gap-2">
            <Label>Prompt</Label>
            <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="min-h-24 rounded-2xl" placeholder="High-level goal, angle, or notes" />
          </div>
          <div className="grid gap-2">
            <Label>LinkedIn Description</Label>
            <Textarea value={linkedinDescription} onChange={(e) => setLinkedinDescription(e.target.value)} className="min-h-24 rounded-2xl" placeholder="Paste the brand/recipient description from LinkedIn" />
          </div>
          <div className="grid gap-2">
            <Label>Blog Posts</Label>
            <Textarea value={blogPosts} onChange={(e) => setBlogPosts(e.target.value)} className="min-h-24 rounded-2xl" placeholder="Paste 1–3 relevant blog post excerpts" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAIGenerate} disabled={aiLoading} className="rounded-xl">
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" /> Generate with AI
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onGenerate} disabled={aiLoading} className="rounded-xl">
              <Play className="mr-2 h-4 w-4" /> Token fill (local)
            </Button>
          </div>
          {aiError && (
            <div className="text-sm text-destructive">{aiError}</div>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap rounded-2xl border p-3 bg-muted/30">{aiText || preview || "(Preview will appear here)"}</pre>
          </div>
        </div>
      </section>
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
  const [showBatchCard, setShowBatchCard] = useState(true);
  const [showComplianceCard, setShowComplianceCard] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showBatchCard && (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Batch Sending</CardTitle>
            <CardDescription>Send approved emails in small batches to protect sender reputation.</CardDescription>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowBatchCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="overflow-auto">
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
      )}

      {showComplianceCard && (
        <Card className="rounded-2xl flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Compliance</CardTitle>
            <CardDescription>Deliverability & opt-out</CardDescription>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowComplianceCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="overflow-auto space-y-3">
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
      )}
    </div>
  );
}

function AnalyticsScreen() {
  const [showPerformanceCard, setShowPerformanceCard] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showPerformanceCard && (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Daily sending vs opens & replies</CardDescription>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowPerformanceCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto">
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
      )}

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
  const [showSmtpCard, setShowSmtpCard] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showSmtpCard && (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>SMTP & Provider</CardTitle>
              <CardDescription>Credentials are stored securely.</CardDescription>
            </div>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={() => setShowSmtpCard(false)}>Delete</Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto">
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
      )}

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
  // LinkedIn enrichment flow replaces generic enrichment toggles
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
    try {
      // 1) Parse CSV on the client
      const parsed = await new Promise<Papa.ParseResult<Record<string, any>>>((resolve, reject) => {
        Papa.parse<Record<string, any>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => String(h || "").trim(),
          complete: (res: Papa.ParseResult<Record<string, any>>) => resolve(res),
          error: (err: any) => reject(err),
        });
      });

      const rows = (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
      const columns = (parsed.meta.fields || []).filter(Boolean) as string[];

      if (!rows.length || !columns.length) {
        console.warn("CSV appears empty or has no headers");
        return;
      }

      // 2) Ask the backend LLM to map headers and provide sample normalization
      const resp = await fetch("/api/map-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns, rows: rows.slice(0, 25) }),
      });

      let headerMapping: Record<string, string> | null = null;
      let rules: { splitFullName?: { column: string; firstNameFirst?: boolean } } | undefined = undefined;

      if (resp.ok) {
        const data = await resp.json();
        headerMapping = data?.headerMapping ?? null;
        rules = data?.rules;
      }

      if (!headerMapping) {
        console.warn("Falling back to heuristic header mapping");
        headerMapping = guessHeaderMapping(columns);
      }

      // 3) Apply the mapping to all rows locally
      const mapped: Lead[] = rows
        .map((r: Record<string, any>, idx: number) => {
          const normalized = applyMapping(r, headerMapping!, rules);
          const hasAny = Boolean(
            normalized.email ||
            normalized.linkedin ||
            normalized.company ||
            normalized.firstName ||
            normalized.lastName
          );
          if (!hasAny) return null;
          return {
            id: `${Date.now()}-${idx}`,
            firstName: normalized.firstName || "",
            lastName: normalized.lastName || "",
            company: normalized.company || "",
            email: (normalized.email || "").toLowerCase(),
            title: normalized.title || "",
            website: normalized.website || undefined,
            linkedin: normalized.linkedin || undefined,
            status: "new" as const,
          };
        })
        .filter(Boolean) as Lead[];

      if (!mapped.length) {
        console.warn("No valid leads produced from CSV");
        return;
      }

      setLeads((prev) => [...prev, ...mapped]);
      setSection("enrich");
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const onConnectCRM = (provider: string) => {
    console.log("Connect to:", provider);
  };

  const setLinkedInForLead = (leadId: string, url: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, linkedin: url || undefined, status: url ? "enriched" : l.status }
          : l
      )
    );
  };

  const bulkMarkEnriched = () => {
    setLeads((prev) => prev.map((l) => (l.linkedin ? { ...l, status: "enriched" } : l)));
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
          <main className="mx-auto max-w-[1440px] xl:max-w-[1600px] px-4 py-6 space-y-4">
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
              <EnrichScreen leads={leads} onSetLinkedIn={setLinkedInForLead} onBulkMarkEnriched={bulkMarkEnriched} />
            )}

            {section === "generate" && (
              <GenerateScreen
                template={template}
                setTemplate={setTemplate}
                subject={subject}
                setSubject={setSubject}
                preview={preview}
                onGenerate={runGeneration}
                lead={leads[0] ?? null}
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
                <div className="flex items-center gap-2"><Database className="h-4 w-4" /> LinkedIn enrichment: search & attach profile URLs</div>
                <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Prompt-based generation with tokens</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Review, edit, approve per-lead emails</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Batch sending, schedule, compliance</div>
                <div className="flex items-center gap-2"><LineChart className="h-4 w-4" /> KPIs & charts for outcomes</div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
