import { Routes, Route, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { HomePage } from '@/features/home/HomePage'
import { HostsPage } from '@/features/hosts/HostsPage'
import { HostProfilePage } from '@/features/hosts/HostProfilePage'
import { HowItWorksPage } from '@/features/marketing/HowItWorksPage'
import { PricingPage } from '@/features/marketing/PricingPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'

// Module 2 (Projects + supporters — the "support / investment" section) is parked
// under features/projects for later. There is no separate "experience" listing:
// a host's profile carries the help they want.

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hosts" element={<HostsPage />} />
        <Route path="hosts/:id" element={<HostProfilePage />} />
        {/* Old experience URLs now resolve to hosts */}
        <Route path="experiences/*" element={<Navigate to="/hosts" replace />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
