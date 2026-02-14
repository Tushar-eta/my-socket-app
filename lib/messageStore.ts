// Use global object to persist across Next.js API route contexts
declare global {
    var __messageStore__: string | null;
}

if (!global.__messageStore__) {
    global.__messageStore__ = null;
}

export function setMessage(message: string) {
    global.__messageStore__ = message;
    console.log("Message set in global store:", message);
}

export function getMessage() {
    console.log("Getting message from global store:", global.__messageStore__);
    return global.__messageStore__;
}
