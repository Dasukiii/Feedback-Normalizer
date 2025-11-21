import { supabase } from './supabase';

export interface ExtractedFeedback {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  tags: string[];
  suggestedOwner: string | null;
  extractedText?: string;
}

export const isAIEnabled = true;

export const extractFeedbackDetails = async (
  feedbackText: string
): Promise<ExtractedFeedback | null> => {
  if (!feedbackText || feedbackText.length < 10) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session');
      return null;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-feedback`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackText }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Edge function error:', error);
      return null;
    }

    const extracted: ExtractedFeedback = await response.json();
    return extracted;
  } catch (error) {
    console.error('AI extraction failed:', error);
    return null;
  }
};

export const extractFeedbackFromFile = async (
  file: File
): Promise<ExtractedFeedback | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-feedback`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Edge function error:', error);
      return null;
    }

    const extracted: ExtractedFeedback = await response.json();
    return extracted;
  } catch (error) {
    console.error('AI extraction from file failed:', error);
    return null;
  }
};
