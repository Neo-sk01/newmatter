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
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { PromptPicker } from "@/components/prompts/PromptPicker";
import type { Prompt } from "@/types/prompting";
import { listPromptTree } from "@/lib/promptTemplates";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
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
  Trash2,
  FolderPlus,
  Folder,
  X,
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

interface LeadList {
  id: string;
  name: string;
  leads: Lead[];
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

// Chart data is now fetched dynamically from SendGrid API

// System prompt for AI email generation (Cold Outreach AI Agent)
const SYSTEM_PROMPT = `Cold Outreach AI Agent Prompt

You are an email cold outreach expert. Your job is to draft short prospecting emails that sound like they were written by a real human.

Style Guidelines
- Write naturally and conversationally, not like a polished ad.
- Vary sentence length. Mix long and short thoughts.
- Break flow occasionally, as if thinking out loud.
- Add small imperfections: hesitations, cautious qualifiers, mild contradictions.
- Use light personalization (mention a reaction, small opinion, or impression).
- Avoid perfect balance. Leave some ideas slightly unfinished.
- No slang or regionalisms. Keep it neutral, simple, and professional.
- Do not use em dashes (–). Use connecting words like "because", "perhaps", "maybe", or "therefore".
- Keep it 120–200 words.

Email Structure (use IP = XYZ Formula)

Subject Line
- Create 1–2 concise, curiosity-driven or benefit-focused options.

Greeting
- Use the recipient’s name if available.

Introduction & Value Proposition (X)
- Introduce yourself/organization.
- State a value proposition relevant to the recipient.
- Add a benefit statement (what’s in it for them).
- Include a hook that connects emotionally or logically to their context (e.g., recent campaign, achievement, or challenge).

Reason for Email & Cross-Reference (Y)
- State the reason for reaching out.
- Show evidence of research (reference their company’s recent news, projects, or values).
- Cross-reference how your solution/audience aligns with their goals or gaps.

Call to Action (Z)
- Suggest one specific, low-friction action (e.g., "a short call next week").
- Use natural action verbs like explore, review, discuss, find out, go through.
- Keep it polite and time-bound.

Closing
- Thank them for their time.
- Sign off with name and contact details.

Inputs You Will Receive
- Recipient name
- Company name
- Recipient role/title
- A research snippet (recent campaign, product launch, recognition, or initiative)

Output You Must Generate
- 1–2 subject line options
- Full cold outreach email (120–200 words), following the XYZ structure and style rules

Important Output Format (for parsing)
- Return exactly in this format:
  Subject: <one best subject>

  <email body, 120–200 words>`;

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

function Sidebar({
  current,
  onChange,
  lists,
  currentListId,
  onSelectList,
  onNewList,
  onRemoveList,
  onRenameList,
}: {
  current: string;
  onChange: (v: string) => void;
  lists: LeadList[];
  currentListId: string;
  onSelectList: (id: string) => void;
  onNewList: () => void;
  onRemoveList: (id: string) => void;
  onRenameList: (id: string, name: string) => void;
}) {
  const items: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "import", label: "Import", icon: <CloudUpload className="h-6 w-6" /> },
    { key: "enrich", label: "Enrich", icon: <Database className="h-6 w-6" /> },
    { key: "generate", label: "Generate", icon: <BrainCircuit className="h-6 w-6" /> },
    { key: "prompts", label: "Prompts", icon: <AlignLeft className="h-6 w-6" /> },
    { key: "preview", label: "Preview", icon: <Search className="h-6 w-6" /> },
    { key: "review", label: "Review", icon: <FileText className="h-6 w-6" /> },
    { key: "send", label: "Send", icon: <Mail className="h-6 w-6" /> },
    { key: "analytics", label: "Analytics", icon: <LineChart className="h-6 w-6" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-6 w-6" /> },
  ];

  return (
    <div className="h-full w-[360px] border-r bg-muted/40 backdrop-blur p-[18px] hidden md:block">
      <div className="flex items-center gap-2 px-3 pb-6">
        <img 
          src="/salesMattertm noBG, SVG.svg" 
          alt="Sales Matter Logo" 
          className="h-12 w-auto"
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
      <div className="px-3 flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lead Lists</div>
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={onNewList}>
          <FolderPlus className="mr-2 h-4 w-4" /> New
        </Button>
      </div>
      <div className="space-y-2">
        {lists.map((list) => (
          <SidebarListRow
            key={list.id}
            list={list}
            active={currentListId === list.id}
            onSelect={() => onSelectList(list.id)}
            onRemove={() => onRemoveList(list.id)}
            onRename={(name) => onRenameList(list.id, name)}
          />
        ))}
        {lists.length === 0 && (
          <div className="px-3 text-xs text-muted-foreground">No lists. Create one to get started.</div>
        )}
      </div>
      <Separator className="my-6" />
      <div className="px-3 text-xs text-muted-foreground">
        v1.0 · Shadcn UI · Tailwind
      </div>
    </div>
  );
}

function SidebarListRow({
  list,
  active,
  onSelect,
  onRemove,
  onRename,
}: {
  list: LeadList;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);

  const commit = () => {
    const next = name.trim();
    if (next && next !== list.name) onRename(next);
    setEditing(false);
  };

  const cancel = () => {
    setName(list.name);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-1">
      {!editing ? (
        <>
          <Button
            variant={active ? "secondary" : "ghost"}
            size="lg"
            className={cx(
              "flex-1 justify-start gap-3 rounded-xl text-base min-w-0",
              active && "shadow"
            )}
            onClick={onSelect}
          >
            <Folder className="h-6 w-6 flex-shrink-0" />
            <span className="truncate">{list.name}</span>
          </Button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8"
              aria-label="Rename list"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8"
              aria-label="Delete list"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            className="rounded-xl flex-1"
            autoFocus
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-xl h-8 w-8"
              aria-label="Save name"
              onClick={commit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-8 w-8"
              aria-label="Cancel rename"
              onClick={cancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Topbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-muted/50 backdrop-blur px-4 py-2">
      <div className="flex items-center gap-3">
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
        <WorkspaceSwitcher />
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-lime-700 bg-lime-600 p-2 text-white">
      {steps.map((s, i) => {
        const selected = i === step;
        return (
          <Button
            key={s.key}
            variant="ghost"
            size="sm"
            className={cx(
              "rounded-xl",
              selected
                ? "bg-black text-white hover:bg-black hover:text-white"
                : "text-white/90 hover:text-white hover:bg-black/30"
            )}
            onClick={() => onStep(i)}
          >
            <span className="mr-2">{s.icon}</span>
            <span className="hidden sm:inline">{i + 1}. {s.key}</span>
            <span className="sm:hidden">{i + 1}</span>
          </Button>
        );
      })}
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
  onRemoveLead,
  onClearLeads,
}: {
  leads: Lead[];
  onImportCSV: (file: File) => void;
  onConnectCRM: (provider: string) => void;
  onRemoveLead: (id: string) => void;
  onClearLeads: () => void;
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
          {/* Detected Columns section removed as requested */}
        </CardContent>
      </Card>

      {/* Removed: Connect CRM container as requested */}

      <Card className="rounded-2xl lg:col-span-4 xl:col-span-6 lg:col-start-1 xl:col-start-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lead Preview</CardTitle>
            <CardDescription>Recently imported leads ({leads.length}).</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={onClearLeads}
              disabled={leads.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear list
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-muted/50 z-10">
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No leads imported yet.
                    </TableCell>
                  </TableRow>
                )}
                {leads.map((l) => (
                  <TableRow key={l.id} className="odd:bg-muted/30">
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
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => onRemoveLead(l.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </Button>
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
          <CardHeader className="flex flex-row items-center justify-between">
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
  leads,
  emails,
  subject,
  template,
  selectedLeadId,
  setSelectedLeadId,
  onEdit,
  onMarkGenerated,
  promptOverrides,
  onUpdatePrompt,
  attachedPrompt,
  onAttachPrompt,
}: {
  leads: Lead[];
  emails: Record<string, GeneratedEmail>;
  subject: string;
  template: string;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  onEdit: (leadId: string, value: GeneratedEmail) => void;
  onMarkGenerated: () => void;
  promptOverrides: Record<string, string>;
  onUpdatePrompt: (leadId: string, value: string) => void;
  attachedPrompt: null | { id: string; name: string; version: number; content: string };
  onAttachPrompt: (p: { id: string; name: string; version: number; content: string }) => void;
}) {
  const selected = useMemo(() => {
    if (!leads.length) return null;
    const id = selectedLeadId && leads.some(l => l.id === selectedLeadId) ? selectedLeadId : leads[0].id;
    return leads.find(l => l.id === id) ?? null;
  }, [leads, selectedLeadId]);

  const previewFor = (l: Lead | null) => {
    if (!l) return { subject: '', body: '' };
    const ge = emails[l.id];
    return {
      subject: ge?.subject ?? tokenFill(subject, l),
      body: ge?.body ?? tokenFill(template, l),
    };
  };

  const preview = previewFor(selected);

  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const buildPromptForLead = (l: Lead) => {
    const fullName = `${l.firstName} ${l.lastName}`.trim()
    const research = l.linkedin ? `LinkedIn profile: ${l.linkedin}` : ''
    return `Inputs You Will Receive\nRecipient name: ${fullName}\nCompany name: ${l.company || ''}\nRecipient role/title: ${l.title || ''}\nResearch snippet: ${research}\n\nTask\nWrite a cold outreach email using the system guidance.\n\nImportant: Return exactly in this format for parsing:\nSubject: <one best subject>\n\n<email body, 120–200 words>`;
  };

  const parseSubjectBody = (txt: string): { subject: string; body: string } => {
    let subject = "";
    let body = txt?.trim() ?? "";
    const match = body.match(/^[Ss]ubject\s*:\s*(.*)$/m);
    if (match) {
      subject = match[1].trim();
      const after = body.split(match[0])[1] ?? "";
      const parts = after.replace(/^\n+/, "").split(/\n\n/);
      body = (parts.length > 1 ? parts.slice(1).join("\n\n") : after).trim();
    } else {
      const lines = body.split(/\n+/);
      subject = (lines[0] || "").slice(0, 120).trim();
      body = lines.slice(1).join("\n").trim();
    }
    return { subject, body };
  };

  const generateAllWithAI = async () => {
    if (!leads.length) return;
    setBulkGenerating(true);
    setBulkProgress({ done: 0, total: leads.length });
    try {
      for (let i = 0; i < leads.length; i++) {
        const l = leads[i];
        const prompt = promptOverrides[l.id] ?? buildPromptForLead(l);
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
          let buf = "";
          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunk = decoder.decode(value || new Uint8Array(), { stream: true });
            if (chunk) buf += chunk;
          }
          const parsed = parseSubjectBody(buf);
          onEdit(l.id, { leadId: l.id, subject: parsed.subject, body: parsed.body });
        } catch (e) {
          onEdit(l.id, { leadId: l.id, subject: tokenFill(subject, l), body: tokenFill(template, l) });
        }
        setBulkProgress({ done: i + 1, total: leads.length });
      }
      onMarkGenerated();
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Output of your generated prompt</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {attachedPrompt && (
                <Badge variant="secondary" className="rounded-xl">
                  Prompt: {attachedPrompt.name} (v{attachedPrompt.version})
                  <PromptPicker
                    treeLoader={loadPromptTree}
                    onUsePrompt={async (p) => {
                      onAttachPrompt({ id: p.id, name: p.name, version: p.version, content: p.content })
                    }}
                    onCloneToCompany={async () => {}}
                    companyFolderId={null}
                  >
                    <Button variant="ghost" size="sm" className="ml-2 px-2">Change</Button>
                  </PromptPicker>
                </Badge>
              )}
              {bulkGenerating && (
                <div className="text-xs text-muted-foreground">Generating {bulkProgress.done}/{bulkProgress.total}…</div>
              )}
            <Button onClick={generateAllWithAI} disabled={bulkGenerating} className="rounded-xl">
              <BrainCircuit className="mr-2 h-4 w-4" /> Generate
            </Button>
            <PromptPicker
              treeLoader={loadPromptTree}
              onUsePrompt={async (p) => {
                // Attach snapshot locally; server should persist via campaign_prompts
                onAttachPrompt({ id: p.id, name: p.name, version: p.version, content: p.content })
              }}
              onCloneToCompany={async (_p, _folderId) => {
                // Integrate with Supabase server util in a real app
              }}
              companyFolderId={null}
            >
              <Button variant="outline" className="rounded-xl">Choose Prompt</Button>
            </PromptPicker>
            </div>
          </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <div className="text-sm text-muted-foreground">For: {selected.firstName} {selected.lastName} · {selected.company}</div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  value={(selected && (emails[selected.id]?.subject ?? tokenFill(subject, selected))) || ''}
                  onChange={(e) => {
                    if (!selected) return;
                    const base = emails[selected.id] ?? { leadId: selected.id, subject: tokenFill(subject, selected), body: tokenFill(template, selected) };
                    onEdit(selected.id, { ...base, subject: e.target.value });
                  }}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea
                  value={(selected && (emails[selected.id]?.body ?? tokenFill(template, selected))) || ''}
                  onChange={(e) => {
                    if (!selected) return;
                    const base = emails[selected.id] ?? { leadId: selected.id, subject: tokenFill(subject, selected), body: tokenFill(template, selected) };
                    onEdit(selected.id, { ...base, body: e.target.value });
                  }}
                  className="min-h-[280px] rounded-2xl"
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label>Prompt Preview</Label>
                <Textarea
                  value={(selected && (promptOverrides[selected.id] ?? buildPromptForLead(selected))) || ''}
                  onChange={(e) => {
                    if (!selected) return;
                    onUpdatePrompt(selected.id, e.target.value);
                  }}
                  className="h-64 rounded-2xl text-xs overflow-auto resize-none"
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a lead to see the preview.</div>
          )}
        </CardContent>
      </Card>

      <LeadListPanel
        leads={leads}
        selectedLeadId={selectedLeadId}
        onSelect={(id) => setSelectedLeadId(id)}
        className="lg:col-span-3"
      />
    </div>
  );
}

function LeadListPanel({
  leads,
  selectedLeadId,
  onSelect,
  className,
}: {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.firstName, l.lastName, l.company, l.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [query, leads]);

  const statusClass = (s: Lead["status"]) =>
    s === "approved"
      ? "bg-green-100 text-green-700 border-green-200"
      : s === "generated"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : s === "enriched"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : s === "sent"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : s === "rejected"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <Card className={cx("rounded-2xl overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leads</CardTitle>
            <CardDescription>{leads.length} total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email"
            className="rounded-xl pl-9"
          />
        </div>
        <ScrollArea className="h-[calc(100vh-320px)] pr-2">
          <div className="grid gap-2">
            {filtered.map((l) => {
              const selected = selectedLeadId === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelect(l.id)}
                  className={cx(
                    "w-full text-left rounded-xl border p-3 hover:bg-muted/50 transition-colors",
                    selected && "bg-muted ring-1 ring-ring/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback>
                        {l.firstName?.[0]}
                        {l.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium truncate">
                          {l.firstName} {l.lastName}
                        </div>
                        <Badge variant="outline" className={cx("rounded-xl text-[10px]", statusClass(l.status))}>
                          {l.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.company}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {l.email}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No leads match “{query}”.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function PreviewScreenMinimal({
  leads,
  emails,
  subject,
  template,
  selectedLeadId,
  setSelectedLeadId,
}: {
  leads: Lead[];
  emails: Record<string, GeneratedEmail>;
  subject: string;
  template: string;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
}) {
  const selected = useMemo(() => {
    if (!leads.length) return null;
    const id = selectedLeadId && leads.some(l => l.id === selectedLeadId) ? selectedLeadId : leads[0].id;
    return leads.find(l => l.id === id) ?? null;
  }, [leads, selectedLeadId]);

  const previewFor = (l: Lead | null) => {
    if (!l) return { subject: '', body: '' };
    const ge = emails[l.id];
    return {
      subject: ge?.subject ?? tokenFill(subject, l),
      body: ge?.body ?? tokenFill(template, l),
    };
  };

  const preview = previewFor(selected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <LeadListPanel
        leads={leads}
        selectedLeadId={selectedLeadId}
        onSelect={(id) => setSelectedLeadId(id)}
        className="lg:col-span-1"
      />

      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Output of your generated prompt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected ? (
            <>
              <div className="text-sm text-muted-foreground">For: {selected.firstName} {selected.lastName} · {selected.company}</div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <div className="rounded-xl border px-3 py-2 bg-muted/30 text-sm break-words">{preview.subject || '—'}</div>
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <ScrollArea className="h-[360px] rounded-2xl border">
                  <pre className="whitespace-pre-wrap break-words p-3 bg-muted/30 text-sm">{preview.body || '(No content)'}</pre>
                </ScrollArea>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a lead to see the preview.</div>
          )}
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
                            <div className="rounded-2xl border p-3 bg-muted/30 whitespace-pre-wrap break-words">
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
          <CardHeader className="flex flex-row items-center justify-between">
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
          <CardHeader className="flex flex-row items-center justify-between">
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
  const [analyticsData, setAnalyticsData] = useState<{
    chartData: Array<{ day: string; sent: number; opened: number; replied: number }>;
    kpis: { openRate: string; replyRate: string; bounceRate: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics?days=7');
        const data = await response.json();
        
        if (response.ok) {
          setAnalyticsData(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Use real data if available, otherwise fallback to mock data
  const displayData = analyticsData || {
    chartData: [
      { day: "Mon", sent: 40, opened: 18, replied: 3 },
      { day: "Tue", sent: 80, opened: 42, replied: 9 },
      { day: "Wed", sent: 60, opened: 33, replied: 6 },
      { day: "Thu", sent: 120, opened: 76, replied: 12 },
      { day: "Fri", sent: 100, opened: 51, replied: 10 },
    ],
    kpis: {
      openRate: "42%",
      replyRate: "9%",
      bounceRate: "1.2%"
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl lg:col-span-3">
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
          <CardDescription>Performance metrics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Analytics dashboard coming soon
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Daily sending vs opens & replies
            {error && (
              <span className="text-amber-600 text-sm ml-2">
                (Using mock data - {error})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.chartData} margin={{ left: 8, right: 8 }}>
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
          )}
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
              <div className="text-xl font-semibold">
                {loading ? "..." : displayData.kpis.openRate}
              </div>
            </div>
            <MailCheck className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Reply rate</div>
              <div className="text-xl font-semibold">
                {loading ? "..." : displayData.kpis.replyRate}
              </div>
            </div>
            <AlignLeft className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <div className="text-xs text-muted-foreground">Bounce rate</div>
              <div className="text-xl font-semibold">
                {loading ? "..." : displayData.kpis.bounceRate}
              </div>
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
            <div key={i} className="flex items-center justify-between rounded-xl border p-2 bg-muted/20">
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
  // Lead lists (folders) and active list selection
  const defaultListId = "default";
  const [leadLists, setLeadLists] = useState<LeadList[]>([
    { id: defaultListId, name: "Sample Leads", leads: initialLeads },
  ]);
  const [currentListId, setCurrentListId] = useState<string>(defaultListId);
  // Local working set mirrors the active list
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
  const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attachedPrompt, setAttachedPrompt] = useState<null | { id: string; name: string; version: number; content: string }>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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

      // Create a new lead list (folder) for each uploaded file
      const base = (file?.name || "Imported").replace(/\.[^/.]+$/, "");
      const newId = `${Date.now()}`;
      const newList: LeadList = { id: newId, name: base, leads: mapped };
      setLeadLists((prev) => [...prev, newList]);
      setCurrentListId(newId);
      setLeads(mapped);
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

  // Keep the current list in sync with local leads state
  useEffect(() => {
    setLeadLists((prev) => {
      let changed = false;
      const next = prev.map((lst) => {
        if (lst.id !== currentListId) return lst;
        if (lst.leads === leads) return lst;
        changed = true;
        return { ...lst, leads };
      });
      return changed ? next : prev;
    });
  }, [leads, currentListId]);

  // When switching lists, load its leads into local state
  // Only react to list ID changes to avoid sync loops with the writer effect above.
  useEffect(() => {
    const selected = leadLists.find((l) => l.id === currentListId);
    if (selected) {
      setLeads(selected.leads);
    }
  }, [currentListId]);

  // Keep a sensible selection for the minimal preview screen
  useEffect(() => {
    if (!leads.length) {
      setSelectedLeadId(null);
    } else if (!selectedLeadId || !leads.some(l => l.id === selectedLeadId)) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  // Sidebar list actions
  const newEmptyList = () => {
    const newId = `${Date.now()}`;
    const list: LeadList = { id: newId, name: `List ${leadLists.length + 1}`, leads: [] };
    setLeadLists((prev) => [...prev, list]);
    setCurrentListId(newId);
    setLeads([]);
  };
  const selectList = (id: string) => setCurrentListId(id);
  const removeListById = (id: string) => {
    setLeadLists((prev) => {
      const filtered = prev.filter((l) => l.id !== id);
      if (id === currentListId) {
        const nextId = filtered[0]?.id || "";
        setCurrentListId(nextId);
        const nextLeads = filtered.find((l) => l.id === nextId)?.leads || [];
        setLeads(nextLeads);
      }
      return filtered;
    });
  };

  // Lead removal helpers for ImportScreen
  const removeLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    // Also remove any generated email entry tied to that lead
    setEmails((prev) => {
      const { [leadId]: _, ...rest } = prev;
      return rest;
    });
  };
  const clearLeads = () => {
    setLeads([]);
    setEmails({});
  };

  const renameList = (id: string, name: string) => {
    setLeadLists((prev) => prev.map((list) => (list.id === id ? { ...list, name } : list)));
  };

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
    const map: Record<string, number> = { import: 0, enrich: 1, generate: 2, preview: 2, prompts: 2, review: 3, send: 4, analytics: 5, settings: 5 };
    setStep(map[section] ?? 0);
  }, [section]);

return (
  <WorkspaceProvider>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="flex">
        <Sidebar
          current={section}
          onChange={setSection}
          lists={leadLists}
          currentListId={currentListId}
          onSelectList={selectList}
          onNewList={newEmptyList}
          onRemoveList={removeListById}
          onRenameList={renameList}
        />
        <div className="flex-1">
          <Topbar />
          <main className="p-4 space-y-4">
            {section !== 'preview' && <Stepper step={step} onStep={setStep} />}

            {section === "import" && (
              <ImportScreen
                leads={leads}
                onImportCSV={onImportCSV}
                onConnectCRM={onConnectCRM}
                onRemoveLead={removeLead}
                onClearLeads={clearLeads}
              />
            )}

            {section === "enrich" && (
              <EnrichScreen leads={leads} onSetLinkedIn={setLinkedInForLead} onBulkMarkEnriched={bulkMarkEnriched} />
            )}

            {section === "generate" && (
              <GenerateScreen
                leads={leads}
                emails={emails}
                subject={subject}
                template={template}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={setSelectedLeadId}
                onEdit={handleEdit}
                onMarkGenerated={() => setLeads((prev) => prev.map((l) => ({ ...l, status: "generated" })))}
                promptOverrides={promptOverrides}
                onUpdatePrompt={(id, value) => setPromptOverrides((prev) => ({ ...prev, [id]: value }))}
                attachedPrompt={attachedPrompt}
                onAttachPrompt={(p) => {
                  setAttachedPrompt(p);
                  setTemplate(p.content);
                }}
              />
            )}

            {section === 'preview' && (
              <PreviewScreenMinimal
                leads={leads}
                emails={emails}
                subject={subject}
                template={template}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={setSelectedLeadId}
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

            {false && (
              <>
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
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  </WorkspaceProvider>
);
}
  // Load prompt tree via Supabase using RLS policies
  const loadPromptTree = async () => {
    const supabase = createSupabaseClient();
    try {
      return await listPromptTree(supabase);
    } catch (e) {
      console.warn('Failed to load prompts', e);
      return { folders: [], prompts: [] };
    }
  };
