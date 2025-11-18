import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const FarmerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Jambo! I am AgriGuard Assistant. How can I help you with your harvest today?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      // Simulate processing time or call an edge function
      // For hackathon, we can route this to the general AI agent
      // or simulate a specific response based on keywords
      let responseText = "";
      
      if (userMsg.toLowerCase().includes("price")) {
        const { data } = await supabase.from('market_prices').select('*').limit(1);
        responseText = `Current maize prices in Nairobi are trending ${data?.[0]?.price_trend || 'stable'} at KES ${data?.[0]?.price_per_kg || 45}/kg.`;
      } else if (userMsg.toLowerCase().includes("weather") || userMsg.toLowerCase().includes("rain")) {
         responseText = "Heavy rains expected in Kiambu for the next 3 days. Ensure drainage channels are open.";
      } else {
         // Fallback generic AI response simulation
         responseText = "I can help you with market prices, weather predictions, and crop disease diagnosis. Please send a photo of your crop or ask about prices.";
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="rounded-full h-14 w-14 shadow-lg bg-[#25D366] hover:bg-[#128C7E]">
          <MessageCircle className="h-8 w-8 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] h-[500px] shadow-2xl flex flex-col">
          <CardHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex flex-row justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> AgriGuard Chat
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary/90">X</Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                        {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-xs text-muted-foreground ml-12">AgriGuard is typing...</div>}
              </div>
            </ScrollArea>
            <div className="p-4 border-t flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about prices, pests..." 
              />
              <Button size="icon" onClick={handleSend}><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};