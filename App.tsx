import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppContextProvider } from './hooks/useAppContext';
import { AuthProvider } from './hooks/useAuth';
import { TonConnectUIProvider } from './hooks/useTonConnect';
import { NotificationsProvider } from './hooks/useNotifications';
import { CollectionsProvider } from './hooks/useCollections';
import { CurrencyProvider } from './hooks/useCurrency';
import { CartProvider } from './hooks/useCart';
import { WishlistProvider } from './hooks/useWishlist';
import { IconProvider } from './hooks/useIcons';

import Header from './components/Header';
import Footer from './components/Footer';
import MobileNavBar from './components/MobileNavBar';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import ProfilePage from './pages/ProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';
import ChatPage from './pages/ChatPage';
import CartPage from './pages/CartPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import CommunityHubPage from './pages/CommunityHubPage';
import ForumThreadPage from './pages/ForumThreadPage';
import PhotoStudioPage from './pages/PhotoStudioPage';
import CheckoutPage from './pages/CheckoutPage';
import VerificationPage from './pages/VerificationPage';
import AuthenticationCenterPage from './pages/AuthenticationCenterPage';
import DisputeCenterPage from './pages/DisputeCenterPage';
import LiveStreamPage from './pages/LiveStreamPage';
import GovernancePage from './pages/GovernancePage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import CreateLiveStreamPage from './pages/CreateLiveStreamPage';
import ProductListPage from './pages/ProductListPage';
import ImportPage from './pages/ImportPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');

  return (
    <div className={`font-sans text-base-content ${isChatPage ? 'h-screen bg-white' : 'bg-base-100 min-h-screen flex flex-col overflow-x-hidden'}`}>
      {!isChatPage && <Header />}
      <main className={isChatPage ? 'h-full' : 'flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/create" element={<CreateListingPage />} />
          <Route path="/edit/:id" element={<EditListingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:profileId" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/collection/:id" element={<CollectionDetailPage />} />
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/thread/:id" element={<ForumThreadPage />} />
          <Route path="/studio/:productId" element={<PhotoStudioPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/auth-center" element={<AuthenticationCenterPage />} />
          <Route path="/dispute/:orderId" element={<DisputeCenterPage />} />
          <Route path="/live/create" element={<CreateLiveStreamPage />} />
          <Route path="/live/:streamId" element={<LiveStreamPage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/proposal/:id" element={<ProposalDetailPage />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </main>
      {!isChatPage && <Footer />}
      {!isChatPage && <MobileNavBar />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AuthProvider>
        <TonConnectUIProvider>
          <NotificationsProvider>
            <CollectionsProvider>
              <CurrencyProvider>
                <CartProvider>
                  <WishlistProvider>
                    <IconProvider>
                       <Router>
                        <AppContent />
                      </Router>
                    </IconProvider>
                  </WishlistProvider>
                </CartProvider>
              </CurrencyProvider>
            </CollectionsProvider>
          </NotificationsProvider>
        </TonConnectUIProvider>
      </AuthProvider>
    </AppContextProvider>
  );
};

export default App;
