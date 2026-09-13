const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf-8');

const oldFunc = /export async function uploadProductImage[\s\S]*?\n\}/;

const newFunc = `export async function uploadProductImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = \`products/\${timestamp}_\${cleanName}.webp\`;

  try {
    // Optimera bilden FÖRE uppladdning (konverterar vanligtvis till WebP eller max 1600px JPEG)
    const { blob } = await compressImageToBlob(file, 1600, 1600, 0.85);
    
    // Vi skapar en ny File-instans av blobben för att Firebase Storage ska få rätt typ och namn
    const optimizedFile = new File([blob], cleanName + '.webp', { type: blob.type });

    // Försök Firebase Storage först
    const storageUrl = await uploadToFirebaseStorage(optimizedFile, path, 8000); // 8s timeout för större filer
    return storageUrl;
  } catch (storageError) {
    console.warn('Firebase Storage direct upload skipped/failed, using server storage:', storageError);
    
    // Fallback till server storage om Firebase bråkar
    try {
      const { blob } = await compressImageToBlob(file, 1600, 1600, 0.85);
      return await uploadToServerStorage(blob, cleanName, 'products');
    } catch (err) {
      console.error('Server upload fallback failed:', err);
      // VIKTIGT: Vi kastar ett fel här istället för att smyg-spara som Base64!
      throw new Error('Kunde inte ladda upp bilden till servern. Försök igen.');
    }
  }
}`;

if (oldFunc.test(code)) {
    code = code.replace(oldFunc, newFunc);
    fs.writeFileSync('src/services/storage.ts', code);
    console.log("Fixed uploadProductImage");
} else {
    console.log("Could not find uploadProductImage to replace");
}
