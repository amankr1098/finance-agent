import { Navigate, Route, Routes } from "react-router-dom"
import { RequireAuth } from "@/auth/RequireAuth"
import { AppLayout } from "@/components/layout/AppLayout"
import AuthCallbackPage from "@/pages/AuthCallback"
import DashboardPage from "@/pages/Dashboard"
import ProfilePage from "@/pages/Profile"
import SignInPage from "@/pages/SignIn"

function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
