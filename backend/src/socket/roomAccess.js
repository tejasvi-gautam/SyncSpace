const ROOM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export const normalizeRoomId = (roomId) => {
    if (typeof roomId !== "string") {
        return null;
    }

    const normalized = roomId.trim();

    if (!ROOM_ID_PATTERN.test(normalized)) {
        return null;
    }

    return normalized;
};

export const canJoinRoom = async ({ user, roomId, getMembership }) => {
    if (!user?.id) {
        return {
            allowed: false,
            code: "AUTH_REQUIRED",
            message: "Authenticated user identity is required."
        };
    }

    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
        return {
            allowed: false,
            code: "INVALID_ROOM_ID",
            message: "A valid roomId is required."
        };
    }

    if (typeof getMembership !== "function") {
        return {
            allowed: false,
            code: "ROOM_ACCESS_UNAVAILABLE",
            message: "Room access cannot be verified."
        };
    }

    const membership = await getMembership({
        roomId: normalizedRoomId,
        userId: user.id
    });

    if (!membership) {
        return {
            allowed: false,
            code: "ROOM_ACCESS_DENIED",
            message: "You are not permitted to join this room."
        };
    }

    return {
        allowed: true,
        roomId: normalizedRoomId,
        membership
    };
};