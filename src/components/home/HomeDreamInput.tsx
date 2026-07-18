import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Moon, Brain, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceDreamRecorder } from "@/components/dream/VoiceDreamRecorder";
import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/lib/notify";
import { useAuth } from "@/hooks/useAuth";
import { captureError } from "@/lib/logger";

interface InterpretationResult {
  islamic_interpretation: string;
  psychological_interpretation: string;
  keywords: string[];
  general_meaning: string;
}

export function HomeDreamInput() {
  const { user } = useAuth();
  const [showRecorder, setShowRecorder] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [dreamText, setDreamText] = useState("");

  const handleVoiceSave = async (data: { title: string; content: string; mood: string }) => {
    setDreamText(data.content);
    setShowRecorder(false);
    await interpretDream(data.content, data.mood);
  };

  const interpretDream = async (text: string, mood?: string) => {
    setIsInterpreting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("interpret-dream", {
        body: {
          dreamText: text,
          dreamMood: mood || null,
          includeSimilar: false,
        },
      });

      if (error) throw error;
      setResult(data as InterpretationResult);
      notify.success("Rüyanız yorumlandı!");
    } catch (err) {
      captureError(err, { tags: { feature: "home-dream-input" } });
      notify.error("Yorumlama başarısız", {
        description: "AI yorumlama servisi şu anda kullanılamıyor.",
      });
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleTextSubmit = () => {
    if (!dreamText.trim()) return;
    interpretDream(dreamText);
  };

  const reset = () => {
    setResult(null);
    setDreamText("");
    setShowRecorder(false);
  };

  return (
    <section className="container px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Yapay Zeka Destekli
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Rüyanızı Yorumlayın
            </h2>
            <p className="text-sm text-muted-foreground">
              Rüyanızı anlatın veya sesli kaydedin, yapay zeka anında İslami ve psikolojik açıdan yorumlasın.
            </p>
          </div>

          {!showRecorder && !result ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    placeholder={isInterpreting ? "Yorumlanıyor..." : "Rüyanızı detaylıca anlatın..."}
                    rows={4}
                    className="resize-none pr-20"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                      onClick={() => setShowRecorder(true)}
                      title="Sesli kayıt"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!dreamText.trim() || isInterpreting}
                    className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                    size="lg"
                  >
                    {isInterpreting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yorumlanıyor...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Yorumla
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : showRecorder && !result ? (
            <div className="space-y-4">
              <VoiceDreamRecorder onSave={handleVoiceSave} />
              <Button variant="ghost" size="sm" onClick={() => setShowRecorder(false)} className="w-full">
                Metin girişine dön
              </Button>
            </div>
          ) : result ? (
            <InterpretationCard result={result} onReset={reset} />
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}

function InterpretationCard({ result, onReset }: { result: InterpretationResult; onReset: () => void }) {
  return (
    <Card className="p-6 space-y-5 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Rüya Yorumu</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
          Yeni Yorum
        </Button>
      </div>

      {result.general_meaning && (
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-sm font-semibold mb-1">Özet</p>
          <p className="text-sm text-muted-foreground">{result.general_meaning}</p>
        </div>
      )}

      <div className="grid gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">İslami Yorum</p>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-200/80 leading-relaxed">
            {result.islamic_interpretation}
          </p>
        </div>

        <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-4 border border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Psikolojik Yorum</p>
          </div>
          <p className="text-sm text-violet-700 dark:text-violet-200/80 leading-relaxed">
            {result.psychological_interpretation}
          </p>
        </div>
      </div>

      {result.keywords && result.keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">İlgili Anahtar Kelimeler</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
