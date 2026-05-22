import ClubChatWorkspace from '@/features/club-chat/ClubChatWorkspace';



export function ChatView({
  clubId,
  isMember,
  userId,
}: {
  clubId: string;
  isMember: boolean;
  userId?: string;
}) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden md:h-[calc(100vh-140px)]">
      <ClubChatWorkspace
        isEmbedded
        clubId={clubId}
        clubCategory="student"
        allowStartRoomFromComposer={isMember}
        composerRoomHostId={userId}
      />
    </div>
  );
}
