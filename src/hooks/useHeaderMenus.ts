import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Header'ın tüm açılır/kapanır menü durumlarını ve kapatma mantığını yönetir.
 * Ayrıca menüler açıkken ilgili verinin (kategoriler/blog) yüklenip
 * yüklenmeyeceğini belirleyen bayrakları üretir.
 */
export function useHeaderMenus() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
  const [openBlogMega, setOpenBlogMega] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Sayfa değiştiğinde menüleri kapat
  useEffect(() => {
    setOpenCategoryMenu(false);
    setOpenBlogMega(false);
    setIsMenuOpen(false);
    setMobileCategoryOpen(false);
    setMobileBlogOpen(false);
  }, [location.pathname, location.search]);

  // Hover kapatma için zamanlayıcı
  const scheduleClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpenCategoryMenu(false);
      setOpenBlogMega(false);
    }, 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  // ESC ile kapatma
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenCategoryMenu(false);
        setOpenBlogMega(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const shouldLoadCategories = openCategoryMenu || mobileCategoryOpen || isMenuOpen || location.pathname === '/kategoriler' || location.pathname.startsWith('/kategori/');
  const shouldLoadBlogMenu = openBlogMega || mobileBlogOpen || location.pathname.startsWith('/blog');

  return {
    isMenuOpen,
    setIsMenuOpen,
    openCategoryMenu,
    setOpenCategoryMenu,
    openBlogMega,
    setOpenBlogMega,
    mobileCategoryOpen,
    setMobileCategoryOpen,
    mobileBlogOpen,
    setMobileBlogOpen,
    shouldLoadCategories,
    shouldLoadBlogMenu,
    scheduleClose,
    cancelClose,
  };
}
