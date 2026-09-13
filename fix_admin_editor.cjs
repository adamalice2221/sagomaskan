const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductEditor.tsx', 'utf-8');

// 1. Add import
if (!code.includes('import { uploadProductImage }')) {
    code = code.replace(
        "import { PALETTE } from '../../data/products';",
        "import { PALETTE } from '../../data/products';\nimport { uploadProductImage } from '../../services/storage';"
    );
}

// 2. Add state
const imageStateMatch = "  const [imageUrlInput, setImageUrlInput] = useState('');";
if (code.includes(imageStateMatch) && !code.includes('uploadingImages')) {
    code = code.replace(
        imageStateMatch,
        imageStateMatch + "\n  const [uploadingImages, setUploadingImages] = useState(false);\n  const [imageUploadError, setImageUploadError] = useState<string | null>(null);"
    );
}

// 3. Update handleFileUpload
const handleFileUploadOld = `  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };`;

const handleFileUploadNew = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploadError(null);
    setUploadingImages(true);

    const uploadedUrls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          continue; // skip non-images
        }
        const url = await uploadProductImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error("Fel vid bilduppladdning:", err);
      setImageUploadError('Ett fel uppstod vid bilduppladdningen. Vänligen försök igen.');
    } finally {
      setUploadingImages(false);
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }
  };`;

code = code.replace(handleFileUploadOld, handleFileUploadNew);

// 4. Disable submit button and add error message
const submitButtonMatch = `disabled={saving}`;
if (code.includes(submitButtonMatch)) {
    code = code.replace(/disabled=\{saving\}/g, "disabled={saving || uploadingImages}");
}

// 5. Change "Spara produkt" text to show uploading status
const sparaProduktMatch = `{saving ? 'Sparar...' : 'Spara produkt'}`;
if (code.includes(sparaProduktMatch)) {
    code = code.replace(sparaProduktMatch, `{saving ? 'Sparar...' : uploadingImages ? 'Laddar upp bild...' : 'Spara produkt'}`);
}

// 6. Update the upload label UI to show uploading indicator
const uploadLabelMatch = `              <Upload className="w-6 h-6 text-[#8C9B90] group-hover:text-[#6B8E7B] mb-2 transition-colors" />
              <span className="text-xs font-medium text-[#242D27]">Ladda upp bild</span>`;
const uploadLabelNew = `              {uploadingImages ? (
                <>
                  <div className="w-6 h-6 border-2 border-[#6B8E7B] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-medium text-[#242D27]">Laddar upp...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#8C9B90] group-hover:text-[#6B8E7B] mb-2 transition-colors" />
                  <span className="text-xs font-medium text-[#242D27]">Ladda upp bild</span>
                </>
              )}`;

code = code.replace(uploadLabelMatch, uploadLabelNew);

// 7. Add image upload error display
const imageUploadHtmlMatch = `<span className="text-[10px] text-[#66726A] font-light mt-0.5">JPG, PNG eller WebP</span>`;
const imageUploadHtmlNew = `<span className="text-[10px] text-[#66726A] font-light mt-0.5">JPG, PNG eller WebP</span>
              {imageUploadError && (
                <span className="text-[10px] text-red-500 font-medium mt-2 max-w-[80%] text-center leading-tight">
                  {imageUploadError}
                </span>
              )}`;
code = code.replace(imageUploadHtmlMatch, imageUploadHtmlNew);

fs.writeFileSync('src/components/admin/AdminProductEditor.tsx', code);
console.log("Fixed AdminProductEditor.tsx");
