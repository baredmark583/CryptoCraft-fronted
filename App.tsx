import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
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
import Spinner from './components/Spinner';
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
// FIX: Changed import to a named import to resolve "no default export" error.
import { ImportPage } from './pages/ImportPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';


// This component contains the main application layout and routes for authenticated users.
const AppContent: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  const isSpecificChatOpen = location.pathname.startsWith('/chat/') && location.pathname !== '/chat';
  const { tg } = useTelegram();

  useEffect(() => {
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, [tg]);

  const appContainerClass = isChatPage
    ? "bg-base-200 h-screen flex flex-col overflow-hidden font-sans text-base-content"
    : "min-h-screen flex flex-col overflow-x-hidden font-sans text-base-content";

  const mainClass = isChatPage
    ? "flex-grow overflow-hidden"
    : "flex-grow";

  return (
    <div className={appContainerClass}>
      <Header />
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
      {!isChatPage && <Footer />}
      { !isSpecificChatOpen && <MobileNavBar /> }
    </div>
  );
};

// This component wraps the main app content with providers that are specific to an authenticated user.
const AuthenticatedApp: React.FC = () => (
  <NotificationsProvider>
    <CollectionsProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </CollectionsProvider>
  </NotificationsProvider>
);

// This component handles the initial loading and authentication check,
// then renders the appropriate part of the application.
const AppInitializer: React.FC = () => {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="bg-base-200 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  // The app is now always rendered, letting internal components and routes handle auth state.
  return <AuthenticatedApp />;
}

// The root App component sets up the global providers that are needed
// for both authenticated and unauthenticated experiences.
const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AuthProvider>
        <TonConnectUIProvider>
          <IconProvider>
            <Router>
              <AppInitializer />
            </Router>
          </IconProvider>
        </TonConnectUIProvider>
      </AuthProvider>
    </AppContextProvider>
  );
};

export default App;