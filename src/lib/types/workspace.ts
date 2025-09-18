export interface Workspace {
  id: string;
  name: string;
  logo?: string;
  description: string;
  color: string;
  settings: {
    emailSignature: string;
    defaultFromEmail: string;
    companyAddress: string;
    website: string;
    phone?: string;
  };
}

export const workspaces: Workspace[] = [
  {
    id: "cape-town-tv",
    name: "Cape Town TV",
    description: "Community television broadcaster serving Cape Town",
    color: "#0066CC",
    settings: {
      emailSignature: "Best regards,\nCape Town TV Team",
      defaultFromEmail: "info@capetowntv.co.za",
      companyAddress: "Cape Town, South Africa",
      website: "https://capetowntv.co.za",
      phone: "+27 21 XXX XXXX"
    }
  },
  {
    id: "likhanyile",
    name: "Likhanyile",
    description: "Digital media and content creation company",
    color: "#FF6B35",
    settings: {
      emailSignature: "Best regards,\nLikhanyile Team",
      defaultFromEmail: "hello@likhanyile.com",
      companyAddress: "Johannesburg, South Africa",
      website: "https://likhanyile.com",
      phone: "+27 11 XXX XXXX"
    }
  },
  {
    id: "mambaonline",
    name: "MambaOnline",
    description: "South Africa's longest-running LGBTIQ+ digital media platform",
    color: "#8B5CF6",
    settings: {
      emailSignature: "Best regards,\nMambaOnline Team\nSouth Africa's leading LGBTIQ+ digital platform",
      defaultFromEmail: "info@mambaonline.com",
      companyAddress: "Cape Town, South Africa",
      website: "https://mambaonline.com",
      phone: "+27 21 XXX XXXX"
    }
  }
];
