import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { QRScannerModal } from './components/common/QRScannerModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { DecodedQRTarget } from './utils/qr';
import { dbService } from './services/db';
import { testFirestoreConnection } from './services/firebase';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { MovementsPage } from './pages/MovementsPage';
import { QRCodesPage } from './pages/QRCodesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { FulfillRequisitionPage } from './pages/FulfillRequisitionPage';
import { EPIHistoryPage } from './pages/EPIHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { TechnicianDashboardPage } from './pages/TechnicianDashboardPage';
import { AlmoxarifadoDashboardPage } from './pages/AlmoxarifadoDashboardPage';
import { RegionalComparisonPage } from './pages/RegionalComparisonPage';
import { ExcelSyncPage } from './pages/ExcelSyncPage';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Deep linking targets
  const [targetCode, setTargetCode] = useState<string | undefined>(undefined);

  // Live metrics for badges
  const [pendingReqCount, setPendingReqCount] = useState(0);
  const [newReqCount, setNewReqCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [alerts, setAlerts] = useState(dbService.getSystemAlerts());

  const refreshBadges = () => {
    const metrics = dbService.getSystemMetrics();
    setPendingReqCount(metrics.pendingRequisitionsCount);
    setLowStockCount(metrics.belowMinStockCount);
    setAlerts(dbService.getSystemAlerts());
    const reqs = dbService.getRequisitions();
    const newCount = reqs.filter((r) => r.isNewNotification || r.status === 'enviada').length;
    setNewReqCount(newCount);
  };

  useEffect(() => {
    dbService.init();
    refreshBadges();
    testFirestoreConnection();
    const unsub = dbService.subscribe(refreshBadges);
    return () => unsub();
  }, []);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: NavigationTab, code?: string) => {
    setTargetCode(code);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // When a QR Code is scanned via camera
  const handleScanSuccess = (result: DecodedQRTarget) => {
    if (result.type === 'shelf') {
      handleNavigate('qrcodes', result.code);
    } else if (result.type === 'material') {
      handleNavigate('materials', result.code);
    } else {
      // Try finding if it's a requisition, material, or shelf
      const req = dbService.getRequisitionByNumber(result.code);
      if (req) {
        handleNavigate('fulfillment', result.code);
      } else {
        handleNavigate('materials', result.code);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col antialiased selection:bg-orange-500 selection:text-white max-w-full overflow-x-hidden">
      {/* Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadAlertCount={alerts.length}
      />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto min-w-0">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pendingReqCount={pendingReqCount}
          newReqCount={newReqCount}
          lowStockCount={lowStockCount}
        />

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 px-2.5 py-3.5 sm:px-4 sm:py-5 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
            />
          )}

          {currentTab === 'tecnico_panel' && (
            <TechnicianDashboardPage
              onNavigateToAlmoxarifado={() => handleNavigate('almoxarifado_panel')}
            />
          )}

          {currentTab === 'almoxarifado_panel' && (
            <AlmoxarifadoDashboardPage
              onNavigateToTechnician={() => handleNavigate('tecnico_panel')}
              onNavigateToDirectExit={() => handleNavigate('movements')}
            />
          )}

          {currentTab === 'regional_comparison' && (
            <RegionalComparisonPage />
          )}

          {currentTab === 'excel_sync' && (
            <ExcelSyncPage />
          )}

          {currentTab === 'materials' && (
            <MaterialsPage initialSearchCode={targetCode} />
          )}

          {currentTab === 'movements' && <MovementsPage />}

          {currentTab === 'qrcodes' && (
            <QRCodesPage
              onOpenQRScanner={() => setIsQRScannerOpen(true)}
              onNavigate={handleNavigate}
              targetInitialCode={targetCode}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesPage
              onNavigate={handleNavigate}
              targetInitialMatricula={targetCode}
            />
          )}

          {currentTab === 'requisitions' && (
            <RequisitionsPage
              onNavigate={handleNavigate}
              targetInitialWorkerId={targetCode}
            />
          )}

          {currentTab === 'fulfillment' && (
            <FulfillRequisitionPage initialSearchReqNumber={targetCode} />
          )}

          {currentTab === 'epi_history' && (
            <EPIHistoryPage initialSearchMatricula={targetCode} />
          )}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'audit' && <AuditPage />}

          {currentTab === 'users' && <UsersPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        alerts={alerts}
        onNavigate={(tab) => handleNavigate(tab as NavigationTab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
