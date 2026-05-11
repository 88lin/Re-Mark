import { describe, expect, it } from 'bun:test';
import { countBookmarkTree } from './bookmarks';

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
