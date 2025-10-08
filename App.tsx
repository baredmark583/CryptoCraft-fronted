import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import LandingPage from './pages/LandingPage';
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
import CreateLiveStreamPage from './pages/CreateLiveStreamPage';
import ProductListPage from './pages/ProductListPage';
import ImportPage from './pages/ImportPage';

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
    ? "bg-base-100 h-screen flex flex-col overflow-hidden font-sans text-base-content"
    : "bg-base-100 min-h-screen flex flex-col overflow-x-hidden font-sans text-base-content";

  const mainClass = isChatPage
    ? "flex-grow overflow-hidden"
    : "flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8";

  return (
    <div className={appContainerClass}>
      <Header />
      <main className={mainClass}>
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

// This component defines the routes for an unauthenticated user, primarily the landing page.
const UnauthenticatedApp: React.FC = () => (
    <Routes>
        <Route path="*" element={<LandingPage />} />
    </Routes>
);

// This component handles the initial loading and authentication check,
// then renders the appropriate part of the application.
const AppInitializer: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="bg-base-200 min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
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