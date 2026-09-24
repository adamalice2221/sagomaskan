import React, { useState, useRef, ReactNode, useEffect } from 'react';
import {
  Save,
  Check,
  Mail,
  Type,
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Layout,
  ShieldAlert,
  Plus,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Truck,
  FileText,
  HelpCircle,
  Tag,
  ShoppingBag,
  Power,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { SiteSettings, FooterLink, Product, InfoSection, FaqSettingItem } from '../../types';
import { uploadHeroImage, uploadLogoImage, uploadAboutImage, normalizeHeroImageUrl } from '../../services/storage';
import { DEFAULT_SETTINGS } from '../../services/db';

type SettingsTab =
  | 'status'      // DRIFT - Webbplatsstatus
  | 'website'     // WEBBPLATS - Startsida & Kampanjer
  | 'content'     // INNEHÅLL - Innehåll & FAQ
  | 'contact';    // KONTAKT & FOOTER - Kontakt & Sidfot

interface AdminSettingsProps {
  settings: SiteSettings;
  products?: Product[];
  onSaveSettings: (settings: Partial<SiteSettings>) => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  products = [],
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('status');
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'shipping' | 'terms' | 'faq'>('about');

  const tabs: { id: SettingsTab; label: string; group: string; icon: ReactNode }[] = [
    { id: 'status', label: 'Webbplatsstatus', group: 'DRIFT', icon: <Power className="w-4 h-4" /> },
    { id: 'website', label: 'Startsida & Kampanjer', group: 'WEBBPLATS', icon: <Type className="w-4 h-4" /> },
    { id: 'content', label: 'Innehåll & FAQ', group: 'INNEHÅLL', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'contact', label: 'Kontakt & Sidfot', group: 'KONTAKT & FOOTER', icon: <Mail className="w-4 h-4" /> },
  ];

  // Webbplatsstatus & Underhållsläge
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => Boolean(settings.maintenanceMode));
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState<boolean>(false);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<boolean>(false);
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);

  useEffect(() => {
    setMaintenanceMode(Boolean(settings.maintenanceMode));
  }, [settings.maintenanceMode]);

  const handleInitiateStatusChange = (newTarget: boolean) => {
    setStatusConfirmTarget(newTarget);
    setShowStatusConfirmModal(true);
  };

  const [email, setEmail] = useState(settings.email || 'hello@sagomaskan.se');
  const [instagram, setInstagram] = useState(settings.instagram || '@sagomaskan');
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || 'Där garn blir till små berättelser');
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || 'Mjuk design, färg och fantasi – skapat för hand.');
  const [heroProductId, setHeroProductId] = useState(settings.heroProductId || '');
  const [heroProductBadge, setHeroProductBadge] = useState(settings.heroProductBadge || 'Unikt hantverk');
  const [heroProductEnabled, setHeroProductEnabled] = useState<boolean>(() =>
    settings.heroProductEnabled !== undefined ? settings.heroProductEnabled : (DEFAULT_SETTINGS.heroProductEnabled ?? true)
  );

  useEffect(() => {
    if (settings.heroProductEnabled !== undefined) {
      setHeroProductEnabled(settings.heroProductEnabled);
    }
  }, [settings.heroProductEnabled]);

  // Välkomst-popup
  const [welcomePopupEnabled, setWelcomePopupEnabled] = useState<boolean>(() =>
    settings.welcomePopupEnabled !== undefined ? settings.welcomePopupEnabled : (DEFAULT_SETTINGS.welcomePopupEnabled ?? false)
  );
  const [welcomePopupTitle, setWelcomePopupTitle] = useState<string>(
    settings.welcomePopupTitle !== undefined ? settings.welcomePopupTitle : (DEFAULT_SETTINGS.welcomePopupTitle || 'Välkommen till Sagomaskan ♡')
  );
  const [welcomePopupDiscountText, setWelcomePopupDiscountText] = useState<string>(
    settings.welcomePopupDiscountText !== undefined ? settings.welcomePopupDiscountText : (DEFAULT_SETTINGS.welcomePopupDiscountText || 'Få 10 % på din första beställning')
  );
  const [welcomePopupDiscountCode, setWelcomePopupDiscountCode] = useState<string>(
    settings.welcomePopupDiscountCode !== undefined ? settings.welcomePopupDiscountCode : (DEFAULT_SETTINGS.welcomePopupDiscountCode || 'VÄLKOMMEN10')
  );
  const [welcomePopupImageUrl, setWelcomePopupImageUrl] = useState<string>(
    settings.welcomePopupImageUrl || ''
  );

  useEffect(() => {
    if (settings.welcomePopupEnabled !== undefined) {
      setWelcomePopupEnabled(settings.welcomePopupEnabled);
    }
    if (settings.welcomePopupTitle !== undefined) {
      setWelcomePopupTitle(settings.welcomePopupTitle);
    }
    if (settings.welcomePopupDiscountText !== undefined) {
      setWelcomePopupDiscountText(settings.welcomePopupDiscountText);
    }
    if (settings.welcomePopupDiscountCode !== undefined) {
      setWelcomePopupDiscountCode(settings.welcomePopupDiscountCode);
    }
    if (settings.welcomePopupImageUrl !== undefined) {
      setWelcomePopupImageUrl(settings.welcomePopupImageUrl);
    }
  }, [settings.welcomePopupEnabled, settings.welcomePopupTitle, settings.welcomePopupDiscountText, settings.welcomePopupDiscountCode, settings.welcomePopupImageUrl]);
  
  const isExternalWebUrl = (url?: string) => {
    if (!url) return false;
    const trimmed = url.trim();
    return (
      (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
      !trimmed.includes('firebasestorage.googleapis.com') &&
      !trimmed.includes('appspot.com')
    );
  };

  const [heroImage, setHeroImage] = useState(() => normalizeHeroImageUrl(settings.heroImage || ''));
  const [externalUrlInput, setExternalUrlInput] = useState(() => {
    const raw = settings.heroImage || '';
    return isExternalWebUrl(raw) ? raw : '';
  });

  // Om hantverket-bild
  const [aboutImageUrl, setAboutImageUrl] = useState(() => normalizeHeroImageUrl(settings.aboutImageUrl || ''));
  const [aboutExternalUrlInput, setAboutExternalUrlInput] = useState(() => {
    const raw = settings.aboutImageUrl || '';
    return isExternalWebUrl(raw) ? raw : '';
  });
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [aboutUploadError, setAboutUploadError] = useState<string | null>(null);
  const [isDraggingAbout, setIsDraggingAbout] = useState(false);
  const aboutFileInputRef = useRef<HTMLInputElement>(null);

  const [aboutText, setAboutText] = useState(settings.aboutText || '');

  // 1. Om mig / Om hantverket
  const [aboutStoryParagraphs, setAboutStoryParagraphs] = useState<string[]>(() =>
    settings.aboutStoryParagraphs?.length ? settings.aboutStoryParagraphs : DEFAULT_SETTINGS.aboutStoryParagraphs || []
  );

  // 2. Frakt & leverans
  const [shippingSections, setShippingSections] = useState<InfoSection[]>(() =>
    settings.shippingSections?.length ? settings.shippingSections : DEFAULT_SETTINGS.shippingSections || []
  );

  // 3. Köpvillkor
  const [termsSections, setTermsSections] = useState<InfoSection[]>(() =>
    settings.termsSections?.length ? settings.termsSections : DEFAULT_SETTINGS.termsSections || []
  );

  // 4. FAQ
  const [faqItems, setFaqItems] = useState<FaqSettingItem[]>(() =>
    settings.faqItems?.length ? settings.faqItems : DEFAULT_SETTINGS.faqItems || []
  );

  // Announcement Bar
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(() =>
    settings.announcementEnabled !== undefined ? settings.announcementEnabled : DEFAULT_SETTINGS.announcementEnabled ?? true
  );
  const [announcementText, setAnnouncementText] = useState<string>(() =>
    settings.announcementText !== undefined ? settings.announcementText : DEFAULT_SETTINGS.announcementText || ''
  );

  // Popular Search Terms
  const [popularSearchTerms, setPopularSearchTerms] = useState<string[]>(() =>
    settings.popularSearchTerms?.length ? settings.popularSearchTerms : DEFAULT_SETTINGS.popularSearchTerms || []
  );

  // Search Terms Handlers
  const handleAddSearchTerm = () => {
    setPopularSearchTerms(prev => [...prev, '']);
  };
  const handleUpdateSearchTerm = (index: number, value: string) => {
    setPopularSearchTerms(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveSearchTerm = (index: number) => {
    setPopularSearchTerms(prev => prev.filter((_, i) => i !== index));
  };
  const handleMoveSearchTerm = (index: number, direction: 'up' | 'down') => {
    setPopularSearchTerms(prev => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  // About Paragraphs Handlers
  const handleAddAboutParagraph = () => {
    setAboutStoryParagraphs(prev => [...prev, '']);
  };
  const handleUpdateAboutParagraph = (index: number, value: string) => {
    setAboutStoryParagraphs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const handleRemoveAboutParagraph = (index: number) => {
    setAboutStoryParagraphs(prev => prev.filter((_, i) => i !== index));
  };
  const handleMoveAboutParagraph = (index: number, direction: 'up' | 'down') => {
    setAboutStoryParagraphs(prev => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  // Shipping Sections Handlers
  const handleAddShippingSection = () => {
    setShippingSections(prev => [...prev, { title: '', content: '' }]);
  };
  const handleUpdateShippingSection = (index: number, field: keyof InfoSection, value: string) => {
    setShippingSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const handleRemoveShippingSection = (index: number) => {
    setShippingSections(prev => prev.filter((_, i) => i !== index));
  };
  const handleMoveShippingSection = (index: number, direction: 'up' | 'down') => {
    setShippingSections(prev => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  // Terms Sections Handlers
  const handleAddTermsSection = () => {
    setTermsSections(prev => [...prev, { title: '', content: '' }]);
  };
  const handleUpdateTermsSection = (index: number, field: keyof InfoSection, value: string) => {
    setTermsSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const handleRemoveTermsSection = (index: number) => {
    setTermsSections(prev => prev.filter((_, i) => i !== index));
  };
  const handleMoveTermsSection = (index: number, direction: 'up' | 'down') => {
    setTermsSections(prev => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  // FAQ Handlers
  const handleAddFaqItem = () => {
    setFaqItems(prev => [...prev, { id: `faq-${Date.now()}`, question: '', answer: '', category: 'forfragan' }]);
  };
  const handleUpdateFaqItem = (index: number, field: keyof FaqSettingItem, value: string) => {
    setFaqItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const handleRemoveFaqItem = (index: number) => {
    setFaqItems(prev => prev.filter((_, i) => i !== index));
  };
  const handleMoveFaqItem = (index: number, direction: 'up' | 'down') => {
    setFaqItems(prev => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };
  
  // FOOTER STATE
  const [logoImageUrl, setLogoImageUrl] = useState(() => normalizeHeroImageUrl(settings.logoImageUrl || ''));
  const [logoTagline, setLogoTagline] = useState(settings.logoTagline ?? 'VIRKADE PRODUKTER');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [footerBrandName, setFooterBrandName] = useState(settings.footerBrandName ?? 'SAGOMASKAN');
  const [footerTagline, setFooterTagline] = useState(settings.footerTagline ?? 'VIRKADE PRODUKTER');
  const [footerDescription, setFooterDescription] = useState(settings.footerDescription ?? 'Handgjorda virkade produkter, skapade med omsorg och glädje.');

  const [footerPageLinks, setFooterPageLinks] = useState<FooterLink[]>(() =>
    settings.footerPageLinks?.length ? settings.footerPageLinks : [
      { label: 'Hem', href: 'home', enabled: true },
      { label: 'Shop', href: 'shop', enabled: true },
      { label: 'Om mig', href: 'about', enabled: true },
      { label: 'Kontakt', href: 'contact', enabled: true },
    ]
  );

  const [footerInfoLinks, setFooterInfoLinks] = useState<FooterLink[]>(() =>
    settings.footerInfoLinks?.length ? settings.footerInfoLinks : [
      { label: 'Frakt & leverans', href: 'shipping', enabled: true },
      { label: 'Köpvillkor', href: 'terms', enabled: true },
      { label: 'FAQ', href: 'faq', enabled: true },
    ]
  );

  const [footerInstagramLabel, setFooterInstagramLabel] = useState(settings.footerInstagramLabel ?? 'Instagram');
  const [footerInstagramUrl, setFooterInstagramUrl] = useState(settings.footerInstagramUrl ?? 'https://instagram.com/sagomaskan');
  const [footerInstagramEnabled, setFooterInstagramEnabled] = useState(settings.footerInstagramEnabled ?? true);

  const [footerEmailLabel, setFooterEmailLabel] = useState(settings.footerEmailLabel ?? 'E-post');
  const [footerEmail, setFooterEmail] = useState(settings.footerEmail ?? settings.email ?? 'hello@sagomaskan.se');

  const [footerContactLabel, setFooterContactLabel] = useState(settings.footerContactLabel ?? 'Kontakt');
  const [footerContactUrl, setFooterContactUrl] = useState(settings.footerContactUrl ?? 'contact');
  const [footerContactEnabled, setFooterContactEnabled] = useState(settings.footerContactEnabled ?? true);

  const [footerCopyright, setFooterCopyright] = useState(settings.footerCopyright ?? '© Sagomaskan. Alla rättigheter reserverade.');
  const [footerSignature, setFooterSignature] = useState(settings.footerSignature ?? 'Små maskor – stora leenden. ♡');
  const [footerShowAdminLink, setFooterShowAdminLink] = useState(settings.footerShowAdminLink ?? false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleConfirmStatusChange = async () => {
    setIsSavingStatus(true);
    try {
      await onSaveSettings({ maintenanceMode: statusConfirmTarget });
      setMaintenanceMode(statusConfirmTarget);
      setShowStatusConfirmModal(false);
      setNotice(
        statusConfirmTarget
          ? 'Webbplatsen är nu stängd för kunder (underhållsläge aktivt).'
          : 'Webbplatsen är nu öppen för kunder.'
      );
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      console.error('Kunde inte uppdatera webbplatsstatus:', err);
      setNotice('Ett fel uppstod när webbplatsstatusen skulle sparas.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handlePageLinkChange = (index: number, field: keyof FooterLink, value: any) => {
    setFooterPageLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleInfoLinkChange = (index: number, field: keyof FooterLink, value: any) => {
    setFooterInfoLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleLogoFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Vänligen välj en giltig bildfil (JPG, PNG, WebP).');
      return;
    }

    setLogoUploadError(null);
    setUploadingLogo(true);

    const safetyTimeout = setTimeout(() => {
      setUploadingLogo((current) => {
        if (current) {
          setLogoUploadError('Uppladdningen tog för lång tid.');
          return false;
        }
        return current;
      });
    }, 10000);

    try {
      const url = await uploadLogoImage(file);
      clearTimeout(safetyTimeout);
      setUploadingLogo(false);
      
      if (url) {
        setLogoImageUrl(url);
      } else {
        setLogoUploadError('Kunde inte få en giltig URL från uppladdningen.');
      }
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      setUploadingLogo(false);
      setLogoUploadError(err.message || 'Ett fel uppstod vid bilduppladdningen.');
    }
  };

  const handleLogoFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleLogoFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImageUrl('');
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Vänligen välj en giltig bildfil (JPG, PNG, WebP).');
      return;
    }

    setUploadError(null);
    setUploadingImage(true);

    const safetyTimeout = setTimeout(() => {
      setUploadingImage((current) => {
        if (current) {
          setUploadError('Uppladdningen tog för lång tid. Försök med en mindre bildfil eller ange bild-URL manuellt.');
          return false;
        }
        return current;
      });
    }, 10000);

    try {
      const url = await uploadHeroImage(file);
      clearTimeout(safetyTimeout);
      const cleanUrl = normalizeHeroImageUrl(url);
      setHeroImage(cleanUrl);
      setExternalUrlInput('');
      setNotice('Bilden har bearbetats! Klicka på "Spara ändringar" nedan för att publicera den.');
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('Image upload failed:', err);
      setUploadError(err?.message || 'Kunde inte ladda upp bilden. Försök igen eller ange bild-URL manuellt.');
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExternalUrlChange = (val: string) => {
    setExternalUrlInput(val);
    if (val.trim()) {
      setHeroImage(val.trim());
    } else if (!heroImage || isExternalWebUrl(heroImage)) {
      setHeroImage('');
    }
  };

  const handleRemoveHeroImage = () => {
    setHeroImage('');
    setExternalUrlInput('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleAboutFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAboutUploadError('Vänligen välj en giltig bildfil (JPG, PNG, WebP).');
      return;
    }

    setAboutUploadError(null);
    setUploadingAboutImage(true);

    const safetyTimeout = setTimeout(() => {
      setUploadingAboutImage((current) => {
        if (current) {
          setAboutUploadError('Uppladdningen tog för lång tid. Försök med en mindre bildfil eller ange bild-URL manuellt.');
          return false;
        }
        return current;
      });
    }, 10000);

    try {
      const url = await uploadAboutImage(file);
      clearTimeout(safetyTimeout);
      const cleanUrl = normalizeHeroImageUrl(url);
      setAboutImageUrl(cleanUrl);
      setAboutExternalUrlInput('');
      setNotice('Bilden för "Om hantverket" har bearbetats! Klicka på "Spara ändringar" nedan för att publicera den.');
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('About image upload failed:', err);
      setAboutUploadError(err?.message || 'Kunde inte ladda upp bilden. Försök igen eller ange bild-URL manuellt.');
    } finally {
      clearTimeout(safetyTimeout);
      setUploadingAboutImage(false);
      if (aboutFileInputRef.current) {
        aboutFileInputRef.current.value = '';
      }
    }
  };

  const handleAboutExternalUrlChange = (val: string) => {
    setAboutExternalUrlInput(val);
    if (val.trim()) {
      setAboutImageUrl(val.trim());
    } else if (!aboutImageUrl || isExternalWebUrl(aboutImageUrl)) {
      setAboutImageUrl('');
    }
  };

  const handleRemoveAboutImage = () => {
    setAboutImageUrl('');
    setAboutExternalUrlInput('');
  };

  const handleAboutFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAboutFileProcess(e.target.files[0]);
    }
  };

  const handleAboutDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAbout(true);
  };

  const handleAboutDragLeave = () => {
    setIsDraggingAbout(false);
  };

  const handleAboutDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAbout(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAboutFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalHero = normalizeHeroImageUrl(heroImage.trim() || externalUrlInput.trim());
      const finalAboutImage = normalizeHeroImageUrl(aboutImageUrl.trim() || aboutExternalUrlInput.trim());
      await onSaveSettings({
        email: email.trim(),
        instagram: instagram.trim(),
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        heroImage: finalHero,
        heroProductId: heroProductId.trim(),
        heroProductBadge: heroProductBadge.trim(),
        heroProductEnabled,
        aboutText: aboutText.trim(),
        aboutImageUrl: finalAboutImage,
        maintenanceMode: Boolean(maintenanceMode),

        // Innehållssidor & FAQ
        aboutStoryParagraphs: aboutStoryParagraphs.map(p => p.trim()).filter(Boolean),
        shippingSections: shippingSections.map(s => ({ title: s.title.trim(), content: s.content.trim() })),
        termsSections: termsSections.map(s => ({ title: s.title.trim(), content: s.content.trim() })),
        faqItems: faqItems.map((f, i) => ({
          id: f.id || `faq-${i}`,
          question: f.question.trim(),
          answer: f.answer.trim(),
          category: f.category || 'forfragan'
        })),

        // Announcement bar & Populära söktermer
        announcementEnabled,
        announcementText: announcementText.trim(),
        popularSearchTerms: popularSearchTerms.map(t => t.trim()).filter(Boolean),

        // Välkomst-popup
        welcomePopupEnabled,
        welcomePopupTitle: welcomePopupTitle.trim(),
        welcomePopupDiscountText: welcomePopupDiscountText.trim(),
        welcomePopupDiscountCode: welcomePopupDiscountCode.trim(),
        welcomePopupImageUrl: normalizeHeroImageUrl(welcomePopupImageUrl.trim()),

        // Footer fields
        logoImageUrl: normalizeHeroImageUrl(logoImageUrl),
        logoTagline: logoTagline.trim(),
        footerBrandName: footerBrandName.trim(),
        footerTagline: footerTagline.trim(),
        footerDescription: footerDescription.trim(),
        footerPageLinks: footerPageLinks.map(l => ({ ...l, label: l.label.trim(), href: l.href.trim() })),
        footerInfoLinks: footerInfoLinks.map(l => ({ ...l, label: l.label.trim(), href: l.href.trim() })),
        footerInstagramLabel: footerInstagramLabel.trim(),
        footerInstagramUrl: footerInstagramUrl.trim(),
        footerInstagramEnabled,
        footerEmailLabel: footerEmailLabel.trim(),
        footerEmail: footerEmail.trim(),
        footerContactLabel: footerContactLabel.trim(),
        footerContactUrl: footerContactUrl.trim(),
        footerContactEnabled,
        footerCopyright: footerCopyright.trim(),
        footerSignature: footerSignature.trim(),
        footerShowAdminLink,
      });
      setNotice('Inställningarna har sparats och uppdaterats på webbplatsen.');
      setTimeout(() => setNotice(null), 3500);
    } catch (e) {
      setNotice('Kunde inte spara inställningarna.');
    } finally {
      setSaving(false);
    }
  };

  const getPageHeaderDetails = () => {
    switch (activeTab) {
      case 'status':
        return {
          group: 'DRIFT',
          title: 'Webbplatsstatus',
          desc: 'Styr om Sagomaskan är öppen för besökare eller om underhållsläget är aktivt.'
        };
      case 'website':
        return {
          group: 'WEBBPLATS',
          title: 'Startsida & Kampanjer',
          desc: 'Bestäm vad kunderna möts av på startsidan, popups och vilka tillfälliga meddelanden som visas.'
        };
      case 'content':
        return {
          group: 'INNEHÅLL',
          title: 'Innehåll & FAQ',
          desc: 'Hantera personliga berättelser, köpvillkor, fraktvillkor och dina vanliga frågor under samlade sidor.'
        };
      case 'contact':
        return {
          group: 'KONTAKT & FOOTER',
          title: 'Kontakt & Sidfot',
          desc: 'Konfigurera butikens kontaktvägar, sociala medielänkar samt layout, länkar och logotyp i sidfoten.'
        };
    }
  };

  const header = getPageHeaderDetails();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* 1. Page Header */}
      <div className="pb-5 border-b border-[#E6DFD3]">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B8E7B] font-bold">
          {header.group}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#242D27] font-semibold mt-1">
          {header.title}
        </h1>
        <p className="text-sm text-[#66726A] font-light mt-0.5">
          {header.desc}
        </p>
      </div>

      {/* Save feedback banner */}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#EFF4F1] border border-[#6B8E7B]/25 text-xs text-[#242D27] font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#526E5F]" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-[#526E5F] hover:text-[#242D27] p-1 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Split Navigation & Content Shell */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Left Side Navigation (Desktop static, Mobile horizontal scroll) */}
        <div className="w-full lg:w-60 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-1 bg-[#FAF8F5] p-2 border border-[#E6DFD3] rounded-2xl flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-none shadow-2xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#242D27] text-[#FAF8F5] shadow-xs'
                      : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                  }`}
                >
                  <span className={isActive ? 'text-[#FAF8F5]' : 'text-[#6B8E7B]'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Settings Form Container */}
        <div className="flex-1 min-w-0 w-full">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
        
            {/* AREA 1: WEBBPLATSSTATUS (DRIFT) */}
            {activeTab === 'status' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
                  
                  <div className="pb-4 border-b border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h3 className="font-serif text-xl text-[#242D27] font-semibold flex items-center gap-2">
                        <Power className="w-4.5 h-4.5 text-[#6B8E7B]" />
                        <span>Underhållsläge</span>
                      </h3>
                      <p className="text-xs text-[#66726A] font-light">
                        Stäng butiken tillfälligt för besökare under uppdateringar.
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
                        maintenanceMode
                          ? 'bg-[#FAF4F3] text-[#8C5248] border-[#8C5248]/20'
                          : 'bg-[#EFF4F1] text-[#526E5F] border-[#6B8E7B]/20'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          maintenanceMode ? 'bg-[#8C5248] animate-pulse' : 'bg-[#526E5F]'
                        }`}
                      />
                      <span>{maintenanceMode ? 'Underhållsläge aktivt' : 'Butik öppen'}</span>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      maintenanceMode
                        ? 'bg-[#FAF4F3]/40 border-[#E8C5C0]'
                        : 'bg-[#EFF4F1]/30 border-[#D5E5DC]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#66726A]">
                          VÄLJ DRIFTSTATUS
                        </div>
                        <h4 className="font-serif text-lg text-[#242D27] font-semibold">
                          {maintenanceMode
                            ? 'Webbplatsen är stängd för kunder.'
                            : 'Webbplatsen är helt öppen för besökare.'}
                        </h4>
                        <p className="text-xs text-[#66726A] font-light leading-relaxed max-w-xl">
                          {maintenanceMode
                            ? 'Kunder som besöker butiken kommer att mötas av en elegant svensk underhållssida. Du kan fortfarande nå och ändra allt i adminpanelen som vanligt.'
                            : 'Din butik är i full drift. Kunder kan besöka dina sidor, se produkter och skicka in beställningsförfrågningar.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInitiateStatusChange(!maintenanceMode)}
                        className={`shrink-0 inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                          maintenanceMode
                            ? 'bg-[#242D27] hover:bg-[#344038] text-[#FAF8F5]'
                            : 'bg-[#8C5248] hover:bg-[#78433A] text-[#FAF8F5]'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>
                          {maintenanceMode ? 'Öppna webbplatsen' : 'Aktivera underhållsläge'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Informational shield alert box */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#66726A] space-y-1.5 shadow-3xs">
                    <div className="font-semibold text-[#242D27] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#6B8E7B]" />
                      <span>Permanent lagring & Åtkomstsäkerhet</span>
                    </div>
                    <p className="font-light leading-relaxed">
                      Sajtstatusen sparas direkt i din Firestore-databas. Du har alltid tillgång till admin-panelen via ditt administratörskonto oavsett driftläge.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* AREA 2: STARTSIDA & KAMPANJER (WEBBPLATS) */}
            {activeTab === 'website' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* 1. HERO SECTION */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
                  <div className="pb-3 border-b border-[#E6DFD3]">
                    <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                      <Type className="w-4.5 h-4.5 text-[#6B8E7B]" />
                      <span>Startsida & Välkomsttitel</span>
                    </h3>
                    <p className="text-xs text-[#66726A] font-light mt-0.5">
                      Här anpassar du den rubrik och text som möter besökaren på förstasidan.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">
                        Huvudrubrik (Hero-titel)
                      </label>
                      <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">
                        Underrubrik / Introduktion
                      </label>
                      <textarea
                        rows={2}
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>

                    {/* Hero image preview & upload */}
                    <div className="pt-4 border-t border-[#E6DFD3]/60 space-y-3">
                      <label className="block text-xs font-semibold text-[#242D27]">
                        Hero-bild (Startsida)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        {/* Preview box */}
                        <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#F3EFE8] aspect-4/3 flex items-center justify-center">
                          {heroImage ? (
                            <>
                              <img
                                src={heroImage}
                                alt="Hero preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={handleRemoveHeroImage}
                                  className="p-2 rounded-xl bg-white/95 text-red-600 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Ta bort</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-[#66726A] space-y-1">
                              <ImageIcon className="w-7 h-7 mx-auto text-[#6B8E7B]/70" />
                              <p className="text-[10px] font-semibold text-[#242D27]">Standardbild aktiv</p>
                              <p className="text-[9px] font-light">Ladda upp en egen bild för startsidan.</p>
                            </div>
                          )}
                        </div>

                        {/* Upload box */}
                        <div className="sm:col-span-7 space-y-3">
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                              isDragging
                                ? 'border-[#6B8E7B] bg-[#EFF4F1]'
                                : 'border-[#D4CBBF] hover:border-[#6B8E7B] bg-[#FAF8F5]'
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                            {uploadingImage ? (
                              <div className="py-2 flex flex-col items-center gap-1.5 text-xs text-[#526E5F]">
                                <RefreshCw className="w-4 h-4 animate-spin text-[#6B8E7B]" />
                                <span>Laddar upp bild...</span>
                              </div>
                            ) : (
                              <div className="py-1 flex flex-col items-center gap-1 text-[#526E5F]">
                                <Upload className="w-4 h-4 text-[#6B8E7B]" />
                                <p className="text-[11px] font-semibold text-[#242D27]">Välj bild eller släpp filen här</p>
                                <p className="text-[9px] text-[#66726A] font-light">JPG, PNG eller WebP</p>
                              </div>
                            )}
                          </div>

                          {uploadError && (
                            <div className="text-[11px] text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{uploadError}</span>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-semibold text-[#66726A] mb-1">
                              Eller ange bild-URL direkt:
                            </label>
                            <input
                              type="text"
                              value={externalUrlInput}
                              onChange={(e) => handleExternalUrlChange(e.target.value)}
                              placeholder="https://images.unsplash.com/..."
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Featured product on hero */}
                    <div className="pt-4 border-t border-[#E6DFD3]/60 space-y-3">
                      <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-[#242D27] block">
                            Hero-produkt
                          </span>
                          <p className="text-[11px] text-[#66726A] font-light leading-relaxed max-w-md">
                            Visa eller dölj en utvald produkt direkt i anslutning till herosektionen på startsidan.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setHeroProductEnabled((prev) => !prev)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] ${
                            heroProductEnabled ? 'bg-[#6B8E7B]' : 'bg-[#D4CBBF]'
                          }`}
                        >
                          <span className="sr-only">Aktivera Hero-produkt</span>
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                              heroProductEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {heroProductEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 animate-fadeIn">
                          <div>
                            <label className="block text-xs font-semibold text-[#242D27] mb-1">
                              Välj produkt i shopen
                            </label>
                            <select
                              value={heroProductId}
                              onChange={(e) => setHeroProductId(e.target.value)}
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
                            >
                              <option value="">-- Välj produkt --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.price} kr)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#242D27] mb-1">
                              Märkning (Badge-etikett)
                            </label>
                            <input
                              type="text"
                              value={heroProductBadge}
                              onChange={(e) => setHeroProductBadge(e.target.value)}
                              placeholder="Unikt hantverk"
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* 2. ANNOUNCEMENT BAR */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <div className="pb-3 border-b border-[#E6DFD3] flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg text-[#242D27] font-semibold">
                        Meddelanderad (Announcement bar)
                      </h3>
                      <p className="text-xs text-[#66726A] font-light mt-0.5">
                        Ligger som en tunn meddelandeband längst upp i sidhuvudet i butiken.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAnnouncementEnabled((prev) => !prev)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] ${
                        announcementEnabled ? 'bg-[#6B8E7B]' : 'bg-[#D4CBBF]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          announcementEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {announcementEnabled && (
                    <div className="animate-fadeIn pt-1">
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">Meddelandetext</label>
                      <input
                        type="text"
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="Handgjorda virkade produkter på beställning • Fri frakt vid beställning över 500 kr"
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                  )}
                </div>

                {/* 3. WELCOME POPUP & OFFERS */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3] gap-3">
                    <div>
                      <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                        <Gift className="w-4.5 h-4.5 text-[#6B8E7B]" />
                        <span>Välkomst-popup (Erbjudande)</span>
                      </h3>
                      <p className="text-xs text-[#66726A] font-light mt-0.5">
                        Visar en välkomstmeddelande-popup med rabattkod för nya besökare.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWelcomePopupEnabled((prev) => !prev)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] ${
                        welcomePopupEnabled ? 'bg-[#6B8E7B]' : 'bg-[#D4CBBF]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          welcomePopupEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {welcomePopupEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Rubrik</label>
                        <input
                          type="text"
                          value={welcomePopupTitle}
                          onChange={(e) => setWelcomePopupTitle(e.target.value)}
                          placeholder="Välkommen till Sagomaskan"
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Erbjudande (Brödtext)</label>
                        <input
                          type="text"
                          value={welcomePopupDiscountText}
                          onChange={(e) => setWelcomePopupDiscountText(e.target.value)}
                          placeholder="Få 10 % på din första beställning!"
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Rabattkod att ge</label>
                        <input
                          type="text"
                          value={welcomePopupDiscountCode}
                          onChange={(e) => setWelcomePopupDiscountCode(e.target.value.toUpperCase())}
                          placeholder="VÄLKOMMEN10"
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] font-mono focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Popup Bild-URL (Valfri)</label>
                        <input
                          type="text"
                          value={welcomePopupImageUrl}
                          onChange={(e) => setWelcomePopupImageUrl(e.target.value)}
                          placeholder="https://... (lämna tom för standard)"
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. POPULÄRA SÖKNINGAR */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
                    <div>
                      <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                        <Tag className="w-4.5 h-4.5 text-[#6B8E7B]" />
                        <span>Populära sökningar (Snabbsökord)</span>
                      </h3>
                      <p className="text-xs text-[#66726A] font-light mt-0.5">
                        Dessa ord visas som klickbara sökförslag när besökaren klickar på sökknappen.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSearchTerm}
                      className="px-3.5 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-semibold rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lägg till ord</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {popularSearchTerms.map((term, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-2.5">
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => handleUpdateSearchTerm(idx, e.target.value)}
                          placeholder="t.ex. Skallra"
                          className="flex-1 bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                        <div className="flex items-center">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSearchTerm(idx, 'up')}
                            className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === popularSearchTerms.length - 1}
                            onClick={() => handleMoveSearchTerm(idx, 'down')}
                            className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSearchTerm(idx)}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* AREA 3: INNEHÅLL & FAQ (INNEHÅLL) */}
            {activeTab === 'content' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Secondary horizontal sub-navigation */}
                <div className="border-b border-[#E6DFD3] pb-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('about')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeSubTab === 'about'
                        ? 'bg-[#242D27] text-[#FAF8F5]'
                        : 'text-[#66726A] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Om hantverket
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('shipping')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeSubTab === 'shipping'
                        ? 'bg-[#242D27] text-[#FAF8F5]'
                        : 'text-[#66726A] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Frakt & leverans
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('terms')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeSubTab === 'terms'
                        ? 'bg-[#242D27] text-[#FAF8F5]'
                        : 'text-[#66726A] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    Köpvillkor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('faq')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeSubTab === 'faq'
                        ? 'bg-[#242D27] text-[#FAF8F5]'
                        : 'text-[#66726A] hover:bg-[#F3EFE8]'
                    }`}
                  >
                    FAQ
                  </button>
                </div>

                {/* Sub-tab 1: Om hantverket */}
                {activeSubTab === 'about' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
                      <div className="pb-3 border-b border-[#E6DFD3]">
                        <h3 className="font-serif text-lg text-[#242D27] font-semibold">
                          Om hantverket & Berättelsen
                        </h3>
                        <p className="text-xs text-[#66726A] font-light mt-0.5">
                          Presentera dig själv, din ateljé och din virkningsberättelse för kunderna.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                        {/* Image Preview */}
                        <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#F3EFE8] aspect-4/3 flex items-center justify-center">
                          {aboutImageUrl ? (
                            <>
                              <img
                                src={aboutImageUrl}
                                alt="Om mig förhandsvisning"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <button
                                  type="button"
                                  onClick={handleRemoveAboutImage}
                                  className="px-3 py-1.5 rounded-xl bg-white/95 text-red-600 hover:bg-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Ta bort</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-[#66726A] space-y-1">
                              <ImageIcon className="w-7 h-7 mx-auto text-[#6B8E7B]/70" />
                              <p className="text-[10px] font-semibold text-[#242D27]">Ingen bild</p>
                              <p className="text-[9px] font-light">Ladda upp en ateljé/porträttbild.</p>
                            </div>
                          )}
                        </div>

                        {/* Image upload */}
                        <div className="sm:col-span-7 space-y-3">
                          <div
                            onDragOver={handleAboutDragOver}
                            onDragLeave={handleAboutDragLeave}
                            onDrop={handleAboutDrop}
                            onClick={() => aboutFileInputRef.current?.click()}
                            className="border border-dashed rounded-2xl p-4 text-center cursor-pointer hover:border-[#6B8E7B] bg-[#FAF8F5]"
                          >
                            <input
                              type="file"
                              ref={aboutFileInputRef}
                              onChange={handleAboutFileInputChange}
                              accept="image/*"
                              className="hidden"
                            />
                            {uploadingAboutImage ? (
                              <p className="text-xs text-[#526E5F]">Laddar upp bild...</p>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-[#526E5F]">
                                <Upload className="w-4 h-4 text-[#6B8E7B]" />
                                <p className="text-[11px] font-semibold text-[#242D27]">Släpp porträttbild här eller välj</p>
                              </div>
                            )}
                          </div>

                          {aboutUploadError && <p className="text-xs text-red-600">{aboutUploadError}</p>}

                          <div>
                            <input
                              type="text"
                              value={aboutExternalUrlInput}
                              onChange={(e) => handleAboutExternalUrlChange(e.target.value)}
                              placeholder="Klistra in bild-URL..."
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Story paragraphs list */}
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
                        <h4 className="font-serif text-base text-[#242D27] font-semibold">Brödtext och stycken</h4>
                        <button
                          type="button"
                          onClick={handleAddAboutParagraph}
                          className="px-3 py-1 rounded-xl bg-[#EFF4F1] text-[#242D27] text-xs font-semibold hover:bg-[#E6DFD3] cursor-pointer shadow-3xs"
                        >
                          + Lägg till stycke
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {aboutStoryParagraphs.map((para, idx) => (
                          <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#6B8E7B]">Stycke {idx + 1}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveAboutParagraph(idx, 'up')}
                                  className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === aboutStoryParagraphs.length - 1}
                                  onClick={() => handleMoveAboutParagraph(idx, 'down')}
                                  className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAboutParagraph(idx)}
                                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              value={para}
                              onChange={(e) => handleUpdateAboutParagraph(idx, e.target.value)}
                              placeholder="Berätta om ditt skapande..."
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Shipping */}
                {activeSubTab === 'shipping' && (
                  <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
                      <div>
                        <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                          <Truck className="w-4.5 h-4.5 text-[#6B8E7B]" />
                          <span>Frakt & leveransvillkor</span>
                        </h3>
                        <p className="text-xs text-[#66726A] font-light mt-0.5">
                          Hantera rubriker och informationstexter för leveranser och frakt.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddShippingSection}
                        className="px-3.5 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-semibold rounded-xl hover:bg-[#E6DFD3] cursor-pointer shadow-3xs"
                      >
                        + Lägg till avsnitt
                      </button>
                    </div>

                    <div className="space-y-4">
                      {shippingSections.map((sec, idx) => (
                        <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#6B8E7B]">Leveransavsnitt {idx + 1}</span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveShippingSection(idx, 'up')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === shippingSections.length - 1}
                                onClick={() => handleMoveShippingSection(idx, 'down')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveShippingSection(idx)}
                                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => handleUpdateShippingSection(idx, 'title', e.target.value)}
                            placeholder="Rubrik på avsnitt (t.ex. Frakttid)"
                            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          />
                          <textarea
                            rows={3}
                            value={sec.content}
                            onChange={(e) => handleUpdateShippingSection(idx, 'content', e.target.value)}
                            placeholder="Skriv text för leveransavsnittet..."
                            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 3: Terms */}
                {activeSubTab === 'terms' && (
                  <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
                      <div>
                        <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-[#6B8E7B]" />
                          <span>Köpvillkor & köpinformation</span>
                        </h3>
                        <p className="text-xs text-[#66726A] font-light mt-0.5">
                          Redigera textblocken som visas på butikens köpvillkor-sida.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTermsSection}
                        className="px-3.5 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-semibold rounded-xl hover:bg-[#E6DFD3] cursor-pointer shadow-3xs"
                      >
                        + Lägg till avsnitt
                      </button>
                    </div>

                    <div className="space-y-4">
                      {termsSections.map((sec, idx) => (
                        <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#6B8E7B]">Villkorsavsnitt {idx + 1}</span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveTermsSection(idx, 'up')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === termsSections.length - 1}
                                onClick={() => handleMoveTermsSection(idx, 'down')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTermsSection(idx)}
                                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => handleUpdateTermsSection(idx, 'title', e.target.value)}
                            placeholder="Rubrik på avsnittet (t.ex. Ångerrätt)"
                            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          />
                          <textarea
                            rows={3}
                            value={sec.content}
                            onChange={(e) => handleUpdateTermsSection(idx, 'content', e.target.value)}
                            placeholder="Skriv text för villkorsavsnittet..."
                            className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 4: FAQ */}
                {activeSubTab === 'faq' && (
                  <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
                      <div>
                        <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                          <HelpCircle className="w-4.5 h-4.5 text-[#6B8E7B]" />
                          <span>Vanliga frågor (FAQ)</span>
                        </h3>
                        <p className="text-xs text-[#66726A] font-light mt-0.5">
                          Lägg till och redigera svar på kunders vanligaste funderingar.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFaqItem}
                        className="px-3.5 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-semibold rounded-xl hover:bg-[#E6DFD3] cursor-pointer shadow-3xs"
                      >
                        + Lägg till fråga
                      </button>
                    </div>

                    <div className="space-y-4">
                      {faqItems.map((faq, idx) => (
                        <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#6B8E7B]">FAQ Fråga {idx + 1}</span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveFaqItem(idx, 'up')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === faqItems.length - 1}
                                onClick={() => handleMoveFaqItem(idx, 'down')}
                                className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveFaqItem(idx)}
                                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-[#242D27] mb-0.5">Fråga</label>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => handleUpdateFaqItem(idx, 'question', e.target.value)}
                                placeholder="t.ex. Hur gör jag en förfrågan?"
                                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#242D27] mb-0.5">Kategori</label>
                              <select
                                value={faq.category || 'forfragan'}
                                onChange={(e) => handleUpdateFaqItem(idx, 'category', e.target.value)}
                                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] cursor-pointer"
                              >
                                <option value="forfragan">Beställningsförfrågan</option>
                                <option value="produkter">Produkter & Hantverk</option>
                                <option value="betalning">Betalning</option>
                                <option value="leverans">Leverans</option>
                                <option value="skotsel">Skötselråd</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#242D27] mb-0.5">Svar på frågan</label>
                            <textarea
                              rows={3}
                              value={faq.answer}
                              onChange={(e) => handleUpdateFaqItem(idx, 'answer', e.target.value)}
                              placeholder="Svara på frågan här..."
                              className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* AREA 4: KONTAKT & SIDFOT (KONTAKT & FOOTER) */}
            {activeTab === 'contact' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* 1. CONTACT INFO */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <div className="pb-3 border-b border-[#E6DFD3]">
                    <h3 className="font-serif text-lg text-[#242D27] font-semibold flex items-center gap-2">
                      <Mail className="w-4.5 h-4.5 text-[#6B8E7B]" />
                      <span>Kontaktuppgifter & sociala nätverk</span>
                    </h3>
                    <p className="text-xs text-[#66726A] font-light mt-0.5">
                      Officiell butiks-e-post och Instagram-konto.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">
                        Officiell e-post
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">
                        Instagram-användarnamn
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@sagomaskan"
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. LOGO & BRAND DETAILS */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
                  <div className="pb-3 border-b border-[#E6DFD3]">
                    <h3 className="font-serif text-lg text-[#242D27] font-semibold">
                      Varumärkesprofil i sidfoten
                    </h3>
                    <p className="text-xs text-[#66726A] font-light mt-0.5">
                      Inställningar för logotyp, namn, taglines och korta beskrivningar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Logo Image */}
                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-2">
                        Sidfotslogotyp
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-40 h-24 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl flex items-center justify-center overflow-hidden relative shadow-3xs">
                          {logoImageUrl ? (
                            <>
                              <img 
                                src={logoImageUrl} 
                                alt="Logo" 
                                className="w-full h-full object-contain p-2"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="absolute top-1.5 right-1.5 p-1 bg-white/95 rounded-full text-red-500 hover:text-red-700 transition-colors shadow-sm cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-[#8C9890] font-bold uppercase tracking-wider">Märkesnamn visas</span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <input
                            type="file"
                            ref={logoFileInputRef}
                            onChange={handleLogoFileInputChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-white border border-[#E6DFD3] rounded-xl text-xs font-semibold text-[#242D27] hover:bg-[#FAF8F5] cursor-pointer shadow-3xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#6B8E7B]" />
                            <span>Ladda upp logga</span>
                          </button>
                          <p className="text-[9px] text-[#66726A] font-light">Transparent bakgrund rekommenderas.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Butiksnamn</label>
                        <input
                          type="text"
                          value={footerBrandName}
                          onChange={(e) => setFooterBrandName(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#242D27] mb-1">Tagline</label>
                        <input
                          type="text"
                          value={footerTagline}
                          onChange={(e) => setFooterTagline(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">Kort beskrivning i sidfoten</label>
                      <textarea
                        rows={2}
                        value={footerDescription}
                        onChange={(e) => setFooterDescription(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. FOOTER LINKS */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <h3 className="font-serif text-lg text-[#242D27] font-semibold pb-2 border-b border-[#E6DFD3]">
                    Aktiva länkar i sidfoten
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Huvudsidor */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-[#6B8E7B] tracking-wider block">KOLUMN 1: BUTIKSSIDOR</span>
                      {footerPageLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-[#FAF8F5] border border-[#E6DFD3]/70 rounded-xl p-2.5 text-xs">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => handlePageLinkChange(idx, 'enabled', e.target.checked)}
                            className="w-4 h-4 text-[#6B8E7B] accent-[#526E5F] rounded"
                          />
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handlePageLinkChange(idx, 'label', e.target.value)}
                            className="flex-1 bg-transparent focus:outline-none border-b border-transparent focus:border-[#6B8E7B] font-semibold"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Informationssidor */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold text-[#6B8E7B] tracking-wider block">KOLUMN 2: INFORMATIONSSIDOR</span>
                      {footerInfoLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-[#FAF8F5] border border-[#E6DFD3]/70 rounded-xl p-2.5 text-xs">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => handleInfoLinkChange(idx, 'enabled', e.target.checked)}
                            className="w-4 h-4 text-[#6B8E7B] accent-[#526E5F] rounded"
                          />
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleInfoLinkChange(idx, 'label', e.target.value)}
                            className="flex-1 bg-transparent focus:outline-none border-b border-transparent focus:border-[#6B8E7B] font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. FOOTER DETAILS & CONTACT */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <h3 className="font-serif text-lg text-[#242D27] font-semibold pb-2 border-b border-[#E6DFD3]">
                    Sidfotens länkade uppgifter
                  </h3>

                  <div className="space-y-3.5">
                    {/* Instagram in footer */}
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#242D27]">Instagram-länk</span>
                        <p className="text-[11px] text-[#66726A] font-light">Hantera länkens text och URL i footern.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={footerInstagramEnabled}
                          onChange={(e) => setFooterInstagramEnabled(e.target.checked)}
                          className="w-4 h-4 text-[#6B8E7B] accent-[#526E5F] rounded"
                        />
                        <input
                          type="text"
                          value={footerInstagramLabel}
                          onChange={(e) => setFooterInstagramLabel(e.target.value)}
                          placeholder="Instagram"
                          className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={footerInstagramUrl}
                          onChange={(e) => setFooterInstagramUrl(e.target.value)}
                          placeholder="URL"
                          className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs w-48"
                        />
                      </div>
                    </div>

                    {/* Email in footer */}
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#242D27]">E-post</span>
                        <p className="text-[11px] text-[#66726A] font-light">E-postadress och etikett i footern.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={footerEmailLabel}
                          onChange={(e) => setFooterEmailLabel(e.target.value)}
                          placeholder="E-post"
                          className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={footerEmail}
                          onChange={(e) => setFooterEmail(e.target.value)}
                          placeholder="hello@sagomaskan.se"
                          className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs w-48"
                        />
                      </div>
                    </div>

                    {/* Contact Page link in footer */}
                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#242D27]">Kontaktformulär</span>
                        <p className="text-[11px] text-[#66726A] font-light">Mållänk och text till kontaktformulär.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={footerContactEnabled}
                          onChange={(e) => setFooterContactEnabled(e.target.checked)}
                          className="w-4 h-4 text-[#6B8E7B] accent-[#526E5F] rounded"
                        />
                        <input
                          type="text"
                          value={footerContactLabel}
                          onChange={(e) => setFooterContactLabel(e.target.value)}
                          placeholder="Kontakt"
                          className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. COPYRIGHT & SITEMAP */}
                <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                  <h3 className="font-serif text-lg text-[#242D27] font-semibold pb-2 border-b border-[#E6DFD3]">
                    Copyright, signatur och administration
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">Copyright-rad</label>
                      <input
                        type="text"
                        value={footerCopyright}
                        onChange={(e) => setFooterCopyright(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#242D27] mb-1">Personlig signatur (Slogan-avslut)</label>
                      <input
                        type="text"
                        value={footerSignature}
                        onChange={(e) => setFooterSignature(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27]"
                      />
                    </div>

                    <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-semibold text-[#242D27]">Visa "Admin"-länk för besökare</span>
                        <p className="text-[11px] text-[#66726A] font-light">Lägger till en diskret länk till administrationspanelen längst ner i sidfoten.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={footerShowAdminLink}
                        onChange={(e) => setFooterShowAdminLink(e.target.checked)}
                        className="w-4 h-4 text-[#6B8E7B] accent-[#526E5F] rounded shrink-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || uploadingImage || uploadingAboutImage || uploadingLogo}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-semibold hover:bg-[#344038] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#526E5F]" />
                <span>{saving ? 'Sparar...' : 'Spara ändringar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation modal for underhållsläge status change */}
      {showStatusConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-xs border bg-[#F3EFE8]">
              {statusConfirmTarget ? (
                <AlertCircle className="w-6 h-6 text-[#8C5248]" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-[#526E5F]" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-2xl text-[#242D27] font-semibold">
                {statusConfirmTarget ? 'Stäng webbplatsen för kunder?' : 'Öppna webbplatsen?'}
              </h3>
              <p className="text-xs text-[#66726A] font-light leading-relaxed">
                {statusConfirmTarget
                  ? 'Kunder kommer endast att se underhållssidan tills du väljer att öppna butiken igen.'
                  : 'Webbplatsen och kassan blir nu helt öppna och synliga för kunder.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={() => setShowStatusConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={handleConfirmStatusChange}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-xs cursor-pointer ${
                  statusConfirmTarget
                    ? 'bg-[#8C5248] hover:bg-[#78433A]'
                    : 'bg-[#526E5F] hover:bg-[#41584C]'
                }`}
              >
                {isSavingStatus
                  ? 'Sparar...'
                  : statusConfirmTarget
                  ? 'Stäng webbplats'
                  : 'Öppna webbplats'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
