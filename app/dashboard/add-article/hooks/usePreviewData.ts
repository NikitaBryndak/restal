import { useMemo } from 'react';
import { PreviewState } from '../types';
import { Article } from '@/types';

export const usePreviewData = (
  previewState: PreviewState
): Article => {
  return useMemo(() => {
    return {
      tag: previewState.tag ?? "",
      images: previewState.images ?? [],
      title: previewState.title || "Untitled article",
      description: previewState.description || "No description provided",
      content: previewState.content || "",
      creatorPhone: previewState.creatorPhone ?? "",
    };
  }, [previewState]);
}