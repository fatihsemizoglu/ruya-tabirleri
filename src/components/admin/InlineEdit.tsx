import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'number';
  className?: string;
}

export function InlineEdit({ value, onSave, type = 'text', className }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`h-8 w-32 ${className}`}
        />
        <button onClick={handleSave} className="p-1 hover:text-green-500">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-1 hover:text-red-500">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`hover:bg-muted px-2 py-1 rounded text-left ${className}`}
    >
      {value || '-'}
    </button>
  );
}