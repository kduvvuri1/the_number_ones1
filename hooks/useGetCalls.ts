// hooks/useGetCalls.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';
import { RecordingService } from '../lib/recording-service';

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();

  const [calls, setCalls] = useState<Call[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    if (!client || !user?.id) {
      console.log('🚫 No client or user');
      return { calls: [], recordings: [] };
    }

    try {
      console.log('🔄 Loading data from Stream.io...');

      // Get user's calls from Stream.io
      const { calls: streamCalls } = await client.queryCalls({
        sort: [{ field: 'starts_at', direction: -1 }],
        filter_conditions: {
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
      });

      console.log(`📞 Found ${streamCalls.length} calls from Stream`);

      // Sync calls and get recordings
      const allRecordings: any[] = [];
      const recordingsForSupabase: any[] = [];
      const seenRecordings = new Set();

      for (const call of streamCalls) {
        try {
          console.log(`🎥 Getting recordings for call: ${call.id}`);
          const recordingsResponse = await call.queryRecordings();
          console.log(`📹 Found ${recordingsResponse.recordings.length} recordings for call ${call.id}`);

          for (const recording of recordingsResponse.recordings) {
            if (!recording.url) {
              console.log('⏭️ Skipping recording without URL:', recording.filename);
              continue;
            }

            const uniqueKey = recording.filename;
            if (seenRecordings.has(uniqueKey)) {
              console.log('⏭️ Skipping duplicate recording:', uniqueKey);
              continue;
            }

            seenRecordings.add(uniqueKey);

            // Prepare recording data for Supabase
            const recordingData = {
              stream_recording_id: recording.filename,
              stream_call_id: call.id,
              title: call.state?.custom?.description || `Recording for ${call.id}`,
              url: recording.url,
              filename: recording.filename,
              duration: Math.floor(recording.duration || 0),
              start_time: recording.start_time
                ? new Date(recording.start_time).toISOString()
                : new Date().toISOString(),
              end_time: recording.end_time
                ? new Date(recording.end_time).toISOString()
                : undefined,
              status: 'ready' as const,
              resolution: '720p',
              recording_type: 'video' as const,
              user_id: user.id,
            };

            recordingsForSupabase.push(recordingData);

            // Also prepare for immediate frontend display
            allRecordings.push({
              id: recording.filename,
              ...recordingData,
              call_title: call.state?.custom?.description || `Call ${call.id}`,
            });
          }
        } catch (error) {
          console.error(`❌ Error getting recordings for call ${call.id}:`, error);
        }
      }

      console.log(`💾 Prepared ${recordingsForSupabase.length} recordings for Supabase sync`);

      // Sync to Supabase
      if (recordingsForSupabase.length > 0) {
        try {
          await RecordingService.syncMultipleRecordings(recordingsForSupabase);
          console.log('✅ All recordings synced to Supabase');
        } catch (error) {
          console.error('❌ Failed to sync recordings to Supabase:', error);
          toast.error('Failed to sync recordings to database');
        }
      }

      return { calls: streamCalls, recordings: allRecordings };
    } catch (error) {
      console.error('❌ Error loading data from Stream.io:', error);
      toast.error('Failed to load data from Stream');
      return { calls: [], recordings: [] };
    }
  }, [client, user?.id]);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      console.log('🚫 No user ID');
      return { calls: [], recordings: [] };
    }

    setIsLoading(true);
    console.log('🚀 Starting data load...');

    try {
      // Load from Supabase first for fast display
      console.log('📦 Loading recordings from Supabase...');
      const supabaseRecordings = await RecordingService.getUserRecordings(user.id);
      console.log(`📦 Loaded ${supabaseRecordings.length} recordings from Supabase`);

      // Then load fresh data from Stream
      console.log('🌐 Loading fresh data from Stream...');
      const { calls: streamCalls, recordings: streamRecordings } = await loadAllData();

      // Prefer Supabase data as it's more reliable
      const finalRecordings = supabaseRecordings.length > 0 ? supabaseRecordings : streamRecordings;
      console.log(`🎯 Using ${finalRecordings.length} total recordings`);

      setCalls(streamCalls);
      setRecordings(finalRecordings);

      return { calls: streamCalls, recordings: finalRecordings };
    } catch (error) {
      console.error('💥 Load error:', error);
      toast.error('Failed to load recordings');
      return { calls: [], recordings: [] };
    } finally {
      setIsLoading(false);
      console.log('🏁 Data load complete');
    }
  }, [user?.id, loadAllData]);

  // Initial load
  useEffect(() => {
    console.log('🎬 useGetCalls useEffect triggered');
    loadData();
  }, [loadData]);

  const refreshData = async () => {
    if (!client || !user?.id) {
      toast.error('Please sign in to refresh');
      return;
    }

    setIsLoading(true);
    toast.info('Refreshing recordings...');
    
    try {
      const { calls: streamCalls, recordings: streamRecordings } = await loadAllData();
      setCalls(streamCalls);
      setRecordings(streamRecordings);
      toast.success('Recordings refreshed successfully');
    } catch (error) {
      console.error('🔄 Refresh error:', error);
      toast.error('Failed to refresh recordings');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter calls
  const now = Date.now();
  const endedCalls = calls.filter(c => {
    const starts = c.state.startsAt ? new Date(c.state.startsAt).getTime() : 0;
    return c.state.endedAt || starts < now;
  });

  const upcomingCalls = calls.filter(c => {
    const starts = c.state.startsAt ? new Date(c.state.startsAt).getTime() : 0;
    return starts > now;
  });

  return {
    endedCalls,
    upcomingCalls,
    allCalls: calls,
    recordings,
    isLoading,
    refreshData,
    loadData,
  };
};
