"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "assistant" }[]
  >([]);
  const [input, setInput] = useState("");
  const [waitingReply, setWaitingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    try {
      if (input.trim()) {
        setWaitingReply(true);

        const userMessage = input;

        setInput("");

        // agregar mensaje usuario
        const newMessages = [
          ...messages,
          {
            text: userMessage,
            sender: "user" as const,
          },
          {
            text: "",
            sender: "assistant" as const,
          },
        ];

        setMessages(newMessages);

        // request
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
          }),
        });

        const reader = response.body?.getReader();

        if (!reader) return;

        const decoder = new TextDecoder();

        let assistantText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // agregar chunk al buffer
          buffer += decoder.decode(value, { stream: true });

          // separar por líneas
          const lines = buffer.split("\n");

          // guardar última línea incompleta
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const parsed = JSON.parse(line);

              assistantText += parsed.response || "";

              setMessages((prev) => {
                const updated = [...prev];

                updated[updated.length - 1] = {
                  text: assistantText,
                  sender: "assistant",
                };

                return updated;
              });
            } catch (err) {
              console.error("JSON parse error:", err);
            }
          }
        }

        setWaitingReply(false);
      }
    } catch (e) {
      alert(e);
    } finally {
      setWaitingReply(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full h-full max-w-xl mx-auto">
      {/* Título */}
      <h1 className="text-4xl font-bold text-white">Chatbot - Enunciado 2</h1>

      {/* Subtítulo */}
      <p className="text-lg text-white/80">Tema: Producción Musical</p>
      {/* Subtítulo */}
      <p className="text-lg text-neutral-500 mb-8">
        Daniel Mass Jamet - Martín Díaz Muñoz
      </p>

      {/* Contenedor Chat */}
      <div className="flex flex-col flex-1 bg-neutral-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Área de mensajes */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-neutral-400 text-center py-8">
              Los mensajes aparecerán aquí
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-700 text-neutral-100"
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Área de entrada */}
        <div className="border-t border-neutral-700 p-4">
          <input
            disabled={waitingReply}
            type="text"
            placeholder={
              waitingReply ? "Cargando respuesta..." : "Escribe tu mensaje..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`w-full text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${waitingReply ? "bg-neutral-800" : "bg-blue-600/50"} transition`}
          />
        </div>
      </div>
    </div>
  );
}
