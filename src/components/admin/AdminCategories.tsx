import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Layers,
  Upload,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Category, Product, AgeGroup } from '../../types';
import { uploadCategoryImage, deleteStorageImage, ensureStorageCategoryImageUrl } from '../../services/storage';

interface AdminCategoriesProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Omit<Category, 'id'> & { id?: string }) => Promise<string>;
  onEditCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  products,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [targetAgeGroups, setTargetAgeGroups] = useState<AgeGroup[]>(['Barn', 'Vuxen', 'Baby']);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openCreate = () => {
    setName('');
    setDescription('');
    setImage('');
    setOriginalImageUrl(null);
    setSortOrder(categories.length + 1);
    setIsActive(true);
    setTargetAgeGroups(['Barn', 'Vuxen', 'Baby']);
    setEditingCatId(null);
    setShowCreateModal(true);
    setError(null);
    setUploadingImage(false);
    setUploadSuccess(false);
  };

  const openEdit = (cat: Category) => {
    setName(cat.name);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setOriginalImageUrl(cat.image || null);
    setSortOrder(cat.sortOrder || 1);
    setIsActive(cat.isActive ?? true);
    setTargetAgeGroups(cat.targetAgeGroups || ['Barn', 'Vuxen', 'Baby']);
    setEditingCatId(cat.id);
    setShowCreateModal(true);
    setError(null);
    setUploadingImage(false);
    setUploadSuccess(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vänligen välj en giltig bildfil (JPG, PNG, WebP).');
      return;
    }

    setError(null);
    setUploadingImage(true);
    setUploadSuccess(false);

    try {
      // 1. Optimizes and uploads file to Supabase Storage
      // 2. Returns permanent public URL
      const storageUrl = await uploadCategoryImage(file, name.trim() || 'kategori');
      setImage(storageUrl);
      setUploadSuccess(true);
      showNotice('Kategoribilden har laddats upp till Supabase Storage!');
    } catch (err: any) {
      console.error('Category image upload to Storage failed:', err);
      setError(err?.message || 'Kunde inte ladda upp bilden till Supabase Storage.');
      setUploadSuccess(false);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Kategorinamn krävs.');
      return;
    }

    if (uploadingImage) {
      setError('Vänta tills bilduppladdningen är klar.');
      return;
    }

    setSaving(true);
    try {
      // Ensure image is never stored as base64 in Firestore
      let finalImageUrl = image.trim();
      if (finalImageUrl.startsWith('data:image')) {
        finalImageUrl = await ensureStorageCategoryImageUrl(finalImageUrl, name.trim());
      }

      if (editingCatId) {
        await onEditCategory(editingCatId, {
          name: name.trim(),
          description: description.trim(),
          image: finalImageUrl,
          sortOrder: Number(sortOrder),
          isActive,
          targetAgeGroups
        });

        // Safely clean up old Storage file if replaced with a different Storage URL
        if (
          originalImageUrl &&
          originalImageUrl !== finalImageUrl &&
          originalImageUrl.includes('firebasestorage.googleapis.com')
        ) {
          deleteStorageImage(originalImageUrl).catch(() => {});
        }

        showNotice('Kategorin uppdaterades.');
      } else {
        await onAddCategory({
          name: name.trim(),
          description: description.trim(),
          image: finalImageUrl || '',
          sortOrder: Number(sortOrder),
          isActive,
          targetAgeGroups
        });
        showNotice('Ny kategori skapades.');
      }
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err?.message || 'Ett fel uppstod vid sparning.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const prodsInCat = products.filter(
      (p) => p.category === cat.name || p.categoryId === cat.id
    );
    if (prodsInCat.length > 0) {
      setError(
        `Kategorin "${cat.name}" kan inte raderas eftersom den innehåller ${prodsInCat.length} produkt(er). Flytta eller radera dessa produkter först.`
      );
      setDeleteConfirmId(null);
      return;
    }

    try {
      await onDeleteCategory(cat.id);
      // Clean up storage file if it was hosted in Firebase Storage
      if (cat.image && cat.image.includes('firebasestorage.googleapis.com')) {
        deleteStorageImage(cat.image).catch(() => {});
      }
      showNotice('Kategorin raderades.');
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError(err?.message || 'Kunde inte radera kategorin.');
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await onEditCategory(cat.id, { isActive: !cat.isActive });
      showNotice(cat.isActive ? 'Kategorin inaktiverades.' : 'Kategorin aktiverades.');
    } catch (e) {
      setError('Kunde inte ändra status.');
    }
  };

  const legacyCategories = categories.filter(cat => {
    const img = cat.image || '';
    return (
      img.includes('/uploads/categories/') ||
      img.startsWith('data:image') ||
      img.includes('base64') ||
      (img.startsWith('/') && !img.startsWith('http') && !img.includes('firebasestorage.googleapis.com'))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DFD3]">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#6B8E7B] font-semibold">
            Struktur
          </span>
          <h1 className="font-serif text-3xl text-[#242D27] font-medium mt-1">
            Kategorier ({categories.length})
          </h1>
          <p className="text-xs text-[#66726A] font-light mt-0.5">
            Hantera webbplatsens huvudkategorier, bilder och sorteringsordning.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Skapa kategori</span>
        </button>
      </div>

      {/* Base64 / Local Image Warning Box */}
      {legacyCategories.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-serif text-sm font-medium text-amber-900">
              Varning: Kategorier med tillfälliga/lokala bilder upptäckta
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed font-light">
              Följande kategorier sparar sina bilder lokalt på webbservern i stället för i Firebase Storage. Eftersom serverns lagring är tillfällig riskerar dessa bilder att försvinna. Klicka på <strong>Redigera</strong> för respektive kategori, ladda upp dess bild igen från din enhet och spara för att säkra den permanent:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-4 list-disc text-xs text-amber-950 font-medium">
              {legacyCategories.map(cat => (
                <li key={cat.id}>{cat.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {notification && (
        <div className="p-3.5 rounded-2xl bg-[#EBF3EE] border border-[#CDE0D4] text-xs text-[#242D27] font-medium flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-[#F8EFEF] border border-[#E4C9C9] text-xs text-[#8C5248] flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#8C5248]">
            &times;
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => {
          const count = products.filter(
            (p) => p.category === cat.name || p.categoryId === cat.id
          ).length;

          return (
            <div
              key={cat.id}
              className="bg-[#FBF9F5] border border-[#E6DFD3] rounded-3xl overflow-hidden p-5 flex flex-col justify-between space-y-4 hover:border-[#6B8E7B] transition-all group"
            >
              <div className="space-y-3">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E6DFD3] flex items-center justify-center">
                  {/* Subtle soft backdrop for non-4:3 aspect ratios */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-20 blur-md scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${cat.image})` }}
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 bg-[#FAF8F5]/60 pointer-events-none" />

                  {/* Main Category Image with object-contain & object-center so the entire product is always visible */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="relative z-1 w-full h-full object-contain object-center p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 z-10 bg-[#242D27]/80 backdrop-blur-xs text-[#FAF8F5] text-[10px] px-2.5 py-1 rounded-full font-medium">
                    Plats #{cat.sortOrder || idx + 1}
                  </div>
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        cat.isActive ?? true
                          ? 'bg-[#EBF3EE] text-[#526E5F] border-[#CDE0D4]'
                          : 'bg-[#FAF4ED] text-[#7A5930] border-[#E6D7C3]'
                      }`}
                    >
                      {cat.isActive ?? true ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-lg text-[#242D27] font-medium">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#66726A] font-light mt-1 line-clamp-2">
                    {cat.description || 'Ingen beskrivning'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DFD3] flex items-center justify-between text-xs">
                <span className="text-[#66726A] font-light">
                  {count} produkt(er)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#242D27] hover:bg-[#F3EFE8]"
                    title="Redigera kategori"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === cat.id ? (
                    <div className="inline-flex items-center gap-1 bg-[#F8EFEF] border border-[#E4C9C9] p-1 rounded-lg">
                      <span className="text-[10px] text-[#8C5248] font-semibold">Ta bort?</span>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="px-1.5 py-0.5 bg-[#8C5248] text-[#FAF8F5] text-[10px] rounded"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 py-0.5 text-[10px] text-[#8C5248]"
                      >
                        Nej
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="p-1.5 rounded-lg bg-[#FAF8F5] border border-[#E6DFD3] text-[#8C5248] hover:bg-[#F8EFEF]"
                      title="Radera kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Dialog for Create & Edit Category */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] border border-[#E6DFD3] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
              <h2 className="font-serif text-2xl text-[#242D27] font-medium">
                {editingCatId ? 'Redigera kategori' : 'Ny kategori'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#66726A] hover:text-[#242D27]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#F8EFEF] border border-[#E4C9C9] text-xs text-[#8C5248]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Kategorinamn *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. Mössor"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3.5 py-2 text-sm text-[#242D27]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242D27] mb-1">
                  Beskrivning
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Handgjorda mössor för små och stora huvuden."
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl p-3 text-xs text-[#242D27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#242D27] mb-1">
                    Sorteringsordning
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min="1"
                    className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-2 text-xs text-[#242D27]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#6B8E7B]"
                    />
                    <span className="text-xs font-medium text-[#242D27]">
                      Aktiv kategori
                    </span>
                  </label>
                </div>
              </div>

              {/* Bild */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#242D27]">
                  Kategoribild
                </label>
                <div className="flex items-center gap-4">
                  {image && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E6DFD3] flex items-center justify-center relative shrink-0">
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-20 blur-xs scale-110 pointer-events-none"
                        style={{ backgroundImage: `url(${image})` }}
                        aria-hidden="true"
                      />
                      <img
                        src={image}
                        alt="Förhandsvisning"
                        className="relative z-1 w-full h-full object-contain object-center p-1"
                      />
                    </div>
                  )}

                  <label className={`px-4 py-2 rounded-xl bg-[#F3EFE8] border border-[#E6DFD3] text-xs text-[#242D27] hover:bg-[#E6DFD3] cursor-pointer inline-flex items-center gap-2 ${uploadingImage ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6B8E7B]" />
                        <span>Laddar upp till Storage...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Välj bild från enhet</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || saving}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <p className="text-[11px] text-[#6B8E7B] font-medium animate-pulse flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Laddar upp bild till Supabase Storage...</span>
                  </p>
                )}
                {!uploadingImage && uploadSuccess && (
                  <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600 shrink-0" />
                    <span>Bild uppladdad!</span>
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Eller klistra in bild-URL..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={uploadingImage || saving}
                  className="w-full bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl px-3 py-1.5 text-xs text-[#242D27]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6DFD3]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 rounded-full text-xs text-[#66726A] hover:text-[#242D27]"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-6 py-2 rounded-full bg-[#242D27] text-[#FAF8F5] text-xs font-medium hover:bg-[#344038] disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {(saving || uploadingImage) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploadingImage ? 'Laddar upp bild...' : saving ? 'Sparar...' : 'Spara kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
