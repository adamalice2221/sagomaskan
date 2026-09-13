const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductEditor.tsx', 'utf-8');

if (!code.includes('const [uploadSuccess, setUploadSuccess] = useState(false);')) {
    code = code.replace(
        "const [uploadingImages, setUploadingImages] = useState(false);",
        "const [uploadingImages, setUploadingImages] = useState(false);\n  const [uploadSuccess, setUploadSuccess] = useState(false);"
    );
}

const finallyMatch = `    } finally {
      setUploadingImages(false);
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }`;
const finallyNew = `    } finally {
      setUploadingImages(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }`;
if (code.includes(finallyMatch)) {
    code = code.replace(finallyMatch, finallyNew);
}

const labelMatch = `              {uploadingImages ? (
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

const labelNew = `              {uploadingImages ? (
                <>
                  <div className="w-6 h-6 border-2 border-[#6B8E7B] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-medium text-[#242D27]">Laddar upp bild...</span>
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="w-6 h-6 text-[#6B8E7B] mb-2" />
                  <span className="text-xs font-medium text-[#242D27]">Bild uppladdad!</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#8C9B90] group-hover:text-[#6B8E7B] mb-2 transition-colors" />
                  <span className="text-xs font-medium text-[#242D27]">Ladda upp bild</span>
                </>
              )}`;
if (code.includes(labelMatch)) {
    code = code.replace(labelMatch, labelNew);
}

fs.writeFileSync('src/components/admin/AdminProductEditor.tsx', code);
console.log("Updated AdminProductEditor with uploadSuccess");
