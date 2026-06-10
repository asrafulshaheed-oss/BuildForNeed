export interface Message {
  role: "user" | "assistant";
  content: string;
}

export const DEFAULT_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm Gemini, your AI guide. Need benchmarking, project planning, relational database outline, or help detailing a complex problem statement? Ask me anything!",
};

// In-memory message store that handles sync fallbacks
let messagesStore: Message[] = [DEFAULT_MESSAGE];
const listeners = new Set<() => void>();

// Native IndexedDB configuration constants safely segmented per tenant / session
const DB_NAME = "GeminiChatbotDB";
const STORE_NAME = "chatMessages";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadMessagesFromDB(userId: string | undefined): Promise<Message[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const key = userId || "anonymous";
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("IndexedDB fallback loaded due to exception:", err);
    return null;
  }
}

async function saveMessagesToDB(userId: string | undefined, messages: Message[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const key = userId || "anonymous";
      const request = store.put(messages, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("Failed saving messages to IndexedDB:", err);
  }
}

export const geminiStore = {
  getMessages(): Message[] {
    return messagesStore;
  },
  
  setMessages(newMessages: Message[]) {
    messagesStore = newMessages;
    listeners.forEach((l) => l());
    saveMessagesToDB(lastUserId, newMessages);
  },

  clearChat() {
    messagesStore = [
      {
        role: "assistant",
        content: "Chat log cleared! Ask me any new query to start freshly.",
      },
    ];
    listeners.forEach((l) => l());
    saveMessagesToDB(lastUserId, messagesStore);
  },

  resetStore() {
    messagesStore = [DEFAULT_MESSAGE];
    listeners.forEach((l) => l());
    saveMessagesToDB(lastUserId, messagesStore);
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

let lastUserId: string | undefined = "uninitialized";

export async function syncGeminiUserSession(userId: string | undefined) {
  if (lastUserId === "uninitialized") {
    lastUserId = userId;
    const saved = await loadMessagesFromDB(userId);
    if (saved) {
      messagesStore = saved;
    } else {
      messagesStore = [DEFAULT_MESSAGE];
    }
    listeners.forEach((l) => l());
  } else if (lastUserId !== userId) {
    // Detect logout/login switches, perform partition transition for safety
    lastUserId = userId;
    const saved = await loadMessagesFromDB(userId);
    if (saved) {
      messagesStore = saved;
    } else {
      messagesStore = [DEFAULT_MESSAGE];
    }
    listeners.forEach((l) => l());
  }
}
