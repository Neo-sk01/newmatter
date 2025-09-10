import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { belongsToCompany, hasPermission } from '@/lib/auth/permissions';
import { Permission } from '@/lib/types/auth';

interface CompanyPrompt {
  id: string;
  companyId: string;
  name: string;
  description: string;
  content: string;
  category: 'lead_generation' | 'email_outreach' | 'follow_up' | 'custom';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    const { companyId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this company
    const belongsToComp = await belongsToCompany(companyId);
    if (!belongsToComp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has permission to view prompts
    const canView = await hasPermission(Permission.VIEW_PROMPTS);
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Mock prompts data - replace with actual database query
    const prompts: CompanyPrompt[] = [
      {
        id: '1',
        companyId,
        name: 'Lead Generation - SaaS',
        description: 'Generate qualified leads for SaaS companies',
        content: `Generate qualified leads for ${getCompanyName(companyId)} in the technology sector. Focus on companies with 50-500 employees that might benefit from our SaaS solutions. 

Target criteria:
- Industry: Technology, Software, E-commerce
- Company size: 50-500 employees
- Revenue: $5M-$100M annually
- Pain points: Manual processes, scalability issues, data management challenges

Research each lead thoroughly and provide:
1. Company name and website
2. Key decision makers (CEO, CTO, VP of Operations)
3. Contact information (email, LinkedIn)
4. Specific pain points they might have
5. How our solution addresses their needs
6. Personalized outreach angle`,
        category: 'lead_generation',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        createdBy: userId
      },
      {
        id: '2',
        companyId,
        name: 'Cold Email Outreach',
        description: 'Personalized cold email template',
        content: `Write a personalized cold email for ${getCompanyName(companyId)}. 

Email structure:
Subject: [Personalized subject mentioning their company/recent news]

Hi [First Name],

I noticed [specific observation about their company/recent achievement/challenge]. 

At ${getCompanyName(companyId)}, we help companies like [their company] [specific benefit related to their industry/size].

[Specific pain point they likely face] is a common challenge we see with [their industry] companies of your size. We've helped similar companies [specific result/metric].

Would you be open to a brief 15-minute call next week to discuss how we might help [their company] [specific outcome]?

Best regards,
[Your name]
${getCompanyName(companyId)}

P.S. [Relevant postscript that adds value or urgency]`,
        category: 'email_outreach',
        isActive: true,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-22'),
        createdBy: userId
      },
      {
        id: '3',
        companyId,
        name: 'Follow-up Email',
        description: 'Follow-up for non-responsive prospects',
        content: `Create a follow-up email for prospects who haven't responded to our initial outreach from ${getCompanyName(companyId)}.

Subject: Quick follow-up - [Original subject or new angle]

Hi [First Name],

I sent you a note last week about [brief reminder of original topic]. I know you're busy, so I'll keep this short.

[New piece of value/insight/case study that wasn't in the original email]

If this isn't a priority right now, no worries at all. Would it be helpful if I checked back in [timeframe - 3 months/next quarter]?

If you'd like to explore this further, I'm happy to send over a brief case study of how we helped [similar company] achieve [specific result].

Best,
[Your name]

P.S. If you're not the right person for this, could you point me toward who might be?`,
        category: 'follow_up',
        isActive: true,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-25'),
        createdBy: userId
      }
    ];

    return NextResponse.json({ prompts });

  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    const { companyId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to this company
    const belongsToComp = await belongsToCompany(companyId);
    if (!belongsToComp) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if user has permission to manage prompts
    const canManage = await hasPermission(Permission.MANAGE_PROMPTS);
    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, description, content, category } = await req.json();

    // Validate required fields
    if (!name || !content || !category) {
      return NextResponse.json(
        { error: 'Name, content, and category are required' },
        { status: 400 }
      );
    }

    // Create new prompt
    const newPrompt: CompanyPrompt = {
      id: Date.now().toString(), // In real app, use proper UUID
      companyId,
      name,
      description: description || '',
      content,
      category,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    // Here you would save to database
    // await db.prompts.create(newPrompt);

    return NextResponse.json({ 
      message: 'Prompt created successfully',
      prompt: newPrompt 
    });

  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getCompanyName(companyId: string): string {
  const companyNames: Record<string, string> = {
    'acme-corp': 'Acme Corporation',
    'tech-solutions': 'Tech Solutions Inc',
    'innovate-labs': 'Innovate Labs',
    'digital-dynamics': 'Digital Dynamics',
    'future-systems': 'Future Systems'
  };

  return companyNames[companyId] || `Company ${companyId}`;
}
