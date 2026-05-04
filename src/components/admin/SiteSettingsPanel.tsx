import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings, Globe, Mail, Bell, Shield, Palette, Save, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  enableComments: boolean;
  requireApproval: boolean;
  enableNewsletter: boolean;
  maintenanceMode: boolean;
  analyticsEnabled: boolean;
  socialFacebook: string;
  socialTwitter: string;
  socialInstagram: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

const defaultSettings: SiteSettings = {
  siteName: 'Rüya Tabirleri',
  siteDescription: 'Türkiye\'nin en kapsamlı rüya tabirleri sitesi',
  contactEmail: 'info@ruyatabirleri.com',
  enableComments: true,
  requireApproval: true,
  enableNewsletter: false,
  maintenanceMode: false,
  analyticsEnabled: true,
  socialFacebook: '',
  socialTwitter: '',
  socialInstagram: '',
  metaTitle: 'Rüya Tabirleri - En Kapsamlı Rüya Yorumları',
  metaDescription: 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.',
  metaKeywords: 'rüya tabiri, rüya yorumu, islami rüya tabiri, rüya sözlüğü',
};

export function SiteSettings() {
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<SiteSettings | null>(null);

  const { isLoading, data: settingsData } = useQuery({
    queryKey: [...queryKeys.admin.all, 'settings'],
    queryFn: async () => {
      const response = await fetchApi<{ settings: Record<string, any> }>('/admin/site-settings');
      if (!response.success) throw new Error(response.error || 'Failed to fetch settings');
      const loadedSettings = { ...defaultSettings };
      Object.entries(response.data?.settings || {}).forEach(([key, value]) => {
        if (key in loadedSettings && value !== null) {
          (loadedSettings as any)[key] = value;
        }
      });
      return loadedSettings;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: SiteSettings) => fetchApi('/admin/site-settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: data }),
    }),
    onSuccess: () => {
      setHasChanges(false);
      toast.success('Ayarlar kaydedildi');
    },
    onError: () => toast.error('Ayarlar kaydedilirken hata oluştu'),
  });

  const settings = localSettings || settingsData;

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    if (settings) {
      const newSettings = { ...settings, [key]: value };
      setLocalSettings(newSettings);
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (settings) {
      saveMutation.mutate(settings);
    }
  };

  if (isLoading || !settings) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Ayarlar yükleniyor...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Site Ayarları</h2>
          <p className="text-sm text-slate-500">Sitenin genel ayarlarını yönetin</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Genel</span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Yorumlar</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Sosyal</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Genel Ayarlar</h3>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Adı</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => updateSetting('siteName', e.target.value)}
                    placeholder="Site adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">İletişim E-postası</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => updateSetting('contactEmail', e.target.value)}
                    placeholder="iletisim@site.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Açıklaması</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => updateSetting('siteDescription', e.target.value)}
                  placeholder="Sitenizin kısa açıklaması"
                  rows={3}
                />
              </div>

              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sistem Ayarları
                </h4>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Bakım Modu</p>
                    <p className="text-sm text-slate-500">Siteyi geçici olarak bakım moduna al</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Analitik</p>
                    <p className="text-sm text-slate-500">Site analitiğini etkinleştir</p>
                  </div>
                  <Switch
                    checked={settings.analyticsEnabled}
                    onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Comments Settings */}
        <TabsContent value="comments">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Yorum Ayarları</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Yorumları Etkinleştir</p>
                  <p className="text-sm text-slate-500">Kullanıcıların yorum yapmasına izin ver</p>
                </div>
                <Switch
                  checked={settings.enableComments}
                  onCheckedChange={(checked) => updateSetting('enableComments', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Yorum Onayı Gerekli</p>
                  <p className="text-sm text-slate-500">Yorumlar yayınlanmadan önce onay iste</p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => updateSetting('requireApproval', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Bülten Aboneliği</p>
                  <p className="text-sm text-slate-500">E-posta bülteni sistemini etkinleştir</p>
                </div>
                <Switch
                  checked={settings.enableNewsletter}
                  onCheckedChange={(checked) => updateSetting('enableNewsletter', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">SEO Ayarları</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Başlık</Label>
                <Input
                  id="metaTitle"
                  value={settings.metaTitle}
                  onChange={(e) => updateSetting('metaTitle', e.target.value)}
                  placeholder="Ana sayfa meta başlığı"
                />
                <p className="text-xs text-slate-500">{settings.metaTitle.length}/60 karakter</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Açıklama</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.metaDescription}
                  onChange={(e) => updateSetting('metaDescription', e.target.value)}
                  placeholder="Arama motorlarında görünecek açıklama"
                  rows={3}
                />
                <p className="text-xs text-slate-500">{settings.metaDescription.length}/160 karakter</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Anahtar Kelimeler</Label>
                <Input
                  id="metaKeywords"
                  value={settings.metaKeywords}
                  onChange={(e) => updateSetting('metaKeywords', e.target.value)}
                  placeholder="rüya tabiri, rüya yorumu, ..."
                />
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

        {/* Social Settings */}
        <TabsContent value="social">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Sosyal Medya</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  value={settings.socialFacebook}
                  onChange={(e) => updateSetting('socialFacebook', e.target.value)}
                  placeholder="https://facebook.com/sayfa-adiniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X URL</Label>
                <Input
                  id="twitter"
                  value={settings.socialTwitter}
                  onChange={(e) => updateSetting('socialTwitter', e.target.value)}
                  placeholder="https://twitter.com/kullanici-adiniz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  value={settings.socialInstagram}
                  onChange={(e) => updateSetting('socialInstagram', e.target.value)}
                  placeholder="https://instagram.com/kullanici-adiniz"
                />
              </div>

              {(!settings.socialFacebook && !settings.socialTwitter && !settings.socialInstagram) && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Sosyal medya bağlantıları eksik</p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">Sosyal medya hesaplarınızı ekleyerek erişilebilirliği artırın.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="p-4 flex items-center gap-4 shadow-lg border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Kaydedilmemiş değişiklikler var</span>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Kaydet'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
