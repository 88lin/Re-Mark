import { describe, expect, it } from 'bun:test';
import type { BookmarkItem } from '../types';
import { buildBookmarkFingerprint } from './bookmarkFingerprint';

const makeItems = (): BookmarkItem[] => [
  {
    id: 'root',
    title: 'Bookmarks Bar',
    order: 0,
    createdAt: 0
  },
  {
    id: 'folder-1',
    parentId: 'root',
    title: 'Work',
    order: 1,
    createdAt: 1700000000000
  },
  {
    id: 'item-1',
    parentId: 'folder-1',
    title: 'Repo',
    url: 'https://example.com/repo',
    order: 2,
    createdAt: 1700000001000
  }
];

describe('buildBookmarkFingerprint', () => {
  it('returns same hash for identical items', async () => {
    const a = makeItems();
    const b = makeItems();
    const hashA = await buildBookmarkFingerprint(a);
    const hashB = await buildBookmarkFingerprint(b);
    expect(hashA).toBe(hashB);
  });

  it('returns different hash when bookmark content changes', async () => {
    const a = makeItems();
    const b = makeItems();
    b[2] = { ...b[2]!, title: 'Repo Updated' };
    const hashA = await buildBookmarkFingerprint(a);
    const hashB = await buildBookmarkFingerprint(b);
    expect(hashA).not.toBe(hashB);
  });
});
