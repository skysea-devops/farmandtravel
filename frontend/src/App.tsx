import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/features/home/HomePage";
import { AboutPage } from "@/features/about/AboutPage";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { ActivitiesPage } from "@/features/activities/ActivitiesPage";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { RequireAuth } from "@/components/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hakkimizda" element={<AboutPage />} />
        <Route path="kesfet" element={<ExplorePage />} />
        <Route path="aktiviteler" element={<ActivitiesPage />} />
        <Route path="kayit" element={<SignUpPage />} />
        <Route path="giris" element={<LoginPage />} />
        <Route path="onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route path="profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
