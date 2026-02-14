"use client";

import React, { useEffect, useRef, useState } from "react";
import pusher from "@/lib/pusherClient";

interface Message {
  id: string | number;
  text: string;
  sender: string;
  timestamp: string;
  type: "user" | "cron";
  seen?: boolean;
  isNew?: boolean; // Added for new message differentiation
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastSeenMessageId, setLastSeenMessageId] = useState<string | number | null>(null);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const cronStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate random username only on client side
    setSenderName("User" + Math.floor(Math.random() * 1000));

    console.log("🔧 Initializing Pusher connection...");

    // Initialize Pusher
    pusherRef.current = pusher;

    // Subscribe to chat channel
    const channel = pusherRef.current.subscribe('chat-channel');
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Connected to Pusher');
      setIsConnected(true);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.log('🔴 Pusher subscription error:', error);
      setIsConnected(false);
    });

    channel.bind('new-message', (message: Message) => {
      console.log('📨 Received message:', message);

      // Check if message already exists to prevent duplicates
      setMessages((prev) => {
        const messageExists = prev.some((msg) => msg.id === message.id);
        if (messageExists) {
          console.log('⚠️ Duplicate message detected, skipping:', message.id);
          return prev;
        }

        // Mark as new if it's from someone else and user is not looking at chat
        const isNewMessage = !isOwnMessage(message.sender) && !isVisible;

        const messageWithNewFlag = {
          ...message,
          isNew: isNewMessage
        };

        return [...prev, messageWithNewFlag];
      });

      // Update last message for preview
      setLastMessage(message.text);

      // Handle unread count (only count messages from others)
      if (!isOwnMessage(message.sender)) {
        if (!isVisible) {
          setUnreadCount(prev => prev + 1);
        }

        // Show browser notification if permission granted
        if (Notification.permission === "granted" && !isVisible) {
          new Notification(`${message.sender}`, {
            body: message.text,
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💬</text></svg>"
          });
        }
      }

      // Mark message as seen after 2 seconds (simulate WhatsApp seen feature)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, seen: true } : msg
          )
        );
      }, 2000);
    });

    return () => {
      console.log('🔌 Cleaning up Pusher connection...');
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current.unsubscribe('chat-channel');
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      if (!document.hidden) {
        // Clear unread count when user returns to tab
        setUnreadCount(0);

        // Mark all messages as read (remove new flags)
        setMessages((prev) =>
          prev.map((msg) => ({ ...msg, isNew: false }))
        );

        // Update last seen message ID to the latest message
        if (messages.length > 0) {
          setLastSeenMessageId(messages[messages.length - 1].id);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim()) {
      try {
        const response = await fetch('/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage.trim(),
            sender: senderName
          })
        });

        if (response.ok) {
          setInputMessage("");
          inputRef.current?.focus();
        } else {
          console.error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Start API cron job automatically
  useEffect(() => {
    const startCron = async () => {
      // Prevent multiple cron starts
      if (cronStartedRef.current) {
        console.log('🔄 Cron already started, skipping...');
        return;
      }

      try {
        console.log('🚀 Starting API cron job automatically...');
        const response = await fetch('/api/cron', { method: 'POST' });
        const result = await response.json();
        console.log('✅ API cron started:', result);
        cronStartedRef.current = true;
      } catch (error) {
        console.error('❌ Failed to start API cron:', error);
      }
    };

    // Start cron job immediately when component mounts
    startCron();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (sender: string) => sender === senderName;

  return (
    <div style={{
      maxWidth: "800px",
      margin: "20px auto",
      height: "90vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f0f2f5",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}>
      {/* WhatsApp-style Header */}
      <div style={{
        backgroundColor: "#075e54",
        color: "white",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "relative"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#128c7e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          cursor: "pointer"
        }}>
          {senderName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", fontSize: "16px" }}>
            Pusher + Cron Chat
          </div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>
            {isConnected ?
              `🟢 Online • Real-time connected` :
              "🔴 Connecting..."
            }
          </div>
          {lastMessage && (
            <div style={{
              fontSize: "11px",
              opacity: 0.7,
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "200px"
            }}>
              {lastMessage.length > 30 ? lastMessage.substring(0, 30) + "..." : lastMessage}
            </div>
          )}
        </div>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: "#25d366",
            color: "white",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            position: "absolute",
            top: "12px",
            right: "20px"
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}

        <div style={{ fontSize: "12px", opacity: 0.8 }}>
          {senderName}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        backgroundColor: "#e5ddd5",
        backgroundImage: "url('data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='100' height='100' patternTransform='scale(2)'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0h100v100H0z' fill='%23e5ddd5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23a)'/%3E%3C/svg%3E')"
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: "center",
            color: "#666",
            marginTop: "50px",
            fontSize: "14px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
            Welcome to the chat! Messages will appear here...
          </div>
        ) : (
          messages.map((message, index) => {
            // Check if we should show "New Messages" divider
            const showNewMessagesDivider = message.isNew &&
              (index === 0 || !messages[index - 1].isNew);

            return (
              <React.Fragment key={message.id}>
                {showNewMessagesDivider && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "16px 0",
                    padding: "0 20px"
                  }}>
                    <div style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: "#128c7e"
                    }} />
                    <div style={{
                      padding: "4px 12px",
                      backgroundColor: "#128c7e",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      margin: "0 8px"
                    }}>
                      New Messages
                    </div>
                    <div style={{
                      flex: 1,
                      height: "1px",
                      backgroundColor: "#128c7e"
                    }} />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: isOwnMessage(message.sender) ? "flex-end" : "flex-start",
                    marginBottom: "12px",
                    animation: "slideIn 0.3s ease-out"
                  }}
                >
                  <div style={{
                    maxWidth: "70%",
                    minWidth: "100px"
                  }}>
                    {!isOwnMessage(message.sender) && (
                      <div style={{
                        fontSize: "11px",
                        color: "#666",
                        marginBottom: "4px",
                        marginLeft: "12px"
                      }}>
                        {message.sender}
                      </div>
                    )}
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "18px",
                      backgroundColor: isOwnMessage(message.sender) ?
                        (message.type === "cron" ? "#25d366" : "#dcf8c6") :
                        (message.type === "cron" ? "#e8f5e8" : "white"),
                      color: isOwnMessage(message.sender) ? "#303030" : "#303030",
                      position: "relative",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      wordBreak: "break-word",
                      border: message.isNew ? "2px solid #128c7e" : "none"
                    }}>
                      <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                        {message.text}
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "4px",
                        marginTop: "4px"
                      }}>
                        <span style={{
                          fontSize: "10px",
                          color: isOwnMessage(message.sender) ? "#667786" : "#999"
                        }}>
                          {formatTime(message.timestamp)}
                        </span>
                        {isOwnMessage(message.sender) && (
                          <span style={{ fontSize: "12px", color: "#4fc3f7" }}>
                            {message.seen ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* Typing Indicator removed for Pusher implementation */}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Input */}
      <div style={{
        backgroundColor: "#f0f2f5",
        padding: "12px 20px",
        borderTop: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#128c7e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          cursor: "pointer"
        }}>
          📎
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            borderRadius: "20px",
            backgroundColor: "white",
            fontSize: "15px",
            color: "#303030",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            opacity: isConnected ? 1 : 0.6
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: isConnected && inputMessage.trim() ? "#128c7e" : "#ccc",
            color: "white",
            border: "none",
            cursor: isConnected && inputMessage.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px"
          }}
        >
          ➤
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
