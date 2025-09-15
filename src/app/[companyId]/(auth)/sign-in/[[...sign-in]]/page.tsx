import { SignIn } from '@clerk/nextjs'
import { getCompanyBranding } from '@/lib/company/branding'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function CompanySignInPage({ params }: PageProps) {
  const { companyId } = await params

  const appearance = getCompanyBranding(companyId)

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Sign in to {companyId}</h1>
          <p className="text-sm text-muted-foreground">Use your company account to continue</p>
        </div>
        <SignIn
          appearance={appearance}
          afterSignInUrl={`/dashboard/${companyId}`}
          afterSignUpUrl={`/onboarding`}
        />
      </div>
    </div>
  )
}
