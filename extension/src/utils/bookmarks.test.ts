import { describe, expect, it } from 'bun:test';
import type { BookmarkItem } from '../types';
import { countBookmarkTree, flattenBookmarkTreeForSearch, searchBookmarkItems } from './bookmarks';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

function makeNode(node: Omit<BookmarkTreeNode, 'syncing'> & Partial<Pick<BookmarkTreeNode, 'syncing'>>): BookmarkTreeNode {
  return {
    syncing: false,
    ...node
  };
}

describe('countBookmarkTree', () => {
  it('counts only bookmark urls in nested browser bookmark trees', () => {
    const tree = [
      makeNode({
        id: '0',
        title: '',
        children: [
          makeNode({
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              makeNode({
                id: '10',
                title: 'Work',
                children: [
                  makeNode({
                    id: '100',
                    title: 'Repo',
                    url: 'https://example.com/repo'
                  }),
                  makeNode({
                    id: '101',
                    title: 'Docs',
                    url: 'https://example.com/docs'
                  })
                ]
              })
            ]
          }),
          makeNode({
            id: '2',
            title: 'Other Bookmarks',
            children: [
              makeNode({
                id: '200',
                title: 'News',
                url: 'https://example.com/news'
              })
            ]
          })
        ]
      })
    ];

    expect(countBookmarkTree(tree)).toBe(3);
  });
});

describe('flattenBookmarkTreeForSearch', () => {
  it('keeps bookmark tree order using browser node ids', () => {
    const tree = [
      makeNode({
        id: '0',
        title: '',
        children: [
          makeNode({
            id: '1',
            title: 'Bookmarks Bar',
            children: [
              makeNode({
                id: '10',
                title: 'Work',
                children: [
                  makeNode({
                    id: '100',
                    title: 'Repo',
                    url: 'https://example.com/repo',
                    dateAdded: 1700000000000
                  })
                ]
              })
            ]
          })
        ]
      })
    ];

    expect(flattenBookmarkTreeForSearch(tree)).toEqual([
      {
        id: '1',
        title: 'Bookmarks Bar',
        order: 0,
        createdAt: 0
      },
      {
        id: '10',
        parentId: '1',
        title: 'Work',
        order: 1,
        createdAt: 0
      },
      {
        id: '100',
        parentId: '10',
        title: 'Repo',
        url: 'https://example.com/repo',
        order: 2,
        createdAt: 1700000000000
      }
    ]);
  });
});

const searchItems: BookmarkItem[] = [
  {
    id: 'folder',
    title: 'Work',
    order: 0,
    createdAt: 0
  },
  {
    id: 'docs',
    parentId: 'folder',
    title: 'React Docs',
    url: 'https://react.dev/reference/react',
    order: 1,
    createdAt: 0
  },
  {
    id: 'repo',
    parentId: 'folder',
    title: 'Re-Mark Repository',
    url: 'https://github.com/example/re-mark',
    order: 2,
    createdAt: 0
  },
  {
    id: 'ai',
    parentId: 'folder',
    title: 'Search Notes',
    url: 'https://example.com/notes',
    order: 3,
    createdAt: 0,
    ai: {
      summary: 'Local bookmark knowledge base',
      tags: ['bookmark', 'productivity'],
      cover: '',
      enrichedAt: 0
    }
  }
];

describe('searchBookmarkItems', () => {
  it('returns empty results for blank queries', () => {
    expect(searchBookmarkItems(searchItems, '   ')).toEqual([]);
  });

  it('matches bookmark titles and urls without case sensitivity', () => {
    const results = searchBookmarkItems(searchItems, 'REACT');
    expect(results.map(item => item.id)).toEqual(['docs']);
  });

  it('excludes folders from results', () => {
    const results = searchBookmarkItems(searchItems, 'work');
    expect(results).toEqual([]);
  });

  it('matches enriched bookmark summaries and tags', () => {
    const results = searchBookmarkItems(searchItems, 'productivity');
    expect(results.map(item => item.id)).toEqual(['ai']);
  });

  it('limits results using bookmark order', () => {
    const results = searchBookmarkItems(searchItems, 'e', 2);
    expect(results.map(item => item.id)).toEqual(['docs', 'repo']);
  });
});
