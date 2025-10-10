import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useCurrency } from '../hooks/useCurrency';
import type { CartItem } from '../types';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { getFormattedPrice } = useCurrency();
  const navigate = useNavigate();

  useTelegramBackButton(true);

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-white mb-4">Ваша корзина пуста</h1>
        <p className="text-base-content/70 mb-8">Самое время отправиться за покупками!</p>
        <Link to="/" className="bg-primary hover:bg-primary-focus text-primary-content font-bold py-3 px-6 rounded-lg transition-colors">
          На главную
        </Link>
      </div>
    );
  }

  const groupedBySeller = React.useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const sellerId = item.product.seller.id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: item.product.seller,
          items: [],
        };
      }
      acc[sellerId].items.push(item);
      return acc;
    }, {} as Record<string, { seller: any; items: CartItem[] }>);
  }, [cartItems]);

  const getVariantString = (item: CartItem): string | null => {
      if (!item.variant) return null;
      return Object.values(item.variant.attributes).join(', ');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Корзина</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.values(groupedBySeller).map(({ seller, items }) => (
            <div key={seller.id} className="card bg-base-100 border border-base-300 shadow-lg">
              <div className="p-4 border-b border-base-300">
                <h2 className="font-semibold text-white">Продавец: <Link to={`/profile/${seller.id}`} className="text-secondary hover:underline">{seller.name}</Link></h2>
              </div>
              <div className="divide-y divide-base-300">
                {items.map(item => {
                  const variantString = getVariantString(item);
                  
                  return (
                    <div key={item.product.id + (item.variant?.id || '') + `-${item.purchaseType}`} className="p-4 flex items-center gap-4">
                      <img src={item.variant?.imageUrl || item.product.imageUrls[0]} alt={item.product.title} className="w-20 h-20 rounded-md object-cover"/>
                      <div className="flex-grow">
                        <Link to={`/product/${item.product.id}`} className="font-semibold text-white hover:text-primary">{item.product.title}</Link>
                        {item.purchaseType === 'WHOLESALE' && <span className="ml-2 bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">Оптом</span>}
                        {variantString && <p className="text-sm text-base-content/70">{variantString}</p>}
                        <p className="text-sm text-base-content/70">{getFormattedPrice(item.priceAtTimeOfAddition)} / шт.</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           value={item.quantity} 
                           onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value), item.variant?.id, item.purchaseType)}
                           min="1"
                           className="w-16 bg-base-200 border border-base-300 rounded-md p-2 text-center"
                         />
                         <button onClick={() => removeFromCart(item.product.id, item.variant?.id, item.purchaseType)} className="text-base-content/70 hover:text-red-500 p-2">
                           <DynamicIcon name="delete-item" className="h-5 w-5" />
                         </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="card bg-base-100 border border-base-300 shadow-lg sticky top-24">
            <div className="card-body p-6">
              <h2 className="text-xl font-bold text-white mb-4">Итог заказа</h2>
              <div className="flex justify-between text-base-content mb-2">
                <span>Товары ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})</span>
                <span>{getFormattedPrice(cartTotal)}</span>
              </div>
               <div className="flex justify-between text-base-content mb-4">
                <span>Доставка</span>
                <span className="text-green-400">Рассчитывается</span>
              </div>
              <div className="border-t border-base-300 my-4"></div>
              <div className="flex justify-between text-white font-bold text-lg mb-6">
                <span>Всего</span>
                <span>{getFormattedPrice(cartTotal)}</span>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary hover:bg-primary-focus text-primary-content font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
              >
                Перейти к оформлению
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;