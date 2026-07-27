'use client'

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiImage, FiUpload } from 'react-icons/fi';

import { getMenuImageUploadSignatureAction } from '@/lib/actions/cloudinary-actions';
import { updateProductImageAction } from '@/lib/actions/menu-actions';
import { cloudinaryTransform, MENU_DETAIL } from '@/lib/utils/cloudinary';

const MAX_FILE_SIZE_MB = 5;

interface ProductImageUploaderProps {
  businessId: string;
  productId: string;
  currentImageUrl: string | null;
}

export default function ProductImageUploader({
  businessId,
  productId,
  currentImageUrl,
}: ProductImageUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no puede pesar más de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const sig = await getMenuImageUploadSignatureAction(productId);

      const uploadFormData = new FormData();
      uploadFormData.set('file', file);
      uploadFormData.set('api_key', sig.apiKey);
      uploadFormData.set('timestamp', String(sig.timestamp));
      uploadFormData.set('signature', sig.signature);
      uploadFormData.set('folder', sig.folder);
      uploadFormData.set('public_id', sig.publicId);
      uploadFormData.set('overwrite', 'true');

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: uploadFormData }
      );

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => null);
        throw new Error(
          errBody?.error?.message ?? 'Error subiendo la imagen a Cloudinary.'
        );
      }

      const uploadData = await uploadRes.json();
      const secureUrl = uploadData.secure_url as string;

      await updateProductImageAction(productId, businessId, secureUrl);

      setPreviewUrl(secureUrl);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
        Foto del producto
      </span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] text-black/25">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cloudinaryTransform(previewUrl, MENU_DETAIL)}
              alt="Foto del producto"
              className="h-full w-full object-cover"
            />
          ) : (
            <FiImage size={24} />
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm text-black/70 hover:bg-black/5 disabled:opacity-60"
          >
            <FiUpload size={14} />
            {uploading ? 'Subiendo...' : 'Subir foto'}
          </button>
          <p className="mt-1 text-xs text-black/35">
            PNG o JPG, máximo {MAX_FILE_SIZE_MB}MB.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}