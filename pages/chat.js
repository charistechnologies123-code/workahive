import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { formatWorkaHiveDateTime } from "../lib/date-format";
import { getChatRoomDisplayName, getChatRoomSubtitle } from "../lib/chat";

function formatLastMessage(message) {
  if (!message) return "No messages yet";
  if (!message.body) return "Attachment message";
  return message.body.length > 90 ? `${message.body.slice(0, 90)}...` : message.body;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [privateContactId, setPrivateContactId] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupParticipantIds, setGroupParticipantIds] = useState([]);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const bottomRef = useRef(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(selectedRoomId)) || null,
    [rooms, selectedRoomId]
  );

  const loadContacts = async () => {
    const res = await fetch("/api/chat/users", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load chat contacts");
      setContacts([]);
      return [];
    }
    const list = Array.isArray(data.users) ? data.users : [];
    setContacts(list);
    return list;
  };

  const loadRooms = async (shouldSelectFirst = false) => {
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/chat/rooms", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load chat rooms");
        setRooms([]);
        return [];
      }

      const list = Array.isArray(data.rooms) ? data.rooms : [];
      setRooms(list);

      if (shouldSelectFirst && list.length > 0) {
        setSelectedRoomId((current) => {
          if (current && list.some((room) => String(room.id) === String(current))) {
            return current;
          }
          return list[0].id;
        });
      }

      return list;
    } catch (error) {
      console.error(error);
      toast.error("Failed to load chat rooms");
      setRooms([]);
      return [];
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId) => {
    if (!roomId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load messages");
        setMessages([]);
        return;
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load messages");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const bootstrap = async () => {
      const loadedContacts = await loadContacts();
      const loadedRooms = await loadRooms(true);

      if (mounted && loadedRooms.length > 0) {
        setSelectedRoomId((current) => current || loadedRooms[0].id);
      }

      if (mounted && loadedContacts.length > 0 && !privateContactId) {
        setPrivateContactId(String(loadedContacts[0].id));
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!selectedRoomId) return;
    loadMessages(selectedRoomId);

    const interval = setInterval(() => {
      loadMessages(selectedRoomId);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedRoomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadRooms(false);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const toggleGroupMember = (userId) => {
    setGroupParticipantIds((current) =>
      current.includes(userId)
        ? current.filter((value) => value !== userId)
        : [...current, userId]
    );
  };

  const createPrivateRoom = async () => {
    const participantId = Number(privateContactId);
    if (!participantId) {
      toast.error("Pick someone to start a private chat.");
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: "DIRECT", participantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create private chat");
        return;
      }

      await loadRooms(true);
      setSelectedRoomId(data.room?.id || null);
      toast.success("Private chat ready.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create private chat");
    } finally {
      setCreatingRoom(false);
    }
  };

  const createGroupRoom = async () => {
    const memberIds = groupParticipantIds.filter((id) => Number.isFinite(Number(id)));
    if (memberIds.length === 0) {
      toast.error("Select at least one person for the group chat.");
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "GROUP",
          title: groupTitle.trim(),
          participantIds: memberIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create group chat");
        return;
      }

      setGroupTitle("");
      setGroupParticipantIds([]);
      await loadRooms(true);
      setSelectedRoomId(data.room?.id || null);
      toast.success("Group chat created.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group chat");
    } finally {
      setCreatingRoom(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = messageBody.trim();
    if (!selectedRoomId || !body) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${selectedRoomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message");
        return;
      }

      setMessageBody("");
      await loadMessages(selectedRoomId);
      await loadRooms(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || (!authLoading && !user)) {
    return (
      <div className="page">
        <p className="muted">Loading chat...</p>
      </div>
    );
  }

  const roomTitle = selectedRoom ? getChatRoomDisplayName(selectedRoom, user.id) : "Chat";
  const roomSubtitle = selectedRoom ? getChatRoomSubtitle(selectedRoom, user.id) : "Select a conversation";

  return (
    <div className="page">
      <div className="page-head">
        <h1>Chat</h1>
        <p className="muted">
          Fast private and group messaging for your team and peers.
        </p>
      </div>

      <div className="chat-shell">
        <aside className="chat-sidebar">
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-head">
              <h3 style={{ marginBottom: 6 }}>Start a private chat</h3>
              <p className="muted small" style={{ margin: 0 }}>
                Choose one person to begin a direct conversation.
              </p>
            </div>
            <div className="chat-form-panel">
              <div className="field">
                <label>Contact</label>
                <select
                  value={privateContactId}
                  onChange={(event) => setPrivateContactId(event.target.value)}
                >
                  <option value="">Select person</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name || contact.email} - {contact.role}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={creatingRoom}
                onClick={createPrivateRoom}
              >
                {creatingRoom ? "Starting..." : "Start private chat"}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-head">
              <h3 style={{ marginBottom: 6 }}>Create a group</h3>
              <p className="muted small" style={{ margin: 0 }}>
                Add a title and select members.
              </p>
            </div>
            <div className="chat-form-panel">
              <div className="field">
                <label>Group title</label>
                <input
                  value={groupTitle}
                  onChange={(event) => setGroupTitle(event.target.value)}
                  placeholder="e.g. Product team"
                />
              </div>
              <div className="field">
                <label>Members</label>
                <div className="chat-contact-list">
                  {contacts.length === 0 ? (
                    <p className="muted small" style={{ margin: 0 }}>
                      No other users found.
                    </p>
                  ) : (
                    contacts.map((contact) => (
                      <label key={contact.id} className="chat-contact-item">
                        <input
                          type="checkbox"
                          checked={groupParticipantIds.includes(contact.id)}
                          onChange={() => toggleGroupMember(contact.id)}
                        />
                        <span>
                          <strong>{contact.name || contact.email}</strong>
                          <br />
                          <span className="muted small">
                            {contact.email} - {contact.role}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-soft"
                disabled={creatingRoom}
                onClick={createGroupRoom}
              >
                {creatingRoom ? "Creating..." : "Create group chat"}
              </button>
            </div>
          </div>

          <div>
            <div className="card-head" style={{ marginBottom: 12 }}>
              <h3 style={{ marginBottom: 6 }}>Conversations</h3>
              <p className="muted small" style={{ margin: 0 }}>
                Your recent group and private chats.
              </p>
            </div>

            {loadingRooms ? (
              <p className="muted">Loading rooms...</p>
            ) : rooms.length === 0 ? (
              <div className="chat-empty-state">
                Start a private or group chat to see conversations here.
              </div>
            ) : (
              <div className="chat-room-list">
                {rooms.map((room) => {
                  const isActive = String(room.id) === String(selectedRoomId);
                  const lastMessage = room.messages?.[0] || null;
                  const unreadCount = Number(room.unreadCount || 0);

                  return (
                    <button
                      key={room.id}
                      type="button"
                      className={`chat-room-item ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <p className="chat-room-item-title">
                            {getChatRoomDisplayName(room, user.id)}
                          </p>
                          <p className="chat-room-item-meta">
                            {getChatRoomSubtitle(room, user.id)}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="chat-room-item-badge">{unreadCount}</span>
                        )}
                      </div>
                      <p className="chat-room-item-meta" style={{ marginTop: 10 }}>
                        {formatLastMessage(lastMessage)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="chat-room">
          <div className="chat-room-header">
            <div>
              <h2 className="chat-room-title">{roomTitle}</h2>
              <p className="chat-room-subtitle">{roomSubtitle}</p>
            </div>
            <div className="muted small">
              {selectedRoom?.lastMessageAt
                ? `Updated ${formatWorkaHiveDateTime(selectedRoom.lastMessageAt)}`
                : "No recent activity"}
            </div>
          </div>

          {selectedRoomId ? (
            <>
              <div className="chat-message-list">
                {loadingMessages ? (
                  <p className="muted">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-state">
                    No messages yet. Send the first one to start the conversation.
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = Number(message.senderId) === Number(user.id);

                    return (
                      <div
                        key={message.id}
                        className={`chat-message-row ${mine ? "mine" : ""}`}
                      >
                        <div className={`chat-bubble ${mine ? "mine" : ""}`}>
                          <p className="chat-bubble-name">
                            {mine ? "You" : message.sender?.name || message.sender?.email || "Member"}
                          </p>
                          <p className="chat-bubble-body">{message.body}</p>
                          <p className="chat-bubble-meta">
                            {formatWorkaHiveDateTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form className="chat-composer" onSubmit={sendMessage}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Message</label>
                  <textarea
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Write your message..."
                    disabled={sending}
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={sending || !messageBody.trim()}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              Choose a conversation on the left or start a new one.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
