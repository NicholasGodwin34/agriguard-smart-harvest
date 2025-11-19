import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export const FarmerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Jambo! I am AgriGuard. Ask about market prices (e.g. "Price of maize in Kiambu") or upload a crop photo.',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------
  // Extract commodity + location from text
  // -------------------------------------------------------
  const parsePriceQuery = (text: string) => {
    const lower = text.toLowerCase();

    const commodities = ["maize", "wheat", "rice", "beans", "potatoes", "sorghum"];
    const locations = [
      "nairobi",
      "nakuru",
      "kiambu",
      "mombasa",
      "kisumu",
      "meru",
      "bomet",
      "embu",
      "kericho",
      "eldoret",
      "machakos",
      "nandi",
    ];

    const commodity = commodities.find((c) => lower.includes(c));
    const location = locations.find((l) => lower.includes(l));

    if (!commodity || !location) return null;

    return { commodity, location };
  };

  // -------------------------------------------------------
  // Handle sending text messages
  // -------------------------------------------------------
  const handleSend = async () => {
    if (!input.trim()) return;

    const text = input;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsLoading(true);

    try {
      let response = "I didn’t understand that. Ask about prices, weather, or upload a photo.";

      // -------------------------------------------------------
      // 1 — MARKET PRICE LOGIC
      // -------------------------------------------------------
      const priceQuery = parsePriceQuery(text);
      if (priceQuery) {
        const { commodity, location } = priceQuery;

        const { data, error } = await supabase
          .from("market_prices")
          .select("*")
          .ilike("commodity", `%${commodity}%`)
          .ilike("market_location", `%${location}%`)
          .order("recorded_at", { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const row = data[0];
          response = `The current price of ${row.commodity} in ${row.market_location} is KES ${row.price_per_kg}/kg (${row.price_trend}).`;
        } else {
          response = `No recent price data found for ${commodity} in ${location}.`;
        }
      }

      // -------------------------------------------------------
      // 2 — WEATHER LOGIC
      // -------------------------------------------------------
      else if (text.toLowerCase().includes("weather") || text.toLowerCase().includes("rain")) {
        response = "Heavy rainfall expected in the Rift Valley region. Ensure proper grain drying and drainage.";
      }

      // -------------------------------------------------------
      // 3 — FALLBACK
      // -------------------------------------------------------
      else {
        response =
          'I can help with: prices (e.g., "Price of maize in Nairobi"), weather alerts, or crop health (upload a photo).';
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "System error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------
  // Handle Image Upload → Crop Health Agent
  // -------------------------------------------------------
  const handleImageUpload = async () => {
    const demoImageUrl =
      "https://images.unsplash.com/photo-1596734776582-22493a1d816c";

    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Analyzing this crop...", image: demoImageUrl },
    ]);

    setIsLoading(true);
    toast.info("Uploading image for crop analysis...");

    try {
      const { data, error } = await supabase.functions.invoke("crop-health-agent", {
        body: {
          location: "Farmer Chat",
          cropType: "Unknown",
          imageUrl: demoImageUrl,
        },
      });

      if (error) throw error;

      const result = data?.analysis;

      const diagnosis = `Analysis: ${result.health_status.toUpperCase()}
Detected: ${result.disease_detected || "None"}
Advice: ${result.recommendations?.[0] || "Monitor crop conditions."}`;

      setMessages((prev) => [...prev, { role: "assistant", content: diagnosis }]);
    } catch (err) {
      console.error("Image Analysis Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to analyze image. Try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------
  // UI Rendering
  // -------------------------------------------------------
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button className="rounded-full h-14 w-14 bg-green-600" onClick={() => setIsOpen(true)}>
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[360px] h-[520px] shadow-xl flex flex-col border-green-600">
          <CardHeader className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" /> AgriGuard
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsOpen(false)}>
              X
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-3 flex flex-col overflow-hidden bg-slate-50">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`p-3 rounded-lg max-w-[85%] text-sm ${
                        msg.role === "user"
                          ? "bg-green-600 text-white"
                          : "bg-white border shadow-sm text-slate-700"
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Crop"
                          className="rounded-md mb-2 w-full h-32 object-cover"
                        />
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="pt-3 mt-1 border-t flex gap-2 items-center">
              <Button variant="outline" size="icon" onClick={handleImageUpload}>
                <Camera className="w-5 h-5 text-slate-700" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about prices..."
                className="flex-1"
              />

              <Button size="icon" onClick={handleSend} className="bg-green-600">
                <Send className="w-5 h-5 text-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
