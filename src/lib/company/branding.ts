export function getCompanyBranding(companyId: string) {
  // Simple demo theming per company. In production, fetch from DB.
  const brands: Record<string, { color: string }> = {
    acme: { color: '#1e40af' },
    globex: { color: '#16a34a' },
    initech: { color: '#7c3aed' },
  }

  const brand = brands[companyId] ?? { color: '#0ea5e9' }

  return {
    variables: {
      colorPrimary: brand.color,
    },
    elements: {
      card: 'rounded-2xl shadow-lg',
    },
  }
}

