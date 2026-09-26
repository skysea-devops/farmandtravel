import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/features/home/HomePage";
import { AboutPage } from "@/features/about/AboutPage";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { ActivitiesPage } from "@/features/activities/ActivitiesPage";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hakkimizda" element={<AboutPage />} />
        <Route path="kesfet" element={<ExplorePage />} />
        <Route path="aktiviteler" element={<ActivitiesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
