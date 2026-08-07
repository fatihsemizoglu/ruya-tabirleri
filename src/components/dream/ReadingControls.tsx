import { Type, Rows3, Glasses, Sun, Volume2, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TextSize, LineSpacing } from '@/lib/dream-reading';

function TextSizeControls({ value, onChange }: { value: TextSize; onChange: (value: TextSize) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/45 bg-muted/30 p-1">
      <Type className="ml-2 h-4 w-4 text-muted-foreground" />
      {(['sm', 'base', 'lg'] as TextSize[]).map((size) => (
        <Button
          key={size}
          type="button"
          variant={value === size ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onChange(size)}
          aria-pressed={value === size}
        >
          {size === 'sm' ? 'A-' : size === 'lg' ? 'A+' : 'A'}
        </Button>
      ))}
    </div>
  );
}

interface ReadingControlsProps {
  textSize: TextSize;
  onTextSizeChange: (value: TextSize) => void;
  lineSpacing: LineSpacing;
  onLineSpacingChange: (value: LineSpacing) => void;
  isReadingMode: boolean;
  onToggleReadingMode: () => void;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  speechSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ReadingControls({
  textSize,
  onTextSizeChange,
  lineSpacing,
  onLineSpacingChange,
  isReadingMode,
  onToggleReadingMode,
  wakeLockActive,
  onToggleWakeLock,
  speechSupported,
  isSpeaking,
  isPaused,
  onSpeak,
  onPause,
  onResume,
  onStop,
}: ReadingControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <TextSizeControls value={textSize} onChange={onTextSizeChange} />
      <div className="flex items-center gap-1 rounded-xl border border-border/45 bg-muted/30 p-1">
        <Rows3 className="ml-2 h-4 w-4 text-muted-foreground" />
        {(['normal', 'relaxed', 'loose'] as LineSpacing[]).map((spacing) => (
          <Button key={spacing} type="button" variant={lineSpacing === spacing ? 'secondary' : 'ghost'} size="sm" onClick={() => onLineSpacingChange(spacing)} aria-pressed={lineSpacing === spacing}>
            {spacing === 'normal' ? 'Sık' : spacing === 'relaxed' ? 'Rahat' : 'Geniş'}
          </Button>
        ))}
      </div>
      <Button type="button" variant={isReadingMode ? 'default' : 'outline'} size="sm" onClick={onToggleReadingMode}>
        <Glasses className="mr-2 h-4 w-4" />
        Okuma Modu
      </Button>
      <Button type="button" variant={wakeLockActive ? 'secondary' : 'outline'} size="sm" onClick={onToggleWakeLock}>
        <Sun className="mr-2 h-4 w-4" />
        Ekranı Açık Tut
      </Button>
      {speechSupported && (
        <div className="flex items-center gap-1 rounded-xl border border-border/45 bg-muted/30 p-1">
          {!isSpeaking && !isPaused ? (
            <Button type="button" variant="outline" size="sm" onClick={onSpeak}>
              <Volume2 className="mr-2 h-4 w-4" />
              Dinle
            </Button>
          ) : isPaused ? (
            <Button type="button" variant="secondary" size="sm" onClick={onResume}>
              <Volume2 className="mr-2 h-4 w-4" />
              Devam
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={onPause}>
              <Pause className="mr-2 h-4 w-4" />
              Duraklat
            </Button>
          )}
          {(isSpeaking || isPaused) && (
            <Button type="button" variant="ghost" size="sm" onClick={onStop} aria-label="Sesli okumayı durdur">
              <Square className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
