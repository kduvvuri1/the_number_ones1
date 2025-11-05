// components/CallList.tsx
'use client';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, Download } from 'lucide-react';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { user } = useUser();
  const { 
    endedCalls, 
    upcomingCalls, 
    recordings, 
    isLoading, 
    deleteRecording, 
    refreshRecordings,
    syncStreamRecordings
  } = useGetCalls();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getCalls = () => {
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings Available';
      default:
        return '';
    }
  };

  const handleDeleteRecording = async (recording: any) => {
    try {
      if (!confirm('Are you sure you want to permanently delete this recording?')) {
        return;
      }

      setDeletingId(recording.id);
      await deleteRecording(recording.id, recording.filename);
    } catch (err) {
      console.log('Error in handleDeleteRecording:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    if (!user?.id) {
      toast.error('Please sign in to refresh recordings');
      return;
    }
    
    setIsRefreshing(true);
    try {
      await refreshRecordings();
      toast.success('Recordings refreshed');
    } catch (err) {
      console.log('Error refreshing recordings:', err);
      toast.error('Failed to refresh recordings');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncStreamRecordings = async () => {
    if (!user?.id) {
      toast.error('Please sign in to sync recordings');
      return;
    }
    
    setIsSyncing(true);
    try {
      await syncStreamRecordings();
    } catch (err) {
      console.log('Error syncing recordings:', err);
      toast.error('Failed to sync recordings');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  return (
    <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
      {type === 'recordings' && (
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Your Recordings</h2>
            <div className="flex gap-2">
              <Button 
                onClick={handleSyncStreamRecordings} 
                disabled={isSyncing}
                variant="outline"
                size="sm"
                className="text-black hover:text-black border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-100"
              >
                <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Stream.io'}
              </Button>
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="text-black hover:text-black border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-100"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Use "Sync Stream.io" to fetch new recordings from your calls. "Refresh" reloads the list.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {calls && calls.length > 0 ? (
          calls.map((item: any) => (
            <div
              key={item.id || item.filename}
              className="relative"
            >
              <MeetingCard
                icon={
                  type === 'ended'
                    ? '/icons/previous.svg'
                    : type === 'upcoming'
                      ? '/icons/upcoming.svg'
                      : '/icons/recordings.svg'
                }
                title={
                  item.state?.custom?.description ||
                  item.filename?.substring(0, 20) ||
                  item.calls?.title ||
                  'No Description'
                }
                date={
                  item.state?.startsAt?.toLocaleString() ||
                  item.start_time?.toLocaleString() ||
                  'No Date'
                }
                isPreviousMeeting={type === 'ended'}
                link={
                  type === 'recordings'
                    ? item.url
                    : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${item.id}`
                }
                buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
                buttonText={type === 'recordings' ? 'Play' : 'Start'}
                handleClick={
                  type === 'recordings'
                    ? () => window.open(item.url, '_blank')
                    : () => router.push(`/meeting/${item.id}`)
                }
              />
              {type === 'recordings' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-red-400 hover:bg-red-900/30"
                  onClick={() => handleDeleteRecording(item)}
                  disabled={deletingId === item.id}
                  aria-label="Delete recording"
                >
                  {deletingId === item.id ? (
                    <Loader className="h-5 w-5" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center h-32 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">{noCallsMessage}</h1>
            {type === 'recordings' && (
              <div className="text-gray-400 text-sm">
                <p>No recordings found in your database.</p>
                <p className="mt-1">Click "Sync Stream.io" to fetch recordings from your calls.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallList;