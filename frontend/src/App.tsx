import { Navigate, Route, Routes } from "react-router-dom"
import { RequireAuth } from "@/auth/RequireAuth"
import AuthCallbackPage from "@/pages/AuthCallback"
import DashboardPage from "@/pages/Dashboard"
import SignInPage from "@/pages/SignIn"

function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
