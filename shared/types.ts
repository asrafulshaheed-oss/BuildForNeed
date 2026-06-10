export enum UserRole {
  PROBLEM_SHARER = "problem_sharer",
  DEVELOPER = "developer",
}

export enum PostVisibility {
  DEVELOPERS_ONLY = "developers",
  EVERYONE = "everyone",
}

export enum CommentVisibility {
  OWNER_AND_COMMENTER = "owner_only",
  EVERYONE = "everyone",
}

export interface User {
  id: string;
  name: string;
  emailOrPhone: string;
  rolePreference: UserRole;
  onboardingCompleted: boolean;
  savedPostIds: string[]; // Bookmark list of post IDs for developers
  createdAt: string;
  salt?: string;
  hashedPassword?: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  isAnonymous: boolean;
  visibility: PostVisibility;
  createdAt: string;
  commentsCount?: number;
  likes?: string[]; // user IDs who liked
  difficultyRatings?: { userId: string; rating: number }[]; // developer difficulty ratings
}

export interface CommentReply {
  replyContent: string;
  replyUpdatedAt?: string;
  replyUserId: string; // post owner who replied
  likes?: string[]; // user IDs who liked
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  visibility: CommentVisibility;
  createdAt: string;
  updatedAt?: string;
  repositoryUrl?: string;
  rating?: number; // average/current rating legacy support
  ratings?: { userId: string; rating: number }[]; // Problem Sharer ratings per user
  reply?: CommentReply; // single object from post owner
  isAnonymous?: boolean;
  likes?: string[]; // user IDs who liked
}

export interface DashboardStats {
  totalProblems: number;
  solvedProblemsCount: number;
  totalDevelopers: number;
  totalSharers: number;
}
