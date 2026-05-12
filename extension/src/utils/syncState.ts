export type LocalChangeState = 'changed' | 'unchanged';
export type UploadSource = 'manual' | 'auto';

export type UploadSkipState = {
  skipUpload: boolean;
  notifyNoChanges: boolean;
};

export function getChangeState(baseFingerprint: unknown, currentFingerprint: string): LocalChangeState {
  return typeof baseFingerprint === 'string' && baseFingerprint === currentFingerprint ? 'unchanged' : 'changed';
}

export function getUploadSkipState(changeState: LocalChangeState, source: UploadSource): UploadSkipState {
  const skipUpload = changeState === 'unchanged';

  return {
    skipUpload,
    notifyNoChanges: skipUpload && source === 'manual'
  };
}
