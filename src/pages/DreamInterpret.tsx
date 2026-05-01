import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Brain, Loader2, Star, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/ui/page-transition';
import { fetchApi } from '@/lib/api';
import { VoiceRecorder } from '@/components/dream/VoiceRecorder';

interface InterpretationResult {
  islamic_interpretation: string;
  psychological_interpretation: string;
  symbols: { name: string; meaning: string }[];
  overall_mood: string;
  advice: string;
}

export default function DreamInterpret() {
  const [dream, setDream] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InterpretationResult | null>(null);

  const handleInterpret = async () => {
    if (dream.trim().length < 10) {
      toast.error('Lütfen rüyanızı en az 10 karakter ile açıklayın.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetchApi<InterpretationResult>('/ai/interpret-dream', {
        method: 'POST',
        body: JSON.stringify({ dream: dream.trim() }),
      });

      if (!response.success) {
        const message = response.error || 'Rüya yorumlanırken bir hata oluştu.';
        toast.error(message);
        return;
      }

      if (response.data) {
        setResult(response.data);
      }
    } catch {
      toast.error('Bağlantı hatası oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDream('');
    setResult(null);
  };

  const moodLabel: Record<string, { text: string; color: string }> = {
    olumlu: { text: '😊 Olumlu', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    olumsuz: { text: '😟 Olumsuz', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    nötr: { text: '😐 Nötr', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
    karışık: { text: '🤔 Karışık', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  };

  return (
    <Layout>
      <PageTransition>
        <div className="container max-w-4xl py-8 md:py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200/50 dark:border-indigo-800/50 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">AI Destekli Rüya Tabiri</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Rüyanızı Yorumlatalım
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gördüğünüz rüyayı detaylı bir şekilde anlatın, yapay zeka hem İslami hem de psikolojik perspektiften yorumlasın.
            </p>
          </div>

          {/* Input */}
          <Card className="mb-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50">
            <CardContent className="p-6">
              <Textarea
                value={dream}
                onChange={(e) => setDream(e.target.value)}
                placeholder="Rüyanızı buraya yazın... Örn: Gece karanlık bir ormanda yürüyordum. Uzakta bir ışık gördüm ve ona doğru koştum..."
                className="min-h-[150px] text-base border-0 shadow-none focus-visible:ring-0 resize-none p-0"
                disabled={isLoading}
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <VoiceRecorder onTranscript={(text) => setDream(prev => (prev + ' ' + text).trim())} />
                  <span className="text-xs text-muted-foreground">{dream.length}/2000 karakter</span>
                </div>
                <div className="flex gap-2">
                  {result && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="rounded-lg">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Yeni Rüya
                    </Button>
                  )}
                  <Button
                    onClick={handleInterpret}
                    disabled={isLoading || dream.trim().length < 10}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yorumlanıyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Yorumlat
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Rüyanız analiz ediliyor...</h3>
                <p className="text-muted-foreground text-sm">İslami ve psikolojik perspektiflerden yorumlanıyor</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Mood & Advice */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {result.overall_mood && (
                    <Card className="flex-1">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rüya Tonu</p>
                          <Badge className={moodLabel[result.overall_mood]?.color || moodLabel.nötr.color}>
                            {moodLabel[result.overall_mood]?.text || result.overall_mood}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {result.advice && (
                    <Card className="flex-[2]">
                      <CardContent className="p-4 flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tavsiye</p>
                          <p className="text-sm text-foreground">{result.advice}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Symbols */}
                {result.symbols && result.symbols.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Rüyadaki Semboller
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.symbols.map((symbol, i) => (
                          <div
                            key={i}
                            className="group relative px-3 py-2 rounded-lg bg-muted hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-default"
                          >
                            <span className="text-sm font-medium text-foreground">{symbol.name}</span>
                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs max-w-[200px] text-center z-10 shadow-lg">
                              {symbol.meaning}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interpretations Tabs */}
                <Tabs defaultValue="islamic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
                    <TabsTrigger value="islamic" className="rounded-lg flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      İslami Yorum
                    </TabsTrigger>
                    <TabsTrigger value="psychological" className="rounded-lg flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Psikolojik Yorum
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="islamic">
                    <Card>
                      <CardContent className="p-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {result.islamic_interpretation.split('\n').map((p, i) => (
                            p.trim() ? <p key={i}>{p}</p> : null
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="psychological">
                    <Card>
                      <CardContent className="p-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {result.psychological_interpretation.split('\n').map((p, i) => (
                            p.trim() ? <p key={i}>{p}</p> : null
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Disclaimer */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Bu yorumlar yapay zeka tarafından üretilmiştir ve bilgilendirme amaçlıdır. Kesin bir tabir olarak değerlendirilmemelidir.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageTransition>
    </Layout>
  );
}
