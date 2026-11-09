import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth-context";
import { CarsPage } from "./pages/CarsPage";
import { GaragePage } from "./pages/GaragePage";
import { HomePage } from "./pages/HomePage";
import { ListingPage } from "./pages/ListingPage";
import { MemberProfilePage } from "./pages/MemberProfilePage";
import { MembersPage } from "./pages/MembersPage";
import { AdminHomePage } from "./pages/admin/AdminHomePage";
import { AdminInventoryPage } from "./pages/admin/AdminInventoryPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { RecordReviewPage } from "./pages/RecordReviewPage";
import { ReviewDetailPage } from "./pages/ReviewDetailPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { TopTrumpsPage } from "./pages/TopTrumpsPage";
import { TradesPage } from "./pages/TradesPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<ListingPage />} />
        <Route path="/garage" element={<GaragePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:id" element={<MemberProfilePage />} />
        <Route path="/play" element={<TopTrumpsPage />} />
        <Route path="/trades" element={<TradesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/record" element={<RecordReviewPage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/inventory" element={<AdminInventoryPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
