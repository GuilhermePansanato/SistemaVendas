export interface PlatformModule {
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isTenantVisible: boolean;
  sortOrder: number;
}
