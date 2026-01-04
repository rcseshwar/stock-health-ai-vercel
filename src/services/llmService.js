// Client-side integration for demo purposes. 
// In production, this call should go through a backend proxy to hide keys.

export const analyzeStockRisks = async (apiKey, stockData, provider = 'gemini') => {
    if (!apiKey) throw new Error("API Key is required");

    // Filter for only critical items to reduce token usage and context size
    const criticalItems = stockData.filter(d => d.status === 'CRITICAL' || d.status === 'WARNING');

    if (criticalItems.length === 0) {
        return "Good news! All stock levels appear to be healthy. No immediate reorders needed.";
    }

    const prompt = `
    You are an expert supply chain analyst for a hospital network.
    Here is a list of items at risk of running out of stock:
    
    ${JSON.stringify(criticalItems.slice(0, 15))}
    
    (List truncated to top 5 items for brevity if long)

    Task:
    1. Identify the most urgent locations needing attention.
    2. Suggest a specific reorder quantity for the top 3 critical items (assume we want 30 days of stock based on avgDailyUsage).
    3. Provide a brief, actionable summary for the procurement officer.
    4. Do not include any additional information or context not directly related to the task.
    5. Output in a bullet point format with only the required information.
    `;

    try {
        if (provider === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error.message);
            return result.candidates[0].content.parts[0].text;
        }

        else if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const result = await response.json();
            if (result.error) throw new Error(result.error.message);
            return result.choices[0].message.content;
        }
    } catch (error) {
        console.error("AI Service Error:", error);
        throw new Error("Failed to get analysis. Please check your API key and try again.");
    }
};
