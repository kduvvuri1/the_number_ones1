import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

type CallWithRecordings = Call & { recordings?: Array<{ session: string; filename: string; url?: string }> };

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();

  const [calls, setCalls] = useState<CallWithRecordings[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true);
      try {
        const { calls: fetchedCalls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });

        setCalls(fetchedCalls);
      } catch (err) {
        console.error('Error querying calls:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id]);

  const fetchRecordingsForCall = useCallback(async (call: Call) => {
    try {
      const res = await call.queryRecordings();
      return res.recordings;
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
      return [];
    }
  }, []);

  const deleteRecording = useCallback(async (call: Call, session: string, filename: string) => {
    try {
      await call.deleteRecording({ session, filename });
      // Refresh recordings for this call:
      const newRecs = await fetchRecordingsForCall(call);

      setCalls(prev =>
        prev.map(c =>
          c.cid === call.cid ? { ...c, recordings: newRecs } : c
        )
      );
    } catch (err) {
      console.error('Failed to delete recording:', err);
      throw err;
    }
  }, [fetchRecordingsForCall]);

  // Partition ended vs upcoming calls:
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
    isLoading,
    fetchRecordingsForCall,
    deleteRecording,
  };
};