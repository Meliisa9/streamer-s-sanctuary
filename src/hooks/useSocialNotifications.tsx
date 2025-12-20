import { supabase } from "@/integrations/supabase/client";

export async function sendSocialNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  if (!userId) return;
  
  const { error } = await supabase.from("user_notifications").insert({
    user_id: userId,
    type,
    title,
    message: message || null,
    link: link || null,
  });
  
  if (error) {
    console.error("Error sending notification:", error);
  }
}

export async function notifyFollow(followerId: string, followingId: string, followerName: string) {
  await sendSocialNotification({
    userId: followingId,
    type: "follow",
    title: "New Follower",
    message: `${followerName} started following you`,
    link: `/user/${followerName}`,
  });
}

export async function notifyComment(profileOwnerId: string, commenterName: string, profileUsername: string, commentId?: string) {
  await sendSocialNotification({
    userId: profileOwnerId,
    type: "comment",
    title: "New Comment",
    message: `${commenterName} commented on your profile`,
    link: commentId ? `/profile#comment-${commentId}` : `/profile#wall`,
  });
}

export async function notifyArticleLike(articleAuthorId: string, likerName: string, articleSlug: string) {
  await sendSocialNotification({
    userId: articleAuthorId,
    type: "like",
    title: "Article Liked",
    message: `${likerName} liked your article`,
    link: `/news/${articleSlug}`,
  });
}

export async function notifyMention(mentionedUserId: string, mentionerName: string, context: string, link: string, profileUsername?: string) {
  // For profile comments, link to the profile owner's page, not the recipient's own profile
  const actualLink = link.startsWith('/profile') && profileUsername 
    ? `/user/${profileUsername}${link.replace('/profile', '')}` 
    : link;
    
  await sendSocialNotification({
    userId: mentionedUserId,
    type: "mention",
    title: "You were mentioned",
    message: `${mentionerName} mentioned you in ${context}`,
    link: actualLink,
  });
}
