import { Sparkles, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DreamWidgetProps {
  dream?: {
    id: string;
    title: string;
    interpretation: string;
    category_name?: string;
  };
  onRandom?: () => void;
}

export function DreamOfTheDay({ dream, onRandom }: DreamWidgetProps) {
  if (!dream) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Günün Rüyası
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link to={`/ruya/${dream.id}`} className="font-semibold hover:underline">
          {dream.title}
        </Link>
        {dream.category_name && (
          <span className="text-sm text-muted-foreground ml-2">{dream.category_name}</span>
        )}
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {dream.interpretation}
        </p>
      </CardContent>
    </Card>
  );
}

export function RandomDreamButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" className="gap-2" onClick={onClick}>
      <Shuffle className="h-4 w-4" />
      Rastgele Rüya
    </Button>
  );
}