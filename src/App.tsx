import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { CityProvider } from "./context/CityContext";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CityPickerModal from "./components/CityPickerModal";
import NavigationProgress from "./components/NavigationProgress";
import Home from "./pages/home/Home";
import Products from "./pages/products/Products";
import ProductDetail from "./pages/products/ProductDetail";
import Cart from "./pages/cart/Cart";
import Checkout from "./pages/cart/Checkout";
import Login from "./pages/auth/Login";
import Profile from "./pages/auth/Profile";
import Orders from "./pages/orders/Orders";
import OrderDetail from "./pages/orders/OrderDetail";
import WalletPage from "./pages/wallet/Wallet";
import Notifications from "./pages/notifications/Notifications";
import SearchPage from "./pages/search/Search";
import BrandPage from "./pages/brands/BrandPage";
import AllBrands from "./pages/brands/AllBrands";
import CategoryPage from "./pages/categories/CategoryPage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CityProvider>
          <BrowserRouter>
            <NavigationProgress />
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Header />
              <CityPickerModal />
              <div className="flex-1">
                <Routes>
                  <Route path="/"                  element={<Home />} />
                  <Route path="/products"          element={<Products />} />
                  <Route path="/products/:id"      element={<ProductDetail />} />
                  <Route path="/cart"              element={<Cart />} />
                  <Route path="/checkout"          element={<Checkout />} />
                  <Route path="/login"             element={<Login />} />
                  <Route path="/profile"           element={<Profile />} />
                  <Route path="/orders"            element={<Orders />} />
                  <Route path="/orders/:id"        element={<OrderDetail />} />
                  <Route path="/wallet"            element={<WalletPage />} />
                  <Route path="/notifications"     element={<Notifications />} />
                  <Route path="/search"            element={<SearchPage />} />
                  <Route path="/categories/:id"    element={<CategoryPage />} />
                  <Route path="/brands"            element={<AllBrands />} />
                  <Route path="/brands/:slug"      element={<BrandPage />} />
                  <Route path="*"                  element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </CityProvider>
      </CartProvider>
    </AuthProvider>
  );
}
