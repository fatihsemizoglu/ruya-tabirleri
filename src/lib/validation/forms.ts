import { z } from 'zod';

export const commentContentSchema = z
  .string()
  .trim()
  .min(10, 'Yorum en az 10 karakter olmalıdır')
  .max(1000, 'Yorum en fazla 1000 karakter olabilir');

export const guestCommentSchema = z.object({
  name: z.string().trim().min(2, 'Ad Soyad en az 2 karakter olmalıdır').max(100, 'Ad Soyad en fazla 100 karakter olabilir'),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin').max(200, 'E-posta en fazla 200 karakter olabilir'),
  content: commentContentSchema,
});

export const memberCommentSchema = z.object({
  content: commentContentSchema,
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Adınız en az 2 karakter olmalıdır').max(100, 'Adınız en fazla 100 karakter olabilir'),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi girin').max(200, 'E-posta en fazla 200 karakter olabilir'),
  reason: z.enum(['genel', 'oneri', 'hata', 'isbirligi']),
  subject: z.string().trim().min(3, 'Başlık en az 3 karakter olmalıdır').max(150, 'Başlık en fazla 150 karakter olabilir'),
  message: z.string().trim().min(10, 'Mesaj en az 10 karakter olmalıdır').max(1000, 'Mesaj en fazla 1000 karakter olabilir'),
});

export function getFirstValidationMessage(error: z.ZodError): string {
  return error.errors[0]?.message || 'Lütfen form alanlarını kontrol edin.';
}
