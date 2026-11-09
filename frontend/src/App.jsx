import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MedicalReports from "./pages/reports/MedicalReports";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/patient/Dashboard";
import XrayAnalyzer from "./pages/xray/XrayAnalyzer";
import MedicineScanner from "./pages/reports/MedicineScanner";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/xray"
            element={
              <ProtectedRoute>
                <XrayAnalyzer />
              </ProtectedRoute>
            }
          />

         <Route
  path="/reports"
  element={
    <ProtectedRoute>
      <MedicalReports />
    </ProtectedRoute>
  }
/>
<Route
  path="/medicine-scanner"
  element={
    <ProtectedRoute>
      <MedicineScanner />
    </ProtectedRoute>
  }
/>

          <Route
  path="/reports"
  element={
    <ProtectedRoute>
      <MedicalReports />
    </ProtectedRoute>
  }
/>

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;