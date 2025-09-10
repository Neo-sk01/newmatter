import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserMetadata, belongsToCompany, hasPermission } from '@/lib/auth/permissions';
import { Permission } from '@/lib/types/auth';

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

    // Check if user has permission to view company data
    const canView = await hasPermission(Permission.VIEW_COMPANY);
    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Mock company data - replace with actual database query
    const companyData = {
      id: companyId,
      name: getCompanyName(companyId),
      domain: `${companyId}.com`,
      industry: 'Technology',
      size: '50-100 employees',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      isActive: true,
      settings: {
        emailSignature: `Best regards,\n${getCompanyName(companyId)} Team`,
        defaultPrompts: {
          leadGeneration: `Generate qualified leads for ${getCompanyName(companyId)} in the technology sector. Focus on companies with 50-500 employees that might benefit from our SaaS solutions.`,
          emailOutreach: `Write a personalized cold email for ${getCompanyName(companyId)}. Mention specific pain points in their industry and how our solution can help.`,
          followUp: `Create a follow-up email for prospects who haven't responded to our initial outreach from ${getCompanyName(companyId)}.`
        },
        branding: {
          primaryColor: '#3B82F6',
          logo: '/company-logos/default.png'
        },
        integrations: {
          sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY || '',
            fromEmail: `noreply@${companyId}.com`
          }
        }
      },
      stats: {
        totalLeads: 2543,
        totalCampaigns: 47,
        openRate: 24.3,
        responseRate: 8.7
      }
    };

    return NextResponse.json(companyData);

  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if user has permission to manage company
    const canManage = await hasPermission(Permission.MANAGE_COMPANY);
    if (!canManage) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updateData = await req.json();

    // Here you would update the company in your database
    // For now, return success response
    return NextResponse.json({ 
      message: 'Company updated successfully',
      data: updateData 
    });

  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getCompanyName(companyId: string): string {
  // Mock company names - replace with database lookup
  const companyNames: Record<string, string> = {
    'acme-corp': 'Acme Corporation',
    'tech-solutions': 'Tech Solutions Inc',
    'innovate-labs': 'Innovate Labs',
    'digital-dynamics': 'Digital Dynamics',
    'future-systems': 'Future Systems'
  };

  return companyNames[companyId] || `Company ${companyId}`;
}
