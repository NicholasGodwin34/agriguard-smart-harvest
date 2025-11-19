import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Bot, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const FarmerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Jambo! I am AgriGuard Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------
  // PRICE PARSER — Extract crop + county
  // -------------------------------------------------------
  const extractPriceQuery = (text: string) => {
    const lower = text.toLowerCase();

    const crops = ["maize", "beans", "rice", "wheat", "potatoes", "sorghum"];
    const counties = [
      "nairobi","nakuru","kiambu","kisumu","eldoret","machakos","meru",
      "bomet","kericho","nandi","embu","makueni","kirinyaga"
    ];

    const crop = crops.find(c => lower.includes(c));
    const county = counties.find(c => lower.includes(c));

    if (!crop || !county) return null;
    return { crop, county };
  };

  // -------------------------------------------------------
  // MOCK CROP HEALTH IMAGE ANALYSIS
  // -------------------------------------------------------
  const handleImageUpload = () => {
    setMessages(prev => [...prev, { role: "user", content: "[Image Uploaded]" }]);
    setIsLoading(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I have analyzed your crop photo. The leaves show early signs of fungal infection. Apply recommended fungicide and monitor moisture levels."
        }
      ]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      let responseText = "";

      // -------------------------------------------------------
      // 1. PRICE QUERY LOGIC
      // -------------------------------------------------------
      const priceQuery = extractPriceQuery(userMsg);
      if (priceQuery) {
        const { crop, county } = priceQuery;

        const { data } = await supabase
          .from("market_prices")
          .select("*")
          .eq("crop", crop)
          .eq("county", county)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const price = data[0].price_per_kg || data[0].price || "N/A";
          const trend = data[0].price_trend || "stable";

          responseText = `The current price of ${crop} in ${county} is KES ${price} per kg. Trend: ${trend}.`;
        } else {
          responseText = `I could not find updated market prices for ${crop} in ${county}.`;
        }
      }

      // -------------------------------------------------------
      // 2. WEATHER LOGIC
      // -------------------------------------------------------
      else if (userMsg.toLowerCase().includes("weather") || userMsg.toLowerCase().includes("rain")) {
        responseText = "Rainfall expected in your region for the next 3 days. Plan harvesting and drying carefully.";
      }

      // -------------------------------------------------------
      // 3. FALLBACK ASSISTANT RESPONSE
      // -------------------------------------------------------
      else {
        responseText =
          "I can help with: prices (e.g., 'Price of maize in Nakuru'), crop health (send a photo), weather, and market trends.";
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
        setIsLoading(false);
      }, 800);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-[#25D366] hover:bg-[#128C7E]"
        >
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] h-[510px] shadow-2xl flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> AgriGuard Chat
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary/90"
            >
              X
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-2 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          m.role === "user" ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        {m.role === "user" ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          m.role === "user" ? "bg-primary text-white" : "bg-muted"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-xs text-muted-foreground ml-12">AgriGuard is typing...</div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex gap-2 items-center">
              <Button size="icon" variant="secondary" onClick={handleImageUpload}>
                <ImageIcon className="w-5 h-5" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about prices, pests..."
              />

              <Button size="icon" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
