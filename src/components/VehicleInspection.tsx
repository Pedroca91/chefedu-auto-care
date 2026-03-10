import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, Trash2, Image } from 'lucide-react';
import { toast } from 'sonner';
import type { VehicleInspection as InspectionType, InspectionPhoto } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  serviceId: string;
}

export default function VehicleInspection({ open, onOpenChange, serviceId }: Props) {
  const { user } = useAuth();
  const { currentShopId } = useShop();
  const [inspection, setInspection] = useState<InspectionType | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInspection = useCallback(async () => {
    if (!serviceId) return;
    setLoading(true);
    const { data } = await (supabase.from as any)('vehicle_inspections').select('*').eq('service_id', serviceId).maybeSingle();
    if (data) {
      const insp = data as InspectionType;
      setInspection(insp);
      setNotes(insp.notes);
      const { data: photosData } = await (supabase.from as any)('inspection_photos').select('*').eq('inspection_id', insp.id).order('created_at');
      setPhotos((photosData || []) as InspectionPhoto[]);
    } else {
      setInspection(null);
      setNotes('');
      setPhotos([]);
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => { if (open) fetchInspection(); }, [open, fetchInspection]);

  const ensureInspection = async (): Promise<string | null> => {
    if (inspection) return inspection.id;
    if (!currentShopId || !user) return null;
    const { data, error } = await (supabase.from as any)('vehicle_inspections').insert({
      service_id: serviceId, shop_id: currentShopId, inspector_user_id: user.id, notes,
    }).select().single();
    if (error || !data) { toast.error('Erro ao criar inspeção'); return null; }
    const insp = data as InspectionType;
    setInspection(insp);
    return insp.id;
  };

  const handleSaveNotes = async () => {
    const inspId = await ensureInspection();
    if (!inspId) return;
    await (supabase.from as any)('vehicle_inspections').update({ notes }).eq('id', inspId);
    toast.success('Observações salvas');
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const inspId = await ensureInspection();
    if (!inspId) return;

    setUploading(true);
    const file = e.target.files[0];
    const path = `${currentShopId}/${serviceId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('inspection-photos').upload(path, file);
    if (error) { toast.error('Erro ao enviar foto'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('inspection-photos').getPublicUrl(path);

    await (supabase.from as any)('inspection_photos').insert({
      inspection_id: inspId, photo_url: publicUrl, label: label || file.name,
    });
    setLabel('');
    await fetchInspection();
    toast.success('Foto adicionada');
    setUploading(false);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await (supabase.from as any)('inspection_photos').delete().eq('id', photoId);
    await fetchInspection();
    toast.success('Foto removida');
  };

  const inspDate = inspection ? new Date(inspection.inspection_date).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-h-[90vh] overflow-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Inspeção do Veículo
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>📅 Data: {inspDate}</span>
              {inspection?.inspector_user_id && <span>👤 Inspector ID: {inspection.inspector_user_id.slice(0, 8)}...</span>}
            </div>

            <div className="space-y-2">
              <Label>Observações sobre o estado do veículo</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="bg-input border-border"
                placeholder="Descreva o estado do veículo: riscos, amassados, quilometragem, etc." />
              <Button size="sm" onClick={handleSaveNotes} variant="outline" className="border-border">Salvar Observações</Button>
            </div>

            <div className="space-y-3">
              <Label>Fotos do Veículo</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Descrição da foto</Label>
                  <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Frente, Traseira, Quilometragem..." className="bg-input border-border" />
                </div>
                <Label htmlFor="photo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-red text-primary-foreground text-sm h-10 hover:opacity-90">
                  <Upload className="h-4 w-4" /> {uploading ? 'Enviando...' : 'Anexar'}
                </Label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" disabled={uploading} />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map(p => (
                    <div key={p.id} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={p.photo_url} alt={p.label} className="w-full h-32 object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1">
                        <p className="text-xs truncate">{p.label}</p>
                      </div>
                      <button onClick={() => handleDeletePhoto(p.id)} className="absolute top-1 right-1 p-1 rounded bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma foto anexada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
