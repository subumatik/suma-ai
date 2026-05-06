"use client";

import React, { useMemo } from "react";
import { ChatBox } from "@mui/x-chat";
import { ChatAdapter, ChatMessageChunk, ChatUser } from "@mui/x-chat-headless";
import { Box, Typography } from "@mui/material";
import { SmartToy } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getInitialsAvatar(name: string, bg: string, fg: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${bg}" rx="32"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${fg}" font-size="28" font-family="sans-serif" font-weight="bold">${initials}</text></svg>`;
  if (typeof window !== "undefined") {
    return `data:image/svg+xml;base64,${window.btoa(svg)}`;
  }
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createAdapter(caseId: string): ChatAdapter {
  return {
    async sendMessage({ message, messages, signal }) {
      const apiMessages = messages
        .map((m) => {
          const textPart = m.parts.find((p) => p.type === "text");
          return { role: m.role, content: textPart?.text ?? "" };
        })
        .filter((m) => m.content.length > 0);

      const userText = message.parts.find((p) => p.type === "text")?.text ?? "";
      if (
        userText &&
        !apiMessages.some(
          (m) => m.role === message.role && m.content === userText
        )
      ) {
        apiMessages.push({ role: message.role, content: userText });
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, case_id: caseId }),
        signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const messageId = crypto.randomUUID();
      const textId = crypto.randomUUID();

      return new ReadableStream<ChatMessageChunk>({
        async start(controller) {
          controller.enqueue({ type: "start", messageId });
          controller.enqueue({ type: "text-start", id: textId });

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.text) {
                      controller.enqueue({
                        type: "text-delta",
                        id: textId,
                        delta: parsed.text,
                      });
                    }
                  } catch {
                    // ignore parse errors for malformed lines
                  }
                }
              }
            }
          } catch (err) {
            controller.error(err);
            return;
          }

          controller.enqueue({ type: "text-end", id: textId });
          controller.enqueue({ type: "finish", messageId });
          controller.close();
        },
      });
    },
  };
}

interface ChatInterfaceProps {
  caseId: string;
  userId: string;
  userName: string;
}

export default function ChatInterface({ caseId, userId, userName }: ChatInterfaceProps) {
  const adapter = useMemo(() => createAdapter(caseId), [caseId]);

  const members: ChatUser[] = useMemo(
    () => [
      {
        id: userId,
        displayName: userName,
        role: "user",
        avatarUrl: getInitialsAvatar(userName, "#3B82F6", "#ffffff"),
      },
      {
        id: "assistant",
        displayName: "AI Asistan",
        role: "assistant",
        avatarUrl: getInitialsAvatar("AI", "#10B981", "#ffffff"),
      },
    ],
    [userId, userName]
  );

  const currentUser: ChatUser = useMemo(
    () => ({
      id: userId,
      displayName: userName,
      role: "user",
      avatarUrl: getInitialsAvatar(userName, "#3B82F6", "#ffffff"),
    }),
    [userId, userName]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: 500,
        borderRadius: 2,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <SmartToy fontSize="small" /> Yapay Zeka Dava Asistanı
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Yüklenen belgelere göre sorularınızı cevaplar. Yargıtay araması için{" "}
          <strong>@yargitay_sorgula</strong> yazın.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ChatBox
          adapter={adapter}
          members={members}
          currentUser={currentUser}
          features={{
            conversationHeader: false,
            attachments: false,
            suggestions: false,
            autoScroll: true,
            helperText: false,
          }}
          slotProps={{
            messageContent: {
              partProps: {
                text: {
                  renderText: (text: string) => (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                  ),
                },
              },
            },
            messageGroup: {
              slots: {
                authorName: () => null,
              },
            },
          }}
          sx={{
            height: "100%",
            borderRadius: 0,
          }}
        />
      </Box>
    </Box>
  );
}
