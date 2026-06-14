import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback, useState } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, 
  AlignRight, Undo, Redo, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface DialogState {
  type: 'link' | 'image' | null;
  value: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'İçerik yazın...' }: RichTextEditorProps) {
  const [dialog, setDialog] = useState<DialogState>({ type: null, value: '' });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline hover:text-indigo-700',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    setDialog({ type: 'link', value: editor.getAttributes('link').href || '' });
  }, [editor]);

  const openImageDialog = useCallback(() => {
    if (!editor) return;
    setDialog({ type: 'image', value: '' });
  }, [editor]);

  const handleDialogConfirm = useCallback(() => {
    if (!editor) return;

    if (dialog.type === 'link') {
      if (dialog.value === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: dialog.value }).run();
      }
    } else if (dialog.type === 'image') {
      if (dialog.value) {
        editor.chain().focus().setImage({ src: dialog.value }).run();
      }
    }

    setDialog({ type: null, value: '' });
  }, [editor, dialog]);

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title,
    ariaLabel,
  }: { 
    onClick: () => void; 
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
    ariaLabel?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={cn(
        "p-2 rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="overflow-visible rounded-2xl border border-border/45 bg-card/90 text-card-foreground shadow-sm dark:border-white/10">
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-border/45 bg-card/95 p-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Geri Al"
            ariaLabel="Geri Al"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Yinele"
            ariaLabel="Yinele"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Başlık 1"
            ariaLabel="Başlık 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Başlık 2"
            ariaLabel="Başlık 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Başlık 3"
            ariaLabel="Başlık 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Kalın"
            ariaLabel="Kalın"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="İtalik"
            ariaLabel="İtalik"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Altı Çizili"
            ariaLabel="Altı Çizili"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Üstü Çizili"
            ariaLabel="Üstü Çizili"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Kod"
            ariaLabel="Kod"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Sola Hizala"
            ariaLabel="Sola Hizala"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Ortala"
            ariaLabel="Ortala"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Sağa Hizala"
            ariaLabel="Sağa Hizala"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Madde Listesi"
            ariaLabel="Madde Listesi"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numaralı Liste"
            ariaLabel="Numaralı Liste"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Alıntı"
            ariaLabel="Alıntı"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link & Image */}
          <ToolbarButton
            onClick={openLinkDialog}
            isActive={editor.isActive('link')}
            title="Link Ekle"
            ariaLabel="Link Ekle"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={openImageDialog}
            title="Görsel Ekle"
            ariaLabel="Görsel Ekle"
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Horizontal Rule */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Yatay Çizgi"
            ariaLabel="Yatay Çizgi"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} className="rounded-b-2xl bg-background/80 dark:bg-slate-950/40" />
      </div>

      {/* Link / Image Dialog */}
      <Dialog
        open={dialog.type !== null}
        onOpenChange={(open) => !open && setDialog({ type: null, value: '' })}
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-border/45 bg-card text-card-foreground dark:border-white/10 dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>
              {dialog.type === 'link' ? 'Link Ekle' : 'Görsel Ekle'}
            </DialogTitle>
          </DialogHeader>

          <Input
            autoFocus
            value={dialog.value}
            onChange={(e) => setDialog((prev) => ({ ...prev, value: e.target.value }))}
            placeholder={dialog.type === 'link' ? 'https://...' : 'Görsel URL\'si girin'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDialogConfirm();
              }
            }}
          />

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">İptal</Button>
            </DialogClose>
            <Button onClick={handleDialogConfirm}>
              {dialog.type === 'link' && dialog.value === '' ? 'Linki Kaldır' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
