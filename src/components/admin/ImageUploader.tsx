import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
    currentUrl?: string;
    onUpload: (url: string) => void;
    label?: string;
    bucket?: string;
}

export const ImageUploader = ({
    currentUrl,
    onUpload,
    label = 'Imagem',
    bucket = 'landing-images'
}: ImageUploaderProps) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
    const { toast } = useToast();

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Erro',
                description: 'Por favor, selecione uma imagem válida',
                variant: 'destructive'
            });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Erro',
                description: 'A imagem deve ter no máximo 5MB',
                variant: 'destructive'
            });
            return;
        }

        try {
            setUploading(true);

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);
            onUpload(publicUrl);

            toast({
                title: 'Sucesso',
                description: 'Imagem enviada com sucesso!'
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao enviar imagem. Tente novamente.',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onUpload('');
    };

    return (
        <div className="space-y-4">
            <Label>{label}</Label>

            {previewUrl ? (
                <div className="relative group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                        Arraste uma imagem ou clique para selecionar
                    </p>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                        disabled={uploading}
                        className="hidden"
                        id="image-upload"
                    />
                    <Label htmlFor="image-upload">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={uploading}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Selecionar Imagem
                                </>
                            )}
                        </Button>
                    </Label>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB
            </p>
        </div>
    );
};
