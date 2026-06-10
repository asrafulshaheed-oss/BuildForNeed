import { User, Post, Comment, UserRole } from "../types";

export function usePermissions(currentUser: User | null) {
  return {
    canCreatePost: currentUser?.rolePreference === UserRole.PROBLEM_SHARER,
    canCreateComment: currentUser?.rolePreference === UserRole.DEVELOPER,
    canReplyToComment: (post: Post) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.PROBLEM_SHARER &&
        post.userId === currentUser.id
      );
    },
    canEditPost: (post: Post) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.PROBLEM_SHARER &&
        post.userId === currentUser.id
      );
    },
    canDeletePost: (post: Post) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.PROBLEM_SHARER &&
        post.userId === currentUser.id
      );
    },
    canEditComment: (comment: Comment) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.DEVELOPER &&
        comment.userId === currentUser.id
      );
    },
    canDeleteComment: (comment: Comment) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.DEVELOPER &&
        comment.userId === currentUser.id
      );
    },
    canDeleteReply: (comment: Comment, post: Post) => {
      if (!currentUser) return false;
      return (
        currentUser.rolePreference === UserRole.PROBLEM_SHARER &&
        post.userId === currentUser.id
      );
    },
    canRateDifficulty: (post: Post) => {
      return currentUser?.rolePreference === UserRole.DEVELOPER;
    },
    canRateComment: (comment: Comment, post?: Post) => {
      return currentUser?.rolePreference === UserRole.PROBLEM_SHARER;
    },
    canLikePost: (post: Post) => {
      return !!currentUser;
    },
    canLikeComment: (comment: Comment) => {
      return !!currentUser;
    },
    canLikeReply: (comment: Comment) => {
      return !!currentUser;
    },
  };
}
