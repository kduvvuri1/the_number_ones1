// lib/recording-service.ts
import { supabase, withRLS } from './supabase';

export interface CallData {
  stream_call_id: string;
  title?: string;
  description?: string;
  type?: string;
  starts_at?: string;
  ended_at?: string;
  created_by_user_id: string;
  participant_count?: number;
  duration?: number;
  status?: 'scheduled' | 'ongoing' | 'ended';
  custom_data?: any;
}

export interface RecordingData {
  stream_recording_id: string;
  stream_call_id: string;
  title?: string;
  url: string;
  download_url?: string;
  filename: string;
  duration: number;
  file_size?: number;
  start_time: string;
  end_time?: string;
  status?: 'processing' | 'ready' | 'failed' | 'deleted';
  resolution?: string;
  recording_type?: 'video' | 'audio' | 'composite';
  user_id: string;
}

export interface TranscriptionData {
  recording_id: string;
  content: string;
  language?: string;
  confidence_score?: number;
  word_count?: number;
  processing_time?: number;
  status?: 'processing' | 'completed' | 'failed';
  user_id: string;
}

export interface NoteData {
  recording_id?: string;
  transcription_id?: string;
  title: string;
  content?: string;
  summary?: string;
  tags?: string[];
  key_points?: any[];
  sentiment_score?: number;
  is_archived?: boolean;
  is_favorite?: boolean;
  user_id: string;
}

export class RecordingService {
  // Call Management
  static async upsertCall(callData: CallData): Promise<any> {
    return await withRLS(callData.created_by_user_id, async () => {
      console.log('📞 Upserting call:', callData.stream_call_id);

      const { data, error } = await supabase
        .from('calls')
        .upsert(
          {
            stream_call_id: callData.stream_call_id,
            title: callData.title || `Call ${callData.stream_call_id}`,
            description: callData.description,
            type: callData.type || 'default',
            starts_at: callData.starts_at,
            ended_at: callData.ended_at,
            created_by_user_id: callData.created_by_user_id,
            participant_count: callData.participant_count || 0,
            duration: callData.duration || 0,
            status: callData.status || 'ended',
            custom_data: callData.custom_data || {},
          },
          {
            onConflict: 'stream_call_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        console.error('❌ Error upserting call:', error);
        throw new Error(`Failed to upsert call: ${error.message}`);
      }

      console.log('✅ Call upserted successfully:', data.id);
      return data;
    });
  }

  static async getCallByStreamId(streamCallId: string, userId: string): Promise<any> {
    return await withRLS(userId, async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('stream_call_id', streamCallId)
        .single();

      if (error) {
        console.error('Error fetching call:', error);
        throw error;
      }

      return data;
    });
  }

  static async getUserCalls(userId: string): Promise<any[]> {
    return await withRLS(userId, async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('created_by_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }

      return data || [];
    });
  }

  // Recording Management
  static async syncRecording(recordingData: RecordingData): Promise<any> {
    return await withRLS(recordingData.user_id, async () => {
      console.log('🎥 Syncing recording:', recordingData.stream_recording_id);

      // First ensure the call exists
      await this.upsertCall({
        stream_call_id: recordingData.stream_call_id,
        title: `Call ${recordingData.stream_call_id}`,
        created_by_user_id: recordingData.user_id,
        starts_at: recordingData.start_time,
        status: 'ended',
      });

      // Then upsert the recording
      const { data, error } = await supabase
        .from('recordings')
        .upsert(
          {
            stream_recording_id: recordingData.stream_recording_id,
            stream_call_id: recordingData.stream_call_id,
            title: recordingData.title || `Recording ${recordingData.filename}`,
            url: recordingData.url,
            download_url: recordingData.download_url,
            filename: recordingData.filename,
            duration: recordingData.duration,
            file_size: recordingData.file_size,
            start_time: recordingData.start_time,
            end_time: recordingData.end_time,
            status: recordingData.status || 'ready',
            resolution: recordingData.resolution || '720p',
            recording_type: recordingData.recording_type || 'video',
            user_id: recordingData.user_id,
          },
          {
            onConflict: 'stream_recording_id',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) {
        console.error('❌ Error syncing recording:', error);
        throw new Error(`Failed to sync recording: ${error.message}`);
      }

      console.log('✅ Recording synced successfully:', data.id);
      return data;
    });
  }

  static async syncMultipleRecordings(recordings: RecordingData[]): Promise<any[]> {
    if (recordings.length === 0) {
      console.log('No recordings to sync');
      return [];
    }

    const userId = recordings[0].user_id;
    return await withRLS(userId, async () => {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const recording of recordings) {
        try {
          console.log(`🔄 Syncing recording ${successCount + 1}/${recordings.length}:`, recording.filename);
          const result = await this.syncRecording(recording);
          results.push(result);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to sync recording ${recording.stream_recording_id}:`, error);
          errorCount++;
          // Continue with other recordings even if one fails
        }
      }

      console.log(`🎉 Sync completed: ${successCount} successful, ${errorCount} failed`);
      return results;
    });
  }

  static async getUserRecordings(userId: string): Promise<any[]> {
    return await withRLS(userId, async () => {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          *,
          calls (
            stream_call_id,
            title,
            description,
            duration
          )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        throw error;
      }

      // Transform data for frontend
      return (data || []).map(recording => ({
        id: recording.id,
        stream_recording_id: recording.stream_recording_id,
        url: recording.url,
        download_url: recording.download_url,
        filename: recording.filename,
        duration: recording.duration,
        start_time: recording.start_time,
        status: recording.status,
        resolution: recording.resolution,
        recording_type: recording.recording_type,
        call_id: recording.stream_call_id, // For compatibility with existing code
        call_title: recording.calls?.title || `Call ${recording.stream_call_id}`,
        call_description: recording.calls?.description,
        call_duration: recording.calls?.call_duration,
      }));
    });
  }

  static async getRecordingByStreamId(streamRecordingId: string, userId: string): Promise<any> {
    return await withRLS(userId, async () => {
      const { data, error } = await supabase
        .from('recordings')
        .select(`
          *,
          calls (
            stream_call_id,
            title,
            description
          )
        `)
        .eq('stream_recording_id', streamRecordingId)
        .single();

      if (error) {
        console.error('Error fetching recording:', error);
        throw error;
      }

      return data;
    });
  }

  // Transcription Management
  static async createTranscription(transcriptionData: TranscriptionData): Promise<any> {
    return await withRLS(transcriptionData.user_id, async () => {
      const { data, error } = await supabase
        .from('transcriptions')
        .insert(transcriptionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating transcription:', error);
        throw error;
      }

      return data;
    });
  }

  // Note Management
  static async createNote(noteData: NoteData): Promise<any> {
    return await withRLS(noteData.user_id, async () => {
      const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        throw error;
      }

      return data;
    });
  }

  static async getUserNotes(userId: string): Promise<any[]> {
    return await withRLS(userId, async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          recordings (
            filename,
            duration,
            start_time
          ),
          transcriptions (
            content
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        throw error;
      }

      return data || [];
    });
  }
}