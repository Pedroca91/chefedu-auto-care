import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/contexts/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Upload } from 'lucide-react';

export default function ShopSettings() {
  const { currentShop, refreshShops } = useShop();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (currentShop) {
      setName(currentShop.name);
      setPhone(currentShop.phone);
      setWhatsapp(currentShop.whatsapp);
      setAddress(currentShop.address);
      setEmail(currentShop.email);
      setPrimaryColor(currentShop.primary_color);
    }
  }, [currentShop]);

  const handleSave = async () => {
    if (!currentShop) return;
    setSaving(true);
    await (supabase.from as any)('shops').update({
      name, phone, whatsapp, address, email, primary_color: primaryColor,
    }).eq('id', currentShop.id);
    await refreshShops();
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentShop || !e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const path = `${currentShop.id}/logo_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('shop-logos').upload(path, file);
    if (error) { toast.error('Erro ao enviar logo'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('shop-logos').getPublicUrl(path);
    await (supabase.from as any)('shops').update({ logo_url: publicUrl }).eq('id', currentShop.id);
    await refreshShops();
    toast.success('Logo atualizado!');
    setUploading(false);
  };

  if (!currentShop) return <div className="text-center py-12 text-muted-foreground">Selecione uma oficina</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading font-bold flex items-center gap-2"><Settings className="h-8 w-8 text-primary" /> Configurações</h1>
        <p className="text-muted-foreground text-sm">Personalize sua oficina</p>
      </div>

      <div className="card-glow rounded-xl bg-card p-6 space-y-5">
        <div className="flex items-center gap-4">
          {currentShop.logo_url ? (
            <img src={currentShop.logo_url} alt="Logo" className="h-20 w-20 rounded-xl object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-xl gradient-red flex items-center justify-center font-heading text-3xl font-bold text-primary-foreground">
              {currentShop.name[0]}
            </div>
          )}
          <div>
            <Label htmlFor="logo" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" /> {uploading ? 'Enviando...' : 'Alterar Logo'}
            </Label>
            <input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Oficina</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="bg-input border-border" placeholder="5511999..." />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-2">
            <Label>Cor Principal (HSL)</Label>
            <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="bg-input border-border" placeholder="348 100% 50%" />
            <p className="text-xs text-muted-foreground">Formato: H S% L% (ex: 348 100% 50%)</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gradient-red hover:opacity-90">
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
