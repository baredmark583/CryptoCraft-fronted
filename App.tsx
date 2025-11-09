import React, { Suspense, useEffect } from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const CreateListingPage = React.lazy(() => import('./pages/CreateListingPage'));
const EditListingPage = React.lazy(() => import('./pages/EditListingPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SearchResultsPage = React.lazy(() => import('./pages/SearchResultsPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const CollectionDetailPage = React.lazy(() => import('./pages/CollectionDetailPage'));
const CommunityHubPage = React.lazy(() => import('./pages/CommunityHubPage'));
const ForumThreadPage = React.lazy(() => import('./pages/ForumThreadPage'));
const PhotoStudioPage = React.lazy(() => import('./pages/PhotoStudioPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const AuthenticationCenterPage = React.lazy(() => import('./pages/AuthenticationCenterPage'));
const DisputeCenterPage = React.lazy(() => import('./pages/DisputeCenterPage'));
const LiveStreamPage = React.lazy(() => import('./pages/LiveStreamPage'));
const GovernancePage = React.lazy(() => import('./pages/GovernancePage'));
const ProposalDetailPage = React.lazy(() => import('./pages/ProposalDetailPage'));
const CreateProposalPage = React.lazy(() => import('./pages/CreateProposalPage'));
const CreateLiveStreamPage = React.lazy(() => import('./pages/CreateLiveStreamPage'));
const ProductListPage = React.lazy(() => import('./pages/ProductListPage'));
const ImportPage = React.lazy(() => import('./pages/ImportPage').then(mod => ({ default: mod.ImportPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));


// This component contains the main application layout and routes.
const AppContent: React.FC = () => {
  const location = useLocation();
  const { tg } = useTelegram();
  
  const isFullScreenPage = location.pathname.startsWith('/chat');
  const isSpecificChatOpen = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';

  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg]);
  
  const mainClass = isFullScreenPage
    ? "flex-grow overflow-hidden" 
    : "flex-grow";

  return (
    <div className="flex flex-col h-screen bg-base-200">
      {!isFullScreenPage && <Header />}
      <main className={mainClass}>
        <Suspense fallback={<div className="flex justify-center py-24"><Spinner size="lg" /></div>}>
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
        </Suspense>
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
