import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout, { ProtectedRoute, GuestRoute } from "./components/Layout";
import Home from "./pages/Home";
import Studies from "./pages/Studies";
import Mentor from "./pages/Mentor";
import Student from "./pages/Student";
import Predictor from "./pages/Predictor";
import Chatbot from "./pages/Chatbot";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/mentor" element={<Mentor />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/studies" element={<Studies />} />
              <Route path="/predictor" element={<Predictor />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/student" element={<Student />} />
            </Route>

            {/* Guest only */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
