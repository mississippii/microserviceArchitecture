import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';

// Layout wrapper component
function WithLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages - No layout (full page design) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main pages - With layout */}
        <Route
          path="/"
          element={
            <WithLayout>
              <Home />
            </WithLayout>
          }
        />
        <Route
          path="/products"
          element={
            <WithLayout>
              <Products />
            </WithLayout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <WithLayout>
              <ProductDetail />
            </WithLayout>
          }
        />
        <Route
          path="/cart"
          element={
            <WithLayout>
              <Cart />
            </WithLayout>
          }
        />
        <Route
          path="/wishlist"
          element={
            <WithLayout>
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold">Wishlist</h1>
                <p className="text-gray-500 mt-2">Coming soon...</p>
              </div>
            </WithLayout>
          }
        />
        <Route
          path="/orders"
          element={
            <WithLayout>
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold">My Orders</h1>
                <p className="text-gray-500 mt-2">Coming soon...</p>
              </div>
            </WithLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <WithLayout>
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-gray-500 mt-2">Coming soon...</p>
              </div>
            </WithLayout>
          }
        />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
