# 🔧 REFACTORING GUIDE - ADIM ADIM UYGULAMA

Bu dokument duplicate AuthProvider problemini çözmek ve kod yapısını iyileştirmek için adım adım talimatlar içerir.

---

## 📋 ÖN KOŞUL

```bash
# Repository'nin güncel backup'ını al
git status  # Eğer git kullanıyorsan
```

---

## ADIM 1: Mevcut Durumu Kontrol Et

### 1.1 - useAuth.tsx'i İncelemeye Başla

**Dosya**: `src/hooks/useAuth.tsx`

```typescript
// BURADA AuthProvider VE useAuth hook'u beraber tanımlanmış
export function AuthProvider({ children }: { children: ReactNode }) {
  // ... 143 satır implementation
}

export function useAuth(): AuthContextType {
  // ... hook implementation
}
```

### 1.2 - AuthProvider.tsx'i İncelemeye Başla

**Dosya**: `src/contexts/AuthProvider.tsx`

```typescript
// DUPLICATE: Aynı şey burada da var
export function AuthProvider({ children }: { children: ReactNode }) {
  // ... 100+ satır implementation (FARKLI pattern)
}
```

### 1.3 - Farkları Analiz Et

```diff
// useAuth.tsx (aktif, DEFERRED pattern):
if (session?.user) {
  setTimeout(() => {
    fetchUserData(session.user.id);  // Deferred
  }, 0);
}

// AuthProvider.tsx (eski, SEQUENTIAL pattern):
if (session?.user) {
  fetchProfile(session.user.id);     // Immediate
  fetchRoles(session.user.id);       // Immediate
}
```

---

## ADIM 2: AuthProvider.tsx'i Geliştirilmiş Deferred Pattern ile Güncelleyin

### 2.1 - Dosyayı Açın

```bash
src/contexts/AuthProvider.tsx
```

### 2.2 - Deferred Fetch Pattern'i Uygulayın

```typescript
// Aşağıdaki kodu AuthProvider.tsx'e ekleyin (veya useAuth.tsx'ten kopyalayın):

useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Defer profile/roles fetch to avoid deadlock (ÖNEMLİ!)
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);  // Deferred
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
      }
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    // ... rest of implementation
  });
});
```

---

## ADIM 3: useAuth.tsx'i Silin

```bash
# Terminal'de çalıştır:
rm src/hooks/useAuth.tsx
```

### Veya manual olarak:
1. VS Code'da `src/hooks/useAuth.tsx` açın
2. Dosyayı sağ tıklayıp Delete'i seçin

---

## ADIM 4: useAuth.ts Hook'u Güncelleyin

**Dosya**: `src/hooks/useAuth.ts`

```typescript
// Güncellenmiş versiyon:
import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/contexts/auth-context';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## ADIM 5: Barrel Export Oluşturun

### 5.1 - Yeni dosya oluşturun: `src/hooks/index.ts`

```typescript
// src/hooks/index.ts
export { useAuth } from './useAuth';
export { useToast, type Toast, type ToastActionElement } from './use-toast';
export { useMobile } from './use-mobile';
export { useAuditLog } from './useAuditLog';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { usePWA } from './usePWA';
export { useSearchAutocomplete } from './useSearchAutocomplete';
export { useSelection } from './useSelection';
```

---

## ADIM 6: Tüm useAuth Import'larını Güncelle

### 6.1 - Eski import'ları bulun:

```bash
# Terminal'de arama yap:
grep -r "from.*useAuth" src/
```

### 6.2 - Bulduğunuz dosyalarda güncelle:

```typescript
// ESKI (Silinmesi gereken):
import { useAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth.tsx";

// YENİ (Kullanılacak):
import { useAuth } from "@/hooks";
// veya
import { useAuth } from "@/hooks/useAuth";  // ✅ Hâlâ çalışır
```

### 6.3 - Tüm hook import'larını barrel export kullan:

```typescript
// ESKI (Dağınık):
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";

// YENİ (Temiz):
import { useAuth, useToast, useMobile } from "@/hooks";
```

---

## ADIM 7: AuthProvider Import'larını Kontrol Et

### 7.1 - App.tsx'i Kontrol Et

```typescript
// src/App.tsx Line 7
import { AuthProvider } from "@/contexts/AuthProvider";  // ✅ Doğru
```

### 7.2 - Başka AuthProvider import'ları varsa:

```bash
grep -r "AuthProvider" src/
```

Bulunan tüm dosyalarda:
```typescript
// Tüm import'lar şöyle olmalı:
import { AuthProvider } from "@/contexts/AuthProvider";
```

---

## ADIM 8: Test Et

### 8.1 - Build'i çalıştır:

```bash
npm run build
```

**Beklenen Çıktı**:
```
✓ built in 8.XX seconds

PWA v1.2.0
mode      generateSW
files generated
```

### 8.2 - Hata yoksa Başarılı! 🎉

```bash
npm run dev  # Local test için
```

---

## ADIM 9: Git Commit Et (Eğer Git kullanıyorsan)

```bash
git add -A
git commit -m "refactor: consolidate AuthProvider and hooks structure

- Remove duplicate AuthProvider from src/hooks/useAuth.tsx
- Improve deferred fetch pattern in src/contexts/AuthProvider.tsx
- Create barrel export at src/hooks/index.ts
- Update imports across project
- Fix: AuthProvider now properly imported from contexts/
"
```

---

## 🧪 VERIFICATION CHECKLIST

```
[ ] npm run build başarıyla tamamlanıyor
[ ] Build sonunda PWA files generated görülüyor
[ ] dist/ klasörü oluşmuş
[ ] No import errors in output
[ ] App.tsx yükleniyor
[ ] AuthProvider component proper export ediliyor
[ ] useAuth hook proper export ediliyor
[ ] Barrel exports (src/hooks/index.ts) çalışıyor
[ ] Tüm hook import'ları güncellenmiş
[ ] TypeScript hataları yok (tsc check)
```

---

## 🚨 SORUN GIDERİME

### Problem: "AuthProvider not exported"

```bash
# Kontrol et:
ls -la src/contexts/  # AuthProvider.tsx var mı?
grep "export.*AuthProvider" src/contexts/AuthProvider.tsx  # Export ediliyor mu?
```

### Problem: "Cannot find module '@/hooks'"

```bash
# Kontrol et:
ls -la src/hooks/index.ts  # Dosya var mı?
cat src/hooks/index.ts  # İçerik doğru mu?
```

### Problem: "useAuth hook not found"

```bash
# Kontrol et:
grep "export.*useAuth" src/hooks/useAuth.ts  # Export ediliyor mu?
npm run build 2>&1 | head -50  # Hata nerede?
```

---

## 📊 Sonrası Folder Structure

```
src/
├─ contexts/
│  ├─ auth-context.ts          ← Context definition
│  └─ AuthProvider.tsx         ← Provider component (improved)
│
├─ hooks/
│  ├─ index.ts                 ← NEW: Barrel export
│  ├─ useAuth.ts               ← Hook wrapper
│  ├─ use-mobile.tsx
│  ├─ use-toast.ts
│  ├─ useAuditLog.ts
│  ├─ useInfiniteScroll.ts
│  ├─ useKeyboardShortcuts.ts
│  ├─ usePWA.ts
│  ├─ useSearchAutocomplete.ts
│  └─ useSelection.ts
│
├─ components/
├─ pages/
├─ types/
└─ App.tsx  (✅ FIXED)
```

---

## ✅ REFACTORING COMPLETED

Quando tamamladığınızda:
1. Duplicate kod yok ✅
2. Import paths konsisten ✅
3. Hook exports merkezi ✅
4. Build hatası yok ✅
5. Code maintainability artmış ✅

---

**Son Durum**: Ready for implementation  
**Zaman Tahmini**: ~15-20 dakika  
**Risk Seviyesi**: Düşük (sadece refactoring, fonksiyon değişikliği yok)
