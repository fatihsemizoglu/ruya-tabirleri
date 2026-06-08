import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Home, 
  BookOpen, 
  FolderOpen, 
  TrendingUp, 
  User,
  Moon,
  Sun,
  X,
  Command
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: 'home',
      title: 'Ana Sayfa',
      description: 'Ana sayfaya git',
      icon: <Home className="h-4 w-4" />,
      action: () => navigate('/'),
      category: 'Navigasyon',
    },
    {
      id: 'dreams',
      title: 'Rüya Tabirleri',
      description: 'Tüm rüya tabirlerini gör',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => navigate('/ruya-tabirleri'),
      category: 'Navigasyon',
    },
    {
      id: 'categories',
      title: 'Kategoriler',
      description: 'Kategorilere göz at',
      icon: <FolderOpen className="h-4 w-4" />,
      action: () => navigate('/kategoriler'),
      category: 'Navigasyon',
    },
    {
      id: 'popular',
      title: 'Popüler',
      description: 'En popüler tabirleri gör',
      icon: <TrendingUp className="h-4 w-4" />,
      action: () => navigate('/populer'),
      category: 'Navigasyon',
    },
    {
      id: 'search',
      title: 'Ara',
      description: 'Rüya tabiri ara',
      icon: <Search className="h-4 w-4" />,
      action: () => navigate('/ara'),
      category: 'Eylemler',
    },
    {
      id: 'profile',
      title: 'Profil',
      description: 'Profiline git',
      icon: <User className="h-4 w-4" />,
      action: () => navigate('/profil'),
      category: 'Eylemler',
    },
  ];

  const filteredCommands = commands.filter(
    cmd => 
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      setIsOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={handleKeyNavigation}
                  placeholder="Komut veya sayfa ara..."
                  className="border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Commands List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {Object.entries(groupedCommands).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {category}
                    </div>
                    {items.map((cmd, idx) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            setIsOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            globalIndex === selectedIndex
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <span className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            globalIndex === selectedIndex
                              ? "bg-primary-foreground/20"
                              : "bg-muted"
                          )}>
                            {cmd.icon}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{cmd.title}</div>
                            {cmd.description && (
                              <div className={cn(
                                "text-sm",
                                globalIndex === selectedIndex
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}>
                                {cmd.description}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
                
                {filteredCommands.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    Sonuç bulunamadı
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-muted px-1.5 py-0.5">↑↓</kbd>
                    gezin
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-muted px-1.5 py-0.5">↵</kbd>
                    seç
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-muted px-1.5 py-0.5">esc</kbd>
                  kapat
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
