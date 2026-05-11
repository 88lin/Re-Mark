import type { BookmarkItem } from '../types';

type FingerprintItem = {
  id: string;
  parentId: string | null;
  title: string;
  url: string | null;
  order: number;
  createdAt: number;
};

function normalizeItem(item: BookmarkItem): FingerprintItem {
  return {
    id: item.id,
    parentId: item.parentId ?? null,
    title: item.title,
    url: item.url ?? null,
    order: item.order,
    createdAt: item.createdAt
  };
}

export async function buildBookmarkFingerprint(items: BookmarkItem[]): Promise<string> {
  const normalized = items.map(normalizeItem);
  const payload = JSON.stringify(normalized);
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
