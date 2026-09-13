import { FaqItem } from '../types';

export const FAQS: FaqItem[] = [
  {
    id: 'forfragan-funkar',
    question: 'Hur fungerar en beställningsförfrågan?',
    answer: 'Eftersom Sagomaskan är en personlig hobbyverksamhet genomförs ingen automatisk betalning på webbplatsen. Du lägger de alster du är intresserad av i din förfrågelista och skickar dina uppgifter. Jag går igenom din förfrågan personligen och återkommer via e-post med information om beställningen, pris, eventuell frakt och betalning.',
    category: 'forfragan'
  },
  {
    id: 'nar-betalar-jag',
    question: 'När betalar jag?',
    answer: 'Ingen betalning sker på webbplatsen. När vi kommit överens om din beställning och jag bekräftat tillgänglighet eller tillverkningstid återkommer jag med information om pris, frakt och hur betalning sker.',
    category: 'betalning'
  },
  {
    id: 'leveranstid',
    question: 'Hur lång tid tar leveransen?',
    answer: 'Alster som finns färdiga i ateljén skickas snarast möjligt efter överenskommelse. För alster som virkas på beställning meddelar jag beräknad tillverkningstid direkt i mitt svarsmejl.',
    category: 'leverans'
  },
  {
    id: 'handgjorda',
    question: 'Är alla produkter handgjorda?',
    answer: 'Ja, varje produkt är virkad för hand med omsorg och glädje. Eftersom det är ett genuint hantverk har varje exemplar sin unika karaktär och personliga känsla.',
    category: 'produkter'
  },
  {
    id: 'annan-farg',
    question: 'Kan jag önska en annan färg eller storlek?',
    answer: 'Ja, skriv gärna dina önskemål i meddelandefältet när du skickar din beställningsförfrågan. Jag går igenom mina garner och återkommer om möjligheterna.',
    category: 'produkter'
  },
  {
    id: 'skotsel',
    question: 'Hur sköter jag om de virkade alstren?',
    answer: 'För mössor, pannband, halsdukar och strumpor i ull/alpacka/merino rekommenderas varsam handtvätt i ljummet vatten med ulltvättmedel och plantorkning. Skallror och bitringar i bomullstrikå kan torkas av med fuktig trasa och lufttorkas.',
    category: 'skotsel'
  }
];
