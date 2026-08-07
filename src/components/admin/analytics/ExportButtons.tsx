import { Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  onCsv: () => void;
  onPdf: () => void;
}

export function ExportButtons({ onCsv, onPdf }: ExportButtonsProps) {
  return (
    <>
      <Button variant="outline" size="sm" onClick={onCsv}>
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onPdf}>
        <FileDown className="w-4 h-4 mr-2" />
        PDF
      </Button>
    </>
  );
}
