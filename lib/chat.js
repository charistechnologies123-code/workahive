export function getChatRoomDisplayName(room, currentUserId) {
  if (!room) return "Chat";

  if (room.type === "GROUP" && String(room.title || "").trim()) {
    return room.title.trim();
  }

  const members = Array.isArray(room.members) ? room.members : [];
  const others = members
    .map((member) => member?.user)
    .filter(Boolean)
    .filter((member) => Number(member.id) !== Number(currentUserId));

  if (room.type === "DIRECT") {
    return others[0]?.name || others[0]?.email || "Direct chat";
  }

  if (others.length > 0) {
    const names = others
      .slice(0, 3)
      .map((member) => member.name || member.email || "Member");
    return names.join(", ") + (others.length > 3 ? "..." : "");
  }

  return room.title || "Group chat";
}

export function getChatRoomSubtitle(room, currentUserId) {
  if (!room) return "";

  const members = Array.isArray(room.members) ? room.members : [];
  const others = members
    .map((member) => member?.user)
    .filter(Boolean)
    .filter((member) => Number(member.id) !== Number(currentUserId));

  if (room.type === "DIRECT") {
    const other = others[0];
    return [other?.role, other?.email].filter(Boolean).join(" \u2022 ");
  }

  if (room.type === "GROUP") {
    return `${members.length} members`;
  }

  return "";
}
