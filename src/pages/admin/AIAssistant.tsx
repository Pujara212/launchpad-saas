import { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BOOKINGS, SERVICES, STAFF, getServiceById, getStaffById } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: Record<string, unknown>;
}

const today = "2025-06-15";

function processQuery(query: string): { message: string; data?: Record<string, unknown> } {
  const q = query.toLowerCase();

  if (q.includes("how many") && q.includes("today")) {
    const todayB = BOOKINGS.filter((b) => b.startTime.startsWith(today));
    return { message: `You have ${todayB.length} bookings today (${today}).`, data: { totalBookings: todayB.length, date: today } };
  }

  if ((q.includes("most booked") || q.includes("popular")) && q.includes("service")) {
    const counts: Record<string, number> = {};
    BOOKINGS.forEach((b) => { counts[b.serviceId] = (counts[b.serviceId] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const service = getServiceById(top[0]);
    return { message: `The most booked service is "${service?.name}" with ${top[1]} bookings.`, data: { serviceId: top[0], serviceName: service?.name, bookingCount: top[1] } };
  }

  if (q.includes("cancelled")) {
    const cancelled = BOOKINGS.filter((b) => b.status === "cancelled");
    return {
      message: `There are ${cancelled.length} cancelled bookings in total.`,
      data: { cancelledCount: cancelled.length, bookings: cancelled.map((b) => ({ id: b.id, service: getServiceById(b.serviceId)?.name, time: b.startTime })) }
    };
  }

  if (q.includes("staff") && (q.includes("highest") || q.includes("top") || q.includes("most"))) {
    const counts: Record<string, number> = {};
    BOOKINGS.filter((b) => b.status !== "cancelled").forEach((b) => { counts[b.staffId] = (counts[b.staffId] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const staff = getStaffById(top[0]);
    return { message: `${staff?.name} has the highest booking count with ${top[1]} bookings.`, data: { staffName: staff?.name, bookingCount: top[1] } };
  }

  if (q.includes("pending")) {
    const pending = BOOKINGS.filter((b) => b.status === "pending");
    return { message: `There are ${pending.length} pending bookings awaiting confirmation.`, data: { pendingCount: pending.length } };
  }

  if (q.includes("confirmed")) {
    const confirmed = BOOKINGS.filter((b) => b.status === "confirmed");
    return { message: `There are ${confirmed.length} confirmed bookings.`, data: { confirmedCount: confirmed.length } };
  }

  if (q.includes("total") && q.includes("booking")) {
    return { message: `The platform has ${BOOKINGS.length} total bookings across all dates.`, data: { totalBookings: BOOKINGS.length } };
  }

  if (q.includes("revenue") || q.includes("earning")) {
    const revenue = BOOKINGS.filter((b) => b.status === "confirmed").reduce((sum, b) => {
      const s = getServiceById(b.serviceId);
      return sum + (s?.price ?? 0);
    }, 0);
    return { message: `Estimated revenue from confirmed bookings is ₹${revenue.toLocaleString()}.`, data: { revenue } };
  }

  if (q.includes("service") && q.includes("list")) {
    return { message: `Available services: ${SERVICES.map((s) => `${s.name} (₹${s.price})`).join(", ")}.`, data: { services: SERVICES } };
  }

  if (q.includes("staff") && q.includes("list")) {
    return { message: `Staff members: ${STAFF.map((s) => s.name).join(", ")}.`, data: { staff: STAFF } };
  }

  return {
    message: "I can help you with booking data. Try asking: 'How many bookings today?', 'Most booked service this week?', 'Show cancelled bookings', 'Which staff has highest bookings?', 'Total revenue?'"
  };
}

const SUGGESTIONS = [
  "How many bookings today?",
  "Which service is most booked?",
  "Show cancelled bookings",
  "Which staff has highest bookings?",
  "Total revenue from confirmed bookings?",
];

export default function AdminAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your BookEase AI Assistant. I can answer questions about your bookings, services, staff, and revenue. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (query: string = input) => {
    if (!query.trim()) return;
    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const result = processQuery(query);
      setMessages((prev) => [...prev, { role: "assistant", ...result }]);
      setLoading(false);
    }, 600);
  };

  return (
    <AdminLayout title="AI Assistant" subtitle="Ask natural language questions about your booking data">
      <div className="flex gap-5 h-[calc(100vh-8.5rem)]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-lg shadow-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-primary">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-foreground">BookEase AI</p>
              <p className="text-xs text-primary-foreground/60">Powered by booking data analytics</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-primary-foreground/60">Active</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-lg px-4 py-2.5 text-sm",
                  msg.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-accent text-accent-foreground"
                )}>
                  <p className="leading-relaxed">{msg.content}</p>
                  {msg.data && (
                    <pre className="mt-2 text-xs bg-background/50 rounded p-2 overflow-x-auto border border-border/50">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((n) => (
                    <div key={n} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${n * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about bookings, revenue, staff..."
                className="h-9 text-sm"
                disabled={loading}
              />
              <Button onClick={() => send()} disabled={!input.trim() || loading} size="icon" className="h-9 w-9 flex-shrink-0">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestions Panel */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow-card">
            <p className="text-xs font-semibold text-foreground mb-3">Quick Questions</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-md bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors border border-border hover:border-accent/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 shadow-card">
            <p className="text-xs font-semibold text-foreground mb-2">What I Know</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" /> Booking counts & statuses</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" /> Service popularity</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" /> Staff performance</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" /> Revenue estimates</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" /> Cancellation data</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
