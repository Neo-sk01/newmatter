// Role-based access control types
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_USER = 'company_user',
  COMPANY_VIEWER = 'company_viewer'
}

export enum Permission {
  // Company management
  MANAGE_COMPANY = 'manage_company',
  VIEW_COMPANY = 'view_company',
  
  // User management
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Lead generation
  GENERATE_LEADS = 'generate_leads',
  VIEW_LEADS = 'view_leads',
  EXPORT_LEADS = 'export_leads',
  
  // Email campaigns
  CREATE_CAMPAIGNS = 'create_campaigns',
  SEND_CAMPAIGNS = 'send_campaigns',
  VIEW_CAMPAIGNS = 'view_campaigns',
  
  // Analytics
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_ANALYTICS = 'export_analytics',
  
  // Prompts and templates
  MANAGE_PROMPTS = 'manage_prompts',
  VIEW_PROMPTS = 'view_prompts',
  
  // Settings
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SETTINGS = 'view_settings'
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  settings: CompanySettings;
}

export interface CompanySettings {
  emailSignature?: string;
  defaultPrompts: {
    leadGeneration?: string;
    emailOutreach?: string;
    followUp?: string;
  };
  branding: {
    primaryColor?: string;
    logo?: string;
  };
  integrations: {
    sendgrid?: {
      apiKey: string;
      fromEmail: string;
    };
    crm?: {
      type: string;
      apiKey: string;
    };
  };
}

export interface UserMetadata {
  companyId: string;
  role: UserRole;
  permissions: Permission[];
  department?: string;
  title?: string;
}

// Role permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  
  [UserRole.COMPANY_ADMIN]: [
    Permission.MANAGE_COMPANY,
    Permission.VIEW_COMPANY,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.GENERATE_LEADS,
    Permission.VIEW_LEADS,
    Permission.EXPORT_LEADS,
    Permission.CREATE_CAMPAIGNS,
    Permission.SEND_CAMPAIGNS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_PROMPTS,
    Permission.VIEW_PROMPTS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.COMPANY_USER]: [
    Permission.VIEW_COMPANY,
    Permission.GENERATE_LEADS,
    Permission.VIEW_LEADS,
    Permission.EXPORT_LEADS,
    Permission.CREATE_CAMPAIGNS,
    Permission.SEND_CAMPAIGNS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_PROMPTS,
    Permission.VIEW_SETTINGS
  ],
  
  [UserRole.COMPANY_VIEWER]: [
    Permission.VIEW_COMPANY,
    Permission.VIEW_LEADS,
    Permission.VIEW_CAMPAIGNS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_PROMPTS,
    Permission.VIEW_SETTINGS
  ]
};
