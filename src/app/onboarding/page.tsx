'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/lib/types/auth';
import { Building2, Users, Briefcase } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyId: '',
    industry: '',
    companySize: '',
    role: UserRole.COMPANY_USER,
    department: '',
    title: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user metadata in Clerk
      await user?.update({
        publicMetadata: {
          companyId: formData.companyId,
          role: formData.role,
          department: formData.department,
          title: formData.title,
          onboardingComplete: true
        }
      });

      // Create company record (in real app, this would be an API call)
      await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.companyId,
          name: formData.companyName,
          industry: formData.industry,
          size: formData.companySize
        })
      });

      // Redirect to company dashboard
      router.push(`/dashboard/${formData.companyId}`);
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCompanyId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to SalesMatter AI</CardTitle>
          <CardDescription>
            Let's set up your company profile to get started with AI-powered lead generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                <span>Company Information</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        companyName: name,
                        companyId: generateCompanyId(name)
                      }));
                    }}
                    placeholder="Acme Corporation"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyId">Company ID</Label>
                  <Input
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    placeholder="acme-corp"
                    required
                  />
                  <p className="text-xs text-gray-500">This will be used in your dashboard URL</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* User Role */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                <span>Your Role</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role in Company</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.COMPANY_ADMIN}>Company Admin</SelectItem>
                    <SelectItem value={UserRole.COMPANY_USER}>Company User</SelectItem>
                    <SelectItem value={UserRole.COMPANY_VIEWER}>Company Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Admin: Full access to manage company and users<br/>
                  User: Can generate leads and create campaigns<br/>
                  Viewer: Read-only access to data and reports
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Sales, Marketing, Operations..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Sales Manager, VP of Marketing..."
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up your account...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
