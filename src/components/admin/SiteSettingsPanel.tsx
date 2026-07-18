import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Globe, Bell, Shield, Palette, Save, RefreshCw,
  Check, AlertCircle, Phone, MapPin, Clock, Mail,
  Facebook, Instagram, Twitter, Youtube, Linkedin,
} from 'lucide-react';
import { toast } from 'sonner';
import { captureError } from '@/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { invalidateSiteSettingsCache } from '@/hooks/useSiteSettings';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactWorkingHours: string;
  mapLatitude: string;
  mapLongitude: string;
  enableComments: boolean;
  requireApproval: boolean;
  enableNewsletter: boolean;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  socialYoutube: string;
  socialLinkedin: string;
  socialTiktok: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'Rüya Tabirleri',
  siteDescription: "Türkiye'nin en kapsamlı rüya tabirleri sitesi",
  contactEmail: 'info@ruyatabirleri.com',
  contactPhone: '+90 (212) 123 45 67',
  contactAddress: 'İstanbul, Türkiye',
  contactWorkingHours: 'Pzt - Cum: 09:00 - 18:00',
  mapLatitude: '41.0082',
  mapLongitude: '28.9784',
  enableComments: true,
  requireApproval: true,
  enableNewsletter: false,
  maintenanceMode: false,
  analyticsEnabled: true,
  socialFacebook: '',
  socialTwitter: '',
  socialInstagram: '',
  socialYoutube: '',
  socialLinkedin: '',
  socialTiktok: '',
  metaTitle: 'Rüya Tabirleri - En Kapsamlı Rüya Yorumları',
  metaDescription: 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.',
  metaKeywords: 'rüya tabiri, rüya yorumu, islami rüya tabiri, rüya sözlüğü',
};

export function SiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error) throw error;
      if (data && data.length > 0) {
        const loaded = { ...defaultSettings };
        data.forEach((item) => {
          if (item.key in loaded && item.value !== null && item.value !== undefined) {
            (loaded as Record<string, unknown>)[item.key] = item.value;
          }
        });
        setSettings(loaded);
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'site-settings' }, extra: { context: 'fetch-settings' } });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { data: existing } = await supabase.from('site_settings').select('id').eq('key', key).single();
        if (existing) {
          await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
        } else {
          await supabase.from('site_settings').insert({ key, value });
        }
      }
      invalidateSiteSettingsCache();
      setHasChanges(false);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      captureError(error, { tags: { feature: 'site-settings' }, extra: { context: 'save-settings' } });
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Ayarlar yükleniyor...</span>
        </div>
      </Card>
    );
  }

  const hasAnySocial = settings.socialFacebook || settings.socialTwitter || settings.socialInstagram ||
                       settings.socialYoutube || settings.socialLinkedin || settings.socialTiktok;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Site Ayarları</h2>
          <p className="text-sm text-slate-500">Sitenin genel ayarlarını yönetin</p>
        </div>
        <Button onClick={saveSettings} disabled={!hasChanges || saving} className="gap-2">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4" /><span className="hidden sm:inline">Genel</span></TabsTrigger>
          <TabsTrigger value="contact" className="gap-2"><Phone className="h-4 w-4" /><span className="hidden sm:inline">İletişim</span></TabsTrigger>
          <TabsTrigger value="comments" className="gap-2"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Yorumlar</span></TabsTrigger>
          <TabsTrigger value="seo" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">SEO</span></TabsTrigger>
          <TabsTrigger value="social" className="gap-2"><Palette className="h-4 w-4" /><span className="hidden sm:inline">Sosyal</span></TabsTrigger>
        </TabsList>

        {/* Genel */}
        <TabsContent value="general">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Genel Ayarlar</h3>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Adı</Label>
                  <Input id="siteName" value={settings.siteName} onChange={(e) => updateSetting('siteName', e.target.value)} placeholder="Site adını girin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmailGen">İletişim E-postası</Label>
                  <Input id="contactEmailGen" type="email" value={settings.contactEmail} onChange={(e) => updateSetting('contactEmail', e.target.value)} placeholder="iletisim@site.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Açıklaması</Label>
                <Textarea id="siteDescription" value={settings.siteDescription} onChange={(e) => updateSetting('siteDescription', e.target.value)} placeholder="Sitenizin kısa açıklaması" rows={3} />
              </div>
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Shield className="h-4 w-4" /> Sistem Ayarları</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Bakım Modu</p>
                    <p className="text-sm text-slate-500">Siteyi geçici olarak bakım moduna al</p>
                  </div>
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)} />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Analitik</p>
                    <p className="text-sm text-slate-500">Site analitiğini etkinleştir</p>
                  </div>
                  <Switch checked={settings.analyticsEnabled} onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* İLETİŞİM */}
        <TabsContent value="contact">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">İletişim Bilgileri</h3>
            <p className="text-sm text-slate-500 mb-6">Bu bilgiler footer'da, iletişim sayfasında ve site genelinde otomatik görüntülenir.</p>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Telefon</Label>
                  <Input id="contactPhone" type="tel" value={settings.contactPhone} onChange={(e) => updateSetting('contactPhone', e.target.value)} placeholder="+90 (212) 123 45 67" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> E-posta</Label>
                  <Input id="contactEmail" type="email" value={settings.contactEmail} onChange={(e) => updateSetting('contactEmail', e.target.value)} placeholder="iletisim@site.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactAddress" className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Adres</Label>
                <Textarea id="contactAddress" value={settings.contactAddress} onChange={(e) => updateSetting('contactAddress', e.target.value)} placeholder="İstanbul, Türkiye" rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactWorkingHours" className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Çalışma Saatleri</Label>
                <Input id="contactWorkingHours" value={settings.contactWorkingHours} onChange={(e) => updateSetting('contactWorkingHours', e.target.value)} placeholder="Pzt - Cum: 09:00 - 18:00" />
              </div>
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Harita Koordinatları</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mapLatitude">Enlem (Latitude)</Label>
                    <Input id="mapLatitude" value={settings.mapLatitude} onChange={(e) => updateSetting('mapLatitude', e.target.value)} placeholder="41.0082" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mapLongitude">Boylam (Longitude)</Label>
                    <Input id="mapLongitude" value={settings.mapLongitude} onChange={(e) => updateSetting('mapLongitude', e.target.value)} placeholder="28.9784" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">OpenStreetMap iframe otomatik olarak bu koordinatları kullanır.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Yorumlar */}
        <TabsContent value="comments">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Yorum Ayarları</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div><p className="font-medium text-slate-900 dark:text-white">Yorumları Etkinleştir</p><p className="text-sm text-slate-500">Kullanıcıların yorum yapmasına izin ver</p></div>
                <Switch checked={settings.enableComments} onCheckedChange={(checked) => updateSetting('enableComments', checked)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div><p className="font-medium text-slate-900 dark:text-white">Yorum Onayı Gerekli</p><p className="text-sm text-slate-500">Yorumlar yayınlanmadan önce onay iste</p></div>
                <Switch checked={settings.requireApproval} onCheckedChange={(checked) => updateSetting('requireApproval', checked)} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div><p className="font-medium text-slate-900 dark:text-white">Bülten Aboneliği</p><p className="text-sm text-slate-500">E-posta bülteni sistemini etkinleştir</p></div>
                <Switch checked={settings.enableNewsletter} onCheckedChange={(checked) => updateSetting('enableNewsletter', checked)} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">SEO Ayarları</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Başlık</Label>
                <Input id="metaTitle" value={settings.metaTitle} onChange={(e) => updateSetting('metaTitle', e.target.value)} placeholder="Ana sayfa meta başlığı" />
                <p className="text-xs text-slate-500">{settings.metaTitle.length}/60 karakter</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Açıklama</Label>
                <Textarea id="metaDescription" value={settings.metaDescription} onChange={(e) => updateSetting('metaDescription', e.target.value)} placeholder="Arama motorlarında görünecek açıklama" rows={3} />
                <p className="text-xs text-slate-500">{settings.metaDescription.length}/160 karakter</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Anahtar Kelimeler</Label>
                <Input id="metaKeywords" value={settings.metaKeywords} onChange={(e) => updateSetting('metaKeywords', e.target.value)} placeholder="rüya tabiri, rüya yorumu, ..." />
                <p className="text-xs text-slate-500">Virgülle ayırarak yazın</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">SEO Durumu İyi</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">Meta başlık ve açıklama uygun uzunlukta.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Sosyal Medya */}
        <TabsContent value="social">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Sosyal Medya Hesapları</h3>
            <p className="text-sm text-slate-500 mb-6">Bu bağlantılar footer'da ve iletişim sayfasında otomatik görüntülenir. Boş bıraktıklarınız gizlenir.</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2"><Facebook className="h-3.5 w-3.5" /> Facebook URL</Label>
                <Input id="facebook" value={settings.socialFacebook} onChange={(e) => updateSetting('socialFacebook', e.target.value)} placeholder="https://facebook.com/sayfa-adiniz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2"><Twitter className="h-3.5 w-3.5" /> Twitter / X URL</Label>
                <Input id="twitter" value={settings.socialTwitter} onChange={(e) => updateSetting('socialTwitter', e.target.value)} placeholder="https://twitter.com/kullanici-adiniz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2"><Instagram className="h-3.5 w-3.5" /> Instagram URL</Label>
                <Input id="instagram" value={settings.socialInstagram} onChange={(e) => updateSetting('socialInstagram', e.target.value)} placeholder="https://instagram.com/kullanici-adiniz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2"><Youtube className="h-3.5 w-3.5" /> YouTube URL</Label>
                <Input id="youtube" value={settings.socialYoutube} onChange={(e) => updateSetting('socialYoutube', e.target.value)} placeholder="https://youtube.com/@kanal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2"><Linkedin className="h-3.5 w-3.5" /> LinkedIn URL</Label>
                <Input id="linkedin" value={settings.socialLinkedin} onChange={(e) => updateSetting('socialLinkedin', e.target.value)} placeholder="https://linkedin.com/in/kullanici" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok URL</Label>
                <Input id="tiktok" value={settings.socialTiktok} onChange={(e) => updateSetting('socialTiktok', e.target.value)} placeholder="https://tiktok.com/@kullanici" />
              </div>
              {!hasAnySocial && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Sosyal medya bağlantıları eksik</p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">En az bir hesap ekleyerek erişilebilirliği artırın.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="p-4 flex items-center gap-4 shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Kaydedilmemiş değişiklikler var</span>
            <Button size="sm" onClick={saveSettings} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Kaydet'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default SiteSettings;
