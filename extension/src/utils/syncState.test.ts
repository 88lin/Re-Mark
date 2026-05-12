import { describe, expect, it } from 'bun:test';
import { getChangeState, getUploadSkipState } from './syncState';

describe('getChangeState', () => {
  it('reports unchanged when current fingerprint matches the sync baseline', () => {
    expect(getChangeState('same-fingerprint', 'same-fingerprint')).toBe('unchanged');
  });

  it('reports changed when current fingerprint differs from the sync baseline', () => {
    expect(getChangeState('old-fingerprint', 'new-fingerprint')).toBe('changed');
  });

  it('reports changed when no sync baseline exists', () => {
    expect(getChangeState(undefined, 'current-fingerprint')).toBe('changed');
  });
});

describe('getUploadSkipState', () => {
  it('skips manual uploads and shows a no-change prompt when local bookmarks are unchanged', () => {
    expect(getUploadSkipState('unchanged', 'manual')).toEqual({
      skipUpload: true,
      notifyNoChanges: true
    });
  });

  it('skips automatic uploads silently when local bookmarks are unchanged', () => {
    expect(getUploadSkipState('unchanged', 'auto')).toEqual({
      skipUpload: true,
      notifyNoChanges: false
    });
  });

  it('allows uploads when local bookmarks changed', () => {
    expect(getUploadSkipState('changed', 'manual')).toEqual({
      skipUpload: false,
      notifyNoChanges: false
    });
  });
});
