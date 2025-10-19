import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AppContextProvider } from './hooks/useAppContext';
import { TonConnectUIProvider } from './hooks/useTonConnect';
import { NotificationsProvider } from './hooks/useNotifications';
import { CollectionsProvider } from './hooks/useCollections';
import { CurrencyProvider } from './hooks/useCurrency';
import { CartProvider } from './hooks/useCart';
import { WishlistProvider } from './hooks/useWishlist';
import { IconProvider } from './hooks/useIcons';
import { useTelegram } from './hooks/useTelegram';

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
import AuthenticationCenterPage from './pages/AuthenticationCenterPage';
import DisputeCenterPage from './pages/DisputeCenterPage';
import LiveStreamPage from './pages/LiveStreamPage';
import GovernancePage from './pages/GovernancePage';
import ProposalDetailPage from './pages/ProposalDetailPage';
import CreateProposalPage from './pages/CreateProposalPage';
import CreateLiveStreamPage from './pages/CreateLiveStreamPage';
import ProductListPage from './pages/ProductListPage';
import { ImportPage } from './pages/ImportPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';


// This component contains the main application layout and routes.
const AppContent: React.FC = () => {
  const location = useLocation();
  const { tg } = useTelegram();
  
  const isFullScreenPage = location.pathname.startsWith('/chat') || location.pathname.startsWith('/dashboard');
  const isSpecificChatOpen = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';

  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg]);
  
  const mainClass = isFullScreenPage
    ? "flex-grow" 
    : "flex-grow";

  return (
    <div className="flex flex-col min-h-screen">
      {!isFullScreenPage && <Header />}
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/profile/:profileId" element={<ProfilePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/thread/:id" element={<ForumThreadPage />} />
          <Route path="/live/:streamId" element={<LiveStreamPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/collection/:id" element={<ProtectedRoute><CollectionDetailPage /></ProtectedRoute>} />
          <Route path="/studio/:productId" element={<ProtectedRoute><PhotoStudioPage /></ProtectedRoute>} />
          <Route path="/auth-center" element={<ProtectedRoute><AuthenticationCenterPage /></ProtectedRoute>} />
          <Route path="/dispute/:orderId" element={<ProtectedRoute><DisputeCenterPage /></ProtectedRoute>} />
          <Route path="/live/create" element={<ProtectedRoute><CreateLiveStreamPage /></ProtectedRoute>} />
          <Route path="/governance" element={<ProtectedRoute><GovernancePage /></ProtectedRoute>} />
          <Route path="/proposal/:id" element={<ProtectedRoute><ProposalDetailPage /></ProtectedRoute>} />
          <Route path="/governance/create" element={<ProtectedRoute><CreateProposalPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isFullScreenPage && <Footer />}
      { !isSpecificChatOpen && !isFullScreenPage && <MobileNavBar /> }
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AuthProvider>
        <TonConnectUIProvider>
          <IconProvider>
            <NotificationsProvider>
              <CollectionsProvider>
                <CurrencyProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <Router>
                        <AppContent />
                      </Router>
                    </WishlistProvider>
                  </CartProvider>
                </CurrencyProvider>
              </CollectionsProvider>
            </NotificationsProvider>
          </IconProvider>
        </TonConnectUIProvider>
      </AuthProvider>
    </AppContextProvider>
  );
};

export default App;