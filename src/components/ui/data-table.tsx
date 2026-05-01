import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, Pencil, Trash2, Eye, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Checkbox } from './checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getId: (item: T) => string;
  selection?: ReturnType<typeof import('@/hooks/useCRUD').useSelection<T>>;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  actions?: { label: string; icon?: React.ReactNode; onClick: (item: T) => void; variant?: 'default' | 'destructive' }[];
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  getId,
  selection,
  onEdit,
  onDelete,
  onView,
  page = 1,
  totalPages = 1,
  onPageChange,
  isLoading,
  actions,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {selection && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={selection.isAllSelected}
                    onCheckedChange={() => selection.selectAll()}
                  />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key as string} className={cn('px-4 py-3 text-left text-sm font-medium', col.className)}>
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete || onView || actions) && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (selection ? 2 : 1)} className="h-48 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 2 : 1)} className="h-48 text-center text-muted-foreground">
                  Veri bulunamadı
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr key={getId(item)} className="hover:bg-muted/50">
                  {selection && (
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selection.isSelected(getId(item))}
                        onCheckedChange={() => selection.toggle(getId(item))}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key as string} className={cn('px-4 py-3 text-sm', col.className)}>
                      {col.cell ? col.cell(item) : String((item as any)[col.key as string] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView || actions) && (
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                          {actions?.map(action => (
                            <DropdownMenuItem key={action.label} onClick={() => action.onClick(item)}>
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onPageChange(1)} disabled={page === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}