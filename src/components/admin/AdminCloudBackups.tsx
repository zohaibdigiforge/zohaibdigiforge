import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Settings, 
  HardDrive, 
  Calendar, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  ExternalLink,
  Layers,
  ShoppingBag,
  Users,
  Package,
  Star,
  ShieldAlert,
  FileText,
  Mail,
  Zap,
  Globe,
  Check,
  Radio
} from 'lucide-react';
import { 
  CloudBackupRecord, 
  BackupSystemSettings,
  GoogleSheetsSyncConfig 
} from '../../types';
import { 
  getCloudBackupsFromDb, 
  subscribeToCloudBackups, 
  getBackupSettingsFromDb, 
  saveBackupSettingsToDb, 
  triggerServerBackupNow, 
  deleteCloudBackupRecord,
  getAllOrdersForBackupFromDb,
  getProductsFromDb,
  getAllUsersFromDb,
  getAuditLogsFromDb,
  getSecurityThreats
} from '../../services/firestoreService';
import { 
  exportBackupToExcelBlob, 
  triggerBrowserExcelDownload 
} from '../../utils/excelBackupGenerator';
import { auth } from '../../lib/firebase';
import {
  getSavedSheetsConfig,
  saveSheetsConfig,
  clearSheetsConfig,
  connectGoogleSheetsAuth,
  createDedicatedSyncSpreadsheet,
  syncAllDataToGoogleSheet,
  getCachedAccessToken,
  setCachedAccessToken
} from '../../services/googleSheetsService';

export const AdminCloudBackups: React.FC = () => {
  const [backups, setBackups] = useState<CloudBackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSystemSettings>({
    autoBackupEnabled: true,
    scheduledTime: '02:00',
    emailNotification: true,
    notifyEmail: 'zohaibdigiforge@gmail.com',
    retentionDays: 30,
    systemStatus: 'ACTIVE_ARMED'
  });
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingBrowser, setIsExportingBrowser] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'automated_nightly' | 'manual_admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedBackupForInspect, setSelectedBackupForInspect] = useState<CloudBackupRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Settings form local state
  const [editSettings, setEditSettings] = useState<BackupSystemSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Google Sheets Live Sync State
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsSyncConfig | null>(getSavedSheetsConfig());
  const [isConnectingSheets, setIsConnectingSheets] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. Initial Load & Live Listeners
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch server backups if running via Express
        try {
          const token = await auth.currentUser?.getIdToken();
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch('/api/admin/backups', { headers });
          const data = await res.json();
          if (data.success && Array.isArray(data.backups)) {
            setBackups(data.backups);
            if (data.settings) {
              setSettings(data.settings);
              setEditSettings(data.settings);
            }
          }
        } catch (e) {
          // Fallback to Firestore
          const fbBackups = await getCloudBackupsFromDb();
          setBackups(fbBackups);
        }

        // Fetch settings from Firestore
        const currentSettings = await getBackupSettingsFromDb();
        if (currentSettings) {
          setSettings(currentSettings);
          setEditSettings(currentSettings);
        }

        // Setup real-time listener for backups collection
        unsubscribe = subscribeToCloudBackups((updated) => {
          if (updated && updated.length > 0) {
            setBackups(updated);
          }
        });
      } catch (err) {
        console.error('Failed to load cloud backup data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Trigger Server-Side Instant Backup
  const handleTriggerServerBackup = async () => {
    setIsGenerating(true);
    try {
      const res: any = await triggerServerBackupNow();
      if (res.success && res.backup) {
        setBackups(prev => [res.backup, ...prev.filter(b => b.id !== res.backup.id)]);
        showToast('✅ Cloud backup generated successfully in Excel format (.xlsx)!', 'success');
      } else {
        // Fallback: generate via browser if server returned error or in mock mode
        await handleBrowserInstantExport();
      }
    } catch (err: any) {
      console.warn('Server backup error, triggering browser fallback:', err);
      await handleBrowserInstantExport();
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Client-Side Browser Direct Excel Generation
  const handleBrowserInstantExport = async () => {
    setIsExportingBrowser(true);
    try {
      showToast('Compiling live Firestore data into Excel Spreadsheet...', 'info');
      
      const [orders, products, users, auditLogs, threatData] = await Promise.all([
        getAllOrdersForBackupFromDb(),
        getProductsFromDb(),
        getAllUsersFromDb(),
        getAuditLogsFromDb(),
        getSecurityThreats()
      ]);
      const threats = Array.isArray(threatData) ? threatData : ((threatData as any)?.threats || []);

      const timestamp = new Date().toISOString();
      const dateFormatted = timestamp.replace(/[:.]/g, '-').slice(0, 19);
      const filename = `ZohaibDigiForge_Firestore_Backup_Manual_${dateFormatted}.xlsx`;

      const blob = await exportBackupToExcelBlob({
        backupTimestamp: timestamp,
        triggerType: 'manual_admin',
        databaseId: 'ai-studio-zohaibdigiforge-078ffbc8-6fe0-4d09-9943-4f07a3df3a5c',
        orders,
        products,
        users,
        reviews: [],
        auditLogs,
        threats
      });

      triggerBrowserExcelDownload(blob, filename);

      // Create record
      const clientRecord: CloudBackupRecord = {
        id: `backup_client_${Date.now()}`,
        filename,
        timestamp,
        triggerType: 'manual_admin',
        fileSizeBytes: blob.size,
        fileSizeFormatted: `${(blob.size / 1024).toFixed(1)} KB`,
        recordCounts: {
          orders: orders.length,
          products: products.length,
          users: users.length,
          reviews: 0,
          auditLogs: auditLogs.length,
          threats: threats.length,
          total: orders.length + products.length + users.length + auditLogs.length + threats.length
        },
        status: 'completed',
        downloadUrl: '#',
        sheetsIncluded: [
          'Executive_Summary',
          'Orders_Master',
          'Order_Items_Breakdown',
          'Users_Customers',
          'Products_Catalog',
          'Reviews_Feedback',
          'Cyber_Threats_Blocked',
          'Audit_Trail_Logs'
        ]
      };

      setBackups(prev => [clientRecord, ...prev]);
      showToast(`✅ Master Excel file generated and downloaded! (${orders.length} orders saved)`, 'success');
    } catch (err: any) {
      console.error('Browser export error:', err);
      showToast('Export failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsExportingBrowser(false);
    }
  };

  // 4. Download an existing backup safely using Bearer token
  const handleDownloadBackup = async (backup: CloudBackupRecord) => {
    if (backup.downloadUrl && backup.downloadUrl.startsWith('/api/')) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(backup.downloadUrl, {
          method: 'GET',
          headers
        });

        if (!res.ok) {
          throw new Error(`Download failed with status ${res.status}`);
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = backup.filename || 'backup.xlsx';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      } catch (err: any) {
        console.error('Download error:', err);
        showToast('Download failed: ' + (err.message || 'Unauthorized or server error'), 'error');
      }
    } else {
      // Re-trigger live download
      handleBrowserInstantExport();
    }
  };

  // 5. Delete an archive
  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup archive? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCloudBackupRecord(backupId);
      setBackups(prev => prev.filter(b => b.id !== backupId));
      showToast('Backup archive deleted successfully', 'info');
    } catch (err) {
      showToast('Failed to delete backup', 'error');
    }
  };

  // 6. Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveBackupSettingsToDb(editSettings);
      setSettings(editSettings);
      setShowSettingsModal(false);
      showToast('✅ Automated backup settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 7. Google Sheets Connection & Real-Time Sync
  const handleConnectGoogleSheets = async () => {
    setIsConnectingSheets(true);
    try {
      // 1. OAuth Sign In with Google Sheets scopes
      const { email, token } = await connectGoogleSheetsAuth();
      showToast('Authenticated with Google! Creating live spreadsheet...', 'info');

      // 2. Create dedicated spreadsheet with all store tabs
      const { spreadsheetId, spreadsheetUrl } = await createDedicatedSyncSpreadsheet(
        token,
        'Zohaib DigiForge - Live Store Data'
      );

      // 3. Fetch latest data
      const [orders, products, users] = await Promise.all([
        getAllOrdersForBackupFromDb(),
        getProductsFromDb(),
        getAllUsersFromDb()
      ]);

      // 4. Populate the new spreadsheet
      await syncAllDataToGoogleSheet(spreadsheetId, token, orders, products, users);

      // 5. Store configuration locally and update state
      const newConfig: GoogleSheetsSyncConfig = {
        spreadsheetId,
        spreadsheetUrl,
        connectedEmail: email,
        autoSyncOnChanges: true,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Synced ${orders.length} orders & ${products.length} products`,
        syncedOrdersCount: orders.length
      };

      saveSheetsConfig(newConfig);
      setSheetsConfig(newConfig);
      showToast('🚀 Google Sheets connected & synced! Live online spreadsheet is ready.', 'success');
    } catch (err: any) {
      console.error('Google Sheets connection error:', err);
      showToast('Failed to connect Google Sheets: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsConnectingSheets(false);
    }
  };

  const handleSyncGoogleSheetsNow = async () => {
    if (!sheetsConfig) return;
    setIsSyncingSheets(true);
    try {
      let token = getCachedAccessToken();
      if (!token) {
        // Re-authenticate to obtain fresh token
        const authRes = await connectGoogleSheetsAuth();
        token = authRes.token;
      }

      const [orders, products, users] = await Promise.all([
        getAllOrdersForBackupFromDb(),
        getProductsFromDb(),
        getAllUsersFromDb()
      ]);

      await syncAllDataToGoogleSheet(sheetsConfig.spreadsheetId, token, orders, products, users);

      const updatedConfig: GoogleSheetsSyncConfig = {
        ...sheetsConfig,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Successfully updated ${orders.length} orders`,
        syncedOrdersCount: orders.length
      };

      saveSheetsConfig(updatedConfig);
      setSheetsConfig(updatedConfig);
      showToast('✅ Google Sheet updated in real-time with latest store orders!', 'success');
    } catch (err: any) {
      console.error('Google Sheets sync error:', err);
      showToast('Sync error: ' + (err.message || 'Check connection'), 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleDisconnectGoogleSheets = () => {
    if (!window.confirm('Disconnect Google Sheets live sync? Future orders will not auto-sync to this sheet.')) {
      return;
    }
    clearSheetsConfig();
    setSheetsConfig(null);
    setCachedAccessToken(null);
    showToast('Google Sheets disconnected', 'info');
  };

  // Filter & Search
  const filteredBackups = backups.filter(b => {
    if (activeFilter !== 'all' && b.triggerType !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.filename.toLowerCase().includes(q) || 
             b.timestamp.toLowerCase().includes(q) ||
             (b.triggerType && b.triggerType.toLowerCase().includes(q));
    }
    return true;
  });

  const totalOrdersProtected = backups.reduce((max, b) => Math.max(max, b.recordCounts?.orders || 0), 0);
  const nightlyCount = backups.filter(b => b.triggerType === 'automated_nightly').length;

  return (
    <div id="admin-cloud-backups" className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all transform translate-y-0 ${
          toastMessage.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' :
          toastMessage.type === 'error' ? 'bg-rose-950/95 border-rose-500/50 text-rose-200' :
          'bg-slate-900/95 border-sky-500/50 text-sky-200'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-sky-400 animate-spin shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Automated Cloud Backup & Excel Redundancy
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Nightly 02:00 AM Active
              </span>
            </div>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Automated disaster-recovery system that snapshots Firestore collections, customer orders, payment receipts, and user accounts into structured multi-tab Excel workbooks (<code className="text-emerald-400 font-mono">.xlsx</code>).
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-settings-backup"
              onClick={() => {
                setEditSettings(settings);
                setShowSettingsModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Configure Schedule</span>
            </button>

            <button
              id="btn-export-browser-excel"
              onClick={handleBrowserInstantExport}
              disabled={isExportingBrowser || isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-500/40 transition shadow-sm disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExportingBrowser ? 'animate-bounce' : ''}`} />
              <span>{isExportingBrowser ? 'Exporting...' : 'Export Excel Now'}</span>
            </button>

            <button
              id="btn-run-server-backup"
              onClick={handleTriggerServerBackup}
              disabled={isGenerating || isExportingBrowser}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Archiving Cloud Data...' : 'Run Master Backup'}</span>
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Scheduled Time
            </div>
            <div className="text-lg font-bold text-white tracking-wide">
              {settings.scheduledTime} AM PKT
            </div>
            <div className="text-[11px] text-slate-500">
              Runs automatically every night
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              Total Archives
            </div>
            <div className="text-lg font-bold text-white tracking-wide">
              {backups.length} Snapshots
            </div>
            <div className="text-[11px] text-slate-500">
              {nightlyCount} Nightly • {backups.length - nightlyCount} Manual
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              Protected Orders
            </div>
            <div className="text-lg font-bold text-white tracking-wide">
              {totalOrdersProtected} Transactions
            </div>
            <div className="text-[11px] text-slate-500">
              Full breakdown & download links
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Redundancy Coverage
            </div>
            <div className="text-lg font-bold text-emerald-400 tracking-wide">
              8 Multi-Sheets
            </div>
            <div className="text-[11px] text-slate-500">
              Zero Data Loss Protocol
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Real-Time Live Sync Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Google Sheets Real-Time Live Sync</h3>
                  {sheetsConfig ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Real-time Google Cloud synchronization: Any order placed or status changed automatically updates your live Google Spreadsheet without downloading files.
                </p>
              </div>
            </div>

            {sheetsConfig && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Account: <strong className="text-white">{sheetsConfig.connectedEmail}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Last Synced: <strong className="text-white">{sheetsConfig.lastSyncedAt ? new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString() : 'Just now'}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Live Sync Hook: <strong className="text-emerald-400">Active on Every Order</strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {sheetsConfig ? (
              <>
                <a
                  href={sheetsConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Live Google Sheet</span>
                </a>

                <button
                  onClick={handleSyncGoogleSheetsNow}
                  disabled={isSyncingSheets}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSheets ? 'Syncing...' : 'Sync Full Data Now'}</span>
                </button>

                <button
                  onClick={handleDisconnectGoogleSheets}
                  className="p-2.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
                  title="Disconnect Google Sheet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGoogleSheets}
                disabled={isConnectingSheets}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <FileSpreadsheet className={`w-4 h-4 ${isConnectingSheets ? 'animate-spin' : ''}`} />
                <span>{isConnectingSheets ? 'Setting up Live Sheet...' : 'Connect Google Sheets'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sheet Structure Breakdown Visual Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">
              Excel Spreadsheet Anatomy (Included Worksheets)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
            OpenXML (.xlsx) Native
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm mb-1">
              <FileText className="w-4 h-4" />
              <span>1. Executive_Summary</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-level store revenue, total orders, users count, system audit status, and cloud DB credentials.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-sky-400 font-medium text-sm mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>2. Orders_Master</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete customer order transactions, payment methods, status, WhatsApp numbers, and download links.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm mb-1">
              <Package className="w-4 h-4" />
              <span>3. Order_Items_Breakdown</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Item-level lines: software licenses, product titles, expiry dates, and automated reminder flags.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>4. Users_Customers</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customer accounts, UID credentials, role types, membership status, contact details, and reward points.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-teal-400 font-medium text-sm mb-1">
              <HardDrive className="w-4 h-4" />
              <span>5. Products_Catalog</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Store catalog inventory: prices (PKR/USD), categories, file formats, ratings, and direct asset links.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-rose-400 font-medium text-sm mb-1">
              <Star className="w-4 h-4" />
              <span>6. Reviews_Feedback</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified customer ratings, feedback comments, star ratings, and review status logs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-purple-400 font-medium text-sm mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>7. Cyber_Threats_Blocked</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              WAF defense records: intercepted SQLi, XSS vectors, banned attacker IPs, and payload signatures.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition group">
            <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm mb-1">
              <Database className="w-4 h-4" />
              <span>8. Audit_Trail_Logs</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Administrative compliance records, system edits, staff access logs, and timestamped actions.
            </p>
          </div>
        </div>
      </div>

      {/* Archives Section Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Cloud Backup Archives ({filteredBackups.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical Excel snapshots generated automatically every night and on-demand
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search backups..."
                className="pl-9 pr-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition w-44 sm:w-56"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-md transition ${activeFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('automated_nightly')}
                className={`px-3 py-1 rounded-md transition ${activeFilter === 'automated_nightly' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Nightly Auto
              </button>
              <button
                onClick={() => setActiveFilter('manual_admin')}
                className={`px-3 py-1 rounded-md transition ${activeFilter === 'manual_admin' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>

        {/* Backups List */}
        {loading ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading cloud backup archives...</p>
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-semibold text-base">No Backup Archives Found</h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                No backup records match your filter. The automated cloud backup will run tonight at 02:00 AM, or you can trigger an immediate backup right now.
              </p>
            </div>
            <button
              onClick={handleBrowserInstantExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4" />
              Generate First Excel Backup Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBackups.map((backup) => (
              <div
                key={backup.id}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* File Details */}
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm sm:text-base font-mono">
                        {backup.filename}
                      </span>
                      {backup.triggerType === 'automated_nightly' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          Nightly Automated Cron
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          Manual Administrator Export
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                        {backup.fileSizeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        {backup.recordCounts?.orders || 0} Orders Protected
                      </span>
                      <span>•</span>
                      <span className="text-sky-400">
                        {backup.recordCounts?.users || 0} Users
                      </span>
                      <span>•</span>
                      <span className="text-teal-400">
                        {backup.recordCounts?.products || 0} Products
                      </span>
                      <span>•</span>
                      <span className="text-rose-400">
                        {backup.recordCounts?.reviews || 0} Reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:self-end lg:self-center shrink-0">
                  <button
                    onClick={() => setSelectedBackupForInspect(backup)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    Inspect Sheets
                  </button>

                  <button
                    onClick={() => handleDownloadBackup(backup)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBackup(backup.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete Archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Backup Schedule & Redundancy</h3>
                  <p className="text-xs text-slate-400">Configure nightly cron time and disaster recovery settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Auto Backup Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-white">Automated Nightly Backup</div>
                  <div className="text-xs text-slate-400">Run background cloud backup cron job every night</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSettings.autoBackupEnabled}
                    onChange={(e) => setEditSettings({ ...editSettings, autoBackupEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* Scheduled Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Scheduled Execution Time (24h format)
                </label>
                <input
                  type="time"
                  value={editSettings.scheduledTime}
                  onChange={(e) => setEditSettings({ ...editSettings, scheduledTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
                <span className="text-[11px] text-slate-500">
                  Default recommended: 02:00 AM (lowest server traffic period)
                </span>
              </div>

              {/* Email Notification Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-white">Email Notification & Attachment</div>
                  <div className="text-xs text-slate-400">Email backup confirmation & Excel file to admin</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editSettings.emailNotification}
                    onChange={(e) => setEditSettings({ ...editSettings, emailNotification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* Notification Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Notification Recipient Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={editSettings.notifyEmail}
                    onChange={(e) => setEditSettings({ ...editSettings, notifyEmail: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Retention Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Archive Retention Policy
                </label>
                <select
                  value={editSettings.retentionDays}
                  onChange={(e) => setEditSettings({ ...editSettings, retentionDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value={7}>Keep last 7 days</option>
                  <option value={14}>Keep last 14 days</option>
                  <option value={30}>Keep last 30 days (Recommended)</option>
                  <option value={60}>Keep last 60 days</option>
                  <option value={90}>Keep last 90 days</option>
                  <option value={365}>Keep 1 full year</option>
                </select>
                <span className="text-[11px] text-slate-500">
                  Archives older than this limit are automatically pruned from server disk
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Backup Modal */}
      {selectedBackupForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedBackupForInspect.filename}</h3>
                  <p className="text-xs text-slate-400">
                    Generated {new Date(selectedBackupForInspect.timestamp).toLocaleString()} • {selectedBackupForInspect.fileSizeFormatted}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBackupForInspect(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Data Volume in this Spreadsheet
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Orders Master</div>
                  <div className="text-lg font-bold text-emerald-400">{selectedBackupForInspect.recordCounts?.orders || 0}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Users & Customers</div>
                  <div className="text-lg font-bold text-sky-400">{selectedBackupForInspect.recordCounts?.users || 0}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Products Catalog</div>
                  <div className="text-lg font-bold text-teal-400">{selectedBackupForInspect.recordCounts?.products || 0}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Customer Reviews</div>
                  <div className="text-lg font-bold text-amber-400">{selectedBackupForInspect.recordCounts?.reviews || 0}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Security Threats</div>
                  <div className="text-lg font-bold text-purple-400">{selectedBackupForInspect.recordCounts?.threats || 0}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Audit Compliance Logs</div>
                  <div className="text-lg font-bold text-cyan-400">{selectedBackupForInspect.recordCounts?.auditLogs || 0}</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Disaster Recovery Ready
                </div>
                <p className="text-slate-300">
                  This workbook contains full data redundancy for all orders, customer credentials, products, and receipts. It can be opened directly in Microsoft Excel, Google Sheets, or LibreOffice Calc.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedBackupForInspect(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  handleDownloadBackup(selectedBackupForInspect);
                  setSelectedBackupForInspect(null);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Download Spreadsheet (.xlsx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
