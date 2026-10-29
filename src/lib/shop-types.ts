export interface NavigationGroup {
  id: string;
  title: string;
  items: { title: string; categoryId: string }[];
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  mobileImageUrl: string;
  sourceLink: string;
  categoryId: string | null;
  productId: string | null;
  order: number;
}

export interface SiteContent {
  logoUrl: string;
  navigation: NavigationGroup[];
  shipping?: string[];
  returns?: string[];
  homeSections: HomeSection[];
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle: string;
  productCount: number;
  productIds: string[];
  order: number;
}
