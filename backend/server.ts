import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { User, Post, Comment, UserRole, PostVisibility, CommentVisibility } from "../shared/types";
import { storage, hashPassword, currentConfig } from "./storage";

// Strip sensitive fields before sending user objects to clients
function sanitizeUser(user: User): User {
  const copy = { ...user };
  delete copy.salt;
  delete copy.hashedPassword;
  return copy;
}

// Delegate database operations to pluggable storage adapter service
function readDB(): { users: User[]; posts: Post[]; comments: Comment[] } {
  return storage.read();
}

function writeDB(data: { users: User[]; posts: Post[]; comments: Comment[] }) {
  storage.write(data);
}

async function startServer() {
  // Strictly initialize resolved storage adapter before routing requests
  if (typeof storage.init === "function") {
    try {
      await storage.init();
    } catch (err: any) {
      console.error("=========================================================================");
      console.error("[CRITICAL BOOT FAILURE] Storage initialization failed:", err.message);
      console.error("The application cannot start up without a verified persistent store.");
      console.error("=========================================================================");
      process.exit(1);
    }
  }

  const app = express();
  const PORT = 3000;

  // Setup standard JSON parses
  app.use(express.json());

  // Simple Request Logging
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  // Auth Middleware (Bearer Token based)
  const getUserFromHeader = (req: express.Request): User | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const userId = authHeader.split(" ")[1];
    const db = readDB();
    const user = db.users.find((u: User) => u.id === userId);
    return user || null;
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getUserFromHeader(req);
    if (!user) {
      return res.status(401).json({ error: "Access Denied. Authenticated user required." });
    }
    (req as any).user = user;
    next();
  };

  // --- API ENDPOINTS ---

  // Auth/SignUp
  app.post("/api/auth/signup", (req, res) => {
    const { name, emailOrPhone, password } = req.body;

    if (!name || !emailOrPhone || !password) {
      return res.status(400).json({ error: "Name, credential, and password are required." });
    }

    const db = readDB();
    const existingUser = db.users.find(
      (u: User) => u.emailOrPhone.toLowerCase() === emailOrPhone.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ error: "Account with this credential already exists." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = hashPassword(password, salt);

    const newUser: User = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      name,
      emailOrPhone,
      rolePreference: UserRole.PROBLEM_SHARER, // Default, updated on onboarding
      onboardingCompleted: false, // Will complete onboarding first
      savedPostIds: [],
      createdAt: new Date().toISOString(),
      salt,
      hashedPassword,
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ user: sanitizeUser(newUser), token: newUser.id });
  });

  // Auth/Login
  app.post("/api/auth/login", (req, res) => {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "Credential and password are required." });
    }

    const db = readDB();
    const user = db.users.find(
      (u: User) => u.emailOrPhone.toLowerCase() === emailOrPhone.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ error: "No user exists with this email/phone number. Please create a new account." });
    }

    if (!user.salt || !user.hashedPassword) {
      return res.status(401).json({ error: "Invalid credentials or password context mismatch." });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.hashedPassword) {
      return res.status(401).json({ error: "Password does not match" });
    }

    res.json({ user: sanitizeUser(user), token: user.id });
  });

  // Auth/Me
  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json(sanitizeUser((req as any).user));
  });

  // Auth/Logout
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // User Onboarding Form
  app.post("/api/users/onboarding", requireAuth, (req, res) => {
    const { rolePreference } = req.body;
    if (rolePreference !== UserRole.PROBLEM_SHARER && rolePreference !== UserRole.DEVELOPER) {
      return res.status(400).json({ error: "Invalid role selected." });
    }

    const currentUser = (req as any).user as User;
    const db = readDB();
    const userIdx = db.users.findIndex((u: User) => u.id === currentUser.id);

    if (userIdx !== -1) {
      db.users[userIdx].rolePreference = rolePreference;
      db.users[userIdx].onboardingCompleted = true;
      writeDB(db);
      return res.json(sanitizeUser(db.users[userIdx]));
    }

    res.status(404).json({ error: "User not found" });
  });

  // Update Role Switch Toggle
  app.post("/api/users/role", requireAuth, (req, res) => {
    const { rolePreference } = req.body;
    if (rolePreference !== UserRole.PROBLEM_SHARER && rolePreference !== UserRole.DEVELOPER) {
      return res.status(400).json({ error: "Invalid role selected." });
    }

    const currentUser = (req as any).user as User;
    const db = readDB();
    const userIdx = db.users.findIndex((u: User) => u.id === currentUser.id);

    if (userIdx !== -1) {
      db.users[userIdx].rolePreference = rolePreference;
      writeDB(db);
      return res.json(sanitizeUser(db.users[userIdx]));
    }

    res.status(444).json({ error: "User not found" });
  });

  // Get Stats summary
  app.get("/stats", (req, res) => {
    const db = readDB();
    const totalProblems = Array.isArray(db.posts) ? db.posts.length : 0;
    const totalDevelopers = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.rolePreference === UserRole.DEVELOPER).length
      : 0;
    const totalSharers = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.rolePreference === UserRole.PROBLEM_SHARER).length
      : 0;
    const solvedProblemsCount = Array.isArray(db.comments)
      ? db.comments.filter((c: Comment) => c.content && (c.content.toLowerCase().includes("github.com") || c.content.toLowerCase().includes("http"))).length
      : 0;

    res.json({
      totalProblems,
      solvedProblemsCount,
      totalDevelopers,
      totalSharers,
    });
  });

  app.get("/api/stats", (req, res) => {
    const db = readDB();
    const totalProblems = Array.isArray(db.posts) ? db.posts.length : 0;
    const totalDevelopers = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.rolePreference === UserRole.DEVELOPER).length
      : 0;
    const totalSharers = Array.isArray(db.users)
      ? db.users.filter((u: User) => u.rolePreference === UserRole.PROBLEM_SHARER).length
      : 0;
    const solvedProblemsCount = Array.isArray(db.comments)
      ? db.comments.filter((c: Comment) => c.content && (c.content.toLowerCase().includes("github.com") || c.content.toLowerCase().includes("http"))).length
      : 0;

    res.json({
      totalProblems,
      solvedProblemsCount,
      totalDevelopers,
      totalSharers,
    });
  });

  // GET posts (Problem list)
  app.get("/api/posts", (req, res) => {
    const user = getUserFromHeader(req);
    const db = readDB();

    let filteredPosts = [...db.posts];

    // If we have categories filters
    const category = req.query.category as string;
    if (category && category !== "all") {
      filteredPosts = filteredPosts.filter((p: Post) => p.category.toLowerCase() === category.toLowerCase());
    }

    // Bookmarks filtering
    const onlyBookmarked = req.query.bookmarked === "true";
    if (onlyBookmarked && user) {
      filteredPosts = filteredPosts.filter((p: Post) => user.savedPostIds?.includes(p.id));
    }

    // Role-based visibility and Developer toggle rule:
    // "When posting, show a dialog/modal with visibility options: Only developers can see this, Everyone can see this"
    // "The toggle should let a logged-in user switch how they view the platform. The feed should change depending on the selected role"
    // If user acts as a PROBLEM_SHARER currently, they should ONLY see posts visible to "everyone".
    // If user is logged in and acts as a DEVELOPER, they can see posts visible to "everyone" AND "developers" (unless they are the author).
    const activeRole = req.query.activeRole as string || (user ? user.rolePreference : UserRole.PROBLEM_SHARER);

    filteredPosts = filteredPosts.filter((post: Post) => {
      // Setup owner check
      const isOwner = user ? post.userId === user.id : false;
      if (isOwner) return true; // Author can always see their own post

      if (post.visibility === PostVisibility.DEVELOPERS_ONLY) {
        // Only visible if active view is developer
        return activeRole === UserRole.DEVELOPER;
      }

      return true; // Everyone posts are public
    });

    // Map posts to resolve anonymity rule:
    // "Anonymous posts must hide the author name from other users."
    // If isAnonymous is true AND requesting user is NOT the author of the post, mask the user name.
    const cleanPosts = filteredPosts.map((post: Post) => {
      const isOwner = user ? post.userId === user.id : false;
      const commentsForPost = db.comments.filter((c: Comment) => c.postId === post.id);

      // Filter comments count based on privacy
      const visibleComments = commentsForPost.filter((c: Comment) => {
        if (c.visibility === CommentVisibility.OWNER_AND_COMMENTER) {
          if (!user) return false;
          return user.id === post.userId || user.id === c.userId;
        }
        return true;
      });

      return {
        ...post,
        userName: (post.isAnonymous && !isOwner) ? "Anonymous Problem Sharer" : post.userName,
        commentsCount: visibleComments.length,
      };
    });

    // Sort by latest
    cleanPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(cleanPosts);
  });

  // CREATE post
  app.post("/api/posts", requireAuth, (req, res) => {
    const { title, description, category, isAnonymous, visibility } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can create posts." });
    }

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category/tags are required." });
    }

    const db = readDB();
    const newPost: Post = {
      id: "p_" + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      title,
      description,
      category,
      isAnonymous: !!isAnonymous,
      visibility: visibility === PostVisibility.DEVELOPERS_ONLY ? PostVisibility.DEVELOPERS_ONLY : PostVisibility.EVERYONE,
      createdAt: new Date().toISOString(),
    };

    db.posts.push(newPost);
    writeDB(db);

    res.status(201).json(newPost);
  });

  // EDIT post
  app.put("/api/posts/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, description, category, isAnonymous, visibility } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can edit posts." });
    }

    const db = readDB();
    const postIdx = db.posts.findIndex((p: Post) => p.id === id);

    if (postIdx === -1) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Verify ownership
    if (db.posts[postIdx].userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. You cannot edit this post." });
    }

    db.posts[postIdx] = {
      ...db.posts[postIdx],
      title: title || db.posts[postIdx].title,
      description: description || db.posts[postIdx].description,
      category: category || db.posts[postIdx].category,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : db.posts[postIdx].isAnonymous,
      visibility: visibility === PostVisibility.DEVELOPERS_ONLY ? PostVisibility.DEVELOPERS_ONLY : PostVisibility.EVERYONE,
    };

    writeDB(db);
    res.json(db.posts[postIdx]);
  });

  // DELETE post
  app.delete("/api/posts/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can delete posts." });
    }

    const db = readDB();
    const postIdx = db.posts.findIndex((p: Post) => p.id === id);

    if (postIdx === -1) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Verify ownership
    if (db.posts[postIdx].userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. You cannot delete this post." });
    }

    db.posts = db.posts.filter((p: Post) => p.id !== id);
    // Also clear associated comments
    db.comments = db.comments.filter((c: Comment) => c.postId !== id);

    writeDB(db);
    res.json({ success: true, message: "Post deleted successfully" });
  });

  // BOOKMARK / SAVE a post
  app.post("/api/posts/:id/bookmark", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    const db = readDB();
    const postExists = db.posts.find((p: Post) => p.id === id);
    if (!postExists) {
      return res.status(404).json({ error: "Post not found." });
    }

    const userIdx = db.users.findIndex((u: User) => u.id === currentUser.id);
    if (userIdx === -1) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const dbUser = db.users[userIdx];
    if (!dbUser.savedPostIds) {
      dbUser.savedPostIds = [];
    }

    const index = dbUser.savedPostIds.indexOf(id);
    let bookmarked = false;
    if (index === -1) {
      dbUser.savedPostIds.push(id);
      bookmarked = true;
    } else {
      dbUser.savedPostIds.splice(index, 1);
      bookmarked = false;
    }

    db.users[userIdx] = dbUser;
    writeDB(db);

    res.json({ bookmarked, savedPostIds: dbUser.savedPostIds });
  });

  // GET Comments for a post
  // Filter according to comment privacy: ONLY post owner and the commenter can view CommentVisibility.OWNER_AND_COMMENTER
  app.get("/api/posts/:postId/comments", (req, res) => {
    const { postId } = req.params;
    const user = getUserFromHeader(req);
    const db = readDB();

    const post = db.posts.find((p: Post) => p.id === postId);
    if (!post) {
      return res.status(444).json({ error: "Parent post does not exist." });
    }

    // Load comments
    const commentsList = db.comments.filter((c: Comment) => c.postId === postId);

    // Apply visibility filter
    // "Comment box should support two visibility modes: visible only to post owner and commenter, visible to everyone who can view the post"
    const visibleComments = commentsList.filter((comment: Comment) => {
      if (comment.visibility === CommentVisibility.OWNER_AND_COMMENTER) {
        if (!user) return false;
        // Allowed if current user is either:
        // 1. The developer who wrote this comment (comment.userId === user.id)
        // 2. The creator of the post themselves (post.userId === user.id)
        return comment.userId === user.id || post.userId === user.id;
      }
      return true; // Everyone comments are visible
    });

    // For comments on an anonymous post:
    // If commenters see other comments, standard name stands. If the commenter is the post-author, and they post anonymously, should that be hidden?
    // Map comments to mask name when isAnonymous is check and current viewer is not the commenter.
    const mappedComments = visibleComments.map((comment: Comment) => {
      const isAuthor = user ? comment.userId === user.id : false;
      return {
        ...comment,
        userName: (comment.isAnonymous && !isAuthor) ? "Anonymous Developer" : comment.userName,
      };
    });

    // Let's sort comments old-to-new
    mappedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(mappedComments);
  });

  // ADD Comment (Only Developer Role)
  app.post("/api/posts/:postId/comments", requireAuth, (req, res) => {
    const { postId } = req.params;
    const { content, visibility, repositoryUrl, isAnonymous } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.DEVELOPER) {
      return res.status(403).json({ error: "Unauthorized. Only Developers can write general comments or solutions." });
    }

    if (!content) {
      return res.status(400).json({ error: "Comment text content cannot be blank." });
    }

    const db = readDB();
    const post = db.posts.find((p: Post) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const newComment: Comment = {
      id: "c_" + Math.random().toString(36).substr(2, 9),
      postId,
      userId: currentUser.id,
      userName: currentUser.name,
      content,
      visibility: visibility === CommentVisibility.OWNER_AND_COMMENTER ? CommentVisibility.OWNER_AND_COMMENTER : CommentVisibility.EVERYONE,
      createdAt: new Date().toISOString(),
      repositoryUrl: repositoryUrl ? String(repositoryUrl) : undefined,
      isAnonymous: !!isAnonymous
    };

    db.comments.push(newComment);
    writeDB(db);

    res.status(201).json(newComment);
  });

  // EDIT Developer Comment (Only Developer Role)
  app.put("/api/comments/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { content, visibility, repositoryUrl, isAnonymous } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.DEVELOPER) {
      return res.status(403).json({ error: "Unauthorized. Only Developers can edit developer comments." });
    }

    if (!content) {
      return res.status(400).json({ error: "Comment text content cannot be blank." });
    }

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];

    // Developers can only edit their own comments
    if (comment.userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. You cannot edit this comment." });
    }

    db.comments[commentIdx] = {
      ...comment,
      content,
      // rating cannot be altered by developers
      visibility: visibility === CommentVisibility.OWNER_AND_COMMENTER ? CommentVisibility.OWNER_AND_COMMENTER : CommentVisibility.EVERYONE,
      repositoryUrl: repositoryUrl ? String(repositoryUrl) : undefined,
      isAnonymous: isAnonymous !== undefined ? !!isAnonymous : comment.isAnonymous,
      updatedAt: new Date().toISOString()
    };

    writeDB(db);
    res.json(db.comments[commentIdx]);
  });

  // POST OWNER REPLY (Single Reply Rule - Only Problem Sharer Role)
  app.put("/api/comments/:id/reply", requireAuth, (req, res) => {
    const { id } = req.params;
    const { replyContent } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can post feedback replies." });
    }

    if (!replyContent) {
      return res.status(400).json({ error: "Reply text content cannot be blank." });
    }

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];
    const post = db.posts.find((p: Post) => p.id === comment.postId);

    if (!post) {
      return res.status(404).json({ error: "Parent post not found." });
    }

    // Only post owner can reply to comments
    if (post.userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. Only the problem poster (post owner) can reply to comments." });
    }

    db.comments[commentIdx] = {
      ...comment,
      reply: {
        replyContent: String(replyContent),
        replyUpdatedAt: new Date().toISOString(),
        replyUserId: currentUser.id
      }
    };

    writeDB(db);
    res.json(db.comments[commentIdx]);
  });

  // DELETE Developer Comment (Only Developer Role)
  app.delete("/api/comments/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];

    if (currentUser.rolePreference !== UserRole.DEVELOPER) {
      return res.status(403).json({ error: "Unauthorized. Only Developers can delete suggestions or comments." });
    }

    // Developers can only delete their own comments
    if (comment.userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. You cannot delete this comment." });
    }

    const post = db.posts.find((p: Post) => p.id === comment.postId);

    db.comments.splice(commentIdx, 1);
    
    // Decrement commentsCount
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
    }

    writeDB(db);
    res.json({ success: true, message: "Comment deleted successfully." });
  });

  // DELETE Post Owner Feedback Reply (Only Problem Sharer Role)
  app.delete("/api/comments/:id/reply", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can delete feedback replies." });
    }

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];
    const post = db.posts.find((p: Post) => p.id === comment.postId);

    if (!post) {
      return res.status(404).json({ error: "Parent post not found." });
    }

    if (post.userId !== currentUser.id) {
      return res.status(403).json({ error: "Unauthorized. Only the post creator can delete this reply feedback." });
    }

    // Remove reply
    delete comment.reply;

    writeDB(db);
    res.json(comment);
  });

  // PUT Comment rating per-user (Only Problem Sharer Role)
  app.put("/api/comments/:id/rating", requireAuth, (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.PROBLEM_SHARER) {
      return res.status(403).json({ error: "Unauthorized. Only Problem Sharers can rate developer comments." });
    }

    if (rating === undefined || rating === null) {
      return res.status(400).json({ error: "Rating value is required." });
    }

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];
    const post = db.posts.find((p: Post) => p.id === comment.postId);

    if (!post) {
      return res.status(404).json({ error: "Parent post not found." });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 0 || numericRating > 3) {
      return res.status(400).json({ error: "Invalid rating. Must be an integer between 0 and 3." });
    }

    if (!comment.ratings) {
      comment.ratings = [];
    }

    const existingIdx = comment.ratings.findIndex(r => r.userId === currentUser.id);

    if (numericRating === 0) {
      // cancel/remove rating
      if (existingIdx !== -1) {
        comment.ratings.splice(existingIdx, 1);
      }
    } else {
      // add or update rating
      if (existingIdx !== -1) {
        comment.ratings[existingIdx].rating = numericRating;
      } else {
        comment.ratings.push({ userId: currentUser.id, rating: numericRating });
      }
    }

    // Compute average rating for backward compatibility/rendering
    if (comment.ratings.length > 0) {
      const sum = comment.ratings.reduce((acc, r) => acc + r.rating, 0);
      comment.rating = Math.round((sum / comment.ratings.length) * 10) / 10;
    } else {
      comment.rating = undefined;
    }

    comment.updatedAt = new Date().toISOString(); 

    writeDB(db);
    res.json(comment);
  });


  // --- LIKING SYSTEM AND POST DIFFICULTY ENHANCEMENTS ---

  // Post Like/Unlike endpoint
  app.post("/api/posts/:id/like", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    const db = readDB();
    const postIdx = db.posts.findIndex((p: Post) => p.id === id);

    if (postIdx === -1) {
      return res.status(404).json({ error: "Post not found." });
    }

    const post = db.posts[postIdx];
    if (!post.likes) {
      post.likes = [];
    }

    const likeIdx = post.likes.indexOf(currentUser.id);
    if (likeIdx === -1) {
      post.likes.push(currentUser.id);
    } else {
      post.likes.splice(likeIdx, 1);
    }

    writeDB(db);
    res.json({ likes: post.likes });
  });

  // Comment Like/Unlike endpoint
  app.post("/api/comments/:id/like", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];
    if (!comment.likes) {
      comment.likes = [];
    }

    const likeIdx = comment.likes.indexOf(currentUser.id);
    if (likeIdx === -1) {
      comment.likes.push(currentUser.id);
    } else {
      comment.likes.splice(likeIdx, 1);
    }

    writeDB(db);
    res.json({ id: comment.id, likes: comment.likes });
  });

  // Comment Reply Like/Unlike endpoint
  app.post("/api/comments/:id/reply/like", requireAuth, (req, res) => {
    const { id } = req.params;
    const currentUser = (req as any).user as User;

    const db = readDB();
    const commentIdx = db.comments.findIndex((c: Comment) => c.id === id);

    if (commentIdx === -1) {
      return res.status(404).json({ error: "Comment not found." });
    }

    const comment = db.comments[commentIdx];
    if (!comment.reply) {
      return res.status(400).json({ error: "No feedback reply exists to like." });
    }

    if (!comment.reply.likes) {
      comment.reply.likes = [];
    }

    const likeIdx = comment.reply.likes.indexOf(currentUser.id);
    if (likeIdx === -1) {
      comment.reply.likes.push(currentUser.id);
    } else {
      comment.reply.likes.splice(likeIdx, 1);
    }

    writeDB(db);
    res.json({ id: comment.id, reply: comment.reply });
  });

  // Post Difficulty rating (1-5 stars) - DEV role ONLY
  app.post("/api/posts/:id/difficulty", requireAuth, (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;
    const currentUser = (req as any).user as User;

    if (currentUser.rolePreference !== UserRole.DEVELOPER) {
      return res.status(403).json({ error: "Unauthorized. Only users operating in Developer mode can rate difficulty." });
    }

    const numericRating = Number(rating);
    if (numericRating === 0) {
      const db = readDB();
      const postIdx = db.posts.findIndex((p: Post) => p.id === id);
      if (postIdx === -1) {
        return res.status(404).json({ error: "Post not found." });
      }
      const post = db.posts[postIdx];
      if (!post.difficultyRatings) {
        post.difficultyRatings = [];
      }
      const existingRatingIdx = post.difficultyRatings.findIndex(r => r.userId === currentUser.id);
      if (existingRatingIdx !== -1) {
        post.difficultyRatings.splice(existingRatingIdx, 1);
      }
      writeDB(db);
      return res.json({ id: post.id, difficultyRatings: post.difficultyRatings });
    }

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Invalid rating. Must be an integer between 1 and 5." });
    }

    const db = readDB();
    const postIdx = db.posts.findIndex((p: Post) => p.id === id);

    if (postIdx === -1) {
      return res.status(404).json({ error: "Post not found." });
    }

    const post = db.posts[postIdx];
    if (!post.difficultyRatings) {
      post.difficultyRatings = [];
    }

    const existingRatingIdx = post.difficultyRatings.findIndex(r => r.userId === currentUser.id);
    if (existingRatingIdx !== -1) {
      post.difficultyRatings[existingRatingIdx].rating = numericRating;
    } else {
      post.difficultyRatings.push({ userId: currentUser.id, rating: numericRating });
    }

    writeDB(db);
    res.json({ id: post.id, difficultyRatings: post.difficultyRatings });
  });

  // --- GEMINI AI CHAT & SUMMARIZE ENDPOINTS ---
  app.post("/api/gemini/chat", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in the platform's Environment Secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format messages safely into standard contents roles
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content) }],
      }));

      // Set headers for Server-Sent Events (SSE) streaming compatibility
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: "You are a helpful companion on 'Build For Need'. You help Problem Sharers clarify their tech requirements and assist Developers (especially beginners) in conceptualizing system designs, open-source stack choices, and feature roadmaps to solve real-world problems. Keep your response helpful, concise, well-formatted, and encouraging.",
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("[GEMINI CHAT ERROR]", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Failed to communicate with Gemini." });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message || "Failed to communicate with Gemini." })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/gemini/summarize", async (req, res) => {
    const { title, description, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Both title and description are required." });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured in the platform's Environment Secrets." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `Please summarize this shared real-world problem concisely in 1-2 sentences. Highlight the core pain point and the desired software outcome.

Title: ${title}
Category: ${category || "General"}
Description:
${description}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a concise summarizer. Respond with ONLY a direct, clean, 2-sentence summary of the core issue and target solution framework. Avoid meta-commentary or slogans.",
        }
      });

      const summary = response.text ? response.text.trim() : "No summary could be generated of this post.";
      res.json({ summary });
    } catch (err: any) {
      console.error("[GEMINI SUMMARIZE ERROR]", err);
      res.status(500).json({ error: err.message || "Failed to communicate with Gemini to summarize this problem." });
    }
  });


  // --- STATIC AND VITE SERVER MIDDLEWARE SETUP ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
