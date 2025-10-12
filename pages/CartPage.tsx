import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../hooks/useAuth'; // Import useAuth
import type { CartItem, User } from '../types';
import { useTelegramBackButton } from '../hooks/useTelegram';
import DynamicIcon from '../components/DynamicIcon';

const CartPage: React.FC = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const { getFormattedPrice } = useCurrency();
  const { user } = useAuth(); // Get the authenticated user
  const navigate = useNavigate();

  useTelegramBackButton(true);

  const groupedBySeller = React.useMemo(() => {
    if (!cartItems) return {};
    return cartItems.reduce((acc, item) => {
      if (!item.product.seller) {
        console.warn('Cart item with missing seller data:', item);
        return acc; 
      }
      const sellerId = item.product.seller.id;
      if (!acc[sellerId]) {
        // FIX: If the seller is the current user, use the complete user object from useAuth.
        // This prevents data inconsistencies that cause React to crash.
        const sellerData = (user && sellerId === user.id) ? user : item.product.seller;
        acc[sellerId] = {
          seller: sellerData,
          items: [],
        };
      }
      acc[sellerId].items.push(item);
      return acc;
    }, {} as Record<string, { seller: User; items: CartItem[] }>);
  }, [cartItems, user]); // Add user to dependency array

  const getVariantString = (item: CartItem): string | null => {
      if (!item.variant) return null;
      return Object.values(item.variant.attributes).join(', ');
  }

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Корзина</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.values(groupedBySeller).map(({ seller, items }) => {
            if (!seller || !seller.id) return null;
            return (
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
                            <DynamicIcon name="delete-item" className="h-5 w-5" fallback={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          })}
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
