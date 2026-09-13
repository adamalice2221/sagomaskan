import React from 'react';
import { PageRoute, ProductCategory } from '../types';

export interface NavigationLocation {
  page: PageRoute;
  productId?: string;
  category?: ProductCategory;
}

/**
 * Generates canonical, shareable and user-friendly URL paths for all routes.
 */
export function getPageUrl(
  page: PageRoute,
  options?: {
    productId?: string;
    category?: ProductCategory;
  }
): string {
  switch (page) {
    case 'home':
      return '/';
    case 'shop':
      if (options?.category && options.category !== 'Alla') {
        return `/shop?category=${encodeURIComponent(options.category)}`;
      }
      return '/shop';
    case 'product':
      return options?.productId ? `/product/${encodeURIComponent(options.productId)}` : '/shop';
    case 'about':
      return '/om-mig';
    case 'contact':
      return '/kontakt';
    case 'cart':
      return '/forfragelista';
    case 'checkout':
      return '/bestallningsforfragan';
    case 'order-confirmation':
      return '/bekraftelse';
    case 'faq':
      return '/faq';
    case 'shipping':
      return '/frakt-och-leverans';
    case 'terms':
      return '/kopvillkor';
    case 'wishlist':
      return '/onskelista';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}

/**
 * Parses current window.location into route, productId and category.
 */
export function parseLocation(pathname: string, search: string, hash: string): NavigationLocation {
  const cleanHash = hash.replace(/^#/, '').trim().toLowerCase();
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
  const searchParams = new URLSearchParams(search);

  // Check admin first
  if (cleanHash === 'admin' || cleanPath === 'admin') {
    return { page: 'admin' };
  }

  // Product detail paths: /product/:id or /produkt/:id
  const productMatch = pathname.match(/^\/(?:product|produkt)\/([^/?#]+)/i);
  if (productMatch && productMatch[1]) {
    const rawId = decodeURIComponent(productMatch[1]);
    return { page: 'product', productId: rawId };
  }

  // Shop with category query param
  if (cleanPath === 'shop') {
    const categoryParam = searchParams.get('category') || searchParams.get('kategori');
    return {
      page: 'shop',
      category: categoryParam ? decodeURIComponent(categoryParam) : 'Alla',
    };
  }

  // Standard route matching
  switch (cleanPath) {
    case '':
    case 'home':
    case 'hem':
      return { page: 'home' };
    case 'om-mig':
    case 'about':
      return { page: 'about' };
    case 'kontakt':
    case 'contact':
      return { page: 'contact' };
    case 'forfragelista':
    case 'cart':
    case 'varukorg':
      return { page: 'cart' };
    case 'bestallningsforfragan':
    case 'checkout':
    case 'kassa':
      return { page: 'checkout' };
    case 'bekraftelse':
    case 'order-confirmation':
      return { page: 'order-confirmation' };
    case 'faq':
    case 'fragor-och-svar':
      return { page: 'faq' };
    case 'frakt-och-leverans':
    case 'shipping':
    case 'leverans':
      return { page: 'shipping' };
    case 'kopvillkor':
    case 'terms':
    case 'villkor':
      return { page: 'terms' };
    case 'onskelista':
    case 'wishlist':
    case 'favoriter':
      return { page: 'wishlist' };
    default:
      return { page: 'home' };
  }
}

/**
 * Checks if a mouse click was modified with Ctrl, Cmd, Shift, Alt or middle-click.
 */
export function isModifiedClick(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}
