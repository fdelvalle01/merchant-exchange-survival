import axios from "axios";

export type NormalizedApiError = {
  status?: number;
  message: string;
  details?: string;
};

function trimDetails(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact;
}

function toText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return trimDetails(value);

  try {
    return trimDetails(JSON.stringify(value));
  } catch {
    return trimDetails(String(value));
  }
}

function extractBackendMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return trimDetails(data);
  if (typeof data !== "object" || Array.isArray(data)) return undefined;

  const record = data as Record<string, unknown>;
  const keys = ["message", "error", "detail", "title"];

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return trimDetails(value);
    }
  }

  return undefined;
}

function mergeDetails(...parts: Array<string | undefined>) {
  const details = parts.filter(Boolean).join(" | ");
  return details ? trimDetails(details) : undefined;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage = extractBackendMessage(error.response?.data);
    const responseDetails = toText(error.response?.data);
    const details = mergeDetails(responseDetails, error.message);
    const diagnostic = `${error.code ?? ""} ${error.message ?? ""} ${details ?? ""}`.toLowerCase();

    if (error.code === "ECONNABORTED" || diagnostic.includes("timeout")) {
      return {
        status,
        message: "Order request timed out.",
        details
      };
    }

    if (
      !error.response ||
      diagnostic.includes("network error") ||
      diagnostic.includes("econnrefused") ||
      diagnostic.includes("proxy error") ||
      status === 502 ||
      status === 503 ||
      status === 504
    ) {
      return {
        status,
        message: "Backend offline. Unable to send order.",
        details
      };
    }

    if (status === 500) {
      return {
        status,
        message: "Backend error while processing order.",
        details
      };
    }

    return {
      status,
      message: backendMessage ?? "Backend rejected the order.",
      details
    };
  }

  if (error instanceof Error) {
    return {
      message: "Unexpected error while sending order.",
      details: trimDetails(error.message)
    };
  }

  return {
    message: "Unexpected error while sending order.",
    details: toText(error)
  };
}
