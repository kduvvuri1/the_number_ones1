// lib/ai_notes.ts
import { supabase } from './supabase';
import { toast } from 'sonner';

// Remove the Google AI imports and only keep the delete function
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({ is_deleted: true })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete note error:', error);
    toast.error('Failed to delete note');
    throw error;
  }
}
