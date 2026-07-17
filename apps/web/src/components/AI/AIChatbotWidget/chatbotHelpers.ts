export const suggestionChips = [
    { label: "Market summary", text: "Please summarize the latest news and catalysts impacting this market." },
    { label: "Trading strategy", text: "What is your recommended trading strategy for YES and NO outcomes?" },
    { label: "Volume analysis", text: "What does the current orderbook volume and depth reveal about sentiment?" }
];

export const streamChatResponse = async (
    marketId: string,
    chatHistory: any[],
    userMessage: string,
    accessToken: string,
    onChunk: (text: string) => void
) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            marketId,
            messages: chatHistory,
            userMessage
        })
    });

    if (!response.ok) throw new Error("Chat request failed");
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error("Could not construct reader");

    let receivedText = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedText += decoder.decode(value);
        onChunk(receivedText);
    }
};
