"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { WorkspaceProvider } from "@/lib/context/workspace-context";
import { Logo } from "@/components/logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import FooterSection from "@/components/footer-section";
import { HydrationSafeThemeToggle } from "@/components/HydrationSafeThemeToggle";
import { format } from "date-fns";
import {
  AlignLeft,
  BadgeCheck,
  BrainCircuit,
  Copy,
  CalendarDays,
  Sparkles,
  Check,
  ChevronLeft,
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
  Play,
  Search,
  Settings,
  StopCircle,
  Upload,
  Linkedin,
  Trash2,
  FolderPlus,
  Folder,
  X,
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

interface LeadList {
  id: string;
  name: string;
  leads: Lead[];
}

interface PromptConfig {
  id: string;
  name: string;
  content: string;
}

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

const DEFAULT_LEAD_LIST: LeadList = {
  id: 'default',
  name: 'Sample Leads',
  leads: initialLeads,
};

const cloneDefaultLeadList = (): LeadList => ({
  id: DEFAULT_LEAD_LIST.id,
  name: DEFAULT_LEAD_LIST.name,
  leads: DEFAULT_LEAD_LIST.leads.map((lead) => ({ ...lead })),
});

// Default prompt library seeded with the provided few-shot instructions
const DEFAULT_PROMPT_CONTENT = `### **Few-Shot Prompt for AI Agent**

You are an expert B2B outreach copywriter.
Your task is to write **personalized cold outreach emails** that sound natural, human, and conversational, not robotic or overly polished.

**Writing style instructions:**

* Vary sentence length and rhythm.
* Mix short and long sentences, let thoughts flow like real human writing.
* Small hesitations or cautious phrases are welcome ("perhaps," "I think," "it feels like").
* Do not balance every argument too neatly. Let some thoughts feel unfinished or slightly tangential.
* Keep tone professional but approachable, no slang.
* Break into paragraphs where it feels natural.
* Do **not** use em-dashes (-). Use commas or pauses instead.

**Email structure:**

1. **Subject line**: Reference the brand and South Africa's R250B LGBTIQ+ market.
2. **Opening line**: Personalized recognition of their role, brand, or achievement.
3. **Authority line**: Introduce MambaOnline as South Africa's leading LGBTIQ+ platform (40,000 monthly visitors, 23 years trust). Include stats: R250B annual purchasing power, 60% hold degrees, 44% in management, 76-83% prefer inclusive brands.
4. **Alignment**: Connect their brand's priorities to opportunities with this audience. Suggest a few ideas (Pride campaigns, targeted ads, digital storytelling, editorials).
5. **CTA**: Invite them to a quick chat next week.
6. **Footer**: Always sign off as Nompilo Gwala with this exact block:

\`\`\`
Best regards,  
Nompilo Gwala  
Head of Commercial | MambaOnline  
P.O. Box 413952, Craighall, 2024, South Africa  
Tel: 072 304 8280 / 078 421 6022  
Email: nompilo@mambaonline.com  
"South Africa's #1 LGBTIQ+ platform trusted by brands and community since 2001."  
\`\`\`

---

### **Example 1 - Kerry Largier (Yuppiechef)**

**Subject:** Partnering with Yuppiechef to Engage South Africa's R250B LGBTIQ+ Market

Hi Kerry,

I have been following your move to Yuppiechef and it feels like such a natural fit. Your path from fintech at Spot Money to wellness at Faithful to Nature shows you can adapt across industries, and that is not an easy thing to do.

I am with MambaOnline, South Africa's leading LGBTIQ+ digital platform. We reach 40,000 monthly visitors and have built 23 years of community trust. The audience we serve represents R250B in annual purchasing power. Many hold degrees, 44 percent are in management, and 76 percent say they prefer brands that visibly support the community.

I think Yuppiechef could do something special here. Pride campaigns, digital collaborations, or even smaller features could land well with our audience.

Would you be open to a chat next week to explore?

Best regards,
Nompilo Gwala
Head of Commercial | MambaOnline
P.O. Box 413952, Craighall, 2024, South Africa
Tel: 072 304 8280 / 078 421 6022
Email: nompilo@mambaonline.com
"South Africa's #1 LGBTIQ+ platform trusted by brands and community since 2001."

---

### **Example 2 - Michelle Hewitt (Castle Lite)**

**Subject:** Connecting Castle Lite with South Africa's R250B LGBTIQ+ Market

Hi Michelle,

Your career path from agency life at Ogilvy and FCB to leading communications for Castle Lite shows real depth in FMCG and liquor marketing. I admire how you have managed large, complex portfolios while still keeping campaigns bold and creative.

I am with MambaOnline, South Africa's leading LGBTIQ+ digital platform. We have 40,000 monthly visitors and over 23 years of community trust. Our audience represents R250B in annual purchasing power. They are educated, many in leadership, and 83 percent prefer brands that align with inclusivity.

Castle Lite already has a reputation for being progressive, but I think there is room to push further. Pride campaigns, lifestyle collaborations, or digital advertising could strengthen that identity with our community.

Would you be open to a quick chat next week to discuss possibilities?

Best regards,
Nompilo Gwala
Head of Commercial | MambaOnline
P.O. Box 413952, Craighall, 2024, South Africa
Tel: 072 304 8280 / 078 421 6022
Email: nompilo@mambaonline.com
"South Africa's #1 LGBTIQ+ platform trusted by brands and community since 2001."
`

const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: "few-shot-nompilo",
    name: "Few-Shot | Nompilo Outreach",
    content: DEFAULT_PROMPT_CONTENT,
  },
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

const createPromptId = () => `prompt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const leadStatuses: Lead['status'][] = ['new', 'enriched', 'generated', 'approved', 'rejected', 'sent'];

const normalizeLeadStatus = (status: unknown): Lead['status'] =>
  leadStatuses.includes(status as Lead['status']) ? (status as Lead['status']) : 'new';

type ApiLeadInput = {
  id?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  title?: string;
  website?: string;
  linkedin?: string;
  status?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

const mapApiLeadToLocal = (lead: ApiLeadInput): Lead => ({
  id: lead.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  firstName: lead.firstName ?? lead.first_name ?? '',
  lastName: lead.lastName ?? lead.last_name ?? '',
  company: lead.company ?? '',
  email: lead.email ?? '',
  title: lead.title ?? '',
  website: lead.website ?? undefined,
  linkedin: lead.linkedin ?? undefined,
  status: normalizeLeadStatus(lead.status),
});

const mapLocalLeadToApi = (lead: Lead) => ({
  id: lead.id,
  firstName: lead.firstName,
  lastName: lead.lastName,
  company: lead.company,
  email: lead.email,
  title: lead.title,
  website: lead.website,
  linkedin: lead.linkedin,
  status: lead.status,
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID_PATTERN.test(value);

type PromptApiPayload = {
  id: string;
  name: string;
  versions?: Array<{ body?: string | null }>;
};

type LeadListApiPayload = {
  id: string;
  name: string;
  leads?: ApiLeadInput[];
};

// Apply LLM-provided mapping rules to a CSV row
function applyMapping(
  row: Record<string, unknown>,
  headerMapping: Record<string, string>,
  rules?: { splitFullName?: { column: string; firstNameFirst?: boolean } }
): {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  title?: string | null;
  website?: string | null;
  linkedin?: string | null;
} {
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
    const value = row[k];
    if (value == null) return "";
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return "";
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

function AppSidebar({
  current,
  onChange,
  lists,
  currentListId,
  onSelectList,
  onNewList,
  onRemoveList,
  onRenameList,
  prompts,
  activePromptId,
  activePrompt,
  onSelectPrompt,
  onCreatePrompt,
  onDuplicatePrompt,
  onDeletePrompt,
  onRenamePrompt,
  onUpdatePromptContent,
  onResetPrompt,
  loadingPrompts,
  loadingLeadLists,
}: {
  current: string;
  onChange: (v: string) => void;
  lists: LeadList[];
  currentListId: string;
  onSelectList: (id: string) => void;
  onNewList: () => void;
  onRemoveList: (id: string) => void;
  onRenameList: (id: string, name: string) => void;
  prompts: PromptConfig[];
  activePromptId: string;
  activePrompt: PromptConfig | null;
  onSelectPrompt: (id: string) => void;
  onCreatePrompt: () => void;
  onDuplicatePrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onRenamePrompt: (id: string, name: string) => void;
  onUpdatePromptContent: (id: string, content: string) => void;
  onResetPrompt: (id: string) => void;
  loadingPrompts: boolean;
  loadingLeadLists: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showActivePrompt, setShowActivePrompt] = useState(true);

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
    setCopied(false);
  }, [activePromptId]);
  const items: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "import", label: "Import", icon: <CloudUpload className="h-5 w-5" /> },
    { key: "enrich", label: "Enrich", icon: <Database className="h-5 w-5" /> },
    { key: "generate", label: "Generate", icon: <BrainCircuit className="h-5 w-5" /> },
    { key: "preview", label: "Preview", icon: <Search className="h-5 w-5" /> },
    { key: "review", label: "Review", icon: <FileText className="h-5 w-5" /> },
    { key: "send", label: "Send", icon: <Mail className="h-5 w-5" /> },
    { key: "analytics", label: "Analytics", icon: <LineChart className="h-5 w-5" /> },
    { key: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <UiSidebar collapsible="icon" className="border-r bg-muted/40 backdrop-blur text-sm">
      <SidebarHeader className="pb-4">
        <div className="flex items-center gap-2 px-2">
          <Logo className="h-12" priority />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.key}>
              <SidebarMenuButton
                type="button"
                isActive={current === it.key}
                className="text-sm"
                onClick={() => onChange(it.key)}
              >
                    {it.icon}
                    <span className="truncate">{it.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="flex-1">
              Lead Lists
              {loadingLeadLists && <span className="ml-1 text-[10px] lowercase text-muted-foreground"> syncing…</span>}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onNewList}
              disabled={loadingLeadLists}
            >
              <FolderPlus className="mr-2 h-4 w-4" /> New
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
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
              <div className="px-1 text-xs text-muted-foreground">No lists. Create one to get started.</div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="flex-1">
              Prompt Library
              {loadingPrompts && <span className="ml-1 text-[10px] lowercase text-muted-foreground"> loading…</span>}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs"
              onClick={onCreatePrompt}
              disabled={loadingPrompts}
            >
              <Sparkles className="mr-2 h-4 w-4" /> New
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            {prompts.map((prompt) => (
              <SidebarPromptRow
                key={prompt.id}
                prompt={prompt}
                active={activePromptId === prompt.id}
                onSelect={() => onSelectPrompt(prompt.id)}
                onRename={(name) => onRenamePrompt(prompt.id, name)}
                onDelete={() => onDeletePrompt(prompt.id)}
                onDuplicate={() => onDuplicatePrompt(prompt.id)}
                disableDelete={prompts.length <= 1}
              />
            ))}
            {prompts.length === 0 && (
              <div className="px-1 text-xs text-muted-foreground">No prompts yet. Add one to get started.</div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {activePrompt && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <Label htmlFor="active-prompt-editor" className="text-xs uppercase tracking-wide text-muted-foreground">
                Active prompt
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl h-7 px-2 text-xs"
                onClick={() => setShowActivePrompt((prev) => !prev)}
              >
                {showActivePrompt ? "Hide" : "Show"}
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {showActivePrompt ? (
                <ScrollArea className="max-h-[420px] pr-1">
                  <div className="space-y-2 pb-2">
                    <Textarea
                      id="active-prompt-editor"
                      value={activePrompt.content}
                      onChange={(e) => onUpdatePromptContent(activePrompt.id, e.target.value)}
                      className="h-[320px] resize-none rounded-2xl border bg-background/60 text-sm"
                      disabled={loadingPrompts}
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => onDuplicatePrompt(activePrompt.id)}
                        disabled={loadingPrompts}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => onResetPrompt(activePrompt.id)}
                        disabled={loadingPrompts}
                      >
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={async () => {
                          if (typeof navigator === "undefined" || !navigator.clipboard) {
                            console.warn("Clipboard API is unavailable in this environment");
                            return;
                          }
                          try {
                            await navigator.clipboard.writeText(activePrompt.content);
                            setCopied(true);
                            if (copyTimer.current) {
                              clearTimeout(copyTimer.current);
                            }
                            copyTimer.current = setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error("Failed to copy prompt", err);
                          }
                        }}
                        disabled={loadingPrompts}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy
                      </Button>
                    </div>
                    {copied && <div className="text-[11px] text-right text-muted-foreground">Prompt copied to clipboard</div>}
                  </div>
                </ScrollArea>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  onClick={() => setShowActivePrompt(true)}
                >
                  Expand prompt
                </Button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="pt-4">
        <div className="px-2 text-[11px] text-muted-foreground">
          v1.0 · Shadcn UI · Tailwind
        </div>
      </SidebarFooter>
    </UiSidebar>
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
            size="sm"
            className={cx(
              "flex-1 justify-start gap-2 rounded-xl text-sm min-w-0",
              active && "shadow"
            )}
            onClick={onSelect}
          >
            <Folder className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{list.name}</span>
          </Button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Rename list"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
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
            className="rounded-xl flex-1 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Save name"
              onClick={commit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
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

function SidebarPromptRow({
  prompt,
  active,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  disableDelete,
}: {
  prompt: PromptConfig;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  disableDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(prompt.name);

  useEffect(() => {
    setName(prompt.name);
  }, [prompt.name]);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== prompt.name) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setName(prompt.name);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-1">
      {!editing ? (
        <>
          <Button
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cx("flex-1 justify-start gap-2 rounded-xl text-sm min-w-0", active && "shadow")}
            onClick={onSelect}
          >
            <AlignLeft className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{prompt.name}</span>
          </Button>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Duplicate prompt"
              onClick={onDuplicate}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Rename prompt"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Delete prompt"
              onClick={onDelete}
              disabled={disableDelete}
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
            className="rounded-xl flex-1 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-xl h-7 w-7"
              aria-label="Save prompt name"
              onClick={commit}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-7 w-7"
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
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-muted/50 backdrop-blur px-4 py-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden rounded-xl" />
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
        <HydrationSafeThemeToggle className="rounded-xl" />
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
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-lime-600 bg-lime-500 p-2 text-white">
      {steps.map((s, i) => (
        <Button
          key={s.key}
          variant="ghost"
          size="sm"
          className={cx(
            "rounded-xl px-3 text-white border",
            i === step
              ? "bg-black border-black hover:bg-black"
              : "bg-white/10 border-white/40 hover:bg-white/20"
          )}
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
  onRemoveLead,
  onClearLeads,
  isImporting,
  importError,
}: {
  leads: Lead[];
  onImportCSV: (file: File) => Promise<void>;
  onRemoveLead: (id: string) => void;
  onClearLeads: () => void;
  isImporting: boolean;
  importError: string | null;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) void onImportCSV(f);
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 xl:grid-cols-6">
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
              dragActive && "border-ring bg-accent/40",
              isImporting && "pointer-events-none opacity-60"
            )}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            role="button"
            aria-label="Drop CSV file here or click to browse"
            aria-busy={isImporting}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="font-medium">Drag & drop CSV here</div>
              <div className="text-xs text-muted-foreground">or click to browse · .csv only</div>
              {isImporting && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Processing file…
                </div>
              )}
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
                if (f) void onImportCSV(f);
              }}
              disabled={isImporting}
            />
            <Button
              className="rounded-xl"
              onClick={() => {
                const f = fileRef.current?.files?.[0];
                if (f) void onImportCSV(f);
              }}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </>
              )}
            </Button>
          </div>
          {importError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {importError}
            </div>
          )}
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
      {showLinkedInCard ? (
        <Card className="rounded-2xl lg:col-span-3 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>LinkedIn Enrichment</CardTitle>
              <CardDescription>
                Use the uploaded CSV fields (first name, last name, company name, company URL) to find and attach each lead&apos;s LinkedIn profile.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl self-end sm:self-auto"
              aria-label="Hide LinkedIn enrichment card"
              onClick={() => setShowLinkedInCard(false)}
            >
              Hide
            </Button>
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
      ) : (
        <Card className="rounded-2xl lg:col-span-3 flex flex-col items-center justify-center gap-4 p-6 text-center max-h-[calc(100vh-220px)]">
          <CardHeader className="items-center text-center">
            <CardTitle>LinkedIn Enrichment hidden</CardTitle>
            <CardDescription>Restore this panel to manage LinkedIn URLs for your leads.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            <Button className="rounded-xl" variant="outline" onClick={() => setShowLinkedInCard(true)}>
              Restore section
            </Button>
          </CardContent>
        </Card>
      )}

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
  onGenerateColdEmail,
  generatingLeadId,
  generateError,
}: {
  leads: Lead[];
  emails: Record<string, GeneratedEmail>;
  subject: string;
  template: string;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  onGenerateColdEmail: (lead: Lead) => Promise<void> | void;
  generatingLeadId: string | null;
  generateError: string | null;
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
  const totalLeads = leads.length;
  const draftedCount = useMemo(() => {
    const statusesWithEmail: Array<Lead['status']> = ["generated", "approved", "rejected", "sent"];
    return leads.reduce((count, lead) => {
      const email = emails[lead.id];
      const hasEmailContent = Boolean(email?.subject?.trim() || email?.body?.trim());
      return hasEmailContent || statusesWithEmail.includes(lead.status) ? count + 1 : count;
    }, 0);
  }, [leads, emails]);
  const draftProgress = totalLeads > 0 ? Math.round((draftedCount / totalLeads) * 100) : 0;
  const selectedIndex = useMemo(() => {
    if (!selected) return -1;
    return leads.findIndex((lead) => lead.id === selected.id);
  }, [leads, selected]);
  const handleNextLead = useCallback(() => {
    if (!leads.length) return;
    if (!selected) {
      setSelectedLeadId(leads[0]?.id ?? null);
      return;
    }
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const nextIndex = (currentIndex + 1) % leads.length;
    setSelectedLeadId(leads[nextIndex].id);
  }, [leads, selected, selectedIndex, setSelectedLeadId]);
  const handlePreviousLead = useCallback(() => {
    if (!leads.length) return;
    if (!selected) {
      setSelectedLeadId(leads[0]?.id ?? null);
      return;
    }
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const prevIndex = (currentIndex - 1 + leads.length) % leads.length;
    setSelectedLeadId(leads[prevIndex].id);
  }, [leads, selected, selectedIndex, setSelectedLeadId]);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Generation Progress</CardTitle>
          <CardDescription>Track drafted emails across this list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              {totalLeads > 0 ? `${draftedCount} of ${totalLeads} leads drafted` : 'No leads imported yet'}
            </span>
            <span className="text-muted-foreground">{draftProgress}%</span>
          </div>
          <Progress value={draftProgress} className="h-2" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
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
                  <pre className="whitespace-pre-wrap p-3 bg-muted/30 text-sm">{preview.body || '(No content)'}</pre>
                </ScrollArea>
                <div className="flex items-center gap-3">
                  <Button
                    className="rounded-xl"
                    onClick={() => selected && onGenerateColdEmail(selected)}
                    disabled={!selected || generatingLeadId === selected?.id}
                  >
                    {generatingLeadId === selected?.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" /> Generate Email
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handlePreviousLead}
                    disabled={totalLeads <= 1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleNextLead}
                    disabled={totalLeads <= 1}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  {generateError && selected && (
                    <span className="text-xs text-destructive">
                      {generateError}
                    </span>
                  )}
                </div>
                {selectedIndex >= 0 && (
                  <div className="text-xs text-muted-foreground">
                    Viewing lead {selectedIndex + 1} of {totalLeads}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a lead to see the preview.</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl max-h-[calc(100vh-220px)] overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Imported Leads</CardTitle>
          <CardDescription>Select a lead to preview</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(100vh-260px)]">
            <div className="divide-y">
              {leads.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeadId(l.id)}
                  className={cx(
                    'w-full text-left p-3 flex items-center gap-2 hover:bg-muted/50',
                    selected?.id === l.id && 'bg-muted'
                  )}
                >
                  <Avatar className="h-8 w-8"><AvatarFallback>{l.firstName[0]}{l.lastName[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.firstName} {l.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.company} · {l.email}</div>
                  </div>
                </button>
              ))}
              {leads.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No leads yet. Import a CSV to begin.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewScreenMinimal({
  leads,
  emails,
  subject,
  template,
  selectedLeadId,
  setSelectedLeadId,
  onGenerateColdEmail,
  generatingLeadId,
  generateError,
}: {
  leads: Lead[];
  emails: Record<string, GeneratedEmail>;
  subject: string;
  template: string;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  onGenerateColdEmail: (lead: Lead) => Promise<void> | void;
  generatingLeadId: string | null;
  generateError: string | null;
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
    <div className="grid gap-4">
      <Card className="rounded-2xl">
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
                  <pre className="whitespace-pre-wrap p-3 bg-muted/30 text-sm">{preview.body || '(No content)'}</pre>
                </ScrollArea>
                <div className="flex items-center gap-3">
                  <Button
                    className="rounded-xl"
                    onClick={() => selected && onGenerateColdEmail(selected)}
                    disabled={!selected || generatingLeadId === selected?.id}
                  >
                    {generatingLeadId === selected?.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" /> Generate Email
                      </>
                    )}
                  </Button>
                  {generateError && selected && (
                    <span className="text-xs text-destructive">
                      {generateError}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Select a lead to see the preview.</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl max-h-[calc(100vh-220px)] overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle>Imported Leads</CardTitle>
          <CardDescription>Select a lead to preview</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(100vh-260px)]">
            <div className="divide-y">
              {leads.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeadId(l.id)}
                  className={cx(
                    'w-full text-left p-3 flex items-center gap-2 hover:bg-muted/50',
                    selected?.id === l.id && 'bg-muted'
                  )}
                >
                  <Avatar className="h-8 w-8"><AvatarFallback>{l.firstName[0]}{l.lastName[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.firstName} {l.lastName}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.company} · {l.email}</div>
                  </div>
                </button>
              ))}
              {leads.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No leads yet. Import a CSV to begin.</div>
              )}
            </div>
          </ScrollArea>
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
  const [showBatchCard, setShowBatchCard] = useState(true);
  const [showComplianceCard, setShowComplianceCard] = useState(true);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {showBatchCard ? (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Batch Sending</CardTitle>
              <CardDescription>Send approved emails in small batches to protect sender reputation.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl self-end sm:self-auto"
              aria-label="Hide batch sending card"
              onClick={() => setShowBatchCard(false)}
            >
              Hide
            </Button>
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
      ) : (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col items-center justify-center gap-4 p-6 text-center max-h-[calc(100vh-220px)]">
          <CardHeader className="items-center text-center">
            <CardTitle>Batch Sending hidden</CardTitle>
            <CardDescription>Restore this panel to configure sending cadence.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            <Button className="rounded-xl" variant="outline" onClick={() => setShowBatchCard(true)}>
              Restore section
            </Button>
          </CardContent>
        </Card>
      )}

      {showComplianceCard ? (
        <Card className="rounded-2xl flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Compliance</CardTitle>
              <CardDescription>Deliverability & opt-out</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl self-end sm:self-auto"
              aria-label="Hide compliance card"
              onClick={() => setShowComplianceCard(false)}
            >
              Hide
            </Button>
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
      ) : (
        <Card className="rounded-2xl flex flex-col items-center justify-center gap-4 p-6 text-center max-h-[calc(100vh-220px)]">
          <CardHeader className="items-center text-center">
            <CardTitle>Compliance panel hidden</CardTitle>
            <CardDescription>Restore to manage unsubscribe and domain settings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            <Button className="rounded-xl" variant="outline" onClick={() => setShowComplianceCard(true)}>
              Restore section
            </Button>
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
      {showSmtpCard ? (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col max-h-[calc(100vh-220px)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle>SMTP & Provider</CardTitle>
              <CardDescription>Credentials are stored securely.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl self-end sm:self-auto"
              aria-label="Hide SMTP settings card"
              onClick={() => setShowSmtpCard(false)}
            >
              Hide
            </Button>
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
      ) : (
        <Card className="rounded-2xl lg:col-span-2 flex flex-col items-center justify-center gap-4 p-6 text-center max-h-[calc(100vh-220px)]">
          <CardHeader className="items-center text-center">
            <CardTitle>SMTP settings hidden</CardTitle>
            <CardDescription>Restore this panel to manage provider credentials.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-0">
            <Button className="rounded-xl" variant="outline" onClick={() => setShowSmtpCard(true)}>
              Restore section
            </Button>
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
  const isSupabaseEnvConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const defaultListId = DEFAULT_LEAD_LIST.id;
  const [leadLists, setLeadLists] = useState<LeadList[]>([cloneDefaultLeadList()]);
  const [currentListId, setCurrentListId] = useState<string>(defaultListId);
  // Local working set mirrors the active list
  const [leads, setLeads] = useState<Lead[]>(() => initialLeads.map((lead) => ({ ...lead })));
  // LinkedIn enrichment flow replaces generic enrichment toggles
  const [template] = useState<string>(
    `Hi {{firstName}},\n\nI came across {{company}} and noticed your work in {{title}}. We help teams like yours automate outbound so you get more replies with fewer sends.\n\nWould you be open to a quick chat this week?\n\nBest,\nNeo\n`
  );
  const [subject] = useState<string>("Quick idea for {{company}}");
  const [emails, setEmails] = useState<Record<string, GeneratedEmail>>({});
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(20);
  const [schedule, setSchedule] = useState<Date | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [generatingLeadId, setGeneratingLeadId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PromptConfig[]>(DEFAULT_PROMPTS);
  const [activePromptId, setActivePromptId] = useState<string>(DEFAULT_PROMPTS[0]?.id ?? "");
  const [supabaseAvailable, setSupabaseAvailable] = useState(isSupabaseEnvConfigured);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingLeadLists, setLoadingLeadLists] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const activePrompt = useMemo(() => {
    if (prompts.length === 0) {
      return null;
    }
    return prompts.find((p) => p.id === activePromptId) ?? prompts[0];
  }, [prompts, activePromptId]);

  const fetchPrompts = useCallback(async () => {
    if (!isSupabaseEnvConfigured) {
      setSupabaseAvailable(false);
      setPrompts(DEFAULT_PROMPTS);
      setActivePromptId(DEFAULT_PROMPTS[0]?.id ?? "");
      return;
    }

    setLoadingPrompts(true);
    try {
      const response = await fetch("/api/prompts");
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || data?.ok === false) {
        const message = typeof data?.error === 'string' ? data.error : response.statusText;
        if (data?.error?.includes('Supabase not configured') || data?.supabaseDisabled || response.status >= 500) {
          setSupabaseAvailable(false);
        }
        if (message) {
          console.warn('Prompt sync disabled:', message);
        }
        setPrompts(DEFAULT_PROMPTS);
        setActivePromptId(DEFAULT_PROMPTS[0]?.id ?? "");
        return;
      }

      const fetched: PromptApiPayload[] = Array.isArray(data?.data) ? (data.data as PromptApiPayload[]) : [];
      if (!fetched.length) {
        setPrompts(DEFAULT_PROMPTS);
        setActivePromptId(DEFAULT_PROMPTS[0]?.id ?? "");
        return;
      }

      const mapped: PromptConfig[] = fetched.map((prompt) => {
        const versions = Array.isArray(prompt.versions) ? prompt.versions : [];
        const latest = versions.at(-1);
        return {
          id: prompt.id,
          name: prompt.name,
          content: typeof latest?.body === 'string' && latest.body.trim() ? latest.body : DEFAULT_PROMPT_CONTENT,
        };
      });

      setPrompts(mapped);
      setActivePromptId(mapped[0]?.id ?? DEFAULT_PROMPTS[0]?.id ?? "");
      setSupabaseAvailable(true);
    } catch (error) {
      console.error('Failed to load prompts', error);
      setSupabaseAvailable(false);
      setPrompts(DEFAULT_PROMPTS);
      setActivePromptId(DEFAULT_PROMPTS[0]?.id ?? "");
    } finally {
      setLoadingPrompts(false);
    }
  }, [isSupabaseEnvConfigured, setSupabaseAvailable]);

  const persistLeadList = useCallback(async (listId: string, update: { name?: string; leads?: Lead[] }) => {
    if (!supabaseAvailable || !listId || !isUuid(listId)) return;

    const payload: Record<string, unknown> = {};
    if (update.name !== undefined) payload.name = update.name;
    if (update.leads) payload.leads = update.leads.map(mapLocalLeadToApi);

    try {
      const response = await fetch(`/api/leadlists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status >= 500 || error?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        console.error('Failed to sync lead list', error?.error ?? response.statusText, error?.code ? { code: error.code, details: error.details } : undefined);
        if ((response.status >= 500 || error?.supabaseDisabled) && error?.error) {
          console.warn('Lead list sync disabled:', error.error);
        }
      }
    } catch (error) {
      console.error('Failed to sync lead list', error);
    }
  }, [supabaseAvailable, setSupabaseAvailable]);

  const syncLeadListLeads = useCallback((nextLeads: Lead[], listId: string | null | undefined) => {
    if (!listId) return;

    setLeadLists((prev) => {
      let changed = false;
      const updated = prev.map((lst) => {
        if (lst.id !== listId) return lst;
        if (lst.leads === nextLeads) return lst;
        changed = true;
        return { ...lst, leads: nextLeads };
      });
      return changed ? updated : prev;
    });

    if (supabaseAvailable) {
      persistLeadList(listId, { leads: nextLeads });
    }
  }, [persistLeadList, supabaseAvailable]);

  const updateLeads = useCallback(
    (updater: ((prev: Lead[]) => Lead[]) | Lead[], listId?: string) => {
      const targetId = listId ?? currentListId;
      setLeads((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: Lead[]) => Lead[])(prev) : updater;
        if (next === prev) return prev;
        syncLeadListLeads(next as Lead[], targetId);
        return next as Lead[];
      });
    },
    [currentListId, syncLeadListLeads]
  );

  const resetToSampleLeadList = useCallback(() => {
    const sample = cloneDefaultLeadList();
    setLeadLists([sample]);
    setCurrentListId(sample.id);
    updateLeads(sample.leads, sample.id);
    setSelectedLeadId(sample.leads[0]?.id ?? null);
  }, [updateLeads]);

  const fetchLeadLists = useCallback(async () => {
    if (!isSupabaseEnvConfigured) {
      setSupabaseAvailable(false);
      resetToSampleLeadList();
      return;
    }

    setLoadingLeadLists(true);
    try {
      const response = await fetch("/api/leadlists");
      const data = await response.json().catch(() => ({ ok: false }));

      if (!response.ok || data?.ok === false) {
        resetToSampleLeadList();
        const message = typeof data?.error === 'string' ? data.error : response.statusText;
        if (data?.error?.includes('Supabase not configured') || data?.supabaseDisabled || response.status >= 500) {
          setSupabaseAvailable(false);
        }
        if (message) {
          console.warn('Lead list sync disabled:', message);
        }
        return;
      }

      const fetched: LeadListApiPayload[] = Array.isArray(data?.data) ? (data.data as LeadListApiPayload[]) : [];

      if (!fetched.length) {
        // Don't clear existing lead lists if they exist (e.g., from a recent import)
        // Only reset to empty if we don't have any local lists either
        setLeadLists((prev) => {
          if (prev.length > 0 && prev[0]?.id !== DEFAULT_LEAD_LIST.id) {
            // We have non-default lists, keep them
            console.log('No remote lists found, keeping local lists');
            return prev;
          }
          // No local lists, clear everything
          return [];
        });
        
        // Don't clear leads if we have some
        setLeads((prev) => {
          if (prev.length > 0) {
            console.log('Keeping existing leads despite no remote lists');
            return prev;
          }
          return [];
        });
        
        return;
      }

      const mapped: LeadList[] = fetched.map((list) => ({
        id: list.id,
        name: list.name,
        leads: Array.isArray(list.leads) ? list.leads.map(mapApiLeadToLocal) : [],
      }));

      setLeadLists(mapped);
      const firstId = mapped[0]?.id ?? "";
      setCurrentListId(firstId);
      const firstLeads = mapped.find((lst) => lst.id === firstId)?.leads ?? [];
      updateLeads(firstLeads, firstId);
      setSelectedLeadId(firstLeads[0]?.id ?? null);
      setSupabaseAvailable(true);
    } catch (error) {
      console.error('Failed to load lead lists', error);
      resetToSampleLeadList();
      setSupabaseAvailable(false);
    } finally {
      setLoadingLeadLists(false);
    }
  }, [isSupabaseEnvConfigured, resetToSampleLeadList, setSupabaseAvailable, updateLeads]);

  useEffect(() => {
    fetchPrompts();
    fetchLeadLists();
  }, [fetchPrompts, fetchLeadLists]);

  const createLeadListRemote = useCallback(async (name: string, leadsPayload: Lead[]) => {
    if (!supabaseAvailable) return null;
    try {
      const response = await fetch('/api/leadlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, leads: leadsPayload.map(mapLocalLeadToApi) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok === false || !data?.data) {
        if (response.status >= 500 || data?.supabaseDisabled) {
          setSupabaseAvailable(false);
          const message = typeof data?.error === 'string' ? data.error : response.statusText;
          if (message) {
            console.warn('Lead list creation disabled:', message);
          }
        }
        return null;
      }
      const created = data.data;
      return {
        id: created.id,
        name: created.name,
        leads: Array.isArray(created.leads) ? created.leads.map(mapApiLeadToLocal) : leadsPayload,
      } as LeadList;
    } catch (error) {
      console.error('Failed to create lead list remotely', error);
      return null;
    }
  }, [supabaseAvailable, setSupabaseAvailable]);

  const deleteLeadListRemote = useCallback(async (id: string) => {
    if (!supabaseAvailable) return;
    try {
      const response = await fetch(`/api/leadlists/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (error?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        console.error('Failed to delete lead list', error?.error ?? response.statusText);
      }
    } catch (error) {
      console.error('Failed to delete lead list', error);
    }
  }, [supabaseAvailable]);

  const handlePromptContentChange = useCallback(async (id: string, content: string) => {
    setPrompts((prev) => prev.map((prompt) => (prompt.id === id ? { ...prompt, content } : prompt)));

    if (!supabaseAvailable) return;

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newContent: content }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Failed to save prompt content', error?.error ?? response.statusText);
      }
    } catch (error) {
      console.error('Failed to save prompt content', error);
    }
  }, [supabaseAvailable]);

  const handlePromptNameChange = useCallback(async (id: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;

    setPrompts((prev) => prev.map((prompt) => (prompt.id === id ? { ...prompt, name: nextName } : prompt)));

    if (!supabaseAvailable) return;

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nextName }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (error?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        console.error('Failed to rename prompt', error?.error ?? response.statusText);
      }
    } catch (error) {
      console.error('Failed to rename prompt', error);
    }
  }, [supabaseAvailable]);

  const handleCreatePrompt = useCallback(async () => {
    const provisional: PromptConfig = {
      id: createPromptId(),
      name: 'New Prompt',
      content: 'Describe the tone, structure, and examples you want the assistant to follow.',
    };

    if (!supabaseAvailable) {
      setPrompts((prev) => [...prev, provisional]);
      setActivePromptId(provisional.id);
      return;
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: provisional.name, content: provisional.content }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false || !data?.data) {
        if (response.status >= 500 || data?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        setPrompts((prev) => [...prev, provisional]);
        setActivePromptId(provisional.id);
        return;
      }

      const created = data.data as PromptApiPayload;
      const versions = Array.isArray(created.versions) ? created.versions : [];
      const latest = versions.at(-1);
      const newPrompt: PromptConfig = {
        id: created.id,
        name: created.name,
        content: typeof latest?.body === 'string' && latest.body.trim() ? latest.body : provisional.content,
      };
      setPrompts((prev) => [...prev, newPrompt]);
      setActivePromptId(newPrompt.id);
    } catch (error) {
      console.error('Failed to create prompt', error);
      setPrompts((prev) => [...prev, provisional]);
      setActivePromptId(provisional.id);
    }
  }, [supabaseAvailable]);

  const handleDuplicatePrompt = useCallback(async (id: string) => {
    const source = prompts.find((p) => p.id === id);
    if (!source) return;

    const provisional: PromptConfig = {
      id: createPromptId(),
      name: `${source.name} Copy`,
      content: source.content,
    };

    if (!supabaseAvailable) {
      setPrompts((prev) => [...prev, provisional]);
      setActivePromptId(provisional.id);
      return;
    }

    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: provisional.name, content: provisional.content }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false || !data?.data) {
        if (response.status >= 500 || data?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        setPrompts((prev) => [...prev, provisional]);
        setActivePromptId(provisional.id);
        return;
      }

      const created = data.data as PromptApiPayload;
      const versions = Array.isArray(created.versions) ? created.versions : [];
      const latest = versions.at(-1);
      const newPrompt: PromptConfig = {
        id: created.id,
        name: created.name,
        content: typeof latest?.body === 'string' && latest.body.trim() ? latest.body : provisional.content,
      };
      setPrompts((prev) => [...prev, newPrompt]);
      setActivePromptId(newPrompt.id);
    } catch (error) {
      console.error('Failed to duplicate prompt', error);
      setPrompts((prev) => [...prev, provisional]);
      setActivePromptId(provisional.id);
    }
  }, [prompts, supabaseAvailable]);

  const handleDeletePrompt = useCallback(async (id: string) => {
    setPrompts((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((prompt) => prompt.id !== id);
      if (next.length === prev.length) return prev;
      if (id === activePromptId) {
        setActivePromptId(next[0]?.id ?? "");
      }
      return next;
    });

    if (!supabaseAvailable) return;

    try {
      const response = await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (error?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        console.error('Failed to delete prompt', error?.error ?? response.statusText);
      }
    } catch (error) {
      console.error('Failed to delete prompt', error);
    }
  }, [activePromptId, supabaseAvailable]);

  const handleResetPrompt = useCallback(async (id: string) => {
    setPrompts((prev) => prev.map((prompt) => (prompt.id === id ? { ...prompt, content: DEFAULT_PROMPT_CONTENT } : prompt)));

    if (!supabaseAvailable) return;

    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newContent: DEFAULT_PROMPT_CONTENT }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (error?.supabaseDisabled) {
          setSupabaseAvailable(false);
        }
        console.error('Failed to reset prompt', error?.error ?? response.statusText);
      }
    } catch (error) {
      console.error('Failed to reset prompt', error);
    }
  }, [supabaseAvailable]);

  const handleSelectLeadId = (id: string | null) => {
    setGenerateError(null);
    setSelectedLeadId(id);
  };

  const onImportCSV = async (file: File): Promise<void> => {
    setImportError(null);

    if (!file?.name?.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload a file with a .csv extension.');
      return;
    }

    setImporting(true);
    try {
      // 1) Parse CSV on the client
      const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => String(h || "").trim(),
          complete: (res: Papa.ParseResult<Record<string, unknown>>) => resolve(res),
          error: (err: unknown) => reject(err),
        });
      });

      const rows = (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
      const columns = (parsed.meta.fields || []).filter(Boolean) as string[];

      if (!rows.length || !columns.length) {
        setImportError('The CSV file appears empty or is missing a header row.');
        return;
      }

      // 2) Try enhanced AI-powered parsing first
      let mapped: Lead[] = [];
      let useEnhancedParser = true;
      
      try {
        console.log('Using enhanced AI-powered CSV parser...');
        const enhancedResp = await fetch("/api/parse-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns,
            rows,
            options: {
              skipEmptyRows: true,
              validateEmails: true,
              detectDuplicates: true,
              maxRows: 10000,
            }
          }),
        });

        if (enhancedResp.ok) {
          const enhancedResult = await enhancedResp.json();
          
          if (enhancedResult.success) {
            console.log('Enhanced parser successful:', {
              totalRows: enhancedResult.totalRows,
              validRows: enhancedResult.validRows,
              dataQuality: enhancedResult.dataQuality,
              suggestions: enhancedResult.suggestions
            });
            
            // Convert enhanced result to Lead format
            mapped = enhancedResult.leads.map((lead: any, idx: number) => ({
              id: lead.id || `${Date.now()}-${idx}`,
              firstName: lead.firstName || "",
              lastName: lead.lastName || "",
              company: lead.company || "",
              email: (lead.email || "").toLowerCase(),
              title: lead.title || "",
              website: lead.website || undefined,
              linkedin: lead.linkedin || undefined,
              status: "new" as const,
            }));
            
            // Show data quality info if available
            if (enhancedResult.dataQuality?.emailValidation?.invalid > 0) {
              console.warn(`Note: ${enhancedResult.dataQuality.emailValidation.invalid} invalid emails were cleaned`);
            }
            if (enhancedResult.dataQuality?.duplicates > 0) {
              console.warn(`Note: ${enhancedResult.dataQuality.duplicates} duplicate entries were removed`);
            }
          } else {
            console.warn('Enhanced parser returned error, falling back...');
            useEnhancedParser = false;
          }
        } else {
          console.warn('Enhanced parser not available, falling back...');
          useEnhancedParser = false;
        }
      } catch (enhancedError) {
        console.warn('Enhanced parser failed, using fallback:', enhancedError);
        useEnhancedParser = false;
      }
      
      // Fallback to original parser if enhanced parser fails
      if (!useEnhancedParser) {
        console.log('Using original CSV parser...');
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

        // Apply the mapping to all rows locally
        mapped = (rows as Record<string, unknown>[]) 
          .map((r, idx) => {
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
      }

      if (!mapped.length) {
        setImportError('We could not find any rows with an email, LinkedIn URL, or name/company details.');
        return;
      }

      // Create a new lead list (folder) for each uploaded file
      const base = (file?.name || "Imported").replace(/\.[^/.]+$/, "");
      let createdList: LeadList | null = null;

      console.log('Creating lead list:', { 
        supabaseAvailable, 
        leadCount: mapped.length,
        fileName: base 
      });

      if (supabaseAvailable) {
        const remote = await createLeadListRemote(base, mapped);
        console.log('Remote creation result:', remote);
        if (remote) {
          createdList = remote;
        }
      }

      if (!createdList) {
        console.log('Creating local lead list');
        createdList = { id: `${Date.now()}`, name: base, leads: mapped };
      }

      const listToAdd = createdList!;
      console.log('Adding lead list:', { 
        id: listToAdd.id, 
        name: listToAdd.name,
        leadCount: listToAdd.leads?.length 
      });
      
      setLeadLists((prev) => {
        const newLists = [...prev, listToAdd];
        console.log('Updated lead lists:', newLists);
        return newLists;
      });
      setCurrentListId(listToAdd.id);
      
      // Make sure leads are properly set
      const leadsToSet = listToAdd.leads || mapped;
      console.log('Setting leads:', leadsToSet);
      updateLeads(leadsToSet, listToAdd.id);
      
      if (leadsToSet.length > 0) {
        setSelectedLeadId(leadsToSet[0]?.id ?? null);
      }
      
      // Don't change section immediately - let user see the imported leads
      // setSection("enrich");
      
      // Show success message
      console.log(`Successfully imported ${leadsToSet.length} leads!`);
    } catch (err) {
      console.error("Import failed", err);
      const message = err instanceof Error ? err.message : 'Failed to import CSV. Please try again.';
      setImportError(message);
    } finally {
      setImporting(false);
    }
  };

  const setLinkedInForLead = (leadId: string, url: string) => {
    updateLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, linkedin: url || undefined, status: url ? "enriched" : l.status }
          : l
      )
    );
  };

  const bulkMarkEnriched = () => {
    updateLeads((prev) => prev.map((l) => (l.linkedin ? { ...l, status: "enriched" } : l)));
  };

  const generateColdEmailForLead = async (lead: Lead) => {
    if (!lead) return;
    setGenerateError(null);
    setGeneratingLeadId(lead.id);
    try {
      const baseSubject = tokenFill(subject, lead) || `Quick intro for ${lead.company}`;
      const baseTemplate = tokenFill(template, lead);
      const prompt = `Recipient details:\n- Name: ${lead.firstName} ${lead.lastName}\n- Company: ${lead.company}\n- Title: ${lead.title || ""}\n- Email: ${lead.email}\n- Website: ${lead.website || "Not provided"}\n- LinkedIn: ${lead.linkedin || "Not provided"}\n\nUse the base subject idea "${baseSubject}" and draw inspiration from this template:\n"""${baseTemplate}"""\n\nGenerate a refreshed cold outreach email that feels human and authentic. Respond with valid JSON in the shape {"subject": "...", "body": "..."}.`;

      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: activePrompt?.content ?? DEFAULT_PROMPT_CONTENT,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }

      const raw = (await response.text()).trim();

      let nextSubject = "";
      let nextBody = "";

      try {
        const jsonMatch = raw.match(/\{[\s\S]*}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          nextSubject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
          nextBody = typeof parsed.body === "string" ? parsed.body.trim() : "";
        }
      } catch (err) {
        console.warn("Failed to parse AI response as JSON", err);
      }

      if (!nextSubject) {
        const subjectMatch = raw.match(/subject[:\-\s]+(.+)/i);
        if (subjectMatch) {
          nextSubject = subjectMatch[1].trim();
        }
      }

      if (!nextBody) {
        const bodyIndex = raw.indexOf("body:");
        if (bodyIndex >= 0) {
          nextBody = raw
            .slice(bodyIndex + 5)
            .replace(/^\s+/, "")
            .trim();
        } else {
          nextBody = raw;
        }
      }

      setEmails((prev) => ({
        ...prev,
        [lead.id]: {
          leadId: lead.id,
          subject: nextSubject || baseSubject,
          body: nextBody || baseTemplate,
        },
      }));

      updateLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? { ...l, status: "generated" }
            : l
        )
      );
    } catch (error) {
      console.error("Cold email generation failed", error);
      setGenerateError("Failed to generate email. Please try again.");
    } finally {
      setGeneratingLeadId(null);
    }
  };

  const handleApprove = (leadId: string, approved: boolean) => {
    updateLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: approved ? "approved" : "rejected" } : l)));
  };

  const handleEdit = (leadId: string, value: GeneratedEmail) => {
    setEmails((prev) => ({ ...prev, [leadId]: { ...prev[leadId], ...value } }));
  };

  const approvedCount = leads.filter((l) => l.status === "approved").length;

  // When switching lists, load its leads into local state
  useEffect(() => {
    const selected = leadLists.find((l) => l.id === currentListId);
    if (!selected) return;

    setLeads((prev) => (prev === selected.leads ? prev : selected.leads));
    setSelectedLeadId((prev) => {
      if (prev && selected.leads.some((lead) => lead.id === prev)) return prev;
      return selected.leads[0]?.id ?? null;
    });
  }, [currentListId, leadLists]);

  // Keep a sensible selection for the minimal preview screen
  useEffect(() => {
    if (!leads.length) {
      handleSelectLeadId(null);
    } else if (!selectedLeadId || !leads.some(l => l.id === selectedLeadId)) {
      handleSelectLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  // Sidebar list actions
  const newEmptyList = useCallback(async () => {
    const listName = `List ${leadLists.length + 1}`;

    if (supabaseAvailable) {
      const remote = await createLeadListRemote(listName, []);
      if (remote) {
        setLeadLists((prev) => [...prev, remote]);
        setCurrentListId(remote.id);
        updateLeads([], remote.id);
        setSelectedLeadId(null);
        return;
      }
    }

    const fallbackId = `${Date.now()}`;
    const fallbackList: LeadList = { id: fallbackId, name: listName, leads: [] };
    setLeadLists((prev) => [...prev, fallbackList]);
    setCurrentListId(fallbackId);
    updateLeads([], fallbackId);
    setSelectedLeadId(null);
  }, [leadLists.length, supabaseAvailable, createLeadListRemote, updateLeads]);

  const selectList = (id: string) => setCurrentListId(id);

  const removeListById = useCallback((id: string) => {
    const filtered = leadLists.filter((l) => l.id !== id);
    setLeadLists(filtered);
    deleteLeadListRemote(id);

    if (id === currentListId) {
      const next = filtered[0];
      setCurrentListId(next?.id ?? "");
      if (next) {
        updateLeads(next.leads, next.id);
        setSelectedLeadId(next.leads[0]?.id ?? null);
      } else {
        setLeads([]);
        setSelectedLeadId(null);
      }
    }
  }, [leadLists, currentListId, deleteLeadListRemote, updateLeads]);

  // Lead removal helpers for ImportScreen
  const removeLead = (leadId: string) => {
    updateLeads((prev) => prev.filter((l) => l.id !== leadId));
    // Also remove any generated email entry tied to that lead
    setEmails((prev) => {
      const { [leadId]: _, ...rest } = prev;
      return rest;
    });
  };
  const clearLeads = () => {
    updateLeads([]);
    setEmails({});
  };

  const renameList = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLeadLists((prev) => prev.map((list) => (list.id === id ? { ...list, name: trimmed } : list)));
    persistLeadList(id, { name: trimmed });
  }, [persistLeadList]);

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
          updateLeads((prev) => prev.map((l) => (l.status === "approved" ? { ...l, status: "sent" } : l)));
        }
      }, 800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sending, approvedCount, batchSize, updateLeads]);

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
    const map: Record<string, number> = { import: 0, enrich: 1, generate: 2, preview: 2, review: 3, send: 4, analytics: 5, settings: 5 };
    setStep(map[section] ?? 0);
  }, [section]);

  return (
    <WorkspaceProvider>
      <SidebarProvider
        className="bg-gradient-to-b from-background to-muted/30"
        style={{
          "--sidebar-width": "18.4rem",
          "--sidebar-width-mobile": "20.7rem",
        } as React.CSSProperties}
      >
        <AppSidebar
          current={section}
          onChange={setSection}
          lists={leadLists}
          currentListId={currentListId}
          onSelectList={selectList}
          onNewList={newEmptyList}
          onRemoveList={removeListById}
          onRenameList={renameList}
          prompts={prompts}
          activePromptId={activePrompt?.id ?? ""}
          activePrompt={activePrompt}
          onSelectPrompt={setActivePromptId}
          onCreatePrompt={handleCreatePrompt}
          onDuplicatePrompt={handleDuplicatePrompt}
          onDeletePrompt={handleDeletePrompt}
          onRenamePrompt={handlePromptNameChange}
          onUpdatePromptContent={handlePromptContentChange}
          onResetPrompt={handleResetPrompt}
          loadingPrompts={loadingPrompts}
          loadingLeadLists={loadingLeadLists}
        />
        <SidebarInset className="bg-gradient-to-b from-background to-muted/30 flex min-h-svh flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto px-6 py-6 space-y-6 md:px-8">
            {section !== 'preview' && <Stepper step={step} onStep={setStep} />}

            {section === "import" && (
              <ImportScreen
                leads={leads}
                onImportCSV={onImportCSV}
                onRemoveLead={removeLead}
                onClearLeads={clearLeads}
                isImporting={importing}
                importError={importError}
              />
            )}

            {section === "enrich" && (
              <EnrichScreen
                leads={leads}
                onSetLinkedIn={setLinkedInForLead}
                onBulkMarkEnriched={bulkMarkEnriched}
              />
            )}

            {section === "generate" && (
              <GenerateScreen
                leads={leads}
                emails={emails}
                subject={subject}
                template={template}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={handleSelectLeadId}
                onGenerateColdEmail={generateColdEmailForLead}
                generatingLeadId={generatingLeadId}
                generateError={generateError}
              />
            )}

            {section === 'preview' && (
              <PreviewScreenMinimal
                leads={leads}
                emails={emails}
                subject={subject}
                template={template}
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={handleSelectLeadId}
                onGenerateColdEmail={generateColdEmailForLead}
                generatingLeadId={generatingLeadId}
                generateError={generateError}
              />
            )}

            {section === "review" && (
              <ReviewScreen
                leads={leads}
                emails={emails}
                onApprove={handleApprove}
                onEdit={handleEdit}
              />
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
          </main>
          <div className="sticky bottom-0 left-0 w-full">
            <FooterSection />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  );
}
