export type ProductCategory =
  | 'Alla'
  | 'Mössor'
  | 'Pannband'
  | 'Halsdukar'
  | 'Strumpor'
  | 'Skallror'
  | 'Bitringar'
  | string;

export type AgeGroup = 'Baby' | 'Barn' | 'Vuxen' | 'Alla';

export type ProductStockStatus = 'På beställning' | 'I lager' | 'Tillfälligt slut' | 'Slut i lager';

export type ProductPersonality =
  | 'Lugn'
  | 'Busig'
  | 'Mysig'
  | 'Lekfull'
  | 'Nyfiken'
  | 'Äventyrlig'
  | 'Klassisk'
  | 'Annat';

export interface ProductColor {
  name: string;
  hex: string;
  inStock?: boolean;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  category: ProductCategory;
  ageGroup: AgeGroup;
  shortDescription: string;
  description: string;
  story?: string; // Produktens saga
  storyIdea?: string; // Sago-idé för AI-inspiration och hantverksidé
  price: number;
  images: string[];
  image?: string; // Main image fallback
  colors: ProductColor[];
  sizes?: string[];
  material?: string;
  craftsmanship?: string;
  leadTime?: string;
  careInstructions?: string;
  recommendedAge?: string;
  safetyInformation?: string;
  personality?: string;
  inspiration?: string;
  stockQuantity?: number;
  stockStatus: ProductStockStatus;
  madeToOrder: boolean;
  featured: boolean;
  newProduct?: boolean;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  targetAgeGroups?: AgeGroup[];
  badge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryCard = Category;

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedSize?: string;
}

export interface InquiryCustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address: string;
  postalCode: string;
  city: string;
  message?: string;
}

export type InquiryStatus =
  | 'Ny'
  | 'Kontaktad'
  | 'Bekräftad'
  | 'Under arbete'
  | 'Klar'
  | 'Avslutad'
  | 'Avböjd';

export interface InquiryItem {
  productId: string;
  productName: string;
  priceAtTimeOfInquiry: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  image?: string;
}

export type DiscountType = 'percentage' | 'fixed';
export type DiscountAppliesTo = 'all' | 'products' | 'categories';

export interface Discount {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom?: string;
  validUntil?: string;
  minimumOrderAmount?: number;
  maxUses?: number;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  appliesTo: DiscountAppliesTo;
  productIds?: string[];
  categoryIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: Discount;
  discountAmount: number;
  eligibleSubtotal: number;
  subtotalBeforeDiscount: number;
  totalAfterDiscount: number;
  errorMessage?: string;
}

export interface Inquiry {
  id: string;
  inquiryNumber: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  message?: string;
  items: InquiryItem[];
  estimatedTotal: number;
  status: InquiryStatus;
  adminNotes?: string;
  updatedAt?: string;
  // Rabatt-snapshot vid förfrågan
  discountCode?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  subtotalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}

export interface OrderInquiry {
  id: string;
  inquiryNumber?: string;
  customer: InquiryCustomerInfo;
  items: CartItem[];
  estimatedTotal: number;
  createdAt: string;
  status: 'received' | 'processing' | 'contacted';
  // Rabatt-snapshot
  discountCode?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  subtotalBeforeDiscount?: number;
  totalAfterDiscount?: number;
}

export interface FooterLink {
  label: string;
  href: string;
  enabled: boolean;
}

export interface InfoSection {
  title: string;
  content: string;
}

export interface FaqSettingItem {
  id?: string;
  question: string;
  answer: string;
  category?: 'forfragan' | 'betalning' | 'produkter' | 'leverans' | 'skotsel' | string;
}

export interface SiteSettings {
  email: string;
  instagram: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroProductId?: string;
  heroProductBadge?: string;
  heroProductEnabled?: boolean;
  aboutText?: string;
  aboutImageUrl?: string;
  updatedAt?: string;

  // Webbplatsstatus & Underhållsläge
  maintenanceMode?: boolean;

  // Fas 2: Innehållssidor & FAQ
  aboutStoryParagraphs?: string[];
  shippingSections?: InfoSection[];
  termsSections?: InfoSection[];
  faqItems?: FaqSettingItem[];

  // Fas 3: Announcement bar & Populära söktermer
  announcementText?: string;
  announcementEnabled?: boolean;
  popularSearchTerms?: string[];

  // Välkomst-popup (Startsida)
  welcomePopupEnabled?: boolean;
  welcomePopupTitle?: string;
  welcomePopupDiscountText?: string;
  welcomePopupDiscountCode?: string;
  welcomePopupImageUrl?: string;

  // 1. VARUMÄRKE
  footerBrandName?: string;
  footerTagline?: string;
  footerDescription?: string;
  logoImageUrl?: string;
  logoTagline?: string;

  // 2. SIDOR
  footerPageLinks?: FooterLink[];

  // 3. INFORMATION
  footerInfoLinks?: FooterLink[];

  // 4. KONTAKT & FÖLJ
  footerInstagramLabel?: string;
  footerInstagramUrl?: string;
  footerInstagramEnabled?: boolean;
  footerEmailLabel?: string;
  footerEmail?: string;
  footerContactLabel?: string;
  footerContactUrl?: string;
  footerContactEnabled?: boolean;

  // 5. NEDRE FOOTER
  footerCopyright?: string;
  footerSignature?: string;
  footerShowAdminLink?: boolean;
}

export type SortOption =
  | 'recommended'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc';

export type PageRoute =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart' // Förfrågelista
  | 'checkout' // Beställningsförfrågan
  | 'order-confirmation' // Bekräftelsesida
  | 'about'
  | 'contact'
  | 'faq'
  | 'shipping'
  | 'terms'
  | 'wishlist'
  | 'claim' // Reklamation
  | 'withdrawal' // Ångra köp
  | 'admin';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'create-product'
  | 'edit-product'
  | 'categories'
  | 'discounts'
  | 'inquiries'
  | 'view-inquiry'
  | 'claims'
  | 'view-claim'
  | 'withdrawals'
  | 'view-withdrawal'
  | 'content'
  | 'settings';

export type ClaimStatus =
  | 'Ny'
  | 'Under behandling'
  | 'Behöver mer information'
  | 'Godkänd'
  | 'Avslagen'
  | 'Åtgärdad'
  | 'Avslutad';

export interface Claim {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  product: string;
  description: string;
  discoveredAt: string;
  imageUrls: string[];
  additionalInfo?: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt?: string;
  internalNotes?: string;
}

export type WithdrawalStatus =
  | 'Ny'
  | 'Behandlas'
  | 'Retur inväntas'
  | 'Återbetalning behandlas'
  | 'Återbetald'
  | 'Avslutad';

export interface Withdrawal {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  items: string;
  status: WithdrawalStatus;
  submittedAt: string;
  updatedAt?: string;
  acknowledgementSentAt?: string | null;
  internalNotes?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'forfragan' | 'betalning' | 'produkter' | 'leverans' | 'skotsel';
}

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  createdAt: string;
  source?: string;
}
