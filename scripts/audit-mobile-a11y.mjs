/**
 * Mobil dokunma hedefi (44px+) ve erişilebilirlik denetim betiği.
 *
 * TypeScript compiler API ile src altındaki tüm .tsx dosyalarını (sayfalar + bileşenler)
 * AST olarak ayrıştırır ve aşağıdaki sorunları raporlar:
 *
 *   [dokunma]
 *     - Açık boyut (h-*, min-h-*, size-*) 44px altında olan etkileşimli öğeler
 *     - Yalnızca padding ile küçük kalan hedefler (tahmini boyut)
 *     - Hiçbir boyut/aralık sınıfı olmayan ikon-butonlar
 *     - input/select/textarea öğeleri (global 48px kuralının kapsamadığı alanlar)
 *
 *   [erişilebilirlik]
 *     - Görünür adı olmayan buton/link (yalnızca ikon, aria-label/title/metin yok)
 *     - href'siz veya yer tutucu (#) href'li linkler
 *     - alt metni olmayan <img> öğeleri
 *     - Etiketi olmayan form kontrolleri (aria-label / aria-labelledby / label[for])
 *     - Form içinde type belirtilmemiş butonlar (yanlışlıkla submit olabilir)
 *     - aria-hidden="true" içindeki odaklanabilir öğeler
 *     - onClick'li ama role/tabIndex'siz statik öğeler (klavye erişimi yok)
 *     - Proje genelinde yinelenen id'ler
 *
 * Notlar:
 *   - index.css'teki "@media (hover:none) and (pointer:coarse)" kuralı dokunmatik
 *     cihazlarda button/a/[role=button]/[tabindex] öğelerini 48px'e yükseltir;
 *     bu yüzden 24-43px arası buton/link'ler "uyarı" (warning), 24px altı ve
 *     form kontrolleri "hata" (error) seviyesinde raporlanır.
 *   - Bilinçli olarak küçük bırakılan yoğun ızgaralar (alfabe vb.) için öğeye
 *     data-audit-ignore özniteliği eklenerek denetimden muaf tutulabilir.
 *   - eslint-plugin-jsx-a11y'nin kapsadığı kurallar (alt-text, anchor-is-valid,
 *     role-*, tabindex-no-positive vb.) burada tekrarlanmaz; script bunların
 *     DIŞINDA kalan ek kontrolleri yapar.
 *
 * Kullanım:
 *   node scripts/audit-mobile-a11y.mjs
 *   node scripts/audit-mobile-a11y.mjs --strict        # uyarılar da exit 1 yapar
 *   node scripts/audit-mobile-a11y.mjs --min 48        # eşiği değiştirir (varsayılan 44)
 *   node scripts/audit-mobile-a11y.mjs --dir src/pages # alt dizini tarar
 *   node scripts/audit-mobile-a11y.mjs --json          # makine-okunur JSON çıktısı
 *
 * Çıkış kodu: hata varsa 1, yoksa 0 (--strict ile uyarılar da 1 yapar).
 */

import ts from 'typescript';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_MIN = 44; // WCAG 2.5.5
const ERROR_MIN = 24; // WCAG 2.5.8 (fine pointer minimum)

/* ───────────────────────── CLI argümanları ───────────────────────── */

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dir: path.join(ROOT, 'src'), min: DEFAULT_MIN, strict: false, json: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--strict') opts.strict = true;
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--min') opts.min = Number.parseInt(args[++i] ?? '', 10) || DEFAULT_MIN;
    else if (args[i] === '--dir') opts.dir = path.resolve(ROOT, args[++i] ?? 'src');
  }
  return opts;
}

/* ───────────────────────── Tailwind spacing (px) ───────────────────────── */

// tailwind.config.ts'teki özel değerler (4.5, 13, 14.5 ...) dahil tam ölçek.
const SPACING = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14, '4': 16, '4.5': 18,
  '5': 20, '5.5': 22, '6': 24, '6.5': 26, '7': 28, '7.5': 30, '8': 32, '8.5': 34, '9': 36, '9.5': 38,
  '10': 40, '10.5': 42, '11': 44, '11.5': 46, '12': 48, '12.5': 50, '13': 52, '14': 56, '14.5': 58,
  '15': 60, '15.5': 62, '16': 64, '16.5': 66, '18': 72, '18.5': 74, '20': 80, '20.5': 82, '22': 88,
  '22.5': 90, '24': 96, '24.5': 98, '25': 100, '26': 104, '26.5': 106, '28': 112, '30': 120,
  '30.5': 122, '32': 128, '36': 144, '40': 160, '44': 176, '48': 192, '52': 208, '56': 224,
  '60': 240, '64': 256, '72': 288, '80': 320, '96': 384,
};

/* ───────────────────────── Bileşen → öğe eşlemesi ───────────────────────── */

// shadcn/Radix bileşenlerinin render ettiği gerçek HTML öğeleri.
// Görünür ad denetimini tetikleyen bileşenler yalnızca "ad alması gerekenler".
const COMPONENT_TO_TAG = {
  Button: 'button',
  Link: 'a',
  NavLink: 'a',
  Input: 'input',
  Textarea: 'textarea',
  SelectTrigger: 'button',
  DialogTrigger: 'button',
  AlertDialogTrigger: 'button',
  DropdownMenuTrigger: 'button',
  PopoverTrigger: 'button',
  SheetTrigger: 'button',
  DrawerTrigger: 'button',
  CollapsibleTrigger: 'button',
  AccordionTrigger: 'button',
  TabsTrigger: 'button',
  TooltipTrigger: 'button',
  MenubarTrigger: 'button',
};

// Button cva'sındaki size varyantlarının taban sınıfları (src/components/ui/button.tsx).
const BUTTON_SIZE_CLASSES = {
  default: 'h-11 px-4 py-2',
  sm: 'h-11 px-3',
  lg: 'h-12 px-8',
  icon: 'h-11 w-11',
};

const NATIVE_INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'tab', 'menuitem', 'checkbox', 'switch', 'radio', 'option', 'slider', 'textbox', 'combobox']);
const FORM_CONTROLS = new Set(['input', 'select', 'textarea']);
const STATIC_TAGS = new Set(['div', 'span', 'li', 'ul', 'ol', 'section', 'p', 'td', 'tr', 'table', 'figure', 'main', 'aside', 'article', 'header', 'footer', 'nav', 'label', 'i', 'b', 'strong', 'em', 'svg', 'video']);

/* ───────────────────────── AST yardımcıları ───────────────────────── */

function extractText(node) {
  if (!node) return null;
  // JSX öznitelik başlatıcıları {expr} → JsxExpression sarmalayıcıdır; aç ve içini çöz.
  if (ts.isJsxExpression(node)) return extractText(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map((s) => extractText(s.expression) ?? '').join('');
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return `${extractText(node.left) ?? ''}${extractText(node.right) ?? ''}`;
  }
  if (ts.isCallExpression(node)) {
    const fn = node.expression.getText();
    // cn(...) / clsx(...) / twMerge(...) — dize argümanlarını topla
    if (['cn', 'clsx', 'twMerge', 'cx'].includes(fn)) {
      return node.arguments.map((a) => extractText(a)).filter(Boolean).join(' ');
    }
    return null;
  }
  if (ts.isParenthesizedExpression(node)) return extractText(node.expression);
  if (ts.isConditionalExpression(node)) {
    return [extractText(node.whenTrue), extractText(node.whenFalse)].filter(Boolean).join(' ');
  }
  if (ts.isAsExpression(node)) return extractText(node.expression);
  return null;
}

function readAttributes(node) {
  // JsxElement'te öznitelikler openingElement üzerindedir; self-closing'de doğrudan.
  const attrsNode = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
  const attrs = new Map();
  for (const prop of attrsNode.properties) {
    if (!ts.isJsxAttribute(prop)) continue; // yayılma (spread) — atlanır
    const name = prop.name.getText();
    let value;
    if (prop.initializer) {
      value = extractText(prop.initializer);
      if (value === null) value = true; // ifade (örn. {open}) — varlık bilgisi yeterli
    } else {
      value = true; // çıplak öznitelik
    }
    attrs.set(name, value);
  }
  return attrs;
}

function collectText(node, localTextRenderers) {
  let out = '';
  const visit = (n) => {
    if (ts.isJsxText(n)) {
      out += n.text;
    } else if (ts.isJsxExpression(n)) {
      // t('...') çeviri çağrıları, {item.title} gibi değişkenler ve koşullu
      // ifadeler çalışma zamanında metin üretir — ifade kaynağını metin say.
      const e = n.expression;
      if (e && ts.isJsxElement(e)) return; // iç içe JSX (bileşen) — metin sayma
      out += e ? e.getText() : '';
    } else if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = (ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName).getText();
      if (/^[A-Z]/.test(tag)) {
        // Yerel bir "metin-bileşeni" ise (ör. <CardInner/>) metin ürettiğini varsay —
        // <a><CardInner/></a> gibi sarmalayıcılarda yanlış "adı yok" hatasını önler.
        // Not: self-closing (<CardInner ... />) öğeler de ts.isJsxElement değildir;
        // her iki düğüm türü de ele alınır.
        if (localTextRenderers.has(tag)) out += ' component-text ';
        return;
      }
      if (ts.isJsxElement(n)) n.children.forEach(visit);
    } else if (ts.isJsxFragment(n)) {
      n.children.forEach(visit);
    }
  };
  node.children?.forEach(visit);
  return out.replace(/\s+/g, ' ').trim();
}

/* ───────────────────────── Dokunma hedefi analizi ───────────────────────── */

function isVisuallyHidden(classes) {
  return /(^|\s)(sr-only|pointer-events-none|hidden|invisible)(\s|$)/.test(classes);
}

function parseSizeTokens(classes) {
  // dönüş: { heights: [{cls, px}], widths: [...], paddingY: px, paddingX: px }
  const heights = [];
  const widths = [];
  let paddingY = 0;
  let paddingYCls = '';
  let paddingX = 0;
  for (const tok of classes.split(/\s+/).filter(Boolean)) {
    if (!tok.includes(':')) {
      let m = tok.match(/^(h|min-h|size)-(\d+(?:\.\d+)?)$/);
      if (m && SPACING[m[2]] != null) heights.push({ cls: tok, px: SPACING[m[2]] });
      m = tok.match(/^(w|min-w|size)-(\d+(?:\.\d+)?)$/);
      if (m && SPACING[m[2]] != null) widths.push({ cls: tok, px: SPACING[m[2]] });
      // Not: p-/py-/px- regex'lerinde TEK yakalama grubu vardır → m[1] kullanılır
      // (h-/w- regex'lerinde iki grup olduğu için m[2] doğruydu).
      m = tok.match(/^p-(\d+(?:\.\d+)?)$/);
      if (m && SPACING[m[1]] != null && SPACING[m[1]] > paddingY) { paddingY = SPACING[m[1]]; paddingYCls = tok; paddingX = Math.max(paddingX, SPACING[m[1]]); }
      m = tok.match(/^py-(\d+(?:\.\d+)?)$/);
      if (m && SPACING[m[1]] != null && SPACING[m[1]] > paddingY) { paddingY = SPACING[m[1]]; paddingYCls = tok; }
      m = tok.match(/^px-(\d+(?:\.\d+)?)$/);
      if (m && SPACING[m[1]] != null) paddingX = Math.max(paddingX, SPACING[m[1]]);
    }
    // Varyantlı (sm:h-9 vb.) sınıflar bilinçli olarak atlanır: mobil-öncelikli
    // eşik için temel (varyantsız) değer esastır ve varyantlar mobilde
    // uygulanmayabilir. (Varyantları çözmek breakpoint bağlamı gerektirir.)
  }
  return { heights, widths, paddingY, paddingYCls, paddingX };
}

function touchTargetIssue(classes, hasText, isFormControl, isMapped, min) {
  if (!classes || isVisuallyHidden(classes)) return null;
  // inset-0 (veya inset-x-0 + inset-y-0): öğe tüm ekranı kaplayan katmandır
  // (modal arka planı vb.) — dev boyutlu hedef, "boyut tanımsız" sayılmaz.
  if (/(^|\s)inset-0(\s|$)/.test(classes) || (/(^|\s)inset-x-0(\s|$)/.test(classes) && /(^|\s)inset-y-0(\s|$)/.test(classes))) {
    return null;
  }
  const { heights, widths, paddingY, paddingYCls, paddingX } = parseSizeTokens(classes);

  let minHeight = null;
  let minHeightCls = null;
  if (heights.length > 0) {
    const smallest = heights.reduce((a, b) => (b.px < a.px ? b : a));
    minHeight = smallest.px;
    minHeightCls = smallest.cls;
  }

  // 1) Açık yükseklik var mı?
  if (minHeight != null) {
    if (minHeight < ERROR_MIN) {
      return { level: 'error', message: `Dokunma hedefi çok küçük: ${minHeightCls} (${minHeight}px) < ${ERROR_MIN}px` };
    }
    if (minHeight < min) {
      return { level: 'warning', message: `Dokunma hedefi küçük: ${minHeightCls} (${minHeight}px) < ${min}px` };
    }
    // Genişlik kontrolü: yalnızca çok dar hedefler için
    if (widths.length > 0) {
      const smallestW = widths.reduce((a, b) => (b.px < a.px ? b : a));
      if (smallestW.px < ERROR_MIN) {
        return { level: 'error', message: `Dokunma hedefi çok dar: ${smallestW.cls} (${smallestW.px}px) < ${ERROR_MIN}px` };
      }
    }
    return null;
  }

  // 2) Form kontrolleri: global 48px kuralı kapsamaz. Boyut yoksa bileşenin
  //    varsayılanına (örn. Input h-10) güvenilir — bilgi seviyesinde not.
  if (isFormControl) {
    return { level: 'info', message: 'Form kontrolünde açık boyut yok (bileşen varsayılanına güveniliyor)' };
  }

  // 3) Padding tahmini: py*2 + içerik yüksekliği (~20px metin/ikon)
  if (paddingY > 0) {
    const estimate = paddingY * 2 + 20;
    const cls = paddingYCls || `p-${paddingY / 4}`;
    if (estimate < ERROR_MIN) {
      return { level: 'warning', message: `Dokunma hedefi tahmini çok küçük: ${cls} (≈${estimate}px)` };
    }
    if (estimate < min) {
      return { level: 'warning', message: `Dokunma hedefi tahmini küçük: ${cls} (≈${estimate}px) < ${min}px` };
    }
    return null;
  }

  // 4) Hiçbir boyut bilgisi yok
  if (hasText) {
    return { level: 'info', message: 'Satır içi metin öğesi — boyut belirsiz (inline link varsayıldı)' };
  }
  if (isMapped) {
    // Bileşen (Button, TabsTrigger vb.): boyut bileşen tanımında (ayrıca taranır)
    return { level: 'info', message: 'Bileşen içi boyut — kullanım yerinde boyut sınıfı yok (bileşen tanımında)' };
  }
  return { level: 'error', message: 'Dokunma hedefi boyutu tanımsız (h-*/min-h-*/p-* sınıfı yok)' };
}

/* ───────────────────────── Ana denetim döngüsü ───────────────────────── */

function auditFile(filePath, opts, labelIds) {
  const content = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];

  // Dosya içinde tanımlanıp JSX'te metin/ifade döndüren yerel bileşenler
  // (ör. <CardInner/>) — alt bileşen çağrısı görünür ad üretiyorsa yanlış
  // "adı yok" hatasını önlemek için bu kümeye eklenir.
  const localTextRenderers = new Set();
  for (const stmt of sourceFile.statements) {
    let name = null;
    let body = null;
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      name = stmt.name.getText();
      body = stmt.body;
    } else if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        const init = decl.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          name = decl.name.getText();
          body = init.body;
          break;
        }
      }
    }
    if (!name || !body) continue;
    let rendersText = false;
    const probe = (n) => {
      if (rendersText) return;
      if (ts.isJsxText(n)) { rendersText = true; return; }
      if (ts.isJsxExpression(n) && n.expression && !ts.isJsxElement(n.expression)) { rendersText = true; return; }
      ts.forEachChild(n, probe);
    };
    probe(body);
    if (rendersText) localTextRenderers.add(name);
  }

  const lineOf = (node) => sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  const analyzeJsx = (node, ctx) => {
    const tagName = (ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName).getText();
    const attrs = readAttributes(node);
    const className = attrs.get('className');
    const children = ts.isJsxElement(node) ? [...node.children] : [];
    const text = collectText(node, localTextRenderers);
    const line = lineOf(node);

    if (attrs.has('data-audit-ignore')) return; // bilinçli muafiyet
    if (isVisuallyHidden(String(className ?? ''))) return;

    // asChild (Slot): gerçek öğe alt bileşendir — Button düğümünü denetleme,
    // alt bileşen (örn. Link) kendi düğümünde ayrıca denetlenir.
    if (tagName === 'Button' && attrs.has('asChild')) {
      const nextCtx = {
        inForm: ctx.inForm || tagName === 'form',
        ariaHidden: ctx.ariaHidden + (String(attrs.get('aria-hidden')) === 'true' ? 1 : 0),
      };
      children.forEach((child) => descend(child, nextCtx));
      return;
    }

    const isMapped = COMPONENT_TO_TAG[tagName] != null;
    const resolvedTag = COMPONENT_TO_TAG[tagName] ?? (NATIVE_INTERACTIVE.has(tagName) ? tagName : null);
    const role = attrs.get('role') ? String(attrs.get('role')) : null;
    const isInteractive = resolvedTag != null || (role && INTERACTIVE_ROLES.has(role)) || attrs.has('tabIndex') || attrs.has('onClick') || attrs.has('onKeyDown');

    let mergedClasses = String(className ?? '');
    if (tagName === 'Button' && attrs.has('size')) {
      const sizeCls = BUTTON_SIZE_CLASSES[String(attrs.get('size'))];
      if (sizeCls) mergedClasses = `${mergedClasses} ${sizeCls}`;
    }

    if (isInteractive) {
      // --- dokunma hedefi ---
      if (!isVisuallyHidden(mergedClasses)) {
        const issue = touchTargetIssue(mergedClasses, text.length > 0, FORM_CONTROLS.has(resolvedTag ?? ''), isMapped, opts.min);
        if (issue) issues.push({ file: filePath, line, tag: tagName, level: issue.level, message: issue.message, classes: mergedClasses });
      }

      // --- erişilebilirlik: ad ---
      // asChild Trigger'lar (örn. DropdownMenuTrigger asChild) adı alt bileşenden
      // alır; çift raporlamayı önlemek için Trigger düğümünde ad denetimi yapılmaz.
      const isAsChildTrigger = resolvedTag === 'button' && tagName.endsWith('Trigger') && attrs.has('asChild');
      // SelectTrigger içinde SelectValue seçili değeri/yer tutucuyu metin olarak basar.
      const NAME_CHECK_EXEMPT = new Set(['SelectTrigger']);
      if ((resolvedTag === 'button' || resolvedTag === 'a') && !isAsChildTrigger && !NAME_CHECK_EXEMPT.has(tagName)) {
        const hasName = attrs.has('aria-label') || attrs.has('aria-labelledby') || attrs.has('title');
        if (!hasName && text.length === 0) {
          issues.push({ file: filePath, line, tag: tagName, level: 'error', message: `Görünür adı yok (aria-label/title/metin yok) — ikon-buton/link`, classes: mergedClasses });
        }
      }

      // --- link href ---
      if (tagName === 'a') {
        if (!attrs.has('href')) {
          issues.push({ file: filePath, line, tag: tagName, level: 'error', message: "href özniteliği yok", classes: mergedClasses });
        } else if (attrs.get('href') === '#' || attrs.get('href') === '') {
          issues.push({ file: filePath, line, tag: tagName, level: 'warning', message: 'Yer tutucu href (# veya boş)', classes: mergedClasses });
        }
      }
      if (tagName === 'Link' && !attrs.has('to')) {
        issues.push({ file: filePath, line, tag: tagName, level: 'error', message: "to özniteliği yok (yönlendirilecek adres yok)", classes: mergedClasses });
      }

      // --- form kontrolleri: etiket ---
      const isFormControlEl = resolvedTag === 'input' || resolvedTag === 'select' || resolvedTag === 'textarea';
      if (isFormControlEl) {
        const id = attrs.get('id');
        // id={ifade} dinamik olabilir — statik çözülemiyorsa etiket kontrolünü atla
        const dynamicId = id === true;
        // {…props} yayılan (proxy) bileşen kökleri: id/aria-label çağıran taraftan
        // gelebilir (örn. ui/input.tsx içindeki <input {...props} />) — etiket
        // kontrolü burada statik olarak yapılamaz, o yüzden atlanır. Muafiyet
        // YALNIZCA ui/ bileşen tanımlarına özeldir; kullanım yerlerinde yayılan
        // form kontrolleri (react-hook-form {...field} vb.) etiket denetimine
        // tabidir.
        const attrsNode = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
        const isUiProxyFile = filePath.split(/[\\/]/).includes('ui');
        const hasSpread = isUiProxyFile && Array.from(attrsNode.properties).some((p) => ts.isJsxSpreadAttribute(p));
        const hasLabel = attrs.has('aria-label') || attrs.has('aria-labelledby') || attrs.has('title');
        if (!hasLabel && !dynamicId && !hasSpread && (!id || !labelIds.has(String(id)))) {
          issues.push({ file: filePath, line, tag: tagName, level: 'warning', message: 'Etiketi yok (aria-label / aria-labelledby / label[for] eşleşmesi yok)', classes: mergedClasses });
        }
      }

      // --- buton type (form içinde) ---
      // Yalnızca native <button> ve shadcn Button tip düzenlemez; Radix *Trigger
      // bileşenleri içte type="button" basar (yanlış pozitifi önlemek için hariç).
      if ((tagName === 'button' || tagName === 'Button') && !attrs.has('type') && ctx.inForm) {
        issues.push({ file: filePath, line, tag: tagName, level: 'warning', message: 'Form içinde type belirtilmemiş — yanlışlıkla submit olabilir (type="button" önerilir)', classes: mergedClasses });
      }

      // --- aria-hidden içinde odaklanabilir öğe ---
      if (ctx.ariaHidden > 0) {
        issues.push({ file: filePath, line, tag: tagName, level: 'warning', message: 'aria-hidden="true" içinde odaklanabilir öğe', classes: mergedClasses });
      }
    }

    // --- statik öğede onClick ---
    if (STATIC_TAGS.has(tagName) && attrs.has('onClick') && !attrs.has('role') && !attrs.has('tabIndex')) {
      issues.push({ file: filePath, line, tag: tagName, level: 'warning', message: 'Tıklanabilir ancak role/tabIndex yok — klavye erişimi sağlanmamış', classes: mergedClasses });
    }

    // --- img alt ---
    if (tagName === 'img' && !attrs.has('alt')) {
      issues.push({ file: filePath, line, tag: tagName, level: 'error', message: 'alt özniteliği yok (dekoratifse alt="" kullanın)', classes: mergedClasses });
    }

    // --- alt öğelere bağlamı taşı ---
    const nextCtx = {
      inForm: ctx.inForm || tagName === 'form',
      ariaHidden: ctx.ariaHidden + (String(attrs.get('aria-hidden')) === 'true' ? 1 : 0),
    };
    // Tüm alt düğümleri dolaş — elementler analyzeJsx'e gider, diğerleri
    // (ifade içindeki elementler dahil) descend ile inilir.
    children.forEach((child) => descend(child, nextCtx));
  };

  // global id toplama + per-file label[for] seti
  const getStaticId = (node) => {
    const attrsNode = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
    for (const prop of attrsNode.properties) {
      if (ts.isJsxAttribute(prop) && prop.name.getText() === 'id' && prop.initializer) {
        if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
          return prop.initializer.text;
        }
        return null; // dinamik id — çalışma zamanında benzersiz olabilir
      }
    }
    return null;
  };
  const walk = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = (ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName).getText();
      const attrs = readAttributes(node);
      const staticId = getStaticId(node);
      if (staticId != null) globalIds.push({ file: filePath, line: lineOf(node), id: staticId });
      // Radix <Label> bileşeni de native <label> render eder (htmlFor → id ilişkisi).
      if ((tagName === 'label' || tagName === 'Label') && attrs.has('htmlFor')) labelIds.add(String(attrs.get('htmlFor')));
    }
    ts.forEachChild(node, walk);
  };
  walk(sourceFile);

  const rootCtx = { inForm: false, ariaHidden: 0 };

  // Tek yönlü yinelemeli dolaşım: element → analyzeJsx, diğer düğümler
  // (JsxExpression içindeki elementler dahil) → forEachChild ile inilir.
  // Böylece {cond && <button/>} / {list.map(x => <Button/>)} içindeki
  // etkileşimli öğeler de denetlenir (örn. onboarding tur nokta butonları).
  const descend = (node, ctx) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      analyzeJsx(node, ctx);
      return;
    }
    ts.forEachChild(node, (child) => descend(child, ctx));
  };
  descend(sourceFile, rootCtx);

  return issues;
}

/* ───────────────────────── Ana akış ───────────────────────── */

const opts = parseArgs();
const globalIds = [];
const labelIds = new Set();
const allIssues = [];

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

if (!statSync(opts.dir).isDirectory()) {
  console.error(`Hata: "${opts.dir}" bir dizin değil.`);
  process.exit(1);
}

const files = collectFiles(opts.dir);

for (const file of files) {
  const issues = auditFile(file, opts, labelIds);
  allIssues.push(...issues);
}

// yinelenen id'ler (global)
const idCount = new Map();
for (const rec of globalIds) idCount.set(rec.id, (idCount.get(rec.id) ?? 0) + 1);
const reportedDups = new Set();
for (const rec of globalIds) {
  if (idCount.get(rec.id) > 1 && !reportedDups.has(rec.id)) {
    reportedDups.add(rec.id);
    allIssues.push({ file: rec.file, line: rec.line, tag: 'id', level: 'error', message: `Yinelenen id: "${rec.id}" (${idCount.get(rec.id)} kez)`, classes: '' });
  }
}

/* ───────────────────────── Rapor ───────────────────────── */

const LEVEL_ICON = { error: '✗', warning: '⚠', info: 'ℹ' };
const counts = { error: 0, warning: 0, info: 0 };
for (const i of allIssues) counts[i.level]++;

if (opts.json) {
  console.log(JSON.stringify({ files: files.length, counts, issues: allIssues.map((i) => ({ ...i, file: path.relative(ROOT, i.file) })) }, null, 2));
  process.exit(counts.error > 0 || (opts.strict && counts.warning > 0) ? 1 : 0);
}

console.log('─'.repeat(72));
console.log('Mobil Dokunma Hedefi & Erişilebilirlik Denetimi');
console.log(`  Taranan: ${files.length} dosya  •  Eşik: ${opts.min}px (hata alt sınırı: ${ERROR_MIN}px)`);
console.log('─'.repeat(72));

// dosyaya göre grupla
const byFile = new Map();
for (const i of allIssues) {
  if (!byFile.has(i.file)) byFile.set(i.file, []);
  byFile.get(i.file).push(i);
}

for (const [file, list] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`\n${path.relative(ROOT, file)}`);
  for (const i of list) {
    console.log(`  ${LEVEL_ICON[i.level]} L${i.line.toString().padEnd(4)} <${i.tag}> ${i.message}`);
    if (i.classes && i.classes.trim()) console.log(`      class: ${i.classes.trim().slice(0, 140)}${i.classes.length > 140 ? '…' : ''}`);
  }
}

console.log('─'.repeat(72));
console.log(`SONUÇ: ${counts.error} hata, ${counts.warning} uyarı, ${counts.info} bilgi`);
console.log(
  'Not: "warning" seviyesindeki küçük buton/link hedefleri dokunmatik cihazlarda\n' +
  'index.css @media(hover:none) kuralıyla 48px\'e yükseltilir; form kontrolleri ve\n' +
  '24px altı hedefler bu kuralın dışındadır. Bilinçli muafiyet: data-audit-ignore.'
);
if (counts.error > 0 || (opts.strict && counts.warning > 0)) {
  console.log('ÇIKTI: DENETİM BAŞARISIZ');
  process.exit(1);
}
console.log('ÇIKTI: Denetim tamam ✓ (hata yok)');
