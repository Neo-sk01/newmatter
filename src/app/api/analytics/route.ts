import { NextRequest, NextResponse } from 'next/server';
import sgClient from '@sendgrid/client';

// Initialize SendGrid client
sgClient.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function GET(req: NextRequest) {
  try {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json(
        { error: 'SendGrid API key not configured' },
        { status: 500 }
      );
    }

    // Get date range from query parameters (default to last 7 days)
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Format dates for SendGrid API (YYYY-MM-DD)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch email activity stats from SendGrid
    const request = {
      url: '/v3/stats',
      method: 'GET' as const,
      qs: {
        start_date: startDateStr,
        end_date: endDateStr,
        aggregated_by: 'day'
      }
    };

    const [response] = await sgClient.request(request);
    const stats = response.body as any[];

    // Process the data to match our chart format
    const chartData = stats.map((stat: any) => ({
      day: new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' }),
      sent: stat.stats[0]?.metrics?.delivered || 0,
      opened: stat.stats[0]?.metrics?.unique_opens || 0,
      replied: stat.stats[0]?.metrics?.unique_clicks || 0, // Using clicks as proxy for replies
      date: stat.date
    }));

    // Calculate KPIs
    const totalSent = chartData.reduce((sum: number, day: any) => sum + day.sent, 0);
    const totalOpened = chartData.reduce((sum: number, day: any) => sum + day.opened, 0);
    const totalReplied = chartData.reduce((sum: number, day: any) => sum + day.replied, 0);

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0.0';
    
    // Calculate bounce rate (delivered - bounces)
    const totalBounces = stats.reduce((sum: number, stat: any) => 
      sum + (stat.stats[0]?.metrics?.bounces || 0), 0
    );
    const bounceRate = totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      chartData,
      kpis: {
        openRate: `${openRate}%`,
        replyRate: `${replyRate}%`,
        bounceRate: `${bounceRate}%`
      }
    });

  } catch (error) {
    console.error('Error fetching SendGrid analytics:', error);
    
    // Return mock data if SendGrid fails
    const mockChartData = [
      { day: "Mon", sent: 40, opened: 18, replied: 3 },
      { day: "Tue", sent: 80, opened: 42, replied: 9 },
      { day: "Wed", sent: 60, opened: 33, replied: 6 },
      { day: "Thu", sent: 120, opened: 76, replied: 12 },
      { day: "Fri", sent: 100, opened: 51, replied: 10 },
    ];

    return NextResponse.json({
      chartData: mockChartData,
      kpis: {
        openRate: "42%",
        replyRate: "9%",
        bounceRate: "1.2%"
      },
      error: 'Using mock data - SendGrid integration failed'
    });
  }
}
