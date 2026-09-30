import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/features/home/HomePage";
import { AboutPage } from "@/features/about/AboutPage";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { ActivitiesPage } from "@/features/activities/ActivitiesPage";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { PanelPage } from "@/features/app/PanelPage";
import { KesfetPage } from "@/features/app/KesfetPage";
import { MemberProfilePage } from "@/features/app/MemberProfilePage";
import { BaglantilarPage } from "@/features/app/BaglantilarPage";
import { MesajlarPage } from "@/features/app/MesajlarPage";
import { KaydedilenlerPage } from "@/features/app/KaydedilenlerPage";
import { BildirimlerPage } from "@/features/app/BildirimlerPage";
import { AbonelikPage } from "@/features/app/AbonelikPage";
import { AktiviteOnayPage } from "@/features/app/AktiviteOnayPage";
import { AyarlarPage } from "@/features/app/stubs";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { RequireAuth } from "@/components/RequireAuth";

export default function App() {
  return (
    <Routes>
      {/* Public marketing site */}
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hakkimizda" element={<AboutPage />} />
        <Route path="kesfet" element={<ExplorePage />} />
        <Route path="aktiviteler" element={<ActivitiesPage />} />
        <Route path="kayit" element={<SignUpPage />} />
        <Route path="giris" element={<LoginPage />} />
        <Route path="onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Member app (behind auth) */}
      <Route path="app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<PanelPage />} />
        <Route path="kesfet" element={<KesfetPage />} />
        <Route path="uye/:id" element={<MemberProfilePage />} />
        <Route path="baglantilar" element={<BaglantilarPage />} />
        <Route path="mesajlar" element={<MesajlarPage />} />
        <Route path="mesajlar/:connectionId" element={<MesajlarPage />} />
        <Route path="kaydedilenler" element={<KaydedilenlerPage />} />
        <Route path="bildirimler" element={<BildirimlerPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="abonelik" element={<AbonelikPage />} />
        <Route path="aktivite-onay" element={<AktiviteOnayPage />} />
        <Route path="ayarlar" element={<AyarlarPage />} />
      </Route>
    </Routes>
  );
}
