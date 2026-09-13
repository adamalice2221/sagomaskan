import { Product, ProductColor } from '../types';

/**
 * CENTRAL PALETT
 * Du kan enkelt ändra eller lägga till färger och färgkoder här.
 */
export const PALETTE: Record<string, ProductColor> = {
  natur: { name: 'Natur', hex: '#F5F2EB' },
  creme: { name: 'Creme', hex: '#FBF9F5' },
  beige: { name: 'Beige', hex: '#DED4C5' },
  ljusbrun: { name: 'Ljusbrun', hex: '#B39B84' },
  salvia: { name: 'Salvia', hex: '#8EA396' },
  dampadRosa: { name: 'Dämpad rosa', hex: '#D8B7B2' },
  dampadBla: { name: 'Dämpad blå', hex: '#96A8B2' },
  gra: { name: 'Grå', hex: '#A8A8A8' },
  morkgron: { name: 'Mörkgrön', hex: '#3B4F42' }
};

export const PRODUCTS: Product[] = [];
