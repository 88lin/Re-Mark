import { browser } from 'wxt/browser';
import type { BookmarkItem, SyncData } from '../types';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

export async function getBookmarkTree(): Promise<BookmarkTreeNode[]> {
  return browser.bookmarks.getTree();
}

export async function flattenBookmarks(tree: BookmarkTreeNode[]): Promise<BookmarkItem[]> {
  const items: BookmarkItem[] = [];
  let order = 0;

  async function traverse(nodes: BookmarkTreeNode[], parentId?: string) {
    for (const node of nodes) {
      const id = await generateStableId(node);
      items.push({
        id,
        parentId,
        title: node.title,
        url: node.url,
        order: order++,
        createdAt: node.dateAdded || 0
      });
      if (node.children) await traverse(node.children, id);
    }
  }

  if (tree[0]?.children) await traverse(tree[0].children);
  return items;
}

export function flattenBookmarkTreeForSearch(tree: BookmarkTreeNode[]): BookmarkItem[] {
  const items: BookmarkItem[] = [];
  let order = 0;

  function traverse(nodes: BookmarkTreeNode[], parentId?: string) {
    for (const node of nodes) {
      items.push({
        id: node.id,
        parentId,
        title: node.title,
        url: node.url,
        order: order++,
        createdAt: node.dateAdded || 0
      });
      if (node.children) traverse(node.children, node.id);
    }
  }

  if (tree[0]?.children) traverse(tree[0].children);
  return items;
}

export async function buildBookmarkTree(items: BookmarkItem[]): Promise<void> {
  const itemMap = new Map<string, BookmarkItem>();
  items.forEach(item => itemMap.set(item.id, item));

  const rootItems = items.filter(item => !item.parentId).sort((a, b) => a.order - b.order);

  for (const item of rootItems) {
    const targetRootId = resolveRootId(item.title) || '1';
    if (item.url) {
      await createNode(item, targetRootId, itemMap);
    } else {
      await createChildren(targetRootId, item.id, itemMap);
    }
  }
}

async function createNode(item: BookmarkItem, parentId: string, itemMap: Map<string, BookmarkItem>): Promise<string> {
  try {
    const node = await browser.bookmarks.create({
      parentId,
      title: item.title,
      url: item.url
    });

    const children = getChildren(itemMap, item.id);
    for (const child of children) {
      await createNode(child, node.id!, itemMap);
    }

    return node.id!;
  } catch {
    return '';
  }
}

async function createChildren(parentId: string, parentItemId: string, itemMap: Map<string, BookmarkItem>) {
  const children = getChildren(itemMap, parentItemId);
  for (const child of children) {
    await createNode(child, parentId, itemMap);
  }
}

export async function clearAllBookmarks(): Promise<void> {
  const tree = await getBookmarkTree();

  if (tree[0]?.children) {
    for (const root of tree[0].children) {
      if (root.children) {
        for (const node of root.children) {
          if (node.id) {
            try {
              await browser.bookmarks.removeTree(node.id);
            } catch {}
          }
        }
      }
    }
  }
}

export function countBookmarks(items: BookmarkItem[]): number {
  return items.filter(item => item.url).length;
}

export function countBookmarkTree(tree: BookmarkTreeNode[]): number {
  let count = 0;

  function traverse(nodes: BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) count += 1;
      if (node.children) traverse(node.children);
    }
  }

  traverse(tree);
  return count;
}

export function searchBookmarkItems(items: BookmarkItem[], query: string, limit = 6): BookmarkItem[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  return items
    .filter(item => item.url && matchesBookmarkItem(item, keyword))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}

function getChildren(itemMap: Map<string, BookmarkItem>, parentId: string) {
  return Array.from(itemMap.values())
    .filter(i => i.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

function resolveRootId(title: string): string | null {
  const t = title.trim().toLowerCase();
  const mapping: Record<string, string> = {
    'bookmarks bar': '1',
    'bookmark bar': '1',
    'bookmark toolbar': '1',
    书签栏: '1',
    'other bookmarks': '2',
    其他书签: '2',
    'mobile bookmarks': '3',
    移动书签: '3'
  };
  return mapping[t] || null;
}

function matchesBookmarkItem(item: BookmarkItem, keyword: string): boolean {
  const searchableText = [
    item.title,
    item.url,
    item.ai?.summary,
    ...(item.ai?.tags ?? [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(keyword);
}

async function generateStableId(node: BookmarkTreeNode): Promise<string> {
  const content = `${node.title}::${node.url || 'folder'}::${node.dateAdded || 0}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}
