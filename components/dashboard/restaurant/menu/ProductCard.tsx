"use client";

import { FiImage } from "react-icons/fi";
import type { Product } from "@/lib/types";
import { cloudinaryTransform, MENU_THUMBNAIL } from "@/lib/utils/cloudinary";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left transition hover:border-black/30"
    >
      <div className="flex h-28 items-center justify-center bg-black/[0.03] text-black/20">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryTransform(product.image_url, MENU_THUMBNAIL)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FiImage size={24} />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-medium">{product.name}</h4>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-black/40">
            {product.description}
          </p>
        )}
        <p className="mt-2 text-sm font-medium">
          ${product.price.toLocaleString("es-CO")}
        </p>
      </div>
    </button>
  );
}
