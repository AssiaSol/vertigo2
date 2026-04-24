import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DealsPage } from "./pages/DealsPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { RestaurantOrdersPage } from "./pages/RestaurantOrdersPage";
import { BecomeMerchantPage } from "./pages/BecomeMerchantPage";
import { AdminApprovalsPage } from "./pages/AdminApprovalsPage";
import { ChatBot } from "./components/chatbot";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/deals"
        element={
          <ProtectedRoute>
            <DealsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MyOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-restaurant"
        element={
          <ProtectedRoute>
            <RestaurantOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route path="/restaurant-orders" element={<Navigate to="/my-restaurant" replace />} />
      <Route
        path="/become-merchant"
        element={
          <ProtectedRoute>
            <BecomeMerchantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute>
            <AdminApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ChatBot />
      </BrowserRouter>
    </AuthProvider>
  );
}
