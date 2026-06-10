import { User, Post, Comment, UserRole, PostVisibility, CommentVisibility, DashboardStats, CommentReply } from "../types";

// Base API URL
const API_BASE = "";

// Dynamic token retrieval helper
function getHeaders(): HeadersInit {
  const token = localStorage.getItem("pfp_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async signUp(name: string, emailOrPhone: string, passwordString: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emailOrPhone, password: passwordString }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to sign up. Credentials might be in use.");
    }
    return res.json();
  },

  async login(emailOrPhone: string, passwordString: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrPhone, password: passwordString }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Invalid username or password.");
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Session expired or invalid.");
    }
    return res.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to clear backend session.");
    }
    return res.json();
  },

  // Onboarding
  async submitOnboarding(role: UserRole): Promise<User> {
    const res = await fetch(`${API_BASE}/api/users/onboarding`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ rolePreference: role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Onboarding failed.");
    }
    return res.json();
  },

  // Role Switching
  async switchRole(role: UserRole): Promise<User> {
    const res = await fetch(`${API_BASE}/api/users/role`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ rolePreference: role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to switch role.");
    }
    return res.json();
  },

  // Posts operations
  async getPosts(category: string = "all", onlyBookmarked: boolean = false, activeRole?: UserRole): Promise<Post[]> {
    const queryParams = new URLSearchParams();
    if (category) queryParams.append("category", category);
    if (onlyBookmarked) queryParams.append("bookmarked", "true");
    if (activeRole) queryParams.append("activeRole", activeRole);

    const res = await fetch(`${API_BASE}/api/posts?${queryParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch problems feed.");
    }
    return res.json();
  },

  async createPost(post: {
    title: string;
    description: string;
    category: string;
    isAnonymous: boolean;
    visibility: PostVisibility;
  }): Promise<Post> {
    const res = await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(post),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create problem post.");
    }
    return res.json();
  },

  async editPost(
    id: string,
    post: {
      title: string;
      description: string;
      category: string;
      isAnonymous: boolean;
      visibility: PostVisibility;
    }
  ): Promise<Post> {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(post),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to edit post.");
    }
    return res.json();
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete post.");
    }
    return res.json();
  },

  async toggleBookmark(postId: string): Promise<{ bookmarked: boolean; savedPostIds: string[] }> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/bookmark`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to toggle bookmark.");
    }
    return res.json();
  },

  // Comments operations
  async getComments(postId: string): Promise<Comment[]> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error("Failed to retrieve comments.");
    }
    return res.json();
  },

  async addComment(
    postId: string,
    comment: { content: string; visibility: CommentVisibility; repositoryUrl?: string; rating?: number; isAnonymous?: boolean }
  ): Promise<Comment> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(comment),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit comment.");
    }
    return res.json();
  },

  async editComment(
    commentId: string,
    comment: { content: string; visibility: CommentVisibility; repositoryUrl?: string; rating?: number; isAnonymous?: boolean }
  ): Promise<Comment> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(comment),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to edit comment.");
    }
    return res.json();
  },

  async replyToComment(
    commentId: string,
    replyContent: string
  ): Promise<Comment> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/reply`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ replyContent }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit feedback reply.");
    }
    return res.json();
  },

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete comment.");
    }
    return res.json();
  },

  async deleteReply(commentId: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/reply`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete feedback reply.");
    }
    return res.json();
  },

  async updateCommentRating(commentId: string, rating: number): Promise<Comment> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/rating`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update comment rating.");
    }
    return res.json();
  },

  // Likes and Difficulty Rating
  async togglePostLike(postId: string): Promise<{ likes: string[] }> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to toggle post like.");
    }
    return res.json();
  },

  async toggleCommentLike(commentId: string): Promise<{ id: string; likes: string[] }> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to toggle comment like.");
    }
    return res.json();
  },

  async toggleReplyLike(commentId: string): Promise<{ id: string; reply: CommentReply }> {
    const res = await fetch(`${API_BASE}/api/comments/${commentId}/reply/like`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to toggle reply like.");
    }
    return res.json();
  },

  async updatePostDifficulty(postId: string, rating: number): Promise<{ id: string; difficultyRatings: { userId: string; rating: number }[] }> {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/difficulty`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update difficulty rating.");
    }
    return res.json();
  },

  // Statistics
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) {
      return { totalProblems: 0, solvedProblemsCount: 0, totalDevelopers: 0, totalSharers: 0 };
    }
    return res.json();
  },
};
