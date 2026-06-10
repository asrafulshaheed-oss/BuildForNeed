import { useState, useEffect, FormEvent } from "react";
import {
  User,
  Post,
  Comment,
  UserRole,
  PostVisibility,
  CommentVisibility,
  DashboardStats,
} from "./types";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { GeminiChatbot } from "./components/GeminiChatbot";
import { useTheme } from "./context/ThemeContext";
import { usePermissions } from "./hooks/usePermissions";
import { AboutTab } from "./components/AboutTab";
import { FaqTab } from "./components/FaqTab";
import { DonateTab } from "./components/DonateTab";
import { AnimatedIntroCarousel } from "./components/AnimatedIntroCarousel";
import { SharePreviewModal } from "./components/SharePreviewModal";
import toriiBg from "./assets/images/torii_gate_sea.png";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Edit3,
  Trash2,
  Heart,
  Bookmark,
  MessageSquare,
  ExternalLink,
  Github,
  Lock,
  Eye,
  Check,
  RefreshCw,
  Layers,
  ShieldCheck,
  Sparkles,
  Code,
  Lightbulb,
  Users,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Info,
  X,
  Star,
  CornerDownRight,
  Share2,
  Search,
  History,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const interactionVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const permissions = usePermissions(currentUser);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("pfp_token"),
  );
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showIntroSequence, setShowIntroSequence] = useState<boolean>(true);
  const [isOnboardingChoiceSubmitting, setIsOnboardingChoiceSubmitting] = useState<boolean>(false);

  const { theme } = useTheme();

  // Responsive and content expansion states
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePostExpand = (postId: string) => {
    setExpandedPostIds((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Tabs: "feed" | "about" | "faq"
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [previousTab, setPreviousTab] = useState<string>("feed");

  useEffect(() => {
    // Sync previousTab to know exactly where to return from full screen workspace
    if (activeTab !== "gemini-workspace") {
      setPreviousTab(activeTab);
    }

    const handleScrollLock = () => {
      if (window.innerWidth >= 1024 && (activeTab === "feed" || activeTab === "gemini-workspace") && currentUser && !showIntroSequence) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        window.scrollTo(0, 0);
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };

    handleScrollLock();
    window.addEventListener("resize", handleScrollLock);

    return () => {
      window.removeEventListener("resize", handleScrollLock);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [activeTab, currentUser, showIntroSequence]);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      const targetTab = e.detail?.tab;
      if (targetTab === "goback") {
        setActiveTab((prev) => {
          // If previousTab is gemini-workspace itself, fallback to feed
          if (previousTab === "gemini-workspace") return "feed";
          return previousTab || "feed";
        });
      } else if (targetTab) {
        setActiveTab(targetTab);
      }
    };
    window.addEventListener("switch-tab" as any, handleSwitchTab);
    return () => {
      window.removeEventListener("switch-tab" as any, handleSwitchTab);
    };
  }, [previousTab]);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(
    null,
  );
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = useState<
    string | null
  >(null);
  const [deleteConfirmReplyId, setDeleteConfirmReplyId] = useState<
    string | null
  >(null);
  const [mobileCommentPostId, setMobileCommentPostId] = useState<string | null>(null);

  // Promise-based state to show a beautiful comment-deletion confirm dialog modal
  const [deleteCommentConfirm, setDeleteCommentConfirm] = useState<{
    resolve: (confirmed: boolean) => void;
    commentId: string;
    commentText: string;
  } | null>(null);

  // App Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    solvedProblemsCount: 0,
    totalDevelopers: 0,
    totalSharers: 0,
  });

  // Feeds state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Gemini AI Summarization states
  const [postSummaries, setPostSummaries] = useState<Record<string, string>>({});
  const [summarizingPostIds, setSummarizingPostIds] = useState<Record<string, boolean>>({});

  // Authentication forms state
  const [signupName, setSignupName] = useState("");
  const [signupType, setSignupType] = useState<"email" | "phone">("email");
  const [signupValue, setSignupValue] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const [loginType, setLoginType] = useState<"email" | "phone">("email");
  const [loginValue, setLoginValue] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  // Modal State for Posting
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalCategory, setModalCategory] = useState("Web Apps");
  const [modalIsAnonymous, setModalIsAnonymous] = useState(false);
  const [modalVisibility, setModalVisibility] = useState<PostVisibility>(
    PostVisibility.EVERYONE,
  );
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Mode state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);

  // Comments State (Keyed by postId -> list of Comment)
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<
    Record<string, boolean>
  >({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<
    string | null
  >(null);

  // New Comment compose state
  const [commentContent, setCommentContent] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>(
    CommentVisibility.EVERYONE,
  );
  const [commentRepositoryUrl, setCommentRepositoryUrl] = useState("");
  const [commentIsAnonymous, setCommentIsAnonymous] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Custom comment ratings, editing, and owner reply states
  const [commentRating, setCommentRating] = useState<number>(3);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] =
    useState<string>("");
  const [editingCommentRating, setEditingCommentRating] = useState<number>(3);
  const [editingCommentVisibility, setEditingCommentVisibility] =
    useState<CommentVisibility>(CommentVisibility.EVERYONE);
  const [editingCommentRepositoryUrl, setEditingCommentRepositoryUrl] =
    useState<string>("");
  const [editingCommentIsAnonymous, setEditingCommentIsAnonymous] =
    useState<boolean>(false);
  const [editingCommentSubmitting, setEditingCommentSubmitting] =
    useState<boolean>(false);

  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(
    null,
  );
  const [replyText, setReplyText] = useState<string>("");
  const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

  // Search input and persistent history helpers
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pfp_recent_queries");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (q) => q.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("pfp_recent_queries", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteHistoryItem = (itemToDelete: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((q) => q !== itemToDelete);
      localStorage.setItem("pfp_recent_queries", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.setItem("pfp_recent_queries", JSON.stringify([]));
  };

  const getDifficultyTrendData = () => {
    const data = [];
    const now = new Date();

    // Aggregate posts that have difficulty ratings
    const ratedPosts = posts
      .map((p) => {
        const ratings = p.difficultyRatings || [];
        const avg =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
        return {
          date: new Date(p.createdAt),
          avgDifficulty: avg,
          hasRatings: ratings.length > 0,
        };
      })
      .filter((p) => p.hasRatings);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      // Calculate average difficulty of all rated posts created on or before day `d`
      const postsUpToDay = ratedPosts.filter((p) => p.date <= d);

      let avgScore = 0;
      if (postsUpToDay.length > 0) {
        avgScore =
          postsUpToDay.reduce((sum, p) => sum + p.avgDifficulty, 0) /
          postsUpToDay.length;
      } else {
        // Falling back to overall average if possible, or starter baseline of 3.0
        avgScore = 3.2;
      }

      data.push({
        name: dateStr,
        difficulty: parseFloat(avgScore.toFixed(1)),
      });
    }
    return data;
  };

  const [postSortOrder, setPostSortOrder] = useState<
    "recent" | "liked" | "difficult"
  >("recent");
  const [commentSortOrders, setCommentSortOrders] = useState<
    Record<string, "newest" | "highest_rated">
  >({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        console.warn("navigator.clipboard failed, trying fallback: ", e);
      }
    }

    // Fallback selection range method for WebView/Android compatibility
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  };

  const handleSharePost = async (postId: string) => {
    showToast("Copying link...");
    const permalink = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    
    setTimeout(async () => {
      await copyToClipboard(permalink);
      const post = posts.find((p) => p.id === postId);
      if (post) {
        setShareModalPost(post);
      }
    }, 400);
  };

  const toggleCommentSort = (postId: string) => {
    setCommentSortOrders((prev) => {
      const current = prev[postId] || "newest";
      const next = current === "newest" ? "highest_rated" : "newest";
      return { ...prev, [postId]: next };
    });
  };

  const categories = [
    "Web Apps",
    "Mobile Apps",
    "Developer Tools",
    "Productivity",
    "Sustainability",
    "Healthcare",
    "Education",
  ];

  // Fetch stats and self initially
  useEffect(() => {
    async function loadStats() {
      try {
        const s = await api.getStats();
        setStats(s);
      } catch (err) {
        console.error("Failed to load statistics", err);
      }
    }
    loadStats();
  }, [posts]);

  // Load self user on token detection
  useEffect(() => {
    async function checkUserSession() {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const user = await api.getMe();
        setCurrentUser(user);
      } catch (err) {
        console.error("Failed to fetch current user session", err);
        localStorage.removeItem("pfp_token");
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkUserSession();
  }, [token]);

  // Fetch feed entries
  const fetchFeed = async () => {
    if (!currentUser || !currentUser.onboardingCompleted) {
      return;
    }
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const activeRole = currentUser.rolePreference;
      const data = await api.getPosts(
        activeCategory,
        showBookmarksOnly,
        activeRole,
      );
      setPosts(data);
    } catch (err: any) {
      setPostsError(err.message || "Failed to sync platform problems.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [
    currentUser?.rolePreference,
    currentUser?.onboardingCompleted,
    activeCategory,
    showBookmarksOnly,
  ]);

  // Handle Signup
  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    if (!signupName.trim()) {
      setSignupError("Please provide a name.");
      return;
    }
    if (!signupValue.trim()) {
      setSignupError(`Please enter a valid ${signupType}.`);
      return;
    }
    if (signupPassword.length < 5) {
      setSignupError("Password must be at least 5 characters.");
      return;
    }

    try {
      const data = await api.signUp(
        signupName.trim(),
        signupValue.trim(),
        signupPassword,
      );
      setSignupSuccess(
        "Successfully registered client! Directing to choose your path...",
      );

      // Auto-save login creds
      localStorage.setItem("pfp_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);

      // Reset signup fields
      setSignupName("");
      setSignupValue("");
      setSignupPassword("");
    } catch (err: any) {
      setSignupError(
        err.message || "Credential already associated with an account.",
      );
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginValue.trim()) {
      setLoginError(`Please enter your registered ${loginType}.`);
      return;
    }
    if (!loginPassword) {
      setLoginError("Please enter your account password.");
      return;
    }

    try {
      const data = await api.login(loginValue.trim(), loginPassword);
      localStorage.setItem("pfp_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setShowIntroSequence(true);
    } catch (err: any) {
      setLoginError(err.message || "Authentication credentials invalid.");
    }
  };

  // Handle Onboarding Choice
  const handleOnboardingChoice = async (role: UserRole) => {
    if (isOnboardingChoiceSubmitting) return;
    setIsOnboardingChoiceSubmitting(true);
    try {
      const updatedUser = await api.submitOnboarding(role);
      setCurrentUser(updatedUser);
      setShowIntroSequence(true);
      // Success triggers fetching feeds
    } catch (err) {
      console.error(
        "Failed to submit onboarding configuration. Please try again.",
        err,
      );
    } finally {
      setIsOnboardingChoiceSubmitting(false);
    }
  };

  // Handle Role Switch inside Dashboard
  const handleRoleSwitch = async (newRole: UserRole) => {
    if (!currentUser) return;
    try {
      const updatedUser = await api.switchRole(newRole);
      setCurrentUser(updatedUser);
      setShowIntroSequence(true);
    } catch (err) {
      console.error("Failed to toggle display role state", err);
    }
  };

  // Logout Trigger
  const handleLogout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch (err) {
      console.warn("Backend session teardown warning:", err);
    } finally {
      // Guaranteed local session clear and state resets
      localStorage.removeItem("pfp_token");
      setToken(null);
      setCurrentUser(null);
      setSearchQuery("");
      setShowIntroSequence(true); // reset carousel state for subsequent logins

      // Reset tabs and navigation references
      setActiveTab("feed");
      setActiveCategory("all");
      setShowBookmarksOnly(false);
    }
  };

  // Logo Brand Click action: jump directly to feed, reset list filters, reset intro sequence, scroll dynamically to posts
  const handleLogoClick = () => {
    setActiveTab("feed");
    setShowIntroSequence(false);
    setPostSortOrder("recent");
    
    // Clear filters and bookmarks so the first available post is visible
    setActiveCategory("all");
    setShowBookmarksOnly(false);
    
    setTimeout(() => {
      const searchToolbar = document.getElementById("feed-search-toolbar");
      if (searchToolbar) {
        searchToolbar.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const postsList = document.getElementById("posts-feed-list") || document.getElementById("feed-columns-grid") || document.getElementById("app-main-layout-container");
        if (postsList) {
          postsList.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }, 100);
  };

  // Bookmark toggler
  const handleToggleBookmark = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.toggleBookmark(postId);

      // update local bookmarks state
      setCurrentUser({
        ...currentUser,
        savedPostIds: res.savedPostIds,
      });

      // Update bookmarks indicator natively in list search
      if (showBookmarksOnly) {
        setPosts((prev) => prev.filter((p) => res.savedPostIds.includes(p.id)));
      }
    } catch (err) {
      console.error("Failed to toggle post save state", err);
    }
  };

  // Submit new problem post
  const handleCreatePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalTitle.trim()) {
      setModalError("Please specify an urgent problem title.");
      return;
    }
    if (!modalDescription.trim()) {
      setModalError(
        "Please detail the problem description or friction points.",
      );
      return;
    }

    try {
      if (editingPost) {
        // Edit flow
        const result = await api.editPost(editingPost.id, {
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          category: modalCategory,
          isAnonymous: modalIsAnonymous,
          visibility: modalVisibility,
        });

        // Sync local app state
        setPosts((prev) =>
          prev.map((p) => (p.id === result.id ? { ...p, ...result } : p)),
        );
        setEditingPost(null);
      } else {
        // Create flow
        await api.createPost({
          title: modalTitle.trim(),
          description: modalDescription.trim(),
          category: modalCategory,
          isAnonymous: modalIsAnonymous,
          visibility: modalVisibility,
        });
        localStorage.removeItem("pfp_post_draft");
      }

      // Reset modal fields and close
      setModalTitle("");
      setModalDescription("");
      setModalCategory("Web Apps");
      setModalIsAnonymous(false);
      setModalVisibility(PostVisibility.EVERYONE);
      setShowCreateModal(false);

      // Refresh list
      fetchFeed();
    } catch (err: any) {
      setModalError(err.message || "Failed to commit problem. Check inputs.");
    }
  };

  // Local storage draft saver for post creation
  useEffect(() => {
    if (showCreateModal && !editingPost) {
      const draft = {
        title: modalTitle,
        description: modalDescription,
        category: modalCategory,
        isAnonymous: modalIsAnonymous,
        visibility: modalVisibility,
      };
      localStorage.setItem("pfp_post_draft", JSON.stringify(draft));
    }
  }, [showCreateModal, modalTitle, modalDescription, modalCategory, modalIsAnonymous, modalVisibility, editingPost]);

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setModalError(null);
    const saved = localStorage.getItem("pfp_post_draft");
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setModalTitle(draft.title || "");
        setModalDescription(draft.description || "");
        setModalCategory(draft.category || "Web Apps");
        setModalIsAnonymous(!!draft.isAnonymous);
        setModalVisibility(draft.visibility || PostVisibility.EVERYONE);
      } catch (e) {
        console.error("Failed to parse post draft:", e);
        setModalTitle("");
        setModalDescription("");
        setModalCategory("Web Apps");
        setModalIsAnonymous(false);
        setModalVisibility(PostVisibility.EVERYONE);
      }
    } else {
      setModalTitle("");
      setModalDescription("");
      setModalCategory("Web Apps");
      setModalIsAnonymous(false);
      setModalVisibility(PostVisibility.EVERYONE);
    }
    setShowCreateModal(true);
  };

  // Trigger editing modal
  const startEditPost = (post: Post) => {
    if (currentUser?.rolePreference !== UserRole.PROBLEM_SHARER) {
      alert("Unauthorized. Only Problem Sharers can create or edit problems.");
      return;
    }
    if (post.userId !== currentUser.id) {
      alert("Unauthorized. You can only edit your own posts.");
      return;
    }
    setEditingPost(post);
    setModalTitle(post.title);
    setModalDescription(post.description);
    setModalCategory(post.category);
    setModalIsAnonymous(post.isAnonymous);
    setModalVisibility(post.visibility);
    setShowCreateModal(true);
  };

  // Delete target problem post
  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      // Reset comments expansion state if deleted item is open
      if (activeCommentsPostId === postId) {
        setActiveCommentsPostId(null);
      }
    } catch (err: any) {
      console.error("Could not delete this problem post:", err.message || err);
    }
  };

  // Load Comments for a target Post
  const toggleCommentsExpansion = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      // close comments pane
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);
    setCommentError(null);
    setCommentContent("");
    setCommentVisibility(CommentVisibility.EVERYONE);

    // If comments are not already loaded or represent fresh look, fetch them
    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await api.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error(
        "Failed to retrieve comments for problem ID " + postId,
        err,
      );
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Submit Comments
  const handleAddCommentSubmit = async (e: FormEvent, postId: string) => {
    e.preventDefault();
    setCommentError(null);

    if (currentUser?.rolePreference !== UserRole.DEVELOPER) {
      setCommentError(
        "Unauthorized. Only Developers can write general solutions or comments.",
      );
      return;
    }

    if (!commentContent.trim()) {
      setCommentError("Please type a meaningful suggestion or review comment.");
      return;
    }

    setCommentSubmitting(true);
    try {
      const result = await api.addComment(postId, {
        content: commentContent.trim(),
        visibility: commentVisibility,
        repositoryUrl: commentRepositoryUrl.trim() || undefined,
        isAnonymous: commentIsAnonymous,
      });

      // Update comments live list in client UI
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), result],
      }));

      // Increment local count so numbers look correct real time
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          }
          return p;
        }),
      );

      // Clear entry form
      setCommentContent("");
      setCommentRepositoryUrl("");
      setCommentVisibility(CommentVisibility.EVERYONE);
      setCommentRating(3);
      setCommentIsAnonymous(false);
    } catch (err: any) {
      setCommentError(
        err.message || "Could not publish your feedback comment.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Edit existing developer comment
  const handleEditCommentSubmit = async (
    e: FormEvent,
    commentId: string,
    postId: string,
  ) => {
    e.preventDefault();

    if (currentUser?.rolePreference !== UserRole.DEVELOPER) {
      alert("Unauthorized. Only Developers can edit suggestions or comments.");
      return;
    }

    if (!editingCommentContent.trim()) {
      alert("Please enter some feedback.");
      return;
    }
    setEditingCommentSubmitting(true);
    try {
      const result = await api.editComment(commentId, {
        content: editingCommentContent.trim(),
        visibility: editingCommentVisibility,
        repositoryUrl: editingCommentRepositoryUrl.trim() || undefined,
        isAnonymous: editingCommentIsAnonymous,
      });

      // Update local comment map
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: prev[postId].map((c) => (c.id === commentId ? result : c)),
      }));

      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message || "Failed to update comment.");
    } finally {
      setEditingCommentSubmitting(false);
    }
  };

  // Submit feedback reply from the post owner (problem poster)
  const handleReplySubmit = async (
    e: FormEvent,
    commentId: string,
    postId: string,
  ) => {
    e.preventDefault();
    if (currentUser?.rolePreference !== UserRole.PROBLEM_SHARER) {
      alert("Unauthorized. Only Problem Sharers can post feedback replies.");
      return;
    }
    if (!replyText.trim()) {
      alert("Please enter feedback reply text.");
      return;
    }
    setReplySubmitting(true);
    try {
      const result = await api.replyToComment(commentId, replyText.trim());

      // Update local comment map
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: prev[postId].map((c) => (c.id === commentId ? result : c)),
      }));

      setReplyingCommentId(null);
      setReplyText("");
    } catch (err: any) {
      alert(err.message || "Failed to post feedback reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  // Delete developer comment
  const handleDeleteComment = async (commentId: string, postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const commSubList = commentsMap[postId] || [];
    const comm = commSubList.find((c) => c.id === commentId);

    const isCommentOwner = comm && currentUser?.id === comm.userId;
    const isPostOwner = post && currentUser?.id === post.userId;

    if (!currentUser || (!isCommentOwner && !isPostOwner)) {
      alert(
        "Unauthorized. Only the owner of this solution plan, or the owner of the problem post, can delete it.",
      );
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      setDeleteCommentConfirm({
        resolve,
        commentId,
        commentText: comm?.content
          ? comm.content.length > 80
            ? comm.content.slice(0, 80) + "..."
            : comm.content
          : "this Suggestion",
      });
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteComment(commentId);

      // Update local comments map
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));

      // Decrement local commentsCount in posts list
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message || "Failed to delete comment.");
    }
  };

  // Delete post owner reply feedback
  const handleDeleteReply = async (commentId: string, postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const isPostOwner = post && currentUser?.id === post.userId;

    if (!currentUser || !isPostOwner) {
      alert(
        "Unauthorized. Only the owner of the problem post can delete their reply.",
      );
      return;
    }
    try {
      const result = await api.deleteReply(commentId);

      // Update local comment map
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) =>
          c.id === commentId ? result : c,
        ),
      }));
    } catch (err: any) {
      alert(err.message || "Failed to delete feedback reply.");
    }
  };

  // Allow post owners to instantly adjust/select rating stars on existing solutions on click
  const handleUpdateCommentRating = async (
    commentId: string,
    rating: number,
    postId: string,
  ) => {
    if (currentUser?.rolePreference !== UserRole.PROBLEM_SHARER) {
      alert("Unauthorized. Only Problem Sharers can rate developer comments.");
      return;
    }

    const previousComments = commentsMap[postId] || [];

    // Optimistically update the comments Map immediately for 0ms lag
    setCommentsMap((prev) => {
      const parentComments = prev[postId] || [];
      const updated = parentComments.map((c) => {
        if (c.id === commentId) {
          const copied = { ...c };
          if (!copied.ratings) copied.ratings = [];

          // find and update rating
          const existingIdx = copied.ratings.findIndex((r) => r.userId === currentUser.id);
          if (rating === 0) {
            if (existingIdx !== -1) {
              const nextRatings = [...copied.ratings];
              nextRatings.splice(existingIdx, 1);
              copied.ratings = nextRatings;
            }
          } else {
            const nextRatings = [...copied.ratings];
            if (existingIdx !== -1) {
              nextRatings[existingIdx] = { ...nextRatings[existingIdx], rating };
            } else {
              nextRatings.push({ userId: currentUser.id, rating });
            }
            copied.ratings = nextRatings;
          }

          // recalculate average rating
          if (copied.ratings.length > 0) {
            const sum = copied.ratings.reduce((acc, r) => acc + r.rating, 0);
            copied.rating = Math.round((sum / copied.ratings.length) * 10) / 10;
          } else {
            copied.rating = undefined;
          }
          return copied;
        }
        return c;
      });
      return { ...prev, [postId]: updated };
    });

    try {
      const result = await api.updateCommentRating(commentId, rating);
      // Synchronize with final server response
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((c) => (c.id === commentId ? result : c)),
      }));
    } catch (err: any) {
      // Revert in case of API error
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: previousComments,
      }));
      alert(err.message || "Failed to update comment rating.");
    }
  };

  const handleSummarizePost = async (postId: string, title: string, description: string, category: string) => {
    if (postSummaries[postId]) {
      setPostSummaries(prev => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }

    setSummarizingPostIds(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, category }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await response.json();
      setPostSummaries(prev => ({ ...prev, [postId]: data.summary }));
    } catch (err: any) {
      alert("Error generating summary: " + (err.message || "Could not reach Gemini client"));
    } finally {
      setSummarizingPostIds(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleTogglePostLike = async (postId: string) => {
    if (!currentUser) {
      alert(
        "Please sign in or create an account to support this problem post!",
      );
      return;
    }
    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const lks = p.likes || [];
            const hasLiked = lks.includes(currentUser.id);
            const nextLikes = hasLiked
              ? lks.filter((uid) => uid !== currentUser.id)
              : [...lks, currentUser.id];
            return { ...p, likes: nextLikes };
          }
          return p;
        }),
      );

      const res = await api.togglePostLike(postId);
      // Synchronize with server response
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, likes: res.likes };
          }
          return p;
        }),
      );
    } catch (err: any) {
      console.error(err.message || "Failed to toggle post like.");
    }
  };

  const handleToggleCommentLike = async (commentId: string, postId: string) => {
    if (!currentUser) {
      alert("Please sign in or create an account to support this comment!");
      return;
    }
    try {
      // Optimistic update
      setCommentsMap((prev) => {
        const comms = prev[postId] || [];
        const nextComms = comms.map((c) => {
          if (c.id === commentId) {
            const lks = c.likes || [];
            const hasLiked = lks.includes(currentUser.id);
            const nextLikes = hasLiked
              ? lks.filter((uid) => uid !== currentUser.id)
              : [...lks, currentUser.id];
            return { ...c, likes: nextLikes };
          }
          return c;
        });
        return { ...prev, [postId]: nextComms };
      });

      const res = await api.toggleCommentLike(commentId);
      // Sync
      setCommentsMap((prev) => {
        const comms = prev[postId] || [];
        const nextComms = comms.map((c) => {
          if (c.id === commentId) {
            return { ...c, likes: res.likes };
          }
          return c;
        });
        return { ...prev, [postId]: nextComms };
      });
    } catch (err: any) {
      console.error(err.message || "Failed to toggle comment like.");
    }
  };

  const handleToggleReplyLike = async (commentId: string, postId: string) => {
    if (!currentUser) {
      alert("Please sign in or create an account to support this reply!");
      return;
    }
    try {
      // Optimistic update
      setCommentsMap((prev) => {
        const comms = prev[postId] || [];
        const nextComms = comms.map((c) => {
          if (c.id === commentId && c.reply) {
            const r = c.reply;
            const lks = r.likes || [];
            const hasLiked = lks.includes(currentUser.id);
            const nextLikes = hasLiked
              ? lks.filter((uid) => uid !== currentUser.id)
              : [...lks, currentUser.id];
            return { ...c, reply: { ...r, likes: nextLikes } };
          }
          return c;
        });
        return { ...prev, [postId]: nextComms };
      });

      const res = await api.toggleReplyLike(commentId);
      // Sync
      setCommentsMap((prev) => {
        const comms = prev[postId] || [];
        const nextComms = comms.map((c) => {
          if (c.id === commentId) {
            return { ...c, reply: res.reply };
          }
          return c;
        });
        return { ...prev, [postId]: nextComms };
      });
    } catch (err: any) {
      console.error(err.message || "Failed to toggle reply like.");
    }
  };

  const handleUpdatePostDifficulty = async (postId: string, rating: number) => {
    if (!currentUser) {
      alert("Please sign in or create an account first!");
      return;
    }
    if (currentUser.rolePreference !== UserRole.DEVELOPER) {
      alert(
        "Unauthorized. Only developers in Developer mode can rate room/post difficulty.",
      );
      return;
    }
    try {
      const currentRating = posts.find(p => p.id === postId)?.difficultyRatings?.find(r => r.userId === currentUser.id)?.rating || 0;
      const targetRating = currentRating === rating ? 0 : rating;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const rts = p.difficultyRatings || [];
            const idx = rts.findIndex((r) => r.userId === currentUser.id);
            const nextRts = [...rts];
            if (idx !== -1) {
              if (targetRating === 0) {
                nextRts.splice(idx, 1);
              } else {
                nextRts[idx].rating = targetRating;
              }
            } else {
              if (targetRating !== 0) {
                nextRts.push({ userId: currentUser.id, rating: targetRating });
              }
            }
            return { ...p, difficultyRatings: nextRts };
          }
          return p;
        }),
      );

      const res = await api.updatePostDifficulty(postId, targetRating);
      // Sync
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, difficultyRatings: res.difficultyRatings };
          }
          return p;
        }),
      );
    } catch (err: any) {
      console.error(err.message || "Failed to update difficulty rating.");
    }
  };

  // Quick helper to fill in suggested repo string
  const insertGithubTemplate = () => {
    const template =
      "GitHub Repo: https://github.com/my-profile/proposed-solution-repo\n";
    setCommentContent((prev) => template + prev);
  };

  // Filter posts based on search criteria and sort dynamically
  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (postSortOrder === "liked") {
        const likesA = a.likes?.length || 0;
        const likesB = b.likes?.length || 0;
        if (likesB !== likesA) return likesB - likesA;
      } else if (postSortOrder === "difficult") {
        const getAvgDifficultyNum = (p: Post) => {
          const ratings = p.difficultyRatings || [];
          if (ratings.length === 0) return 0;
          return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        };
        const diffA = getAvgDifficultyNum(a);
        const diffB = getAvgDifficultyNum(b);
        if (diffB !== diffA) return diffB - diffA;
      }

      // Default: Most Recent (by createdAt descending)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300 relative">

      {/* Dynamic Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        onBrandClick={handleLogoClick}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        showBookmarksOnly={showBookmarksOnly}
        setShowBookmarksOnly={setShowBookmarksOnly}
        setShowIntroSequence={setShowIntroSequence}
        difficultyTrendsData={getDifficultyTrendData()}
      />

      {/* Main Container Area - Responsive and Fluid Viewport Adapter with clamp() */}
      <main
        id="app-main-layout-container"
        className={`flex-1 w-full mx-auto px-[clamp(0.5rem,3vw,1.5rem)] pt-20 pb-5 sm:px-6 md:px-8 lg:px-[clamp(1.5rem,4vw,3rem)] lg:pt-[clamp(5.25rem,6.5vh,6rem)] lg:pb-[clamp(1.5rem,4vh,3.5rem)] transition-all ease-out duration-300 flex flex-col overflow-x-hidden ${
          currentUser && (activeTab === "feed" || activeTab === "gemini-workspace") && !showIntroSequence
            ? "lg:h-[calc(100vh-96px)] lg:overflow-hidden lg:pb-2"
            : ""
        }`}
        style={{ maxWidth: "clamp(100%, 94vw, 1580px)" }}
      >
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-slate-500 text-sm">
              Validating secure platform credentials...
            </p>
          </div>
        ) : !currentUser ? (
          /* 1) LANDING PAGE WITH SIGN-UP AND LOGIN SIDE BY SIDE */
          <div
            id="landing-page-flow"
            className="grid lg:grid-cols-12 gap-[clamp(1.5rem,4vw,4rem)] items-start py-4 lg:py-[clamp(2rem,6vh,4rem)]"
          >
            {/* Left Column: Purpose statement & Community Live Metrics */}
            <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-left duration-500">
              <div className="space-y-[clamp(1rem,3vh,1.75rem)]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-full uppercase tracking-wider">
                  The Product Backlog Of The Internet
                </span>
                <h1 className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold text-slate-900 dark:text-slate-105 tracking-tight leading-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-100 dark:via-indigo-200 dark:to-slate-100 bg-clip-text text-transparent">
                  Every real solution starts with a real problem.
                </h1>
                <p className="text-[clamp(14px,1.1vw,18px)] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  Build For Need is an open community where non-technical
                  operators post manual friction, and developers collaborate
                  around real human needs.
                </p>
              </div>

              {/* Real metric indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {stats.totalProblems}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Problems Shared
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Active dilemmas awaiting design concepts
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {stats.solvedProblemsCount}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Suggested Repos
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Live open-source GitHub repositories linked
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className="text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
                    {stats.totalDevelopers}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Active Developers
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Engineers with linked bookmarks
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                  <div className="text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                    {stats.totalSharers}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Task Analysts
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Posting micro-needs anonymous or public
                  </p>
                </div>
              </div>

              {/* Informative Step Box */}
              <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-4 shadow-md">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  No tech larping, just real utility
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Most developer platforms encourage building duplicate clone
                  apps. We advocate for building tools people actually need. No
                  fake indicators or simulated metadata lines allowed.
                </p>
                <div className="flex gap-4 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                  <div>⏰ UTC: 2026-06-07</div>
                  <div>● Node Production Engine</div>
                </div>
              </div>
            </div>

            {/* Right Column: Premium single card layout with Segmented Toggle/Switch */}
            <div className="lg:col-span-7 flex flex-col gap-6 font-sans">
              {/* Segmented Switch Toggle */}
              <div className="bg-slate-100/90 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex select-none max-w-md mx-auto w-full shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setSignupError(null);
                    setLoginError(null);
                  }}
                  className={`flex-1 py-3 text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer ${
                    authMode === "signup"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm border border-slate-200/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setSignupError(null);
                    setLoginError(null);
                  }}
                  className={`flex-1 py-3 text-[11px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer ${
                    authMode === "login"
                      ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm border border-slate-200/20"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Central Auth Container with premium liquid glass styling */}
              <div className="glass-card-premium rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                {authMode === "signup" ? (
                  <div
                    key="signup-view"
                    className="space-y-5 animate-in fade-in duration-300"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                        Join the Movement
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                        Let's solve real pain lines
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Fast, free registration is open to problem operators and
                        software engineers.
                      </p>
                    </div>

                    {signupError && (
                      <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 text-rose-800 dark:text-rose-300 text-xs p-3.5 backdrop-blur-xs rounded-xl flex items-start gap-2 animate-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span>{signupError}</span>
                      </div>
                    )}

                    {signupSuccess && (
                      <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 backdrop-blur-xs rounded-xl flex items-start gap-2 animate-in slide-in-from-top-1">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{signupSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleSignupSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.55">
                          What is your name?
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Jenkins"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1.5">
                          Identifier Medium
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-2.5 border border-slate-200/50 dark:border-slate-850">
                          <button
                            type="button"
                            onClick={() => {
                              setSignupType("email");
                              setSignupValue("");
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              signupType === "email"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Email Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSignupType("phone");
                              setSignupValue("");
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              signupType === "phone"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Phone Number
                          </button>
                        </div>

                        <input
                          type={signupType === "email" ? "email" : "text"}
                          required
                          placeholder={
                            signupType === "email"
                              ? "sarah@gmail.com"
                              : "+1 (555) 019-2834"
                          }
                          value={signupValue}
                          onChange={(e) => setSignupValue(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1.5">
                          Secure Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={5}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-bold text-xs rounded-xl uppercase tracking-widest shadow-xs transition-all hover:translate-y-[-1px] duration-150 cursor-pointer"
                      >
                        Register & Get Onboarded
                      </button>
                    </form>
                  </div>
                ) : (
                  <div
                    key="login-view"
                    className="space-y-5 animate-in fade-in duration-300"
                  >
                    <div className="space-y-1">
                      <span className="inline-flex text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                        Welcome Back
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                        Return to your solutions
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sign in to check comments, share repositories, and
                        bookmark pain feeds.
                      </p>
                    </div>

                    {loginError && (
                      <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950 text-rose-800 dark:text-rose-300 text-xs p-3.5 backdrop-blur-xs rounded-xl flex items-start gap-2 animate-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1.5">
                          Access Medium
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-2.5 border border-slate-200/50 dark:border-slate-850">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginType("email");
                              setLoginValue("");
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              loginType === "email"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginType("phone");
                              setLoginValue("");
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                              loginType === "phone"
                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                          >
                            Phone Number
                          </button>
                        </div>

                        <input
                          type={loginType === "email" ? "email" : "text"}
                          required
                          placeholder={
                            loginType === "email"
                              ? "sarah@gmail.com"
                              : "e.g. phone details"
                          }
                          value={loginValue}
                          onChange={(e) => setLoginValue(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1.5">
                          Passphrase / Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold text-xs rounded-xl uppercase tracking-widest shadow-xs transition-all hover:translate-y-[-1px] duration-150 cursor-pointer"
                      >
                        Sign in to account
                      </button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        To run live tests immediately, use: <br />
                        <strong className="text-slate-600 dark:text-slate-300">
                          sarah@gmail.com
                        </strong>{" "}
                        (Problem Sharer) or <br />
                        <strong className="text-slate-600 dark:text-slate-300">
                          alex@dev.com
                        </strong>{" "}
                        (Developer). <br />
                        Password is bypass (any password passes).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !currentUser.onboardingCompleted ? (
          /* 2) FIRST-TIME ONBOARDING SCREEN (ONE-TIME choice after login/signup) */
          <div
            id="onboarding-flow-section"
            className="max-w-2xl mx-auto py-12 space-y-8"
          >
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 dark:text-indigo-350 dark:bg-indigo-950/50 rounded-full uppercase tracking-wider border border-indigo-100/50 dark:border-indigo-900/30">
                Setup Initial Role
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How do you want to start?
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Select your primary activity. You can toggle between these roles
                freely from your dashboard at any point later.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              {/* Option A: Problem Sharer */}
              <button
                disabled={isOnboardingChoiceSubmitting}
                onClick={() => handleOnboardingChoice(UserRole.PROBLEM_SHARER)}
                className={`group relative bg-slate-100/50 dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-800/80 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 rounded-2xl p-6 text-left shadow-xs transition-all hover:translate-y-[-2px] hover:shadow-md focus:outline-hidden ${isOnboardingChoiceSubmitting ? "opacity-60 cursor-wait pointer-events-none" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Share Your Problems
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  I suffer from annoying spreadsheets, manual calculations,
                  scheduling issues, or simple business friction and want
                  developers to propose clever widgets.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    Perfect for micro-business, organizers or students
                  </span>
                </div>
              </button>

              {/* Option B: Developer */}
              <button
                disabled={isOnboardingChoiceSubmitting}
                onClick={() => handleOnboardingChoice(UserRole.DEVELOPER)}
                className={`group relative bg-slate-100/50 dark:bg-slate-900/50 border-2 border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 rounded-2xl p-6 text-left shadow-xs transition-all hover:translate-y-[-2px] hover:shadow-md focus:outline-hidden ${isOnboardingChoiceSubmitting ? "opacity-60 cursor-wait pointer-events-none" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-200">
                    <Code className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                  Solve as a Developer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  I am a designer, script writer, coder, or dev lead. I want to
                  browse real human problems, bookmark tasks, swap suggestions,
                  and link GitHub repositories.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-405 uppercase">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>
                    Build real tools, improve your resume and help people
                  </span>
                </div>
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Note: This is a one-time onboarding selection. No accounts will be
              deleted or overwritten.
            </p>
          </div>
        ) : (
          /* 3) MAIN AUTHENTICATED DASHBOARD FLOW */
          <div
            id="authenticated-main-dashboard"
            className={
              currentUser && (activeTab === "feed" || activeTab === "gemini-workspace") && !showIntroSequence
                ? "lg:h-full lg:flex lg:flex-col lg:overflow-hidden min-h-0 w-full"
                : "w-full"
            }
          >
            {activeTab === "about" ? (
              <AboutTab />
            ) : activeTab === "faq" ? (
              <FaqTab />
            ) : activeTab === "donate" ? (
              <DonateTab />
            ) : activeTab === "gemini-workspace" ? (
              <GeminiChatbot userId={currentUser?.id} mode="full" />
            ) : (
              /* FEED TAB WITH SIDEBAR OR INTRO CAROUSEL */
              <div
                className={`@container w-full ${
                  currentUser && activeTab === "feed" && !showIntroSequence
                    ? "lg:h-full lg:flex lg:flex-col lg:overflow-hidden min-h-0"
                    : "space-y-6"
                }`}
              >
                <AnimatePresence mode="wait">
                  {showIntroSequence ? (
                    <motion.div
                      key="intro-carousel"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 20 }}
                      transition={{ duration: 0.45 }}
                      className="w-full"
                    >
                      <AnimatedIntroCarousel
                        role={currentUser.rolePreference}
                        onComplete={() => setShowIntroSequence(false)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="feed-grid-block"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45 }}
                      id="feed-columns-grid"
                      className="grid grid-cols-1 lg:grid-cols-12 gap-[clamp(1.2rem,2.5vw,2.5rem)] items-start lg:items-stretch w-full lg:h-full lg:overflow-hidden flex-1 min-h-0"
                    >
                      {/* Left Sidebar Pane: Categories & Stats Spotlight */}
                      <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 lg:h-[calc(100vh-170px)] lg:overflow-y-auto lg:overscroll-y-contain pr-2 pb-10 scrolls-custom">
                        {/* Category Filter list with high fidelity liquid glass styling */}
                        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 shadow-xs">
                          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Browse Categories
                          </h3>
                          <ul className="space-y-1.5">
                            <li>
                              <button
                                onClick={() => {
                                  setActiveCategory("all");
                                  setShowBookmarksOnly(false);
                                  setActiveTab("feed");
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                  activeCategory === "all" && !showBookmarksOnly && activeTab === "feed"
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                }`}
                              >
                                <span>All Shared Problems</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-bold px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                  {posts.length}
                                </span>
                              </button>
                            </li>

                            {categories.map((cat) => (
                              <li key={cat}>
                                <button
                                  onClick={() => {
                                    setActiveCategory(cat);
                                    setShowBookmarksOnly(false);
                                    setActiveTab("feed");
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                    activeCategory === cat && !showBookmarksOnly && activeTab === "feed"
                                      ? "bg-indigo-600 dark:bg-indigo-500 text-white font-bold"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                  }`}
                                >
                                  <span>{cat}</span>
                                  {activeCategory === cat && activeTab === "feed" && (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Gemini Assistant Chatbot Widget */}
                        <GeminiChatbot userId={currentUser?.id} />

                        {/* High Quality Feature Banner Spotlight */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-md space-y-3">
                          <span className="bg-white/20 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                            Spotlight Goal
                          </span>
                          <h4 className="font-bold text-sm leading-snug">
                            Empowering Anyone to Initiate Software
                          </h4>
                          <p className="text-indigo-100 text-xs leading-relaxed">
                            Our vision is to build solutions for real humans.
                            Think of this as "Facebook feed, but tailored for
                            real problems and open-source outcomes."
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => setActiveTab("about")}
                              className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-full justify-center transition-all"
                            >
                              <span>Learn Our Story</span>
                              <ArrowRight className="w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Recharts Difficulty Trends Widget */}
                        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-indigo-500" />
                              Difficulty Trends
                            </h3>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                              30-Day Outlook
                            </span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Complexity Index
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                              A rolling average index tracking difficulty scores
                              across all community manual problems.
                            </p>
                          </div>

                          <div className="h-32 w-full pr-1.5 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getDifficultyTrendData()}
                                margin={{
                                  top: 5,
                                  right: 5,
                                  left: -25,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="difficultyGrad"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#6366f1"
                                      stopOpacity={0.3}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#6366f1"
                                      stopOpacity={0.0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke={
                                    theme === "dark" ? "#1e293b" : "#f1f5f9"
                                  }
                                />
                                <XAxis
                                  dataKey="name"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{
                                    fill: "#94a3b8",
                                    fontSize: 8,
                                    fontWeight: 600,
                                  }}
                                  interval={6}
                                />
                                <YAxis
                                  domain={[1, 5]}
                                  tickLine={false}
                                  axisLine={false}
                                  tick={{
                                    fill: "#94a3b8",
                                    fontSize: 8,
                                    fontWeight: 600,
                                  }}
                                  ticks={[1, 2, 3, 4, 5]}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background:
                                      theme === "dark" ? "#0f172a" : "#ffffff",
                                    border:
                                      theme === "dark"
                                        ? "1px solid #334155"
                                        : "1px solid #e2e8f0",
                                    borderRadius: "0.5rem",
                                    fontSize: "10px",
                                    boxShadow:
                                      "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                    fontFamily: "sans-serif",
                                  }}
                                  labelStyle={{
                                    fontWeight: "bold",
                                    color: "#6366f1",
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="difficulty"
                                  stroke="#6366f1"
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#difficultyGrad)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Active view status widget with glass background */}
                        <div className="bg-slate-100/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                          <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[10px]">
                            Your Profile Status
                          </div>
                          <p className="leading-relaxed">
                            Logged in as{" "}
                            <strong className="text-slate-900 dark:text-slate-100">
                              {currentUser.name}
                            </strong>
                            . Active dashboard role:{" "}
                            <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                              {currentUser.rolePreference.replace("_", " ")}
                            </strong>
                            .
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1 text-slate-400 dark:text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                            <span>Standard Secure JWT Node Client</span>
                          </div>
                        </div>

                        {/* Replay Mission Intro Widget */}
                        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 text-xs shadow-xs space-y-2.5">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            Our Code Philosophy
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
                            Review the active mission campaign detailing how we
                            solve real issues:
                          </p>
                          <button
                            onClick={() => setShowIntroSequence(true)}
                            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            Replay Mission Intro
                          </button>
                        </div>
                      </div>

                      {/* Right Content Column: Post Feed */}
                      <div className="lg:col-span-8 xl:col-span-9 space-y-6 lg:h-[calc(100vh-170px)] lg:overflow-y-auto lg:overscroll-y-contain pr-2 pb-10 scrolls-custom">
                        {/* Multiple distinct premium liquid glass containers keeping elements in their same area but separated */}
                        <div id="feed-search-toolbar" className="flex flex-col md:flex-row items-stretch gap-4 w-full scroll-mt-28">
                          {/* Box 1: Search Engine Bar */}
                          <div className="glass-panel-premium p-3.5 rounded-2xl flex-1 flex items-center shadow-xs">
                            <div className="relative w-full">
                              <input
                                type="text"
                                placeholder="Search posts (e.g., invoices, food bank, buffer)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => {
                                  // Delay slightly so that click interaction on suggestions registers
                                  setTimeout(
                                    () => setIsSearchFocused(false),
                                    200,
                                  );
                                  if (searchQuery) saveSearchQuery(searchQuery);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveSearchQuery(searchQuery);
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className="w-full text-xs pl-8 pr-12 py-2.5 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 glass-input-premium font-medium"
                              />
                              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-3.5 h-3.5" />
                              </div>
                              {searchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setSearchQuery("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}

                              {/* Recent Searches Overlay Dropdown */}
                              <AnimatePresence>
                                {isSearchFocused &&
                                  searchHistory.length > 0 && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: 10,
                                        scale: 0.95,
                                      }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-100 dark:shadow-none p-3 space-y-2.5 overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                                        <span className="flex items-center gap-1">
                                          <History className="w-3 h-3" />
                                          Recent Queries
                                        </span>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            clearAllHistory();
                                          }}
                                          className="text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer"
                                        >
                                          Clear All
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {searchHistory.map((queryText) => (
                                          <div
                                            key={queryText}
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              setSearchQuery(queryText);
                                              setIsSearchFocused(false);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-105 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700/60 rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
                                          >
                                            <span>{queryText}</span>
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                deleteHistoryItem(queryText);
                                              }}
                                              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                                              title="Delete search history term"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {/* Box 2: Feed Selection Sorting Container */}
                          <div className="glass-panel-premium p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs md:min-w-[170px]">
                            <span className="text-[10px] uppercase font-mono font-extrabold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              Sort By:
                            </span>
                            <div className="relative">
                              <select
                                value={postSortOrder}
                                onChange={(e) =>
                                  setPostSortOrder(
                                    e.target.value as
                                      | "recent"
                                      | "liked"
                                      | "difficult",
                                  )
                                }
                                className="text-xs bg-transparent text-slate-700 dark:text-slate-205 border-none focus:outline-hidden font-bold cursor-pointer pr-4 font-sans appearance-none"
                                style={{ backgroundImage: "none" }}
                              >
                                <option value="recent">Most Recent</option>
                                <option value="liked">Most Liked</option>
                                <option value="difficult">
                                  Most Difficult
                                </option>
                              </select>
                            </div>
                          </div>

                          {/* Box 3: Saved Bookmarks Filter Container */}
                          {currentUser && (
                            <div className="glass-panel-premium p-3 rounded-2xl flex items-center justify-center w-full md:w-auto shadow-xs">
                              <button
                                onClick={() => {
                                  setShowBookmarksOnly(!showBookmarksOnly);
                                  setActiveCategory("all");
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                                  showBookmarksOnly
                                    ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-500/20"
                                    : "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                                }`}
                                title="Show only your saved bookmarks"
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 transition-all ${showBookmarksOnly ? "fill-white text-white" : "text-amber-600 dark:text-amber-400"}`}
                                />
                                <span className="whitespace-nowrap font-bold text-[11px] tracking-wide">Saved Bookmarks</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black transition-all ${showBookmarksOnly ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                                  {currentUser.savedPostIds?.length || 0}
                                </span>
                              </button>
                            </div>
                          )}

                          {/* Box 4: Create Problem Submission Action Container */}
                          {currentUser.rolePreference ===
                            UserRole.PROBLEM_SHARER && (
                            <div className="glass-panel-premium p-3 rounded-2xl flex items-center justify-center w-full md:w-auto shadow-xs">
                              <button
                                onClick={handleOpenCreateModal}
                                className="w-full px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all hover:translate-y-[-1px] cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                                <span className="whitespace-nowrap">Share New Problem</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Empty State vs Search filter warnings */}
                        {loadingPosts ? (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                            <p className="text-xs font-semibold">
                              Updating Feed according to role display state...
                            </p>
                          </div>
                        ) : postsError ? (
                          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-955 text-rose-800 dark:text-rose-300 p-8 rounded-2xl text-center space-y-2">
                            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                            <p className="text-sm font-bold">
                              Failed to load posts
                            </p>
                            <p className="text-xs text-rose-700 dark:text-rose-450">
                              {postsError}
                            </p>
                            <button
                              onClick={fetchFeed}
                              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline font-bold"
                            >
                              Try Re-syncing
                            </button>
                          </div>
                        ) : filteredPosts.length === 0 ? (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xs">
                            <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full flex items-center justify-center mx-auto transition-colors">
                              <Layers className="w-6 h-6" />
                            </div>
                            <div className="max-w-md mx-auto space-y-1">
                              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                No Active Problems Found
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {showBookmarksOnly
                                  ? "You haven't bookmarked any problem posts in this category yet. Look through general posts to find matching favorites!"
                                  : "There aren't any active problems listed under this category filter with current active role constraints."}
                              </p>
                            </div>
                            {currentUser.rolePreference ===
                              UserRole.PROBLEM_SHARER && (
                              <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-sm"
                              >
                                Be The First To Post
                              </button>
                            )}
                          </div>
                        ) : (
                          /* THE PROBLEM FEED LIST */
                          <div className="space-y-4">
                            {filteredPosts.map((post) => {
                              const isOwnPost = post.userId === currentUser.id;
                              const isBookmarked =
                                currentUser.savedPostIds?.includes(post.id);
                              const comments = commentsMap[post.id] || [];
                              const isCommentsExpanded =
                                activeCommentsPostId === post.id;
                              const isLoadingComments =
                                commentsLoading[post.id];

                              const descriptionWords = post.description ? post.description.trim().split(/\s+/) : [];
                              const wordCount = descriptionWords.length;
                              const wordLimit = isMobile ? 60 : 100;
                              const isLongDescription = wordCount > wordLimit;
                              const isDescriptionExpanded = !!expandedPostIds[post.id];
                              const renderedDescription = isLongDescription && !isDescriptionExpanded
                                ? descriptionWords.slice(0, wordLimit).join(" ") + "..."
                                : post.description;

                              return (
                                <motion.div
                                  key={post.id}
                                  id={`problem-post-${post.id}`}
                                  layout="position"
                                  initial={{ opacity: 0, scale: 0.97, y: 25 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 240,
                                    damping: 24,
                                    mass: 0.8,
                                    layout: {
                                      type: "spring",
                                      stiffness: 285,
                                      damping: 26,
                                      mass: 1
                                    }
                                  }}
                                  className="glass-card-premium rounded-2xl overflow-hidden md:active:scale-[0.99] active:scale-[0.985] select-none touch-manipulation active:bg-slate-100 dark:active:bg-slate-950/40"
                                >
                                  <div className="p-6 space-y-4">
                                    {/* Post Metadata line */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md uppercase tracking-wide border border-indigo-100/30 dark:border-indigo-900/40">
                                          {post.category}
                                        </span>

                                        {/* Average Difficulty Rating Badge and Dynamic Visual Bar */}
                                        {(() => {
                                          const ratingsVal =
                                            post.difficultyRatings || [];
                                          const hasRatingsVal =
                                            ratingsVal.length > 0;
                                          const avgNum = hasRatingsVal
                                            ? ratingsVal.reduce(
                                                (sum, r) => sum + r.rating,
                                                0,
                                              ) / ratingsVal.length
                                            : 0;
                                          const avgDiffVal = avgNum.toFixed(1);

                                          // Dynamic progressive colors for the indicator bar
                                          let barColor =
                                            "bg-emerald-500 dark:bg-emerald-400";
                                          let textColor =
                                            "text-emerald-700 dark:text-emerald-400";
                                          let bgColor =
                                            "bg-emerald-50 dark:bg-emerald-950/30";
                                          let borderColor =
                                            "border-emerald-100/40 dark:border-emerald-900/40";

                                          if (avgNum > 4.0) {
                                            barColor =
                                              "bg-rose-500 dark:bg-rose-450";
                                            textColor =
                                              "text-rose-700 dark:text-rose-450";
                                            bgColor =
                                              "bg-rose-50 dark:bg-rose-950/30";
                                            borderColor =
                                              "border-rose-100/40 dark:border-rose-900/40";
                                          } else if (avgNum > 3.0) {
                                            barColor =
                                              "bg-amber-500 dark:bg-amber-400";
                                            textColor =
                                              "text-amber-700 dark:text-amber-400";
                                            bgColor =
                                              "bg-amber-50 dark:bg-amber-950/30";
                                            borderColor =
                                              "border-amber-100/40 dark:border-amber-900/40";
                                          } else if (avgNum > 2.0) {
                                            barColor =
                                              "bg-yellow-500 dark:bg-yellow-400";
                                            textColor =
                                              "text-yellow-700 dark:text-yellow-400";
                                            bgColor =
                                              "bg-yellow-50 dark:bg-yellow-950/30";
                                            borderColor =
                                              "border-yellow-100/40 dark:border-yellow-900/40";
                                          } else if (!hasRatingsVal) {
                                            barColor =
                                              "bg-slate-300 dark:bg-slate-700";
                                            textColor =
                                              "text-slate-500 dark:text-slate-450";
                                            bgColor =
                                              "bg-slate-50 dark:bg-slate-900/40";
                                            borderColor =
                                              "border-slate-150 dark:border-slate-800";
                                          }

                                          return (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 border border-slate-150 dark:border-slate-800 bg-slate-50/[0.45] dark:bg-slate-950/20 p-2 rounded-xl">
                                              <div className="flex items-center">
                                                {hasRatingsVal ? (
                                                  <span
                                                    className={`px-2 py-0.5 ${bgColor} ${textColor} ${borderColor} text-[10px] font-extrabold rounded-md uppercase tracking-wide border inline-flex items-center gap-1`}
                                                  >
                                                    ★ {avgDiffVal} Difficulty (
                                                    {ratingsVal.length}{" "}
                                                    {ratingsVal.length === 1
                                                      ? "rating"
                                                      : "ratings"}
                                                    )
                                                  </span>
                                                ) : (
                                                  <span
                                                    className={`px-2 py-0.5 ${bgColor} ${textColor} ${borderColor} text-[10px] font-bold rounded-md border`}
                                                  >
                                                    Unrated Difficulty
                                                  </span>
                                                )}
                                              </div>
                                              {/* CSS Visual Progress Bar on 1-5 scale */}
                                              <div className="flex flex-col justify-center px-1 sm:px-2 min-w-[120px] gap-0.5">
                                                <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 dark:text-slate-550 px-0.5 leading-none">
                                                  <span>1</span>
                                                  <span>2</span>
                                                  <span>3</span>
                                                  <span>4</span>
                                                  <span>5</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <div
                                                    className="w-20 sm:w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative"
                                                    title={`Average Difficulty Level: ${avgDiffVal}/5.0`}
                                                  >
                                                    <div
                                                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                      style={{
                                                        width: `${hasRatingsVal ? (avgNum / 5.0) * 100 : 0}%`,
                                                      }}
                                                    />
                                                  </div>
                                                  <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 leading-none">
                                                    {hasRatingsVal
                                                      ? `${Math.round((avgNum / 5.0) * 100)}%`
                                                      : "0%"}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}

                                        {post.visibility ===
                                          PostVisibility.DEVELOPERS_ONLY && (
                                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded-md border border-violet-150/30 dark:border-violet-900/40">
                                            <Lock className="w-3 h-3" />
                                            <span>Developers Only</span>
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                          • Posted{" "}
                                          {new Date(
                                            post.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>

                                      {/* Post management / Bookmark toggle */}
                                      <div className="flex items-center gap-1.5">
                                        {currentUser && (
                                          <button
                                            onClick={() =>
                                              handleToggleBookmark(post.id)
                                            }
                                            className={`p-2 rounded-xl border transition-all ${
                                              isBookmarked
                                                ? "bg-amber-500 text-white border-amber-500"
                                                : "bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-100/60 dark:border-slate-800"
                                            }`}
                                            title={
                                              isBookmarked
                                                ? "Remove Bookmark"
                                                : "Save Problem"
                                            }
                                          >
                                            <Bookmark
                                              className={`w-3.5 h-3.5 ${isBookmarked ? "fill-white" : ""}`}
                                            />
                                          </button>
                                        )}

                                        {permissions.canEditPost(post) && (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() =>
                                                startEditPost(post)
                                              }
                                              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100/60 dark:border-slate-850 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all cursor-pointer"
                                              title="Edit this Post"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>

                                            {deleteConfirmPostId === post.id ? (
                                              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1 animate-in fade-in zoom-in-95 duration-150">
                                                <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest px-0.5">
                                                  Delete?
                                                </span>
                                                <button
                                                  onClick={() => {
                                                    handleDeletePost(post.id);
                                                    setDeleteConfirmPostId(
                                                      null,
                                                    );
                                                  }}
                                                  className="p-1 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-xs flex items-center justify-center"
                                                  title="Yes, delete permanently"
                                                >
                                                  <Check className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    setDeleteConfirmPostId(null)
                                                  }
                                                  className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer flex items-center justify-center"
                                                  title="Cancel delete"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() =>
                                                  setDeleteConfirmPostId(
                                                    post.id,
                                                  )
                                                }
                                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100/40 dark:border-slate-850 text-slate-400 hover:text-red-505 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-955/30 hover:border-rose-100 dark:hover:border-rose-900/55 transition-all cursor-pointer"
                                                title="Delete Post"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Title and Description */}
                                    <div className="space-y-3">
                                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 font-sans leading-snug">
                                        {post.title}
                                      </h3>
                                      <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-[15px] font-semibold leading-relaxed whitespace-pre-wrap">
                                        {renderedDescription}
                                      </p>
                                      {isLongDescription && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            togglePostExpand(post.id);
                                          }}
                                          className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/45 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <span>
                                            {isDescriptionExpanded ? "Collapse description" : `Expand description (${wordCount} words)`}
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Interactive post difficulty rating system (Developer mode ONLY) */}
                                    {currentUser &&
                                      currentUser.rolePreference ===
                                        UserRole.DEVELOPER && (
                                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                                          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                                            <span>
                                              Difficulty Rating (Developer
                                              workload estimate):
                                            </span>
                                            {(() => {
                                              const uRating =
                                                post.difficultyRatings?.find(
                                                  (r) =>
                                                    r.userId === currentUser.id,
                                                )?.rating;
                                              return uRating ? (
                                                <span className="text-amber-600 dark:text-amber-400 font-extrabold ml-1 font-mono">
                                                  {uRating}/5 Stars
                                                </span>
                                              ) : (
                                                <span className="text-slate-400 dark:text-slate-500 italic ml-1">
                                                  (unrated by you)
                                                </span>
                                              );
                                            })()}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(
                                              (starValue) => {
                                                const uRating =
                                                  post.difficultyRatings?.find(
                                                    (r) =>
                                                      r.userId ===
                                                      currentUser.id,
                                                  )?.rating || 0;
                                                return (
                                                  <button
                                                    key={starValue}
                                                    type="button"
                                                    onClick={() =>
                                                      handleUpdatePostDifficulty(
                                                        post.id,
                                                        starValue,
                                                      )
                                                    }
                                                    className="p-1 hover:scale-130 transition-transform focus:outline-hidden cursor-pointer"
                                                    title={`Rate Post Difficulty as ${starValue} Stars`}
                                                  >
                                                    <Star
                                                      className={`w-4 h-4 ${
                                                        starValue <= uRating
                                                          ? "text-amber-500 fill-amber-500"
                                                          : "text-slate-300 dark:text-slate-755 hover:text-amber-400"
                                                      }`}
                                                    />
                                                  </button>
                                                );
                                              },
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* AI Post Summary Block Section */}
                                    <AnimatePresence>
                                      {postSummaries[post.id] && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                          transition={{ duration: 0.18 }}
                                          className="my-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/60 to-violet-50/20 dark:from-indigo-950/20 dark:to-violet-950/10 border border-indigo-100/40 dark:border-indigo-900/40 space-y-1.5 w-full text-left"
                                        >
                                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-655 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                            <span>AI Summary</span>
                                            <span className="ml-auto lowercase text-[9px] text-slate-400 dark:text-slate-500 font-normal">Click option again to dismiss</span>
                                          </div>
                                          <p className="text-slate-850 dark:text-slate-200 text-xs sm:text-[13px] font-medium leading-relaxed italic">
                                            "{postSummaries[post.id]}"
                                          </p>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Footer block: Author descriptor & Comment trigger */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850/85 flex items-center justify-between gap-4 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            post.isAnonymous
                                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                              : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                                          }`}
                                        >
                                          {post.userName
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                          {post.userName}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSummarizePost(post.id, post.title, post.description, post.category);
                                          }}
                                          className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-lg font-black tracking-wider transition-all border cursor-pointer ${
                                            postSummaries[post.id]
                                              ? "bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-600 dark:border-indigo-500 shadow-xs"
                                              : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 border-slate-200 dark:border-slate-850"
                                          }`}
                                          title="Let Gemini AI summarize this problem statement"
                                        >
                                          <Sparkles className={`w-3 h-3 ${summarizingPostIds[post.id] ? "animate-spin text-indigo-505" : "text-indigo-600 dark:text-indigo-400"}`} />
                                          <span>{summarizingPostIds[post.id] ? "Summarizing..." : postSummaries[post.id] ? "Summary Active (Dismiss)" : "Summarize by AI"}</span>
                                        </button>
                                        {post.isAnonymous && (
                                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-slate-400 dark:text-slate-500 font-medium">
                                            Secret Profile
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Post Likes System */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleTogglePostLike(post.id)
                                          }
                                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                            currentUser &&
                                            post.likes?.includes(currentUser.id)
                                              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450"
                                              : "bg-slate-50 dark:bg-slate-950/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border-slate-100/60 dark:border-slate-800"
                                          }`}
                                          title="Like / support this problem post"
                                        >
                                          <Heart
                                            className={`w-3.5 h-3.5 ${currentUser && post.likes?.includes(currentUser.id) ? "fill-rose-500 text-rose-500 animate-pulse" : "text-slate-400"}`}
                                          />
                                          <span>
                                            {post.likes?.length || 0} Likes
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleCommentsExpansion(post.id)
                                          }
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                                            isCommentsExpanded
                                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/60"
                                              : "bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-805 border-slate-100/30 dark:border-slate-850"
                                          }`}
                                        >
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          <span>
                                            {post.commentsCount || 0}{" "}
                                            Discussions
                                          </span>
                                        </button>

                                        {/* Copy post permalink to clipboard button */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSharePost(post.id)
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-slate-50 dark:bg-slate-950/20 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-100/60 dark:border-slate-800"
                                          title="Copy permalink to clipboard"
                                        >
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>Share</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* COLLAPSIBLE COMMENTS SECTION */}
                                  {isCommentsExpanded && (
                                    <div className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 p-6 space-y-6">
                                      {/* Existing comments stream */}
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
                                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Discussion on this Problem (
                                            {comments.length})
                                          </h4>

                                          {/* Responsive Comment Sort Selector Toggle */}
                                          {comments.length > 0 && (
                                            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 dark:text-slate-500 px-1.5">
                                                Comments:
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setCommentSortOrders(
                                                    (prev) => ({
                                                      ...prev,
                                                      [post.id]: "newest",
                                                    }),
                                                  );
                                                }}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                                  (commentSortOrders[post.id] ||
                                                    "newest") === "newest"
                                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                    : "text-slate-550 dark:text-slate-400 hover:text-indigo-500"
                                                }`}
                                              >
                                                Newest
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setCommentSortOrders(
                                                    (prev) => ({
                                                      ...prev,
                                                      [post.id]:
                                                        "highest_rated",
                                                    }),
                                                  );
                                                }}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                                  (commentSortOrders[post.id] ||
                                                    "newest") ===
                                                  "highest_rated"
                                                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                                    : "text-slate-550 dark:text-slate-400 hover:text-indigo-500"
                                                }`}
                                              >
                                                Highest Rated
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {isLoadingComments ? (
                                          <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                                            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                                            <span>
                                              Fetching secure solution
                                              suggestions...
                                            </span>
                                          </div>
                                        ) : comments.length === 0 ? (
                                          <div className="bg-white dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-850 p-6 rounded-xl text-center space-y-1 text-slate-500 dark:text-slate-405">
                                            <p className="text-xs font-semibold">
                                              No comments or solutions posted
                                              yet.
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                              {currentUser?.rolePreference ===
                                              UserRole.DEVELOPER
                                                ? "Be the first to propose a design plan or link a codebase!"
                                                : "Developers will verify your post and draft answers shortly."}
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            <AnimatePresence mode="popLayout">
                                              {(() => {
                                                const commentSort =
                                                  commentSortOrders[post.id] ||
                                                  "newest";
                                                const sortedComments = [
                                                  ...comments,
                                                ].sort((a, b) => {
                                                  if (
                                                    commentSort ===
                                                    "highest_rated"
                                                  ) {
                                                    const usefulnessA =
                                                      a.rating || 0;
                                                    const usefulnessB =
                                                      b.rating || 0;
                                                    if (
                                                      usefulnessB !==
                                                      usefulnessA
                                                    ) {
                                                      return (
                                                        usefulnessB -
                                                        usefulnessA
                                                      );
                                                    }
                                                    const likesA =
                                                      a.likes?.length || 0;
                                                    const likesB =
                                                      b.likes?.length || 0;
                                                    if (likesB !== likesA) {
                                                      return likesB - likesA;
                                                    }
                                                  }
                                                  return (
                                                    new Date(
                                                      b.createdAt,
                                                    ).getTime() -
                                                    new Date(
                                                      a.createdAt,
                                                    ).getTime()
                                                  );
                                                });

                                                return sortedComments.map(
                                                  (comm) => {
                                                    const containsGithub =
                                                      comm.content
                                                        .toLowerCase()
                                                        .includes(
                                                          "github.com",
                                                        ) ||
                                                      !!comm.repositoryUrl;
                                                    const commentIsPrivate =
                                                      comm.visibility ===
                                                      CommentVisibility.OWNER_AND_COMMENTER;
                                                    const isPostOwner =
                                                      currentUser?.id ===
                                                      post.userId;
                                                    const isCommentOwner =
                                                      currentUser?.id ===
                                                      comm.userId;
                                                    const canUserRate =
                                                      permissions.canRateComment(comm);
                                                    const ratingsArray = comm.ratings || [];
                                                    const averageCommentRating = ratingsArray.length > 0
                                                      ? (ratingsArray.reduce((sum, r) => sum + r.rating, 0) / ratingsArray.length).toFixed(1)
                                                      : comm.rating
                                                        ? comm.rating.toFixed(1)
                                                        : "0.0";
                                                    const ratingBoxVisible =
                                                      canUserRate ||
                                                      (comm.ratings && comm.ratings.length > 0) ||
                                                      !!comm.rating;
                                                    const isEditingThisComment =
                                                      editingCommentId ===
                                                      comm.id;
                                                    const isReplyingThisComment =
                                                      replyingCommentId ===
                                                      comm.id;
                                                    return (
                                                      <motion.div
                                                        key={`${comm.id}-${commentSort}`}
                                                        layout="position"
                                                        initial={{
                                                          opacity: 0,
                                                          y: 15,
                                                        }}
                                                        animate={{
                                                          opacity: 1,
                                                          y: 0,
                                                        }}
                                                        exit={{
                                                          opacity: 0,
                                                          y: -15,
                                                        }}
                                                        transition={{
                                                          type: "spring",
                                                          stiffness: 350,
                                                          damping: 25,
                                                        }}
                                                        className={`p-4 rounded-xl border space-y-3 relative transition-all ${
                                                          commentIsPrivate
                                                            ? "bg-violet-50/45 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/60"
                                                            : "bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/70 dark:border-slate-850 shadow-xs"
                                                        }`}
                                                      >
                                                        {isEditingThisComment ? (
                                                          <form
                                                            onSubmit={(e) =>
                                                              handleEditCommentSubmit(
                                                                e,
                                                                comm.id,
                                                                post.id,
                                                              )
                                                            }
                                                            className="space-y-3"
                                                          >
                                                            <div className="flex items-center justify-between">
                                                              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                                                <span>
                                                                  Modify
                                                                  Solution Plan
                                                                </span>
                                                              </span>
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  setEditingCommentId(
                                                                    null,
                                                                  )
                                                                }
                                                                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                                                              >
                                                                Cancel
                                                              </button>
                                                            </div>

                                                            <textarea
                                                              rows={3}
                                                              required
                                                              placeholder="Type your revised solution..."
                                                              value={
                                                                editingCommentContent
                                                              }
                                                              onChange={(e) =>
                                                                setEditingCommentContent(
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                                                            />

                                                            <div className="space-y-1.5">
                                                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                Solution
                                                                Repository URL
                                                                (Optional)
                                                              </label>
                                                              <input
                                                                type="url"
                                                                placeholder="https://github.com/myusername/solution"
                                                                value={
                                                                  editingCommentRepositoryUrl
                                                                }
                                                                onChange={(e) =>
                                                                  setEditingCommentRepositoryUrl(
                                                                    e.target
                                                                      .value,
                                                                  )
                                                                }
                                                                className="w-full pl-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono transition-all"
                                                              />
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
                                                              <div className="flex flex-wrap items-center gap-3">
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                                    Mode:
                                                                  </span>
                                                                  <div className="flex items-center bg-slate-150/40 dark:bg-slate-900/60 p-0.5 rounded-xl relative border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shrink-0">
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => setEditingCommentVisibility(CommentVisibility.EVERYONE)}
                                                                      className={`relative px-2 py-1 text-[10px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                                        editingCommentVisibility === CommentVisibility.EVERYONE
                                                                          ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                                                                          : "text-slate-500 dark:text-slate-455 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                                                                      }`}
                                                                    >
                                                                      {editingCommentVisibility === CommentVisibility.EVERYONE && (
                                                                        <motion.div
                                                                          layoutId="activeCommentVisEdit"
                                                                          className="absolute inset-0 bg-white/95 dark:bg-slate-850/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                                        />
                                                                      )}
                                                                      Public
                                                                    </button>
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => setEditingCommentVisibility(CommentVisibility.OWNER_AND_COMMENTER)}
                                                                      className={`relative px-2 py-1 text-[10px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                                        editingCommentVisibility === CommentVisibility.OWNER_AND_COMMENTER
                                                                          ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                                                                          : "text-slate-500 dark:text-slate-455 hover:text-slate-705 dark:hover:text-slate-205 font-semibold"
                                                                      }`}
                                                                    >
                                                                      {editingCommentVisibility === CommentVisibility.OWNER_AND_COMMENTER && (
                                                                        <motion.div
                                                                          layoutId="activeCommentVisEdit"
                                                                          className="absolute inset-0 bg-white/95 dark:bg-slate-850/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                                        />
                                                                      )}
                                                                      Private
                                                                    </button>
                                                                  </div>
                                                                  <div className="hidden">
                                                                  <span className="hidden">
                                                                  </span>
                                                                  <select
                                                                    value={
                                                                      editingCommentVisibility
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      setEditingCommentVisibility(
                                                                        e.target
                                                                          .value as CommentVisibility,
                                                                      )
                                                                    }
                                                                    className="text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-white font-semibold text-slate-600 focus:outline-hidden"
                                                                  >
                                                                    <option
                                                                      value={
                                                                        CommentVisibility.EVERYONE
                                                                      }
                                                                    >
                                                                      Public
                                                                      Feed
                                                                    </option>
                                                                    <option
                                                                      value={
                                                                        CommentVisibility.OWNER_AND_COMMENTER
                                                                      }
                                                                    >
                                                                      Private
                                                                      Match
                                                                    </option>
                                                                  </select></div>
                                                                </div>

                                                                {currentUser?.rolePreference !==
                                                                  UserRole.DEVELOPER && (
                                                                  <div className="flex items-center gap-1.5">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                                      Rating:
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5">
                                                                      {[
                                                                        1, 2, 3,
                                                                      ].map(
                                                                        (
                                                                          starVal,
                                                                        ) => (
                                                                          <button
                                                                            key={
                                                                              starVal
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                              setEditingCommentRating(
                                                                                starVal,
                                                                              )
                                                                            }
                                                                            className="focus:outline-hidden hover:scale-110 transition-transform"
                                                                          >
                                                                            <Star
                                                                              className={`w-3.5 h-3.5 ${starVal <= editingCommentRating ? "fill-amber-500 text-amber-500" : "text-slate-300"}`}
                                                                            />
                                                                          </button>
                                                                        ),
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                )}
                                                              </div>

                                                              <button
                                                                type="submit"
                                                                disabled={
                                                                  editingCommentSubmitting
                                                                }
                                                                className="px-3.5 py-1.5 bg-slate-950 hover:bg-black text-white text-[10px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                                                              >
                                                                {editingCommentSubmitting
                                                                  ? "Saving..."
                                                                  : "Save plan"}
                                                              </button>
                                                            </div>
                                                          </form>
                                                        ) : (
                                                          <>
                                                            {/* Header Row */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
                                                              <div className="flex flex-wrap items-center gap-2">
                                                                <div className="w-5.5 h-5.5 rounded-full bg-indigo-100 dark:bg-indigo-950/65 text-indigo-800 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                                                                  {comm.userName
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                  {
                                                                    comm.userName
                                                                  }
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                                                  •{" "}
                                                                  {new Date(
                                                                    comm.createdAt,
                                                                  ).toLocaleDateString()}
                                                                </span>
                                                                {comm.updatedAt &&
                                                                  new Date(
                                                                    comm.updatedAt,
                                                                  ).getTime() >
                                                                    new Date(
                                                                      comm.createdAt,
                                                                    ).getTime() && (
                                                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/60">
                                                                      edited
                                                                    </span>
                                                                  )}
                                                              </div>

                                                              {/* Rating Display / Setter */}
                                                              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
                                                                {commentIsPrivate && (
                                                                  <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                                                                    <Lock className="w-2.5 h-2.5" />
                                                                    <span>
                                                                      Private
                                                                      Match
                                                                    </span>
                                                                  </span>
                                                                )}

                                                                {ratingBoxVisible && (
                                                                  <motion.div
                                                                    layout
                                                                    variants={
                                                                      interactionVariants
                                                                    }
                                                                    initial="hidden"
                                                                    animate="visible"
                                                                    className={`inline-flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-1.5 rounded-xl border transition-all max-w-full ${
                                                                      canUserRate
                                                                        ? "bg-amber-550/10 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-md scale-102"
                                                                        : "bg-slate-100/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-md"
                                                                    }`}
                                                                  >
                                                                    <span
                                                                      className={`font-semibold pr-0.5 ${canUserRate ? "text-[11px] text-amber-800 dark:text-amber-400 font-sans tracking-wide" : "text-slate-500 dark:text-slate-400 text-[10px] font-mono"}`}
                                                                    >
                                                                      {canUserRate
                                                                        ? "Usability Rating:"
                                                                        : "Rating:"}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5">
                                                                      {[
                                                                        1, 2, 3,
                                                                      ].map(
                                                                        (
                                                                          starVal,
                                                                        ) => {
                                                                          const currentRatingVal =
                                                                            canUserRate
                                                                              ? currentUser
                                                                                ? comm.ratings?.find(
                                                                                    (
                                                                                      r,
                                                                                    ) =>
                                                                                      r.userId ===
                                                                                      currentUser.id,
                                                                                  )
                                                                                    ?.rating ||
                                                                                  0
                                                                                : 0
                                                                              : comm.ratings &&
                                                                                  comm
                                                                                    .ratings
                                                                                    .length >
                                                                                    0
                                                                                ? comm.ratings.reduce(
                                                                                    (
                                                                                      sum,
                                                                                      r,
                                                                                    ) =>
                                                                                      sum +
                                                                                      r.rating,
                                                                                    0,
                                                                                  ) /
                                                                                  comm
                                                                                    .ratings
                                                                                    .length
                                                                                : comm.rating ||
                                                                                  0;
                                                                          return canUserRate ? (
                                                                            <motion.button
                                                                              key={
                                                                                starVal
                                                                              }
                                                                              type="button"
                                                                              onClick={() =>
                                                                                handleUpdateCommentRating(
                                                                                  comm.id,
                                                                                  starVal,
                                                                                  post.id,
                                                                                )
                                                                              }
                                                                              whileHover={{
                                                                                scale: 1.35,
                                                                                rotate: 10,
                                                                              }}
                                                                              whileTap={{
                                                                                scale: 0.85,
                                                                              }}
                                                                              transition={{
                                                                                type: "spring",
                                                                                stiffness: 350,
                                                                                damping: 12,
                                                                              }}
                                                                              className="focus:outline-hidden cursor-pointer p-1.5 -m-1.5 inline-flex items-center justify-center min-w-[32px] min-h-[32px]"
                                                                              title={`Change usefulness rating to ${starVal} Star${starVal > 1 ? "s" : ""}`}
                                                                            >
                                                                              <Star
                                                                                className={`w-5.5 h-5.5 transition-all text-amber-500 hover:scale-120 duration-150 ${starVal <= currentRatingVal ? "fill-amber-500 text-amber-500 filter drop-shadow-[0_0_4.5px_rgba(245,158,11,0.65)]" : "text-slate-350 dark:text-slate-600 opacity-40 hover:opacity-100"}`}
                                                                              />
                                                                            </motion.button>
                                                                          ) : (
                                                                            <motion.div
                                                                              key={
                                                                                starVal
                                                                              }
                                                                              animate={
                                                                                starVal <=
                                                                                currentRatingVal
                                                                                  ? {
                                                                                      scale:
                                                                                        [
                                                                                          1,
                                                                                          1.25,
                                                                                          1,
                                                                                        ],
                                                                                      rotate:
                                                                                        [
                                                                                          0,
                                                                                          5,
                                                                                          0,
                                                                                        ],
                                                                                    }
                                                                                  : {}
                                                                              }
                                                                              transition={{
                                                                                duration: 0.35,
                                                                                delay:
                                                                                  starVal *
                                                                                  0.05,
                                                                              }}
                                                                            >
                                                                              <Star
                                                                                className={`w-3.5 h-3.5 ${starVal <= currentRatingVal ? "fill-amber-500 text-amber-500" : "fill-transparent text-slate-300 dark:text-slate-700 opacity-20"}`}
                                                                              />
                                                                            </motion.div>
                                                                          );
                                                                        },
                                                                      )}
                                                                    </div>
                                                                    {canUserRate &&
                                                                      currentUser &&
                                                                      (comm.ratings?.find(
                                                                        (r) =>
                                                                          r.userId ===
                                                                          currentUser.id,
                                                                      )?.rating ||
                                                                        0) > 0 && (
                                                                        <button
                                                                          type="button"
                                                                          onClick={() =>
                                                                            handleUpdateCommentRating(
                                                                              comm.id,
                                                                              0,
                                                                              post.id,
                                                                            )
                                                                          }
                                                                          className="ml-1 shrink-0 cursor-pointer rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200/55 dark:border-rose-900/40 px-2 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-450 font-sans transition-all"
                                                                          title="Clear my rating"
                                                                        >
                                                                          Cancel
                                                                        </button>
                                                                      )}
                                                                    <span className="ml-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">
                                                                      {averageCommentRating}/3.0 ({comm.ratings?.length || (comm.rating ? 1 : 0)})
                                                                    </span>
                                                                  </motion.div>
                                                                )}
                                                              </div>
                                                            </div>

                                                            {/* Content block */}
                                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed py-1">
                                                              {comm.content}
                                                            </div>

                                                            {/* Actions row */}
                                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100/55 dark:border-slate-805">
                                                              <div className="flex items-center gap-2">
                                                                {containsGithub && (
                                                                  <div className="pt-0.5">
                                                                    <div
                                                                      className={`inline-flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/45 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/55 px-2 py-1 rounded transition-colors border border-indigo-100/50 dark:border-indigo-900/40 ${comm.repositoryUrl ? "cursor-pointer" : ""}`}
                                                                      onClick={() => {
                                                                        if (
                                                                          comm.repositoryUrl
                                                                        ) {
                                                                          window.open(
                                                                            comm.repositoryUrl,
                                                                            "_blank",
                                                                          );
                                                                        }
                                                                      }}
                                                                    >
                                                                      <Github className="w-3.5 h-3.5" />
                                                                      <span>
                                                                        {comm.repositoryUrl
                                                                          ? "Inspect solution URL"
                                                                          : "Suggested Git codebase inside"}
                                                                      </span>
                                                                    </div>
                                                                  </div>
                                                                )}

                                                                {/* Interactive comment like button */}
                                                                <button
                                                                  type="button"
                                                                  onClick={() =>
                                                                    handleToggleCommentLike(
                                                                      comm.id,
                                                                      post.id,
                                                                    )
                                                                  }
                                                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                                    currentUser &&
                                                                    comm.likes?.includes(
                                                                      currentUser.id,
                                                                    )
                                                                      ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-450 font-extrabold"
                                                                      : "bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border-slate-100 dark:border-slate-850"
                                                                  }`}
                                                                  title="Like / support this solution plan"
                                                                >
                                                                  <Heart
                                                                    className={`w-3 h-3 ${currentUser && comm.likes?.includes(currentUser.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
                                                                  />
                                                                  <span>
                                                                    {comm.likes
                                                                      ?.length ||
                                                                      0}{" "}
                                                                    Likes
                                                                  </span>
                                                                </button>
                                                              </div>

                                                              <div className="flex items-center gap-3">
                                                                {permissions.canEditComment(comm) && (
                                                                    <button
                                                                      type="button"
                                                                      onClick={() => {
                                                                        setEditingCommentId(
                                                                          comm.id,
                                                                        );
                                                                        setEditingCommentContent(
                                                                          comm.content,
                                                                        );
                                                                        setEditingCommentVisibility(
                                                                          comm.visibility,
                                                                        );
                                                                        setEditingCommentRepositoryUrl(
                                                                          comm.repositoryUrl ||
                                                                            "",
                                                                        );
                                                                        setEditingCommentRating(
                                                                          comm.rating ||
                                                                            3,
                                                                        );
                                                                        setEditingCommentIsAnonymous(
                                                                          comm.isAnonymous ||
                                                                            false,
                                                                        );
                                                                      }}
                                                                      className="inline-flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-bold transition-all p-1 hover:underline cursor-pointer"
                                                                    >
                                                                      <Edit3 className="w-3 h-3" />
                                                                      <span>
                                                                        Edit
                                                                        Suggestion
                                                                      </span>
                                                                    </button>
                                                                  )}

                                                                {permissions.canDeleteComment(comm) &&
                                                                  (deleteConfirmCommentId ===
                                                                  comm.id ? (
                                                                    <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg px-2 py-0.5 animate-in fade-in zoom-in-95 duration-150">
                                                                      <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                                                                        Delete?
                                                                      </span>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          handleDeleteComment(
                                                                            comm.id,
                                                                            post.id,
                                                                          );
                                                                          setDeleteConfirmCommentId(
                                                                            null,
                                                                          );
                                                                        }}
                                                                        className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs flex items-center justify-center text-[10px]"
                                                                        title="Confirm permanently delete suggestion"
                                                                      >
                                                                        <Check className="w-2.5 h-2.5" />
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          setDeleteConfirmCommentId(
                                                                            null,
                                                                          )
                                                                        }
                                                                        className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center text-[10px]"
                                                                        title="Cancel"
                                                                      >
                                                                        <X className="w-2.5 h-2.5" />
                                                                      </button>
                                                                    </div>
                                                                  ) : (
                                                                    <button
                                                                      type="button"
                                                                      onClick={() =>
                                                                        handleDeleteComment(
                                                                          comm.id,
                                                                          post.id,
                                                                        )
                                                                      }
                                                                      className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-450 hover:text-rose-850 dark:hover:text-rose-350 font-bold transition-all p-1 cursor-pointer"
                                                                      title="Delete suggestion description and code link"
                                                                    >
                                                                      <Trash2 className="w-3 h-3" />
                                                                      <span>
                                                                        Delete
                                                                        Comment
                                                                      </span>
                                                                    </button>
                                                                  ))}
                                                              </div>
                                                            </div>

                                                            {/* Post Owner Reply Section (Single Feedback Block) */}
                                                            {isReplyingThisComment ? (
                                                              <form
                                                                onSubmit={(e) =>
                                                                  handleReplySubmit(
                                                                    e,
                                                                    comm.id,
                                                                    post.id,
                                                                  )
                                                                }
                                                                className="mt-3 pl-4 border-l-2 border-indigo-400 space-y-2 py-1 bg-indigo-50/20 p-3 rounded-r-xl"
                                                              >
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                                                                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                                                                  <span>
                                                                    Modify
                                                                    Poster
                                                                    Feedback
                                                                    Reply
                                                                  </span>
                                                                </div>
                                                                <textarea
                                                                  rows={2}
                                                                  required
                                                                  placeholder="Type your feedback (e.g., This worked for me!)"
                                                                  value={
                                                                    replyText
                                                                  }
                                                                  onChange={(
                                                                    e,
                                                                  ) =>
                                                                    setReplyText(
                                                                      e.target
                                                                        .value,
                                                                    )
                                                                  }
                                                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                      setReplyingCommentId(
                                                                        null,
                                                                      );
                                                                      setReplyText(
                                                                        "",
                                                                      );
                                                                    }}
                                                                    className="px-2.5 py-1 bg-slate-200 text-slate-600 rounded text-[9px] font-bold hover:bg-slate-300"
                                                                  >
                                                                    Cancel
                                                                  </button>
                                                                  <button
                                                                    type="submit"
                                                                    disabled={
                                                                      replySubmitting
                                                                    }
                                                                    className="px-3 py-1 bg-indigo-600 text-white rounded text-[9px] font-bold hover:bg-indigo-700 disabled:opacity-50"
                                                                  >
                                                                    {replySubmitting
                                                                      ? "Saving..."
                                                                      : "Save Feedback"}
                                                                  </button>
                                                                </div>
                                                              </form>
                                                            ) : (
                                                              <motion.div
                                                                layout
                                                                variants={
                                                                  interactionVariants
                                                                }
                                                                initial="hidden"
                                                                animate="visible"
                                                                className="mt-3 pl-4 border-l-2 border-slate-200/85 dark:border-slate-800 flex flex-col gap-1 group"
                                                              >
                                                                <div className="flex items-center justify-between gap-2">
                                                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex-wrap">
                                                                    <CornerDownRight className="w-3 h-3 text-indigo-400" />
                                                                    <span>
                                                                      {post.isAnonymous
                                                                        ? "Problem Sharer Feedback"
                                                                        : `${post.userName} (Post Creator)`}
                                                                    </span>
                                                                    {comm.reply
                                                                      ?.replyUpdatedAt && (
                                                                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal font-mono lowercase bg-indigo-50 dark:bg-indigo-950/40 px-1.5 rounded border border-indigo-100/30 dark:border-indigo-900/40">
                                                                        edited
                                                                      </span>
                                                                    )}

                                                                    {/* Reply Like/Heart Button */}
                                                                    {comm.reply && (
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          handleToggleReplyLike(
                                                                            comm.id,
                                                                            post.id,
                                                                          )
                                                                        }
                                                                        className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                                                          currentUser &&
                                                                          comm.reply.likes?.includes(
                                                                            currentUser.id,
                                                                          )
                                                                            ? "bg-rose-500/10 border-rose-500/15 text-rose-600 dark:text-rose-400 font-bold"
                                                                            : "bg-slate-50 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border-slate-100 dark:border-slate-800"
                                                                        }`}
                                                                        title="Like user's feedback reply"
                                                                      >
                                                                        <Heart
                                                                          className={`w-2.5 h-2.5 ${currentUser && comm.reply.likes?.includes(currentUser.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"}`}
                                                                        />
                                                                        <span>
                                                                          {comm
                                                                            .reply
                                                                            .likes
                                                                            ?.length ||
                                                                            0}
                                                                        </span>
                                                                      </button>
                                                                    )}
                                                                  </div>

                                                                  {isPostOwner && currentUser?.rolePreference === UserRole.PROBLEM_SHARER && (
                                                                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          setReplyingCommentId(
                                                                            comm.id,
                                                                          );
                                                                          setReplyText(
                                                                            comm
                                                                              .reply
                                                                              ?.replyContent ||
                                                                              "This project worked for me",
                                                                          );
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-305 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/55 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/40 cursor-pointer"
                                                                      >
                                                                        <Edit3 className="w-2.5 h-2.5" />
                                                                        <span>
                                                                          Modify
                                                                        </span>
                                                                      </button>

                                                                      {comm
                                                                        .reply
                                                                        ?.replyContent &&
                                                                        (deleteConfirmReplyId ===
                                                                        comm.id ? (
                                                                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded px-1.5 py-0.5 animate-in fade-in zoom-in-95 duration-150 text-[9px]">
                                                                            <span className="font-extrabold text-rose-700 dark:text-rose-450 uppercase text-[8px] tracking-wider">
                                                                              Delete
                                                                              reply?
                                                                            </span>
                                                                            <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                handleDeleteReply(
                                                                                  comm.id,
                                                                                  post.id,
                                                                                );
                                                                                setDeleteConfirmReplyId(
                                                                                  null,
                                                                                );
                                                                              }}
                                                                              className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs flex items-center justify-center font-bold"
                                                                              title="Confirm reply delete"
                                                                            >
                                                                              <Check className="w-2.5 h-2.5" />
                                                                            </button>
                                                                            <button
                                                                              type="button"
                                                                              onClick={() =>
                                                                                setDeleteConfirmReplyId(
                                                                                  null,
                                                                                )
                                                                              }
                                                                              className="p-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center font-bold"
                                                                              title="Cancel"
                                                                            >
                                                                              <X className="w-2.5 h-2.5" />
                                                                            </button>
                                                                          </div>
                                                                        ) : (
                                                                          <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                              setDeleteConfirmReplyId(
                                                                                comm.id,
                                                                              )
                                                                            }
                                                                            className="inline-flex items-center gap-1 text-[9px] text-rose-600 dark:text-rose-450 hover:text-rose-800 dark:hover:text-rose-350 bg-rose-50 dark:bg-rose-955/40 hover:bg-rose-100 dark:hover:bg-rose-900/55 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/40 cursor-pointer"
                                                                            title="Delete this reply"
                                                                          >
                                                                            <Trash2 className="w-2.5 h-2.5" />
                                                                            <span>
                                                                              Delete
                                                                              Reply
                                                                            </span>
                                                                          </button>
                                                                        ))}
                                                                    </div>
                                                                  )}
                                                                </div>

                                                                <div
                                                                  onClick={() => {
                                                                    if (
                                                                      isPostOwner
                                                                    ) {
                                                                      setReplyingCommentId(
                                                                        comm.id,
                                                                      );
                                                                      setReplyText(
                                                                        comm
                                                                          .reply
                                                                          ?.replyContent ||
                                                                          "This project worked for me",
                                                                      );
                                                                    }
                                                                  }}
                                                                  className={`p-2.5 rounded-lg text-xs leading-relaxed transition-all ${
                                                                    isPostOwner
                                                                      ? "cursor-pointer bg-indigo-50/25 dark:bg-indigo-950/20 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/40 border border-dashed border-indigo-200 dark:border-indigo-800"
                                                                      : "bg-slate-100/50 dark:bg-slate-950/40 text-slate-650 dark:text-slate-400"
                                                                  }`}
                                                                >
                                                                  <p
                                                                    className={`italic text-sm font-bold ${comm.reply?.replyContent ? "text-slate-800 dark:text-slate-100" : "text-slate-500/80 dark:text-slate-400"}`}
                                                                  >
                                                                    “
                                                                    {comm.reply
                                                                      ?.replyContent ||
                                                                      "This project worked for me"}
                                                                    ”
                                                                  </p>
                                                                  {isPostOwner &&
                                                                    !comm.reply
                                                                      ?.replyContent && (
                                                                      <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold mt-1.5 animate-pulse">
                                                                        💡 Vague
                                                                        Placeholder
                                                                        (Click
                                                                        here to
                                                                        customize
                                                                        actual
                                                                        feedback!)
                                                                      </p>
                                                                    )}
                                                                </div>
                                                              </motion.div>
                                                            )}
                                                          </>
                                                        )}
                                                      </motion.div>
                                                    );
                                                  },
                                                );
                                              })()}
                                            </AnimatePresence>
                                          </div>
                                        )}
                                      </div>

                                      {/* Mobile-only Action button */}
                                      {currentUser?.rolePreference === UserRole.DEVELOPER && (
                                        <div className="block md:hidden py-3">
                                          <button
                                            type="button"
                                            onClick={() => setMobileCommentPostId(post.id)}
                                            className="w-full py-3 bg-slate-950 hover:bg-black dark:bg-slate-850 text-white font-bold rounded-xl text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                                          >
                                            <Plus className="w-4 h-4" />
                                            <span>Propose feedback or solve problem</span>
                                          </button>
                                        </div>
                                      )}

                                      {/* Mobile Bottom-sheet Comment Form */}
                                      <AnimatePresence>
                                        {mobileCommentPostId === post.id && (
                                          <>
                                            {/* Backdrop */}
                                            <motion.div
                                              key="mobile-comment-backdrop"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 0.5 }}
                                              exit={{ opacity: 0 }}
                                              onClick={() => setMobileCommentPostId(null)}
                                              className={`md:hidden fixed inset-0 z-[140] ${
                                                theme === "dark" ? "bg-black/80" : "bg-black/50"
                                              }`}
                                            />
                                            {/* Drawer Sheet */}
                                            <motion.div
                                              key="mobile-comment-drawer"
                                              initial={{ y: "100%" }}
                                              animate={{ y: 0 }}
                                              exit={{ y: "100%" }}
                                              transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                              className={`md:hidden fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t p-6 z-[150] overflow-y-auto flex flex-col space-y-4 pb-12 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-2xl ${
                                                theme === "dark"
                                                  ? "bg-slate-900 border-slate-800 text-white"
                                                  : "bg-white border-slate-200 text-slate-900"
                                              }`}
                                            >
                                              {/* Drag/Pull Handle Indicator */}
                                              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1 shrink-0" />
                                              
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-sans">
                                                    Propose feedback or solve problem
                                                  </h4>
                                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    Share suggestions, advice, or coordinate outcomes.
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => setMobileCommentPostId(null)}
                                                  className="p-1 px-2.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                                                >
                                                  Close
                                                </button>
                                              </div>

                                              {/* Form Content */}
                                              <form
                                                onSubmit={async (e) => {
                                                  await handleAddCommentSubmit(e, post.id);
                                                  setMobileCommentPostId(null);
                                                }}
                                                className="space-y-4"
                                              >
                                                {commentError && (
                                                  <p className="text-xs text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                                                    {commentError}
                                                  </p>
                                                )}

                                                <div className="space-y-1">
                                                  <div className="flex items-center justify-between">
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                      Your Feedback/Suggestion
                                                    </label>
                                                    {/* Github template shortcut */}
                                                    <button
                                                      type="button"
                                                      onClick={insertGithubTemplate}
                                                      className="text-[9px] bg-slate-105 hover:bg-slate-200/85 text-slate-655 dark:text-slate-400 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                      <Github className="w-3 h-3" />
                                                      <span>Insert Git template</span>
                                                    </button>
                                                  </div>
                                                  <textarea
                                                    rows={4}
                                                    required
                                                    placeholder="Suggest sharing GitHub repositories, design blueprints or solution links..."
                                                    value={commentContent}
                                                    onChange={(e) => setCommentContent(e.target.value)}
                                                    className="w-full p-3 text-xs glass-input-premium rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                                                  />
                                                </div>

                                                <div className="space-y-1">
                                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    Solution Repository URL (Optional)
                                                  </label>
                                                  <div className="relative">
                                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                      <Github className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <input
                                                      type="url"
                                                      placeholder="https://github.com/username/project"
                                                      value={commentRepositoryUrl}
                                                      onChange={(e) => setCommentRepositoryUrl(e.target.value)}
                                                      className="w-full pl-9 pr-3 py-2.5 text-xs glass-input-premium rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                  <div className="flex items-center justify-between font-sans">
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
                                                       Comment visibility:
                                                     </span>
                                                     <div className="flex items-center bg-slate-150/40 dark:bg-slate-900/60 p-0.5 rounded-xl relative border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shrink-0">
                                                       <button
                                                         type="button"
                                                         onClick={() => setCommentVisibility(CommentVisibility.EVERYONE)}
                                                         className={`relative px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                           commentVisibility === CommentVisibility.EVERYONE
                                                             ? "text-indigo-600 dark:text-indigo-400 font-black"
                                                             : "text-slate-500 dark:text-slate-450 hover:text-slate-705 dark:hover:text-slate-205 font-semibold"
                                                         }`}
                                                       >
                                                         {commentVisibility === CommentVisibility.EVERYONE && (
                                                           <motion.div
                                                             layoutId="activeCommentVisModal"
                                                             className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                             transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                           />
                                                         )}
                                                         Public Feed
                                                       </button>
                                                       <button
                                                         type="button"
                                                         onClick={() => setCommentVisibility(CommentVisibility.OWNER_AND_COMMENTER)}
                                                         className={`relative px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                           commentVisibility === CommentVisibility.OWNER_AND_COMMENTER
                                                             ? "text-indigo-600 dark:text-indigo-400 font-black"
                                                             : "text-slate-500 dark:text-slate-450 hover:text-slate-705 dark:hover:text-slate-205 font-semibold"
                                                         }`}
                                                       >
                                                         {commentVisibility === CommentVisibility.OWNER_AND_COMMENTER && (
                                                           <motion.div
                                                             layoutId="activeCommentVisModal"
                                                             className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                             transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                           />
                                                         )}
                                                         Private (Owner & Me)</button></div></div> <div className="hidden"><button className="hidden">
                                                       </button>
                                                     </div>
                                                     <div className="hidden">
                                                     <span className="hidden">
                                                      Comment visibility:
                                                    </span>
                                                    <select
                                                      value={commentVisibility}
                                                      onChange={(e) => setCommentVisibility(e.target.value as CommentVisibility)}
                                                      className="text-xs border border-slate-250 dark:border-slate-705 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-705 dark:text-slate-200 focus:outline-hidden"
                                                    >
                                                      <option value={CommentVisibility.EVERYONE}>Public Feed</option>
                                                      <option value={CommentVisibility.OWNER_AND_COMMENTER}>Private (Owner & Me)</option>
                                                    </select>
                                                  </div>

                                                  {currentUser?.rolePreference === UserRole.PROBLEM_SHARER && (
                                                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                        Quality Rating:
                                                      </span>
                                                      <div className="flex items-center gap-1.5 font-sans">
                                                        {[1, 2, 3].map((starVal) => (
                                                          <button
                                                            key={starVal}
                                                            type="button"
                                                            onClick={() => setCommentRating(starVal)}
                                                            className="p-1 text-slate-400 hover:scale-110 transition-transform cursor-pointer"
                                                          >
                                                            <Star className={`w-5 h-5 ${starVal <= commentRating ? "fill-amber-500 text-amber-500" : "text-slate-250 dark:text-slate-650"}`} />
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex gap-3">
                                                  <button
                                                    type="button"
                                                    onClick={() => setMobileCommentPostId(null)}
                                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 font-semibold rounded-xl text-xs uppercase tracking-wider cursor-pointer font-sans"
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    type="submit"
                                                    disabled={commentSubmitting}
                                                    className="flex-1 py-3 bg-slate-950 hover:bg-black dark:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer font-sans"
                                                  >
                                                    {commentSubmitting ? "Publishing..." : "Submit"}
                                                  </button>
                                                </div>
                                              </form>
                                            </motion.div>
                                          </>
                                        )}
                                      </AnimatePresence>

                                      {/* ADD NEW COMMENT / RESPONSE FORM WITH PREMIUM LIQUID GLASS */}
                                      {currentUser?.rolePreference === UserRole.DEVELOPER && (
                                        <div className="hidden md:block glass-card-premium p-5 rounded-2xl space-y-4 shadow-xs">
                                        <div className="flex items-center justify-between gap-4">
                                          <div>
                                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                              Propose feedback or solve problem
                                            </h5>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                              Share suggestions, advice, or
                                              coordinate code outcomes.
                                            </p>
                                          </div>

                                          {/* Github template shortcut */}
                                          <button
                                            type="button"
                                            onClick={insertGithubTemplate}
                                            className="text-[10px] bg-slate-100 hover:bg-slate-200/80 text-slate-600 px-2 py-1 rounded font-bold flex items-center gap-1 transition-colors"
                                          >
                                            <Github className="w-3 h-3" />
                                            <span>Insert Git suggestion</span>
                                          </button>
                                        </div>

                                        {commentError && (
                                          <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                            {commentError}
                                          </p>
                                        )}

                                        <form
                                          onSubmit={(e) =>
                                            handleAddCommentSubmit(e, post.id)
                                          }
                                          className="space-y-3"
                                        >
                                          <div>
                                            <textarea
                                              rows={3}
                                              required
                                              placeholder="Suggest sharing GitHub repositories, design blueprints or solution links, but still allow free text comments..."
                                              value={commentContent}
                                              onChange={(e) =>
                                                setCommentContent(
                                                  e.target.value,
                                                )
                                              }
                                              className="w-full p-3 text-xs glass-input-premium rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                                            />
                                          </div>

                                          {/* Dedicated Repository Path selector for developers */}
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                              Solution Repository URL (Optional)
                                            </label>
                                            <div className="relative">
                                              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                <Github className="w-3.5 h-3.5 text-slate-400" />
                                              </div>
                                              <input
                                                type="url"
                                                placeholder="https://github.com/myusername/realworld-problem-solution"
                                                value={commentRepositoryUrl}
                                                onChange={(e) =>
                                                  setCommentRepositoryUrl(
                                                    e.target.value,
                                                  )
                                                }
                                                className="w-full pl-9 pr-3 py-2.5 text-xs glass-input-premium rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono transition-all"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wide shrink-0">
                                                  Comment Mode:
                                                </span>
                                                <div className="flex items-center bg-slate-150/40 dark:bg-slate-900/60 p-0.5 rounded-xl relative border border-slate-200/40 dark:border-slate-800/40 overflow-hidden shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => setCommentVisibility(CommentVisibility.EVERYONE)}
                                                    className={`relative px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                      commentVisibility === CommentVisibility.EVERYONE
                                                        ? "text-indigo-600 dark:text-indigo-400 font-black"
                                                        : "text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                                                    }`}
                                                  >
                                                    {commentVisibility === CommentVisibility.EVERYONE && (
                                                      <motion.div
                                                        layoutId="activeCommentVisFeed"
                                                        className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                      />
                                                    )}
                                                    Public Feed
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setCommentVisibility(CommentVisibility.OWNER_AND_COMMENTER)}
                                                    className={`relative px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-250 cursor-pointer z-10 ${
                                                      commentVisibility === CommentVisibility.OWNER_AND_COMMENTER
                                                        ? "text-indigo-600 dark:text-indigo-400 font-black"
                                                        : "text-slate-500 dark:text-slate-450 hover:text-slate-705 dark:hover:text-slate-205 font-semibold"
                                                    }`}
                                                  >
                                                    {commentVisibility === CommentVisibility.OWNER_AND_COMMENTER && (
                                                      <motion.div
                                                        layoutId="activeCommentVisFeed"
                                                        className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 rounded-lg shadow-xs z-[-1] border border-slate-200/40 dark:border-slate-700/40"
                                                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                                                      />
                                                    )}
                                                    Private (Owner & Me)
                                                  </button>
                                                </div>
                                                <div className="hidden">
                                                <span className="hidden">
                                                  Comment Mode:
                                                </span>
                                                <select
                                                  value={commentVisibility}
                                                  onChange={(e) =>
                                                    setCommentVisibility(
                                                      e.target
                                                        .value as CommentVisibility,
                                                    )
                                                  }
                                                  className="text-[11px] border border-slate-200 rounded px-2 py-1 bg-white font-medium text-slate-600 focus:outline-hidden"
                                                >
                                                  <option
                                                    value={
                                                      CommentVisibility.EVERYONE
                                                    }
                                                  >
                                                    Public Feed
                                                  </option>
                                                  <option
                                                    value={
                                                      CommentVisibility.OWNER_AND_COMMENTER
                                                    }
                                                  >
                                                    Private (Owner & Me)
                                                  </option>
                                                </select></div>
                                              </div>

                                              {currentUser?.rolePreference === UserRole.PROBLEM_SHARER && (
                                                <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                                                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide shrink-0 font-sans">
                                                    Quality Rating:
                                                  </span>
                                                  <div className="flex items-center gap-1">
                                                    {[1, 2, 3].map(
                                                      (starVal) => (
                                                        <button
                                                          key={starVal}
                                                          type="button"
                                                          onClick={() =>
                                                            setCommentRating(
                                                              starVal,
                                                            )
                                                          }
                                                          className="focus:outline-hidden hover:scale-110 transition-transform cursor-pointer text-slate-350"
                                                          title={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                                                        >
                                                          <Star
                                                            className={`w-4 h-4 ${starVal <= commentRating ? "fill-amber-500 text-amber-500" : "text-slate-300"}`}
                                                          />
                                                        </button>
                                                      ),
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            <button
                                              type="submit"
                                              disabled={commentSubmitting}
                                              className="px-4 py-2 bg-slate-950 hover:bg-black text-white text-[11px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer"
                                            >
                                              {commentSubmitting
                                                ? "Uploading..."
                                                : "Publish comment"}
                                            </button>
                                          </div>
                                        </form>
                                      </div>
                                    )}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4) DYNAMIC POPUP MODAL FOR FORM CREATION AND EDITING OWN PROBLEMS */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            key="create-modal-container"
            id="create-modal-container"
            initial={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)", WebkitBackdropFilter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
               setShowCreateModal(false);
               setEditingPost(null);
            }}
            className={`fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto ${
              theme === "dark" ? "bg-slate-950/65" : "bg-slate-900/40"
            }`}
          >
            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              onClick={(e) => e.stopPropagation()}
              className={`border rounded-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden shadow-xl z-20 ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {editingPost ? "Modify Problem Post" : "Share Life Dilemma"}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Describe what hurts and who needs to be alerted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Modal Body form - Scrollable vertically for short screens & adaptive viewports */}
              <form
                onSubmit={handleCreatePostSubmit}
                className="p-6 space-y-4 overflow-y-auto flex-1 text-left"
              >
              {modalError && (
                <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-2 border border-rose-100 dark:border-rose-900 rounded">
                  {modalError}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk Invoice PDF Parser for Small Shop Accounting"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1">
                  Friction & Problem Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail your manual workflow. Where does it bottleneck? Who experiences this? e.g. Excel copying takes hours twice a week..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1">
                    Primary Category
                  </label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    {categories.map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="dark:bg-slate-900"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-1">
                    Who can view this?
                  </label>
                  <select
                    value={modalVisibility}
                    onChange={(e) =>
                      setModalVisibility(e.target.value as PostVisibility)
                    }
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  >
                    <option
                      value={PostVisibility.EVERYONE}
                      className="dark:bg-slate-900"
                    >
                      Everyone can see this post
                    </option>
                    <option
                      value={PostVisibility.DEVELOPERS_ONLY}
                      className="dark:bg-slate-900"
                    >
                      Only registered developers can see this
                    </option>
                  </select>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Publish Anonymously
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                    Mask your full user name with 'Anonymous Problem Sharer'
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalIsAnonymous(!modalIsAnonymous)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                    modalIsAnonymous
                      ? "bg-emerald-500 justify-end"
                      : "bg-slate-300 dark:bg-slate-700 justify-start"
                  } p-0.5`}
                >
                  <span className="w-5 h-5 bg-white dark:bg-white rounded-full shadow-xs"></span>
                </button>
              </div>

              {/* Modal controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  {editingPost ? "Save Changes" : "Post Problem"}
                </button>
              </div>
            </form>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Comment Confirmation Dialog */}
      <AnimatePresence>
        {deleteCommentConfirm && (
          <motion.div
            key="delete-comment-modal-container"
            id="delete-comment-modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              deleteCommentConfirm.resolve(false);
              setDeleteCommentConfirm(null);
            }}
            className={`fixed inset-0 z-[160] flex items-center justify-center p-4 overflow-y-auto ${
              theme === "dark" ? "bg-slate-950/70" : "bg-slate-900/40"
            } backdrop-blur-xs`}
          >
            {/* Confirmation Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              onClick={(e) => e.stopPropagation()}
              className={`border rounded-2xl max-w-md w-full overflow-hidden shadow-xl z-20 ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Confirm Deletion
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteCommentConfirm.resolve(false);
                    setDeleteCommentConfirm(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-left space-y-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete this
                  comment/solution suggestion? This action cannot be undone.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 italic">
                  "{deleteCommentConfirm.commentText}"
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    deleteCommentConfirm.resolve(false);
                    setDeleteCommentConfirm(null);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteCommentConfirm.resolve(true);
                    setDeleteCommentConfirm(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Post Preview Modal Dialog */}
      <AnimatePresence>
        {shareModalPost && (
          <SharePreviewModal
            post={shareModalPost}
            onClose={() => setShareModalPost(null)}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Global Simple Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-105 dark:border-slate-800 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Build For Need — Open utility digital tools and real-world
            backlogs.
          </p>
          <div className="flex justify-center gap-4 text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex-wrap">
            <button
              onClick={() => setActiveTab("feed")}
              className="hover:text-indigo-805 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              Problem Feed
            </button>
            <span className="text-slate-200 dark:text-slate-800 select-none">
              |
            </span>
            <button
              onClick={() => setActiveTab("about")}
              className="hover:text-indigo-805 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              About Us
            </button>
            <span className="text-slate-200 dark:text-slate-800 select-none">
              |
            </span>
            <button
              onClick={() => setActiveTab("faq")}
              className="hover:text-indigo-805 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <span className="text-slate-200 dark:text-slate-800 select-none">
              |
            </span>
            <button
              onClick={() => setActiveTab("donate")}
              className="hover:text-rose-650 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              Donate
            </button>
          </div>
        </div>
      </footer>

      {/* Global Animated Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9999] bg-slate-900 dark:bg-slate-50 border border-slate-800 dark:border-slate-200 text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 font-sans font-extrabold text-xs tracking-tight uppercase"
            id="global-toast-notification"
          >
            <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
