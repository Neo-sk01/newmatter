"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const DEFAULT_SYSTEM_PROMPT = `### **Few-Shot Prompt for AI Agent**

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
`;

const DEFAULT_TEMPLATE = `Hi {{firstName}},

I came across {{company}} and noticed your work in {{title}}. We help teams like yours engage South Africa's R250B LGBTIQ+ market with authentic storytelling and inclusive media partnerships.

Would you be open to a quick chat next week?

Best,
Nompilo`;

const DEFAULT_SUBJECT = "Quick idea for {{company}}";

const tokenFill = (template: string, lead: Record<string, string>) =>
  template
    .replaceAll("{{firstName}}", lead.firstName || "")
    .replaceAll("{{lastName}}", lead.lastName || "")
    .replaceAll("{{company}}", lead.company || "")
    .replaceAll("{{title}}", lead.title || "")
    .replaceAll("{{email}}", lead.email || "")
    .replaceAll("{{website}}", lead.website || "")
    .replaceAll("{{linkedin}}", lead.linkedin || "");

export default function Gpt5ColdOutreachTestPage() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [subjectTemplate, setSubjectTemplate] = useState(DEFAULT_SUBJECT);
  const [bodyTemplate, setBodyTemplate] = useState(DEFAULT_TEMPLATE);
  const [firstName, setFirstName] = useState("Kerry");
  const [lastName, setLastName] = useState("Largier");
  const [company, setCompany] = useState("Yuppiechef");
  const [title, setTitle] = useState("Chief Marketing Officer");
  const [email, setEmail] = useState("kerry@yuppiechef.com");
  const [website, setWebsite] = useState("https://www.yuppiechef.com");
  const [linkedin, setLinkedin] = useState("https://www.linkedin.com/in/kerry-largier");
  const [researchSummary, setResearchSummary] = useState(
    "In April 2025, Yuppiechef expanded into curated event experiences and partnered with Pride-friendly venues in Cape Town. The brand is looking to refresh its loyalty program with more community-driven partnerships."
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ subject: string; body: string; raw: string } | null>(null);

  const handleGenerate = useCallback(async () => {
    const lead = { firstName, lastName, company, title, email, website, linkedin };
    const baseSubject = tokenFill(subjectTemplate, lead) || `Quick intro for ${company}`;
    const baseBody = tokenFill(bodyTemplate, lead);
    const summarySection = researchSummary.trim()
      ? `\nResearch summary (approved):\n${researchSummary.trim()}\n`
      : "";
    const prompt = `Recipient details:\n- Name: ${firstName} ${lastName}\n- Company: ${company}\n- Title: ${title || ""}\n- Email: ${email}\n- Website: ${website || "Not provided"}\n- LinkedIn: ${linkedin || "Not provided"}${summarySection}\nUse the base subject idea "${baseSubject}" and draw inspiration from this template:\n"""${baseBody}"""\n\nGenerate a refreshed cold outreach email that feels human and authentic. Respond with valid JSON in the shape {"subject": "...", "body": "..."}.`;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          prompt,
          researchSummary: researchSummary.trim() || undefined,
          lead,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || response.statusText);
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
      } catch (parseError) {
        console.warn("Failed to parse AI response as JSON", parseError);
      }

      if (!nextSubject) {
        const subjectMatch = raw.match(/subject[:\-\s]+(.+)/i);
        if (subjectMatch) {
          nextSubject = subjectMatch[1].trim();
        }
      }

      if (!nextBody) {
        const lower = raw.toLowerCase();
        const bodyIndex = lower.indexOf("body:");
        if (bodyIndex >= 0) {
          nextBody = raw.slice(bodyIndex + 5).trim();
        } else {
          nextBody = raw;
        }
      }

      setResult({ subject: nextSubject || baseSubject, body: nextBody || baseBody, raw });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }, [company, email, firstName, lastName, linkedin, researchSummary, subjectTemplate, bodyTemplate, systemPrompt, title, website]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-10">
      <Card className="rounded-2xl border-2 border-dashed border-muted">
        <CardHeader>
          <CardTitle>GPT-5 mini cold outreach tester</CardTitle>
          <CardDescription>
            Provide lead details, adjust the system prompt if needed, and generate a one-off cold outreach email via the `/api/generate-email` endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="system-prompt">System prompt</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[220px] rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject-template">Subject template</Label>
              <Input
                id="subject-template"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body-template">Body template</Label>
              <Textarea
                id="body-template"
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                className="min-h-[220px] rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="research-summary">Approved research summary</Label>
              <Textarea
                id="research-summary"
                value={researchSummary}
                onChange={(e) => setResearchSummary(e.target.value)}
                className="min-h-[160px] rounded-2xl"
                placeholder="Paste the approved AI research summary here."
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground space-x-1">
            <span>Subject/body templates support placeholders such as</span>
            <code className="rounded bg-muted px-1 py-[1px]">{'{{firstName}}'}</code>
            <span>,</span>
            <code className="rounded bg-muted px-1 py-[1px]">{'{{company}}'}</code>
            <span>,</span>
            <code className="rounded bg-muted px-1 py-[1px]">{'{{title}}'}</code>
            <span>.</span>
          </div>
          <Button className="rounded-xl" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              "Generate cold outreach draft"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Outputs from `/api/generate-email` using GPT-5 mini. Raw response shown for debugging.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {result ? (
            <div className="space-y-3">
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</span>
                <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">{result.subject}</div>
              </div>
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body</span>
                <ScrollArea className="h-[300px] rounded-2xl border bg-muted/20">
                  <pre className="whitespace-pre-wrap p-3 text-sm">{result.body}</pre>
                </ScrollArea>
              </div>
              <div className="grid gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raw response</span>
                <ScrollArea className="h-[220px] rounded-2xl border bg-muted/10">
                  <pre className="whitespace-pre-wrap p-3 text-xs text-muted-foreground">{result.raw}</pre>
                </ScrollArea>
              </div>
            </div>
          ) : !error && !loading ? (
            <div className="rounded-xl border border-dashed border-muted px-3 py-6 text-center text-sm text-muted-foreground">
              No draft yet. Fill in the details above and click “Generate cold outreach draft”.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
