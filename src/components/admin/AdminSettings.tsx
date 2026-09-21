import React, { useState, useRef, ReactNode, useEffect } from 'react';
import { Settings, Save, Check, Mail, Instagram, Type, Image as ImageIcon, Upload, Trash2, RefreshCw, AlertCircle, Layout, Link as LinkIcon, ShieldAlert, Plus, ChevronUp, ChevronDown, BookOpen, Truck, FileText, HelpCircle, Tag, ShoppingBag, Power, CheckCircle2 } from 'lucide-react';
import { SiteSettings, FooterLink, Product, InfoSection, FaqSettingItem } from '../../types';
import { uploadHeroImage, uploadLogoImage, uploadAboutImage, normalizeHeroImageUrl } from '../../services/storage';
import { DEFAULT_SETTINGS } from '../../services/db';

type SettingsTab =
  | 'status'
  | 'hero'
  | 'about'
  | 'info'
  | 'search'
  | 'contact'
  | 'footer'
  | 'orders';

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

  const tabs: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: 'status', label: 'Webbplatsstatus', icon: <Power className="w-4 h-4" /> },
    { id: 'hero', label: 'Startsida & Hero', icon: <Type className="w-4 h-4" /> },
    { id: 'about', label: 'Om hantverket', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'info', label: 'Informationssidor', icon: <FileText className="w-4 h-4" /> },
    { id: 'search', label: 'Sök & navigation', icon: <Tag className="w-4 h-4" /> },
    { id: 'contact', label: 'Kontakt & sociala', icon: <Mail className="w-4 h-4" /> },
    { id: 'footer', label: 'Footer', icon: <Layout className="w-4 h-4" /> },
    { id: 'orders', label: 'Beställningar & meddelanden', icon: <ShoppingBag className="w-4 h-4" /> },
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
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle || 'Handgjorda virkade produkter med kärlek');
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || 'Mjuka detaljer för både stora och små i nordisk, minimalistisk design.');
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
  
  // Distinguish between pure external user-entered web URLs and uploaded/internal assets
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

  // Om hantverket-bild (startsida & om mig)
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

  // --- FAS 2 STATE ---
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

  // --- FAS 3 STATE ---
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

  // --- About Paragraphs Handlers ---
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

  // --- Shipping Sections Handlers ---
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

  // --- Terms Sections Handlers ---
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

  // --- FAQ Handlers ---
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
  
  // --- FOOTER STATE ---
  // 1. Varumärke
  const [logoImageUrl, setLogoImageUrl] = useState(() => normalizeHeroImageUrl(settings.logoImageUrl || ''));
  const [logoTagline, setLogoTagline] = useState(settings.logoTagline ?? 'VIRKADE PRODUKTER');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [footerBrandName, setFooterBrandName] = useState(settings.footerBrandName ?? 'SAGOMASKAN');
  const [footerTagline, setFooterTagline] = useState(settings.footerTagline ?? 'VIRKADE PRODUKTER');
  const [footerDescription, setFooterDescription] = useState(settings.footerDescription ?? 'Handgjorda virkade produkter, skapade med omsorg och glädje.');

  // 2. Sidor
  const [footerPageLinks, setFooterPageLinks] = useState<FooterLink[]>(() =>
    settings.footerPageLinks?.length ? settings.footerPageLinks : [
      { label: 'Hem', href: 'home', enabled: true },
      { label: 'Shop', href: 'shop', enabled: true },
      { label: 'Om mig', href: 'about', enabled: true },
      { label: 'Kontakt', href: 'contact', enabled: true },
    ]
  );

  // 3. Information
  const [footerInfoLinks, setFooterInfoLinks] = useState<FooterLink[]>(() =>
    settings.footerInfoLinks?.length ? settings.footerInfoLinks : [
      { label: 'Frakt & leverans', href: 'shipping', enabled: true },
      { label: 'Köpvillkor', href: 'terms', enabled: true },
      { label: 'FAQ', href: 'faq', enabled: true },
    ]
  );

  // 4. Kontakt & Följ
  const [footerInstagramLabel, setFooterInstagramLabel] = useState(settings.footerInstagramLabel ?? 'Instagram');
  const [footerInstagramUrl, setFooterInstagramUrl] = useState(settings.footerInstagramUrl ?? 'https://instagram.com/sagomaskan');
  const [footerInstagramEnabled, setFooterInstagramEnabled] = useState(settings.footerInstagramEnabled ?? true);

  const [footerEmailLabel, setFooterEmailLabel] = useState(settings.footerEmailLabel ?? 'E-post');
  const [footerEmail, setFooterEmail] = useState(settings.footerEmail ?? settings.email ?? 'hello@sagomaskan.se');

  const [footerContactLabel, setFooterContactLabel] = useState(settings.footerContactLabel ?? 'Kontakt');
  const [footerContactUrl, setFooterContactUrl] = useState(settings.footerContactUrl ?? 'contact');
  const [footerContactEnabled, setFooterContactEnabled] = useState(settings.footerContactEnabled ?? true);

  // 5. Nedre Footer
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
      setNotice('Bilden har bearbetats och förberetts! Klicka på "Spara ändringar" nedan för att publicera den.');
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

        // Fas 2: Innehållssidor & FAQ
        aboutStoryParagraphs: aboutStoryParagraphs.map(p => p.trim()).filter(Boolean),
        shippingSections: shippingSections.map(s => ({ title: s.title.trim(), content: s.content.trim() })),
        termsSections: termsSections.map(s => ({ title: s.title.trim(), content: s.content.trim() })),
        faqItems: faqItems.map((f, i) => ({
          id: f.id || `faq-${i}`,
          question: f.question.trim(),
          answer: f.answer.trim(),
          category: f.category || 'forfragan'
        })),

        // Fas 3: Announcement bar & Populära söktermer
        announcementEnabled,
        announcementText: announcementText.trim(),
        popularSearchTerms: popularSearchTerms.map(t => t.trim()).filter(Boolean),

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#E6DFD3]">
        <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
          Webbplats
        </span>
        <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
          Innehåll & Inställningar
        </h1>
        <p className="text-xs text-[#66726A] font-light mt-0.5">
          Ändra texter, hjältebild, kontaktuppgifter och sidfotsinställningar på kundsidan.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>&times;</button>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Vänster Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-1 bg-[#FBF9F5] p-2 border border-[#E6DFD3] rounded-2xl flex lg:flex-col overflow-x-auto lg:overflow-visible snap-x">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`snap-start flex-shrink-0 text-left px-4 py-3 rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#EBF3EE] text-[#242D27]'
                    : 'text-[#66726A] hover:bg-[#F3EFE8] hover:text-[#242D27]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Innehållsyta */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
        
        {/* Webbplatsstatus */}
        {activeTab === 'status' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-[#242D27] font-medium flex items-center gap-2.5">
                    <Power className="w-5 h-5 text-[#6B8E7B]" />
                    <span>Webbplatsstatus</span>
                  </h2>
                  <p className="text-xs text-[#66726A] font-light mt-1">
                    Styr om Sagomaskan är öppen för besökare eller om underhållsläget är aktivt.
                  </p>
                </div>

                {/* Statusindikator */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                    maintenanceMode
                      ? 'bg-[#FDF3F2] text-[#8C5248] border-[#E8C5C0]'
                      : 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4]'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      maintenanceMode ? 'bg-[#8C5248] animate-pulse' : 'bg-[#526E5F]'
                    }`}
                  />
                  <span>{maintenanceMode ? '🔴 Underhållsläge' : '🟢 Webbplats öppen'}</span>
                </div>
              </div>

              {/* Statuskort */}
              <div
                className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                  maintenanceMode
                    ? 'bg-[#FCF5F4] border-[#EAC9C5]'
                    : 'bg-[#F3F8F5] border-[#CFE1D6]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#66726A]">
                      Aktuell status
                    </div>
                    <h3 className="font-serif text-xl sm:text-2xl text-[#242D27] font-semibold">
                      {maintenanceMode
                        ? 'Webbplatsen är stängd för kunder.'
                        : 'Webbplatsen är öppen för kunder.'}
                    </h3>
                    <p className="text-xs text-[#526057] font-light leading-relaxed max-w-xl">
                      {maintenanceMode
                        ? 'Besökare ser den svenska underhållssidan ("Vi arbetar just nu med vår webbplats..."). Produkter, kategorier, kundvagn och kassa är dolda för allmänheten. Du som inloggad administratör kan fortfarande administrera butiken.'
                        : 'Webbplatsen är i full drift. Kunder kan se och beställa handgjorda virkade alster som vanligt.'}
                    </p>
                  </div>

                  {/* Snabbknapp för ändring */}
                  <button
                    type="button"
                    onClick={() => handleInitiateStatusChange(!maintenanceMode)}
                    className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                      maintenanceMode
                        ? 'bg-[#526E5F] hover:bg-[#41584C] text-[#FAF8F5]'
                        : 'bg-[#8C5248] hover:bg-[#78433A] text-[#FAF8F5]'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {maintenanceMode ? '🟢 Öppna webbplatsen' : '🔴 Stäng webbplatsen (Underhåll)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tydlig Toggle */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-medium text-[#242D27]">
                  Välj läge
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  {/* Toggle: Webbplats öppen */}
                  <button
                    type="button"
                    onClick={() => {
                      if (maintenanceMode) handleInitiateStatusChange(false);
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      !maintenanceMode
                        ? 'bg-[#EBF3EE] border-[#6B8E7B] ring-2 ring-[#6B8E7B]/20 shadow-xs'
                        : 'bg-[#FAF8F5] border-[#E6DFD3] hover:border-[#6B8E7B]/50'
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5">🟢</span>
                    <div>
                      <div className="text-xs font-semibold text-[#242D27]">
                        Webbplats öppen
                      </div>
                      <div className="text-[11px] text-[#66726A] font-light mt-0.5">
                        Webbplatsen är öppen och tillgänglig för alla besökare och kunder.
                      </div>
                    </div>
                  </button>

                  {/* Toggle: Underhållsläge */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!maintenanceMode) handleInitiateStatusChange(true);
                    }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      maintenanceMode
                        ? 'bg-[#FDF3F2] border-[#8C5248] ring-2 ring-[#8C5248]/20 shadow-xs'
                        : 'bg-[#FAF8F5] border-[#E6DFD3] hover:border-[#8C5248]/50'
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5">🔴</span>
                    <div>
                      <div className="text-xs font-semibold text-[#242D27]">
                        Underhållsläge
                      </div>
                      <div className="text-[11px] text-[#66726A] font-light mt-0.5">
                        Webbplatsen är stängd för kunder. Underhållssidan visas.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Information & säkerhet */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] text-xs text-[#66726A] space-y-1">
                <div className="font-semibold text-[#242D27] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#6B8E7B]" />
                  <span>Permanent lagring & administratörsåtkomst</span>
                </div>
                <p className="font-light leading-relaxed">
                  Statusen sparas direkt i Firestore (både under <code>siteSettings/general</code> och <code>siteSettings/maintenance</code>) så att den aktiveras omedelbart i realtid utan omstart eller kodändring. Som inloggad administratör har du alltid åtkomst till adminpanelen och butiken.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Kontaktuppgifter */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#6B8E7B]" />
            <span>Kontakt- och sociala uppgifter</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1.5">
                Officiell kontakt-e-post
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@sagomaskan.se"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1.5">
                Instagram-namn
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@sagomaskan"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>
          </div>
        </div>

        </div>
        )}

        {activeTab === 'hero' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Startsida Hero text & bild */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <Type className="w-4 h-4 text-[#6B8E7B]" />
            <span>Startsida & Välkomsttext</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1.5">
                Huvudrubrik (Hero titel)
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1.5">
                Underrubrik
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>

            {/* Hero Product Selection & Switch */}
            <div className="pt-3 border-t border-[#E6DFD3] space-y-4">
              {/* Switch-sektion för Hero-produkt */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#242D27]">
                      Hero-produkt
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        heroProductEnabled
                          ? 'bg-[#EBF3EE] text-[#526E5F] border border-[#CDE0D4]'
                          : 'bg-[#F3EFE8] text-[#8C9890] border border-[#E6DFD3]'
                      }`}
                    >
                      {heroProductEnabled ? 'På' : 'Av'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66726A] font-light max-w-xl leading-relaxed">
                    Visa eller dölj möjligheten att använda en produkt automatiskt i Hero-kortet på startsidan.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <span className={`text-xs font-medium ${heroProductEnabled ? 'text-[#242D27]' : 'text-[#8C9890]'}`}>
                    {heroProductEnabled ? 'På' : 'Av'}
                  </span>
                  <button
                    type="button"
                    id="hero-product-toggle"
                    role="switch"
                    aria-checked={heroProductEnabled}
                    onClick={() => setHeroProductEnabled((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:ring-offset-2 ${
                      heroProductEnabled ? 'bg-[#6B8E7B]' : 'bg-[#D4CBBF]'
                    }`}
                  >
                    <span className="sr-only">Hero-produkt På eller Av</span>
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        heroProductEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* NÄR SWITCHEN ÄR PÅ: Visa befintlig sektion och inställningar */}
              {heroProductEnabled && (
                <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-medium text-[#242D27] mb-1">
                      Hero-produkt i välkomstkortet
                    </label>
                    <p className="text-[11px] text-[#66726A] mb-2 font-light">
                      Välj vilken produkt från din shop som ska visas i Hero-kortet på startsidan. Bild, namn, kategori och pris hämtas automatiskt.
                    </p>
                    <select
                      value={heroProductId}
                      onChange={(e) => setHeroProductId(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    >
                      <option value="">-- Automatisk (Vald från shopen) --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.price} kr &bull; {p.category}) {p.isPublished === false ? '[Ej publicerad]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#242D27] mb-1.5">
                      Etikett på Hero-kortet
                    </label>
                    <input
                      type="text"
                      value={heroProductBadge}
                      onChange={(e) => setHeroProductBadge(e.target.value)}
                      placeholder="Unikt hantverk"
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-4 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hero Image Section */}
            <div className="pt-2 border-t border-[#E6DFD3] space-y-3">
              <label className="block text-xs font-medium text-[#242D27]">
                Hero-bild (Startsida)
              </label>

              {/* Image Preview & Upload Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Image Preview */}
                <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#FAF8F5] aspect-4/3 flex items-center justify-center">
                  {heroImage ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-20 blur-md scale-110 pointer-events-none"
                        style={{ backgroundImage: `url(${heroImage})` }}
                        aria-hidden="true"
                      />
                      <img
                        src={heroImage}
                        alt="Hero förhandsvisning"
                        className="relative z-1 w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={handleRemoveHeroImage}
                          className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white text-xs flex items-center gap-1 shadow-md"
                          title="Återställ till standardbild"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Ta bort</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-[#66726A] space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-[#A5B7AC]" />
                      <p className="text-[11px] font-medium">Standardbild aktiv</p>
                      <p className="text-[10px] text-[#8C9890]">Ladda upp en egen bild för att byta ut den.</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="sm:col-span-7 space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-[#6B8E7B] bg-[#EBF3EE]'
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
                      <div className="py-3 flex flex-col items-center gap-2 text-xs text-[#526E5F]">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#6B8E7B]" />
                        <span>Laddar upp och optimerar bild...</span>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center gap-1.5 text-[#526E5F]">
                        <Upload className="w-5 h-5 text-[#6B8E7B]" />
                        <p className="text-xs font-medium">Klicka för att välja bild eller dra och släpp här</p>
                        <p className="text-[10px] text-[#8C9890]">Stödjer JPG, PNG, WebP (optimeras automatiskt)</p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="text-[11px] text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-[#66726A] mb-1">
                      Eller klistra in en extern bild-URL:
                    </label>
                    <input
                      type="text"
                      value={externalUrlInput}
                      onChange={(e) => handleExternalUrlChange(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bild för sektionen "Om hantverket" på startsidan & om mig */}
            <div className="pt-5 border-t border-[#E6DFD3] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-[#242D27]">
                    Bild: Sektionen "Om hantverket" (Startsida & Om mig)
                  </label>
                  <p className="text-[11px] text-[#66726A] font-light">
                    Bilden som visas i sektionen "Varje maska är handgjord" på startsidan samt bredvid berättelsen på sidan "Om mig".
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="text-xs text-[#6B8E7B] hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                >
                  <span>Öppna i "Om hantverket"</span>
                  <span>&rarr;</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#FAF8F5] aspect-4/3 flex items-center justify-center">
                  {aboutImageUrl ? (
                    <>
                      <img
                        src={aboutImageUrl}
                        alt="Om hantverket förhandsvisning"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <button
                          type="button"
                          onClick={handleRemoveAboutImage}
                          className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white text-xs flex items-center gap-1 shadow-md cursor-pointer"
                          title="Ta bort bild"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Ta bort</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-[#66726A] space-y-1">
                      <ImageIcon className="w-8 h-8 mx-auto text-[#A5B7AC]" />
                      <p className="text-[11px] font-medium">Standardikon/platshållare aktiv</p>
                      <p className="text-[10px] text-[#8C9890]">Ladda upp en egen bild för att visa den här.</p>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div
                    onDragOver={handleAboutDragOver}
                    onDragLeave={handleAboutDragLeave}
                    onDrop={handleAboutDrop}
                    onClick={() => aboutFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                      isDraggingAbout
                        ? 'border-[#6B8E7B] bg-[#EBF3EE]'
                        : 'border-[#D4CBBF] hover:border-[#6B8E7B] bg-[#FAF8F5]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={aboutFileInputRef}
                      onChange={handleAboutFileInputChange}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                    />
                    {uploadingAboutImage ? (
                      <div className="py-3 flex flex-col items-center gap-2 text-xs text-[#526E5F]">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#6B8E7B]" />
                        <span>Laddar upp och optimerar bild...</span>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center gap-1.5 text-[#526E5F]">
                        <Upload className="w-5 h-5 text-[#6B8E7B]" />
                        <p className="text-xs font-medium">Klicka för att välja bild eller dra och släpp här</p>
                        <p className="text-[10px] text-[#8C9890]">Stödjer JPG, PNG, WebP (optimeras automatiskt)</p>
                      </div>
                    )}
                  </div>

                  {aboutUploadError && (
                    <div className="text-[11px] text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aboutUploadError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-[#66726A] mb-1">
                      Eller klistra in en extern bild-URL:
                    </label>
                    <input
                      type="text"
                      value={aboutExternalUrlInput}
                      onChange={(e) => handleAboutExternalUrlChange(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meddelanderad / Announcement Bar */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <Type className="w-4 h-4 text-[#6B8E7B]" />
            <span>Meddelanderad (Announcement bar)</span>
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="w-4 h-4 text-[#6B8E7B] rounded focus:ring-[#6B8E7B]"
              />
              <span className="text-xs font-medium text-[#242D27]">Visa meddelanderad högst upp</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-[#242D27] mb-1">Text i meddelanderaden</label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Handgjorda virkade produkter på beställning • Skicka en kostnadsfri beställningsförfrågan"
                className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2.5 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              />
            </div>
          </div>
        </div>

        </div>
        )}

        {activeTab === 'about' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Bild för Om hantverket (Startsida & Om mig) */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#6B8E7B]" />
              <span>Bild för Om hantverket</span>
            </h2>
            <p className="text-xs text-[#66726A] font-light mt-1">
              Denna bild visas i sektionen "Om hantverket" (Varje maska är handgjord) på startsidan samt bredvid hantverksberättelsen på sidan "Om mig".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Image Preview */}
            <div className="sm:col-span-5 relative group rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#FAF8F5] aspect-4/3 flex items-center justify-center">
              {aboutImageUrl ? (
                <>
                  <img
                    src={aboutImageUrl}
                    alt="Om hantverket förhandsvisning"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={handleRemoveAboutImage}
                      className="px-3 py-1.5 rounded-xl bg-white/90 text-red-600 hover:bg-white text-xs font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Ta bort bild"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ta bort bild</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-[#66726A] space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#F3EFE8] mx-auto flex items-center justify-center text-[#6B8E7B]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-[#242D27]">Ingen bild vald</p>
                  <p className="text-[11px] text-[#8C9890]">Ladda upp en bild eller ange en bildadress nedan.</p>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="sm:col-span-7 space-y-3">
              <div
                onDragOver={handleAboutDragOver}
                onDragLeave={handleAboutDragLeave}
                onDrop={handleAboutDrop}
                onClick={() => aboutFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                  isDraggingAbout
                    ? 'border-[#6B8E7B] bg-[#EBF3EE]'
                    : 'border-[#D4CBBF] hover:border-[#6B8E7B] bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="file"
                  ref={aboutFileInputRef}
                  onChange={handleAboutFileInputChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />
                <Upload className="w-6 h-6 mx-auto text-[#6B8E7B] mb-2" />
                <p className="text-xs font-medium text-[#242D27]">
                  {uploadingAboutImage ? 'Laddar upp bild...' : 'Dra och släpp en bildfil här'}
                </p>
                <p className="text-[11px] text-[#66726A] mt-1 font-light">
                  eller klicka för att välja från datorn (WebP, JPG, PNG)
                </p>
              </div>

              {uploadingAboutImage && (
                <div className="flex items-center gap-2 text-xs text-[#6B8E7B] bg-[#EBF3EE] px-3 py-2 rounded-xl">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Optimerar och laddar upp bild...</span>
                </div>
              )}

              {aboutUploadError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{aboutUploadError}</span>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-[11px] font-medium text-[#242D27] mb-1">
                  Eller ange bild-URL direkt:
                </label>
                <input
                  type="url"
                  value={aboutExternalUrlInput}
                  onChange={(e) => handleAboutExternalUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Om mig / Om hantverket */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#6B8E7B]" />
              <span>Om mig / Om hantverket</span>
            </h2>
            <button
              type="button"
              onClick={handleAddAboutParagraph}
              className="px-3 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till stycke</span>
            </button>
          </div>

          <p className="text-xs text-[#66726A] font-light">
            Redigera brödtextstyckena som visas i berättelsen under "Om mig" / "Om hantverket".
          </p>

          <div className="space-y-4">
            {aboutStoryParagraphs.map((para, idx) => (
              <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6B8E7B]">Stycke {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveAboutParagraph(idx, 'up')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                      title="Flytta upp"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === aboutStoryParagraphs.length - 1}
                      onClick={() => handleMoveAboutParagraph(idx, 'down')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                      title="Flytta ned"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAboutParagraph(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Ta bort stycke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => handleUpdateAboutParagraph(idx, e.target.value)}
                  placeholder="Skriv textstycke här..."
                  className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            ))}
          </div>
        </div>

        </div>
        )}

        {activeTab === 'info' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Frakt & leverans */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#6B8E7B]" />
              <span>Frakt & leverans (Innehåll)</span>
            </h2>
            <button
              type="button"
              onClick={handleAddShippingSection}
              className="px-3 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till avsnitt</span>
            </button>
          </div>

          <div className="space-y-4">
            {shippingSections.map((sec, idx) => (
              <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6B8E7B]">Avsnitt {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveShippingSection(idx, 'up')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === shippingSections.length - 1}
                      onClick={() => handleMoveShippingSection(idx, 'down')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveShippingSection(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleUpdateShippingSection(idx, 'title', e.target.value)}
                  placeholder="Rubrik (t.ex. Hur leveransen går till)"
                  className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
                <textarea
                  rows={4}
                  value={sec.content}
                  onChange={(e) => handleUpdateShippingSection(idx, 'content', e.target.value)}
                  placeholder="Innehåll för avsnittet..."
                  className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Köpvillkor */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6B8E7B]" />
              <span>Köpvillkor & Information</span>
            </h2>
            <button
              type="button"
              onClick={handleAddTermsSection}
              className="px-3 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till avsnitt</span>
            </button>
          </div>

          <div className="space-y-4">
            {termsSections.map((sec, idx) => (
              <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6B8E7B]">Punkt {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveTermsSection(idx, 'up')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === termsSections.length - 1}
                      onClick={() => handleMoveTermsSection(idx, 'down')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTermsSection(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => handleUpdateTermsSection(idx, 'title', e.target.value)}
                  placeholder="Rubrik (t.ex. 1. Om verksamheten)"
                  className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs font-medium text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
                <textarea
                  rows={3}
                  value={sec.content}
                  onChange={(e) => handleUpdateTermsSection(idx, 'content', e.target.value)}
                  placeholder="Villkorstext..."
                  className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#6B8E7B]" />
              <span>Vanliga frågor (FAQ)</span>
            </h2>
            <button
              type="button"
              onClick={handleAddFaqItem}
              className="px-3 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till fråga</span>
            </button>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6B8E7B]">Fråga {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveFaqItem(idx, 'up')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === faqItems.length - 1}
                      onClick={() => handleMoveFaqItem(idx, 'down')}
                      className="p-1 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaqItem(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-[#242D27] mb-1">Fråga</label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaqItem(idx, 'question', e.target.value)}
                      placeholder="t.ex. Hur lång tid tar leveransen?"
                      className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#242D27] mb-1">Kategori</label>
                    <select
                      value={faq.category || 'forfragan'}
                      onChange={(e) => handleUpdateFaqItem(idx, 'category', e.target.value)}
                      className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
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
                  <label className="block text-[11px] font-medium text-[#242D27] mb-1">Svar</label>
                  <textarea
                    rows={3}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaqItem(idx, 'answer', e.target.value)}
                    placeholder="Svar på frågan..."
                    className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>
        )}

        {activeTab === 'search' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* Populära söktermer */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-xl text-[#242D27] font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#6B8E7B]" />
              <span>Populära söktermer (Sökmodal)</span>
            </h2>
            <button
              type="button"
              onClick={handleAddSearchTerm}
              className="px-3 py-1.5 bg-[#EFF4F1] text-[#242D27] text-xs font-medium rounded-xl hover:bg-[#E6DFD3] transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lägg till sökterm</span>
            </button>
          </div>

          <p className="text-xs text-[#66726A] font-light">
            Hantera de snabbsökord som visas i sökmodalen när kunden klickar på sökikonen.
          </p>

          <div className="space-y-3">
            {popularSearchTerms.map((term, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-3">
                <input
                  type="text"
                  value={term}
                  onChange={(e) => handleUpdateSearchTerm(idx, e.target.value)}
                  placeholder="Sökterm (t.ex. Mössor)"
                  className="flex-1 bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveSearchTerm(idx, 'up')}
                  className="p-1.5 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                  title="Flytta upp"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === popularSearchTerms.length - 1}
                  onClick={() => handleMoveSearchTerm(idx, 'down')}
                  className="p-1.5 text-[#66726A] hover:text-[#242D27] disabled:opacity-30"
                  title="Flytta ned"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSearchTerm(idx)}
                  className="p-1.5 text-red-500 hover:text-red-700"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        </div>
        )}

                {activeTab === 'footer' && (
        <div className="space-y-8 animate-in fade-in duration-300">
        {/* FOOTER SECTION */}
        <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-serif text-xl text-[#242D27] font-medium pb-2 border-b border-[#E6DFD3] flex items-center gap-2">
            <Layout className="w-4 h-4 text-[#6B8E7B]" />
            <span>Sidfot (Footer)</span>
          </h2>

          {/* LOGOTYP & VARUMÄRKE */}
          <div className="space-y-4 pt-1">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              Logotyp & varumärke
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-3">
                  Logotypbild
                </label>
                
                <div className="flex flex-col gap-4">
                  {/* Image Preview Box */}
                  <div className="w-48 h-32 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                    {logoImageUrl ? (
                      <>
                        <img 
                          src={logoImageUrl} 
                          alt="Logotyp preview" 
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                          title="Ta bort logotyp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#8C9890]">
                        <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                        <span className="text-[10px] uppercase tracking-wider font-medium">Textlogotyp visas</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-2">
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
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E6DFD3] rounded-xl text-xs font-medium text-[#242D27] hover:bg-[#FBF9F5] transition-colors disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6B8E7B]" />
                          Laddar upp...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#6B8E7B]" />
                          Ladda upp logotyp
                        </>
                      )}
                    </button>
                    {logoUploadError && (
                      <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-2">
                        <AlertCircle className="w-3 h-3" />
                        {logoUploadError}
                      </p>
                    )}
                    <p className="text-[10px] text-[#8C9890] mt-1">
                      Rekommenderat format: PNG med transparent bakgrund (max 2MB).
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Text under logotyp
                </label>
                <input
                  type="text"
                  value={logoTagline}
                  onChange={(e) => setLogoTagline(e.target.value)}
                  placeholder="VIRKADE PRODUKTER"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-[#E6DFD3] my-6"></div>

          {/* 1. VARUMÄRKE */}
          <div className="space-y-4 pt-1">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              1. Varumärke
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Märkesnamn (Visas i vänsterkolumnen)
                </label>
                <input
                  type="text"
                  value={footerBrandName}
                  onChange={(e) => setFooterBrandName(e.target.value)}
                  placeholder="SAGOMASKAN"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Tagline (Liten text under märkesnamnet)
                </label>
                <input
                  type="text"
                  value={footerTagline}
                  onChange={(e) => setFooterTagline(e.target.value)}
                  placeholder="VIRKADE PRODUKTER"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Kort beskrivning
                </label>
                <textarea
                  rows={2}
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Handgjorda virkade produkter, skapade med omsorg och glädje."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
            </div>
          </div>

          {/* 2. SIDOR */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              2. Sidor (Navigeringslänkar)
            </h3>
            <div className="space-y-3">
              {footerPageLinks.map((link, idx) => (
                <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => handlePageLinkChange(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handlePageLinkChange(idx, 'label', e.target.value)}
                          placeholder="Länknamn (t.ex. Hem)"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => handlePageLinkChange(idx, 'href', e.target.value)}
                          placeholder="Mål (t.ex. home)"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. INFORMATION */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              3. Information (Hjälpsidor)
            </h3>
            <div className="space-y-3">
              {footerInfoLinks.map((link, idx) => (
                <div key={idx} className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => handleInfoLinkChange(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                    />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleInfoLinkChange(idx, 'label', e.target.value)}
                          placeholder="Länknamn"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => handleInfoLinkChange(idx, 'href', e.target.value)}
                          placeholder="Mål"
                          className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. KONTAKT & FÖLJ */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              4. Kontakt & Följ
            </h3>
            <div className="space-y-3">
              {/* Instagram */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={footerInstagramEnabled}
                    onChange={(e) => setFooterInstagramEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerInstagramLabel}
                        onChange={(e) => setFooterInstagramLabel(e.target.value)}
                        placeholder="Titel (t.ex. Instagram)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerInstagramUrl}
                        onChange={(e) => setFooterInstagramUrl(e.target.value)}
                        placeholder="URL (t.ex. https://instagram.com/...)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* E-post */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] opacity-50"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerEmailLabel}
                        onChange={(e) => setFooterEmailLabel(e.target.value)}
                        placeholder="Titel (t.ex. E-post)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerEmail}
                        onChange={(e) => setFooterEmail(e.target.value)}
                        placeholder="E-postadress"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontaktformulär (Länk till kontaktsidan) */}
              <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={footerContactEnabled}
                    onChange={(e) => setFooterContactEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={footerContactLabel}
                        onChange={(e) => setFooterContactLabel(e.target.value)}
                        placeholder="Titel (t.ex. Kontakt)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={footerContactUrl}
                        onChange={(e) => setFooterContactUrl(e.target.value)}
                        placeholder="Mål (t.ex. contact)"
                        className="w-full bg-[#F3EFE8]/50 border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27] focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] opacity-70"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. NEDRE FOOTER */}
          <div className="space-y-4 pt-4 border-t border-[#E6DFD3]">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#6B8E7B]">
              5. Längst ner (Copyright & Signatur)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Copyright-text
                </label>
                <input
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  placeholder="© Sagomaskan. Alla rättigheter reserverade."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Signatur-text (Slogan längst ner)
                </label>
                <input
                  type="text"
                  value={footerSignature}
                  onChange={(e) => setFooterSignature(e.target.value)}
                  placeholder="Små maskor – stora leenden. ♡"
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-xs text-[#242D27] focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
                />
              </div>
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#242D27] block">Visa "Admin"-länk i footern</span>
                  <p className="text-[10px] text-[#8C9890]">Gör en diskret "Admin"-länk synlig i footern för besökare.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={footerShowAdminLink}
                    onChange={(e) => setFooterShowAdminLink(e.target.checked)}
                    className="w-4 h-4 text-[#6B8E7B] rounded-sm border-[#D4CBBF] focus:ring-[#6B8E7B]"
                  />
                  <span className="text-xs text-[#242D27]">Visa länk</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === 'orders' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <ShoppingBag className="w-8 h-8 text-[#6B8E7B] mx-auto opacity-50" />
            <h2 className="font-serif text-xl text-[#242D27] font-medium">
              Beställningar & meddelanden
            </h2>
            <p className="text-xs text-[#66726A]">
              Inga redigerbara inställningar för närvarande. Denna sektion är förberedd för framtida uppdateringar.
            </p>
          </div>
        </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Sparar...' : 'Spara ändringar'}</span>
          </button>
        </div>
      </form>
        </div>
      </div>

      {/* Bekräftelsemodal för ändring av webbplatsstatus */}
      {showStatusConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
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
                  ? 'Besökare kommer att se underhållssidan tills du öppnar webbplatsen igen.'
                  : 'Webbplatsen blir nu synlig för kunder.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={() => setShowStatusConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E6DFD3] text-xs font-medium text-[#242D27] hover:bg-[#F3EFE8] transition-colors cursor-pointer disabled:opacity-50"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={isSavingStatus}
                onClick={handleConfirmStatusChange}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                  statusConfirmTarget
                    ? 'bg-[#8C5248] hover:bg-[#78433A]'
                    : 'bg-[#526E5F] hover:bg-[#41584C]'
                }`}
              >
                {isSavingStatus
                  ? 'Uppdaterar...'
                  : statusConfirmTarget
                  ? 'Stäng webbplatsen'
                  : 'Öppna webbplatsen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
