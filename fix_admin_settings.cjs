const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

// Add import
code = code.replace(
    /import \{ uploadHeroImage, normalizeHeroImageUrl \} from '\.\.\/\.\.\/services\/storage';/,
    `import { uploadHeroImage, uploadLogoImage, normalizeHeroImageUrl } from '../../services/storage';`
);

// Add state
const footerStateMatch = /  const \[footerBrandName, setFooterBrandName\] = useState\(settings\.footerBrandName \?\? 'SAGOMASKAN'\);/;
if (footerStateMatch.test(code)) {
    code = code.replace(footerStateMatch, `  const [logoImageUrl, setLogoImageUrl] = useState(() => normalizeHeroImageUrl(settings.logoImageUrl || ''));
  const [logoTagline, setLogoTagline] = useState(settings.logoTagline ?? 'VIRKADE PRODUKTER');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [footerBrandName, setFooterBrandName] = useState(settings.footerBrandName ?? 'SAGOMASKAN');`);
}

// Add handleLogoFileProcess
const handleFileProcessMatch = /  const handleFileProcess = async \(file: File\) => \{/;
if (handleFileProcessMatch.test(code)) {
    code = code.replace(handleFileProcessMatch, `  const handleLogoFileProcess = async (file: File) => {
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

  const handleFileProcess = async (file: File) => {`);
}

// Add logo properties to handleSubmit
const footerBrandNamePayloadMatch = /footerBrandName: footerBrandName\.trim\(\),/;
if (footerBrandNamePayloadMatch.test(code)) {
    code = code.replace(footerBrandNamePayloadMatch, `logoImageUrl: normalizeHeroImageUrl(logoImageUrl),
        logoTagline: logoTagline.trim(),
        footerBrandName: footerBrandName.trim(),`);
}

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Updated AdminSettings.tsx state and handlers");
