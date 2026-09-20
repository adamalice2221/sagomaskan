import React from 'react';

/**
 * HalloweenDecorations
 * 
 * Tillfälligt, diskret och mysigt Halloween-dekorationslager för Sagomaskan.
 * 
 * Egenskaper:
 * - Renderas endast när Halloween är aktiverat i adminpanelen.
 * - Helt separat visuellt lager med pointer-events: none (påverkar varken klick, formulär eller layout).
 * - Färgskala anpassad efter Sagomaskan: dämpad varm pumpaorange, mjuk plommon, varm beige, mockabrun och dovt skogsgrön.
 * - Handgjord/illustrativ känsla: söta små amigurumi-liknande spöken, virkade minipumpor, små fladdermöss, stjärnor, månar och höstlöv.
 * - Fullt responsiv: diskret minskad mängd på mobila skärmar för att aldrig skymma text eller knappar.
 * - Skapar ingen horisontell scroll (overflow-hidden).
 */

interface HalloweenDecorationsProps {
  enabled?: boolean;
}

export const HalloweenDecorations: React.FC<HalloweenDecorationsProps> = ({ enabled = true }) => {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden max-w-[100vw]"
    >
      {/* 🕸️ Diskret garn-spindelnät: Översta vänstra hörnet (mycket svag opacitet, fäster i hörnet) */}
      <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 opacity-25 text-[#C4B7A6]">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full">
          <path d="M0,0 L90,15 M0,0 L75,45 M0,0 L45,75 M0,0 L15,90" />
          <path d="M20,3 Q22,12 12,20" />
          <path d="M40,7 Q45,25 25,40" />
          <path d="M60,10 Q68,38 38,60" />
          <path d="M80,14 Q88,52 50,80" />
          {/* Litet hängande garnhjärta / droppe */}
          <line x1="50" y1="80" x2="50" y2="92" strokeDasharray="1 2" />
          <circle cx="50" cy="94" r="2.5" fill="#C86938" stroke="none" opacity="0.6" />
        </svg>
      </div>

      {/* 🕸️ Diskret spindelnät: Översta högra hörnet (dold på små mobiler för att inte störa sök/kundvagn) */}
      <div className="hidden md:block absolute top-0 right-0 w-28 h-28 opacity-20 text-[#C4B7A6]">
        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full">
          <path d="M100,0 L10,15 M100,0 L25,45 M100,0 L55,75 M100,0 L85,90" />
          <path d="M80,3 Q78,12 88,20" />
          <path d="M60,7 Q55,25 75,40" />
          <path d="M40,10 Q32,38 62,60" />
        </svg>
      </div>

      {/* 🌙 Söt varm måne & gnistrande stjärnor: Uppe till höger i marginalen */}
      <div className="hidden lg:flex flex-col items-center absolute top-24 right-6 opacity-65">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#E6D3B1" className="transform -rotate-12 drop-shadow-xs">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8A9.047 9.047 0 0 0 12 3z" />
        </svg>
        <span className="text-[9px] text-[#D8B677] mt-1 opacity-75">✨</span>
      </div>

      {/* 🦇 Liten söt fladdermus: Vänster ytterkant, flyger lugnt */}
      <div className="hidden md:block absolute top-40 left-5 lg:left-8 opacity-60">
        <svg width="30" height="18" viewBox="0 0 40 24" fill="#4A2E3E" className="transform -rotate-6">
          {/* Rund kropp och öron */}
          <ellipse cx="20" cy="14" rx="4.5" ry="6" />
          <polygon points="17,9 18,5 20,8" />
          <polygon points="23,9 22,5 20,8" />
          {/* Mjuka söta vingar */}
          <path d="M16 13 C12 7, 5 7, 2 12 C5 14, 10 16, 16 15 Z" />
          <path d="M24 13 C28 7, 35 7, 38 12 C35 14, 30 16, 24 15 Z" />
          {/* Små söta prickögon */}
          <circle cx="18.5" cy="12" r="0.7" fill="#FAF8F5" />
          <circle cx="21.5" cy="12" r="0.7" fill="#FAF8F5" />
        </svg>
      </div>

      {/* 🎃 Liten handgjord virkad pumpa: Vänster skärmkant mot mitten */}
      <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-4 xl:left-8 opacity-75">
        <svg width="34" height="30" viewBox="0 0 40 36" fill="none" className="drop-shadow-xs">
          {/* Grön stjälk */}
          <path d="M19 10 C19 6, 22 4, 24 3 C23 6, 21 8, 21 10 Z" fill="#4B6354" />
          {/* Litet virkat lock/blad */}
          <ellipse cx="20" cy="10" rx="3.5" ry="1.5" fill="#3B5244" />
          {/* Pumpans runda klyftor (varm dämpad orange med virkad mjukhet) */}
          <ellipse cx="12" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="28" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="16" cy="22" rx="8" ry="11" fill="#DA7C47" />
          <ellipse cx="24" cy="22" rx="8" ry="11" fill="#DA7C47" />
          <ellipse cx="20" cy="22" rx="7" ry="12" fill="#E28652" />
          {/* Litet sött leende / stygn */}
          <path d="M17 22 Q20 25 23 22" stroke="#5C3420" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
        </svg>
      </div>

      {/* 🍂 Små höstlöv: Vänster sida nedåt */}
      <div className="hidden md:flex flex-col items-center gap-2 absolute top-[62%] left-3 lg:left-7 opacity-60">
        {/* Varmt hasselnötslöv */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8C6542" className="transform rotate-45">
          <path d="M12 2C8 6 6 12 12 22C18 12 16 6 12 2Z" />
        </svg>
        {/* Mjukt terrakottalöv */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#C86938" className="transform -rotate-12">
          <path d="M12 3C7 8 6 14 12 21C18 14 17 8 12 3Z" />
        </svg>
      </div>

      {/* 👻 Sött litet virkat spöke: Höger skärmkant mitt på sidan */}
      <div className="hidden lg:block absolute top-[45%] right-5 xl:right-9 opacity-75">
        <svg width="28" height="34" viewBox="0 0 32 40" fill="none" className="drop-shadow-xs transform rotate-3">
          {/* Kropp i varm bomullskräm */}
          <path
            d="M16 4 C9 4, 5 10, 5 20 C5 28, 4 33, 7 35 C10 37, 12 33, 16 35 C20 33, 22 37, 25 35 C28 33, 27 28, 27 20 C27 10, 23 4, 16 4 Z"
            fill="#F7F4EE"
            stroke="#E3DACB"
            strokeWidth="1"
          />
          {/* Små söta slutna ögon & rosiga kinder */}
          <ellipse cx="12" cy="16" rx="1.2" ry="1.4" fill="#4A3B32" />
          <ellipse cx="20" cy="16" rx="1.2" ry="1.4" fill="#4A3B32" />
          {/* Ljusrosa små kinder */}
          <circle cx="10" cy="19" r="1.5" fill="#EAAFA8" opacity="0.7" />
          <circle cx="22" cy="19" r="1.5" fill="#EAAFA8" opacity="0.7" />
          {/* Liten mun */}
          <path d="M14.5 19 Q16 20.5 17.5 19" stroke="#4A3B32" strokeWidth="0.9" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* ✨ Små gnistrande stjärnor: Höger kant nedanför spöket */}
      <div className="hidden md:block absolute top-[68%] right-6 lg:right-10 opacity-65">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#DDBE83">
          <path d="M12 2L14 9L21 12L14 15L12 22L10 15L3 12L10 9L12 2Z" />
        </svg>
      </div>

      {/* 🍂 Litet dovt skogsgrönt eklöv & pumpa: Längst ner till vänster (fast i viewport) */}
      <div className="absolute bottom-5 left-3 sm:left-6 flex items-center gap-1.5 opacity-65">
        {/* Liten pumpa synlig även på mobil (mycket liten, 20px, i absolut nedre hörnet) */}
        <svg width="22" height="20" viewBox="0 0 40 36" fill="none">
          <path d="M19 10 C19 6, 22 4, 24 3 C23 6, 21 8, 21 10 Z" fill="#4B6354" />
          <ellipse cx="12" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="28" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="16" cy="22" rx="8" ry="11" fill="#DA7C47" />
          <ellipse cx="24" cy="22" rx="8" ry="11" fill="#DA7C47" />
          <ellipse cx="20" cy="22" rx="7" ry="12" fill="#E28652" />
        </svg>
        {/* Höstlöv bredvid (dold på små skärmar) */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#526E5F" className="hidden sm:block transform -rotate-45">
          <path d="M12 2C7 7 6 13 12 22C18 13 17 7 12 2Z" />
        </svg>
      </div>

      {/* 🎃🍂 Liten subtil pumpa & stjärna längst ner till höger (mobil-anpassad, diskret och säker) */}
      <div className="absolute bottom-5 right-3 sm:right-6 flex items-center gap-1.5 opacity-65">
        <span className="text-[11px] text-[#D8B677] select-none">✨</span>
        <svg width="20" height="18" viewBox="0 0 40 36" fill="none">
          <path d="M19 10 C19 6, 22 4, 24 3 C23 6, 21 8, 21 10 Z" fill="#4B6354" />
          <ellipse cx="14" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="26" cy="22" rx="7" ry="10" fill="#CF703E" />
          <ellipse cx="20" cy="22" rx="8" ry="11" fill="#E28652" />
        </svg>
      </div>
    </div>
  );
};
