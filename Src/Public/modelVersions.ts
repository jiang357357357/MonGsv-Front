const MODEL_VERSION_LABELS: Record<string, string> = {
  v5dev: 'v5dev（平衡版）',
  v5turbo: 'v5turbo（性能版）',
};

export const formatModelVersion = (version: string): string => MODEL_VERSION_LABELS[version] ?? version;
