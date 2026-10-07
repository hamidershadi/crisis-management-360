/**
 * Robust panorama asset management for 360 viewer and UI thumbnails.
 * Handles both Vite-bundled imports and static /public/images/ paths,
 * ensuring images load reliably in dev mode, preview mode, and on published
 * remix URLs (e.g. *.ai.studio).
 */

import crisisStreet from './images/crisis_street_rubble_360_1791308615011.jpg';
import crisisBuilding from './images/crisis_building_interior_360_1791308624645.jpg';
import crisisShelter from './images/crisis_shelter_safezone_360_1791308634138.jpg';

// Vite bundled imports (hashed assets in /dist/assets/)
export const BUNDLED_PANORAMAS: Record<string, string> = {
  pano_01: crisisStreet,
  pano_02: crisisBuilding,
  pano_03: crisisShelter,
  stage_01: crisisStreet,
  stage_02: crisisBuilding,
  stage_03: crisisShelter,
};

// Static public URLs (copied verbatim into /dist/images/)
export const PUBLIC_PANORAMAS: Record<string, string> = {
  pano_01: '/images/crisis_street_rubble_360_1791308615011.jpg',
  pano_02: '/images/crisis_building_interior_360_1791308624645.jpg',
  pano_03: '/images/crisis_shelter_safezone_360_1791308634138.jpg',
  stage_01: '/images/crisis_street_rubble_360_1791308615011.jpg',
  stage_02: '/images/crisis_building_interior_360_1791308624645.jpg',
  stage_03: '/images/crisis_shelter_safezone_360_1791308634138.jpg',
};

// Backward-compatible asset dictionary
export const PANORAMA_ASSETS: Record<string, string> = {
  ...BUNDLED_PANORAMAS,
  'crisis_street_rubble_360_1791308615011.jpg': crisisStreet,
  'crisis_building_interior_360_1791308624645.jpg': crisisBuilding,
  'crisis_shelter_safezone_360_1791308634138.jpg': crisisShelter,
};

/**
 * Resolves any panorama URL, stage ID, or stored path to the guaranteed public URL.
 */
export function resolvePanoramaUrl(urlOrId?: string, panoId?: string): string {
  const target = (panoId || urlOrId || '').toLowerCase();

  // If already a valid data URL or blob URL, return as-is
  if (urlOrId && (urlOrId.startsWith('data:') || urlOrId.startsWith('blob:'))) {
    return urlOrId;
  }

  // Pano 1: Street rubble / Urban crisis
  if (
    target.includes('pano_01') ||
    target.includes('stage_01') ||
    target.includes('street') ||
    target.includes('rubble') ||
    target.includes('mirror_palace') ||
    target.includes('stage1')
  ) {
    return PUBLIC_PANORAMAS.pano_01;
  }

  // Pano 2: Damaged building interior
  if (
    target.includes('pano_02') ||
    target.includes('stage_02') ||
    target.includes('building') ||
    target.includes('interior') ||
    target.includes('historic_bazaar') ||
    target.includes('stage2')
  ) {
    return PUBLIC_PANORAMAS.pano_02;
  }

  // Pano 3: Safe shelter / Command center
  if (
    target.includes('pano_03') ||
    target.includes('stage_03') ||
    target.includes('shelter') ||
    target.includes('safezone') ||
    target.includes('modern_museum') ||
    target.includes('stage3')
  ) {
    return PUBLIC_PANORAMAS.pano_03;
  }

  // Normalize /src/assets/images/ to /images/
  if (urlOrId && urlOrId.startsWith('/src/assets/images/')) {
    return urlOrId.replace('/src/assets/images/', '/images/');
  }

  // Return url if present, otherwise default to first space
  return urlOrId || PUBLIC_PANORAMAS.pano_01;
}

/**
 * Secondary fallback using Vite bundled asset (in case public/ has routing issues)
 */
export function getBundledFallbackUrl(urlOrId?: string, panoId?: string): string {
  const target = (panoId || urlOrId || '').toLowerCase();

  if (
    target.includes('pano_02') ||
    target.includes('stage_02') ||
    target.includes('building') ||
    target.includes('historic_bazaar') ||
    target.includes('stage2')
  ) {
    return BUNDLED_PANORAMAS.pano_02;
  }

  if (
    target.includes('pano_03') ||
    target.includes('stage_03') ||
    target.includes('shelter') ||
    target.includes('safezone') ||
    target.includes('modern_museum') ||
    target.includes('stage3')
  ) {
    return BUNDLED_PANORAMAS.pano_03;
  }

  return BUNDLED_PANORAMAS.pano_01;
}
