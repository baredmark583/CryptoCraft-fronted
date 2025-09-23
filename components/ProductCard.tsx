import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Tag } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    discountPrice?: number;
    seller: string;
    images: string[];
    isFavorite?: boolean;
    badges?: string[];
    features?: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(product.images[0]);

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8">
      {/* ЛЕВАЯ СТОРОНА - ФОТО */}
      <div>
        <div className="rounded-2xl border shadow-sm overflow-hidden">
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-[400px] object-cover"
          />
        </div>

        {/* Миниатюры */}
        <div className="flex gap-3 mt-4">
          {product.images.map((img, i) => (
            <img
              key={i}
              src={img}
              onClick={() => setCurrentImage(img)}
              className={`h-20 w-20 object-cover rounded-xl cursor-pointer border ${
                currentImage === img ? "border-blue-500" : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ПРАВАЯ СТОРОНА - ИНФО */}
      <div className="flex flex-col gap-4">
        {/* Заголовок и продавец */}
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-500">Продавец: {product.seller}</p>
        </div>

        {/* Цена */}
        <div className="flex items-center gap-3">
          {product.discountPrice ? (
            <>
              <span className="text-2xl font-bold text-red-500">
                {product.discountPrice} ₴
              </span>
              <span className="line-through text-gray-400">
                {product.price} ₴
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold">{product.price} ₴</span>
          )}
        </div>

        {/* Бейджи */}
        <div className="flex gap-2">
          {product.badges?.map((badge, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Характеристики */}
        {product.features && (
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">Характеристики</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {product.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Добавить в корзину
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> Купить сейчас
          </Button>
          <Button variant="ghost">
            <Heart
              className={`h-5 w-5 ${
                product.isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ - ОПИСАНИЕ */}
      <div className="md:col-span-2 mt-10">
        <h2 className="text-xl font-semibold mb-2">Описание</h2>
        <p className="text-gray-700">{product.description}</p>
      </div>
    </div>
  );
}
