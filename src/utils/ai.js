export async function callGemini(mode, payload, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const requestSignal = signal || controller.signal;

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...payload }),
      credentials: "same-origin",
      signal: requestSignal,
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.dispatchEvent(new Event("prepmate:unauthorized"));
      throw new Error("Your session has expired. Please sign in again.");
    }
    if (!response.ok) {
      throw new Error(data?.error || `Gemini request failed (${response.status}).`);
    }
    if (!data?.result) throw new Error("Gemini returned an empty response.");
    return data.result;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Gemini request timed out. Check your API key, model name, quota, and internet connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
