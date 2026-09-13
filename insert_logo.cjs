const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf-8');

const logoJsx = `          {/* LOGOTYP & VARUMÄRKE */}
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

`;

code = code.replace(
    /          \{\/\* 1\. VARUMÄRKE \*\/\}/,
    logoJsx + `          {/* 1. VARUMÄRKE */}`
);

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
console.log("Inserted Logo JSX");
