import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { toast, Toaster } from "sonner";

// pakai tailwind yang sudah kamu setup
import "/assets/tailwind.css";
import "./style.css";

// shadcn-light components
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";

// components
import { ThemeProvider } from "../../components/theme-provider";
import { ModeToggle } from "../../components/mode-toggle";

// icons
import { Paperclip, Send } from "lucide-react";

type ChatMsg = {
  id: string;
  role: "user" | "bot" | "system";
  text?: string;
  imageUrl?: string; // local preview
  time: number;
};

const storage = browser.storage.local;

function App() {
  const [webhook, setWebhook] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // load webhook & history
  useEffect(() => {
    (async () => {
      const { n8nWebhook = "", history = [] } = await storage.get([
        "n8nWebhook",
        "history",
      ]);
      setWebhook(n8nWebhook);
      setChat(history);
    })();
  }, []);

  // persist + autoscroll
  useEffect(() => {
    storage.set({ history: chat });
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  // preview image
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const saveWebhook = async () => {
    await storage.set({ n8nWebhook: webhook.trim() });
    toast.success("Webhook saved");
  };

  const canSend = useMemo(
    () => !!webhook.trim() && (!!message.trim() || !!file) && !sending,
    [webhook, message, file, sending]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        setFile(file);
        toast.success("Image pasted!");
      }
    }
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);

    // tampilkan pesan user dulu
    setChat((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: message.trim() || (file ? "(File attached)" : ""),
        imageUrl: filePreview || undefined,
        time: Date.now(),
      },
    ]);

    try {
      let body: any = {
        source: "wxt-sidepanel",
        ts: new Date().toISOString(),
      };
      
      if (message.trim()) body.message = message.trim();
      
      if (file) {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
          };
          reader.readAsDataURL(file);
        });
        
        body.files = "true";
        body.fileName = file.name;
        body.fileType = file.type;
        body.fileSize = String(file.size);
        body.fileData = base64Data;
        body.fileMime = file.type;
      }

      const res = await fetch(webhook.trim(), { 
        method: "POST", 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ctype = res.headers.get("content-type") || "";
      let reply = "";
      if (ctype.includes("application/json")) {
        const data = await res.json();
        reply =
          data?.output ??
          data?.message ??
          data?.text ??
          (Array.isArray(data) &&
            (data[0]?.output ?? data[0]?.message ?? data[0]?.text)) ??
          JSON.stringify(data);
      } else {
        reply = await res.text();
      }

      setChat((c) => [
        ...c,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: String(reply || "OK"),
          time: Date.now(),
        },
      ]);
    } catch (e: any) {
      setChat((c) => [
        ...c,
        {
          id: crypto.randomUUID(),
          role: "system",
          text: `Error: ${e?.message ?? e}`,
          time: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
      setMessage("");
      // biarkan file tetap agar bisa kirim lagi; hapus jika ingin:
      // setFile(null);
      taRef.current?.focus();
    }
  };

  return (
    // ⬅️ penuh layar panel dengan footer fix di bawah
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <Toaster position="top-center" />
      {/* HEADER - lebih compact */}
      <div className="sticky top-0 z-10 bg-background border-b h-auto">
        <div className="mx-auto max-w-[680px] p-1 sm:p-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex justify-center">
              <div className="flex gap-2 items-center w-full max-w-[600px]">
                <Input
                  placeholder="https://n8n.yourdomain.com/webhook/xxxx"
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  className="h-8 flex-1 text-sm"
                />
                <Button
                  onClick={saveWebhook}
                  className="h-8 shrink-0 px-3 text-sm"
                >
                  Save
                </Button>
              </div>
            </div>
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* CHAT AREA (ambil sisa ruang) */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-[680px] px-2 sm:px-3 py-3">
          <div className="grid gap-3">
            {chat.map((m) => (
              <div
                key={m.id}
                className={[
                  "w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1",
                  m.role === "user"
                    ? "ml-auto bg-gradient-to-br from-indigo-500 to-blue-600 text-white ring-transparent"
                    : m.role === "bot"
                    ? "mr-auto bg-muted text-foreground ring-border"
                    : "mx-auto bg-yellow-50 text-yellow-900 ring-yellow-100",
                ].join(" ")}
              >
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    className="mb-2 max-h-40 rounded-xl ring-1 ring-border"
                    alt="preview"
                  />
                )}
                {m.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER - fix di bawah */}
      <div className="bg-background border-t h-auto sticky bottom-0">
        <div className="mx-auto max-w-[680px] p-1 sm:p-2">
          {filePreview && (
            <div className="mb-1 flex items-center gap-2">
              <img
                src={filePreview}
                className="max-h-16 rounded-lg ring-1 ring-border"
              />
              <Button
                type="button"
                className="bg-muted text-foreground ring-1 ring-border hover:bg-muted/80 h-7 px-2 text-xs"
                onClick={() => setFile(null)}
              >
                Remove
              </Button>
            </div>
          )}
          <div className="flex gap-2 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <Textarea
                ref={taRef}
                rows={1}
                placeholder="Tulis pesan…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                className="h-7 flex-1 text-sm resize-none"
              />
            </div>
            <div className="flex flex-col justify-between gap-1">
              <Button
                type="button"
                className="bg-muted text-foreground ring-1 ring-border hover:bg-muted/80 h-9 w-9 p-0 flex items-center justify-center"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*,.pdf,.doc,.docx,.txt';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setFile(file);
                      console.log('File selected:', file.name);
                    }
                  };
                  input.click();
                }}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                disabled={!canSend}
                onClick={send}
                className={
                  !canSend
                    ? "opacity-60"
                    : "h-9 w-9 p-0 flex items-center justify-center"
                }
              >
                {sending ? (
                  <span className="text-xs">Sending…</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="wxt-ui-theme">
    <App />
  </ThemeProvider>
);
