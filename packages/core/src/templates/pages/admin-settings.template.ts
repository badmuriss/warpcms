import { renderAdminLayoutCatalyst, AdminLayoutCatalystData } from '../layouts/admin-layout-catalyst.template'
import { renderConfirmationDialog, getConfirmationDialogScript } from '../components/confirmation-dialog.template'
import { t } from '../../i18n'

export interface SettingsPageData {
  user?: {
    name: string
    email: string
    role: string
  }
  settings?: {
    general?: GeneralSettings
    migrations?: MigrationSettings
    databaseTools?: DatabaseToolsSettings
  }
  activeTab?: string
  version?: string
  locale?: string;
  userLanguage?: string;
}

export interface GeneralSettings {
  siteName: string
  siteDescription: string
  adminEmail: string
  timezone: string
  language: string
  maintenanceMode: boolean
}

export interface MigrationSettings {
  totalMigrations: number
  appliedMigrations: number
  pendingMigrations: number
  lastApplied?: string
  migrations: Array<{
    id: string
    name: string
    filename: string
    description?: string
    applied: boolean
    appliedAt?: string
    size?: number
  }>
}

export interface DatabaseToolsSettings {
  totalTables: number
  totalRows: number
  lastBackup?: string
  databaseSize?: string
  tables: Array<{
    name: string
    rowCount: number
  }>
}

export function renderSettingsPage(data: SettingsPageData): string {
  const activeTab = data.activeTab || 'general'
  const locale = data.locale || 'en'

  const pageContent = `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">${t('settings.title', locale)}</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">${t('settings.subtitle', locale)}</p>
        </div>
      </div>

      <!-- Settings Navigation Tabs -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 mb-6 overflow-hidden">
        <div class="border-b border-zinc-950/5 dark:border-white/10">
          <nav class="flex overflow-x-auto" role="tablist">
            ${renderTabButton('general', t('settings.tabGeneral', locale), 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', activeTab)}
            ${renderTabButton('migrations', t('settings.tabMigrations', locale), 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', activeTab)}
            ${renderTabButton('database-tools', t('settings.tabDatabaseTools', locale), 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', activeTab)}
          </nav>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
        <div id="settings-content" class="p-8">
          ${renderTabContent(activeTab, data.settings, locale, data.userLanguage)}
        </div>
      </div>
    </div>

    <script>
      // i18n strings for client-side JS
      window.__i18n = {
        saving: '${t('settings.saving', locale)}',
        savedSuccess: '${t('settings.savedSuccess', locale)}',
        saveFailed: '${t('settings.saveFailed', locale)}',
        saveFailedRetry: '${t('settings.saveFailedRetry', locale)}',
        running: '${t('settings.running', locale)}',
        runPending: '${t('settings.runPending', locale)}',
        failedToRunMigrations: '${t('settings.failedToRunMigrations', locale)}',
        errorRunningMigrations: '${t('settings.errorRunningMigrations', locale)}',
        schemaValid: '${t('settings.schemaValid', locale)}',
        schemaValidationFailed: '${t('settings.schemaValidationFailed', locale)}',
        failedToValidateSchema: '${t('settings.failedToValidateSchema', locale)}',
        errorValidatingSchema: '${t('settings.errorValidatingSchema', locale)}',
        applied: '${t('settings.applied', locale)}',
        pending: '${t('settings.pending', locale)}',
        creatingBackup: '${t('settings.creatingBackup', locale)}',
        createBackup: '${t('settings.createBackup', locale)}',
        failedToCreateBackup: '${t('settings.failedToCreateBackup', locale)}',
        errorCreatingBackup: '${t('settings.errorCreatingBackup', locale)}',
        truncatePrompt: '${t('settings.truncatePrompt', locale)}',
        truncateCancelled: '${t('settings.truncateCancelled', locale)}',
        truncating: '${t('settings.truncating', locale)}',
        truncateAllData: '${t('settings.truncateAllData', locale)}',
        tablesCleared: '${t('settings.tablesCleared', locale)}',
        failedToTruncate: '${t('settings.failedToTruncate', locale)}',
        errorTruncating: '${t('settings.errorTruncating', locale)}',
        dbValidationPassed: '${t('settings.dbValidationPassed', locale)}',
        dbValidationFailed: '${t('settings.dbValidationFailed', locale)}',
        failedToValidateDb: '${t('settings.failedToValidateDb', locale)}',
        errorValidatingDb: '${t('settings.errorValidatingDb', locale)}',
        rows: '${t('settings.rows', locale)}',
      };

      // Initialize tab-specific features on page load
      const currentTab = '${activeTab}';

      // Track original language to detect changes after save
      var __originalSettingsLanguage = '${data.userLanguage || 'en'}';

      async function saveGeneralSettings() {
        // Collect all form data from general settings
        const formData = new FormData();

        // Get all form inputs in the settings content area
        document.querySelectorAll('#settings-content input, #settings-content select, #settings-content textarea').forEach(input => {
          if (input.type === 'checkbox') {
            formData.append(input.name, input.checked ? 'true' : 'false');
          } else if (input.name) {
            formData.append(input.name, input.value);
          }
        });

        // Show loading state
        const saveBtn = document.querySelector('button[onclick="saveGeneralSettings()"]');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<svg class="animate-spin -ml-0.5 mr-1.5 h-5 w-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>' + window.__i18n.saving;
        saveBtn.disabled = true;

        try {
          const response = await fetch('/admin/settings/general', {
            method: 'POST',
            body: formData
          });

          const result = await response.json();

          if (result.success) {
            showNotification(result.message || window.__i18n.savedSuccess, 'success');
            // Reload page if language changed to render in new locale
            var langSelect = document.getElementById('settings-language');
            if (langSelect && langSelect.value !== __originalSettingsLanguage) {
              setTimeout(function() { window.location.reload(); }, 600);
            }
          } else {
            showNotification(result.error || window.__i18n.saveFailed, 'error');
          }
        } catch (error) {
          console.error('Error saving settings:', error);
          showNotification(window.__i18n.saveFailedRetry, 'error');
        } finally {
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }
      }

      // Migration functions
      window.refreshMigrationStatus = async function() {
        try {
          const response = await fetch('/admin/settings/api/migrations/status');
          const result = await response.json();
          
          if (result.success) {
            updateMigrationUI(result.data);
          } else {
            console.error('Failed to refresh migration status');
          }
        } catch (error) {
          console.error('Error loading migration status:', error);
        }
      };

      window.runPendingMigrations = async function() {
        const btn = document.getElementById('run-migrations-btn');
        if (!btn || btn.disabled) return;

        showConfirmDialog('run-migrations-confirm');
      };

      window.performRunMigrations = async function() {
        const btn = document.getElementById('run-migrations-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = window.__i18n.running;

        try {
          const response = await fetch('/admin/settings/api/migrations/run', {
            method: 'POST'
          });
          const result = await response.json();

          if (result.success) {
            alert(result.message);
            setTimeout(() => window.refreshMigrationStatus(), 1000);
          } else {
            alert(result.error || window.__i18n.failedToRunMigrations);
          }
        } catch (error) {
          alert(window.__i18n.errorRunningMigrations);
        } finally {
          btn.disabled = false;
          btn.innerHTML = window.__i18n.runPending;
        }
      };

      window.validateSchema = async function() {
        try {
          const response = await fetch('/admin/settings/api/migrations/validate');
          const result = await response.json();

          if (result.success) {
            if (result.data.valid) {
              alert(window.__i18n.schemaValid);
            } else {
              alert(window.__i18n.schemaValidationFailed.replace('{{issues}}', result.data.issues.join(', ')));
            }
          } else {
            alert(window.__i18n.failedToValidateSchema);
          }
        } catch (error) {
          alert(window.__i18n.errorValidatingSchema);
        }
      };

      window.updateMigrationUI = function(data) {
        const totalEl = document.getElementById('total-migrations');
        const appliedEl = document.getElementById('applied-migrations');
        const pendingEl = document.getElementById('pending-migrations');

        if (totalEl) totalEl.textContent = data.totalMigrations;
        if (appliedEl) appliedEl.textContent = data.appliedMigrations;
        if (pendingEl) pendingEl.textContent = data.pendingMigrations;

        const runBtn = document.getElementById('run-migrations-btn');
        if (runBtn) {
          runBtn.disabled = data.pendingMigrations === 0;
        }

        // Update migrations list
        const listContainer = document.getElementById('migrations-list');
        if (listContainer && data.migrations && data.migrations.length > 0) {
          listContainer.innerHTML = data.migrations.map(migration => \`
            <div class="px-6 py-4 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    \${migration.applied
                      ? '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                      : '<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                    }
                  </div>
                  <div>
                    <h5 class="text-white font-medium">\${migration.name}</h5>
                    <p class="text-sm text-gray-300">\${migration.filename}</p>
                    \${migration.description ? \`<p class="text-xs text-gray-400 mt-1">\${migration.description}</p>\` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-4 text-sm">
                \${migration.size ? \`<span class="text-gray-400">\${(migration.size / 1024).toFixed(1)} KB</span>\` : ''}
                <span class="px-2 py-1 rounded-full text-xs font-medium \${
                  migration.applied
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }">
                  \${migration.applied ? window.__i18n.applied : window.__i18n.pending}
                </span>
                \${migration.appliedAt ? \`<span class="text-gray-400">\${new Date(migration.appliedAt).toLocaleDateString()}</span>\` : ''}
              </div>
            </div>
          \`).join('');
        }
      };
      
      // Auto-load migrations when switching to that tab
      function initializeMigrations() {
        if (currentTab === 'migrations') {
          setTimeout(window.refreshMigrationStatus, 500);
        }
      }
      
      // Database Tools functions
      window.refreshDatabaseStats = async function() {
        try {
          const response = await fetch('/admin/settings/api/database-tools/stats');
          const result = await response.json();
          
          if (result.success) {
            updateDatabaseToolsUI(result.data);
          } else {
            console.error('Failed to refresh database stats');
          }
        } catch (error) {
          console.error('Error loading database stats:', error);
        }
      };

      window.createDatabaseBackup = async function() {
        const btn = document.getElementById('create-backup-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = window.__i18n.creatingBackup;

        try {
          const response = await fetch('/admin/settings/api/database-tools/backup', {
            method: 'POST'
          });
          const result = await response.json();

          if (result.success) {
            alert(result.message);
            setTimeout(() => window.refreshDatabaseStats(), 1000);
          } else {
            alert(result.error || window.__i18n.failedToCreateBackup);
          }
        } catch (error) {
          alert(window.__i18n.errorCreatingBackup);
        } finally {
          btn.disabled = false;
          btn.innerHTML = window.__i18n.createBackup;
        }
      };

      window.truncateDatabase = async function() {
        // Show dangerous operation warning
        const confirmText = prompt(window.__i18n.truncatePrompt);

        if (confirmText !== 'TRUNCATE ALL DATA') {
          alert(window.__i18n.truncateCancelled);
          return;
        }

        const btn = document.getElementById('truncate-db-btn');
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = window.__i18n.truncating;

        try {
          const response = await fetch('/admin/settings/api/database-tools/truncate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              confirmText: confirmText
            })
          });
          const result = await response.json();

          if (result.success) {
            alert(result.message + '\\n\\n' + window.__i18n.tablesCleared + result.data.tablesCleared.join(', '));
            setTimeout(() => {
              window.refreshDatabaseStats();
              // Optionally reload page to refresh all data
              window.location.reload();
            }, 2000);
          } else {
            alert(result.error || window.__i18n.failedToTruncate);
          }
        } catch (error) {
          alert(window.__i18n.errorTruncating);
        } finally {
          btn.disabled = false;
          btn.innerHTML = window.__i18n.truncateAllData;
        }
      };

      window.validateDatabase = async function() {
        try {
          const response = await fetch('/admin/settings/api/database-tools/validate');
          const result = await response.json();

          if (result.success) {
            if (result.data.valid) {
              alert(window.__i18n.dbValidationPassed);
            } else {
              alert(window.__i18n.dbValidationFailed.replace('{{issues}}', result.data.issues.join('\\n')));
            }
          } else {
            alert(window.__i18n.failedToValidateDb);
          }
        } catch (error) {
          alert(window.__i18n.errorValidatingDb);
        }
      };

      window.updateDatabaseToolsUI = function(data) {
        const totalTablesEl = document.getElementById('total-tables');
        const totalRowsEl = document.getElementById('total-rows');
        const tablesListEl = document.getElementById('tables-list');

        if (totalTablesEl) totalTablesEl.textContent = data.tables.length;
        if (totalRowsEl) totalRowsEl.textContent = data.totalRows.toLocaleString();

        if (tablesListEl && data.tables && data.tables.length > 0) {
          tablesListEl.innerHTML = data.tables.map(table => \`
            <a
              href="/admin/database-tools/tables/\${table.name}"
              class="flex items-center justify-between py-3 px-4 rounded-lg bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 cursor-pointer transition-colors ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 no-underline"
            >
              <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span class="text-zinc-950 dark:text-white font-medium">\${table.name}</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-zinc-500 dark:text-zinc-400 text-sm">\${table.rowCount.toLocaleString()} \${window.__i18n.rows}</span>
                <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>
          \`).join('');
        }
      };

      // Auto-load tab-specific data after all functions are defined
      if (currentTab === 'migrations') {
        setTimeout(window.refreshMigrationStatus, 500);
      }

      if (currentTab === 'database-tools') {
        setTimeout(window.refreshDatabaseStats, 500);
      }
    </script>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog({
      id: 'run-migrations-confirm',
      title: t('settings.runMigrationsTitle', locale),
      message: t('settings.runMigrationsMessage', locale),
      confirmText: t('settings.runMigrationsTitle', locale),
      cancelText: t('common.cancel', locale),
      iconColor: 'blue',
      confirmClass: 'bg-blue-500 hover:bg-blue-400',
      onConfirm: 'performRunMigrations()'
    })}

    ${getConfirmationDialogScript()}
  `

  const layoutData: AdminLayoutCatalystData = {
    title: t('settings.title', locale),
    pageTitle: t('settings.title', locale),
    currentPath: '/admin/settings',
    user: data.user,
    version: data.version,
    content: pageContent,
    locale,
  }

  return renderAdminLayoutCatalyst(layoutData)
}

function renderTabButton(tabId: string, label: string, iconPath: string, activeTab: string): string {
  const isActive = activeTab === tabId
  const baseClasses = 'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap no-underline'
  const activeClasses = isActive
    ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'

  return `
    <a
      href="/admin/settings/${tabId}"
      data-tab="${tabId}"
      class="${baseClasses} ${activeClasses}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"/>
      </svg>
      <span>${label}</span>
    </a>
  `
}

function renderTabContent(activeTab: string, settings?: SettingsPageData['settings'], locale = 'en', userLanguage = 'en'): string {
  switch (activeTab) {
    case 'general':
      return renderGeneralSettings(settings?.general, locale, userLanguage)
    case 'migrations':
      return renderMigrationSettings(settings?.migrations, locale)
    case 'database-tools':
      return renderDatabaseToolsSettings(settings?.databaseTools, locale)
    default:
      return renderGeneralSettings(settings?.general, locale, userLanguage)
  }
}

function renderGeneralSettings(settings?: GeneralSettings, locale = 'en', userLanguage = 'en'): string {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg/7 font-semibold text-zinc-950 dark:text-white">${t('settings.generalTitle', locale)}</h3>
        <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">${t('settings.generalSubtitle', locale)}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">${t('settings.siteName', locale)}</label>
            <input
              type="text"
              name="siteName"
              value="${settings?.siteName || 'WarpCMS AI'}"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="${t('settings.siteNamePlaceholder', locale)}"
            />
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">${t('settings.adminEmail', locale)}</label>
            <input
              type="email"
              name="adminEmail"
              value="${settings?.adminEmail || 'admin@example.com'}"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">${t('settings.timezone', locale)}</label>
            <select
              name="timezone"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="UTC" ${settings?.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
              <option value="America/New_York" ${settings?.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
              <option value="America/Chicago" ${settings?.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
              <option value="America/Denver" ${settings?.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
              <option value="America/Los_Angeles" ${settings?.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">${t('settings.siteDescription', locale)}</label>
            <textarea
              name="siteDescription"
              rows="3"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
              placeholder="${t('settings.siteDescriptionPlaceholder', locale)}"
            >${settings?.siteDescription || ''}</textarea>
          </div>

          <div>
            <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white mb-2">${t('settings.language', locale)}</label>
            <select
              id="settings-language"
              name="language"
              class="w-full rounded-lg bg-white dark:bg-white/5 px-3 py-2 text-sm/6 text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
            >
              <option value="en" ${userLanguage === 'en' ? 'selected' : ''}>English</option>
              <option value="pt" ${userLanguage === 'pt' ? 'selected' : ''}>Português</option>
              <option value="es" ${userLanguage === 'es' ? 'selected' : ''}>Español</option>
            </select>
          </div>
          
          <div class="flex gap-3">
            <div class="flex h-6 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  ${settings?.maintenanceMode ? 'checked' : ''}
                  class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                />
                <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                  <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                  <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                </svg>
              </div>
            </div>
            <div class="text-sm/6">
              <label for="maintenanceMode" class="font-medium text-zinc-950 dark:text-white">
                ${t('settings.maintenanceMode', locale)}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="mt-8 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex justify-end">
        <button
          onclick="saveGeneralSettings()"
          class="inline-flex items-center justify-center rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
        >
          <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          ${t('settings.saveChanges', locale)}
        </button>
      </div>
    </div>
  `
}

function renderMigrationSettings(settings?: MigrationSettings, locale = 'en'): string {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-white mb-4">${t('settings.migrationsTitle', locale)}</h3>
        <p class="text-gray-300 mb-6">${t('settings.migrationsSubtitle', locale)}</p>
      </div>

      <!-- Migration Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="backdrop-blur-md bg-blue-500/20 rounded-lg border border-blue-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-300">${t('settings.totalMigrations', locale)}</p>
              <p id="total-migrations" class="text-2xl font-bold text-white">${settings?.totalMigrations || '0'}</p>
            </div>
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
          </div>
        </div>
        
        <div class="backdrop-blur-md bg-green-500/20 rounded-lg border border-green-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-300">${t('settings.applied', locale)}</p>
              <p id="applied-migrations" class="text-2xl font-bold text-white">${settings?.appliedMigrations || '0'}</p>
            </div>
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        
        <div class="backdrop-blur-md bg-orange-500/20 rounded-lg border border-orange-500/30 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-orange-300">${t('settings.pending', locale)}</p>
              <p id="pending-migrations" class="text-2xl font-bold text-white">${settings?.pendingMigrations || '0'}</p>
            </div>
            <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Migration Actions -->
      <div class="flex items-center space-x-4 mb-6">
        <button 
          onclick="window.refreshMigrationStatus()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          ${t('settings.refreshStatus', locale)}
        </button>

        <button
          onclick="window.runPendingMigrations()"
          id="run-migrations-btn"
          class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          ${(settings?.pendingMigrations || 0) === 0 ? 'disabled' : ''}
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4.586a1 1 0 00.293.707l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1"/>
          </svg>
          ${t('settings.runPending', locale)}
        </button>

        <button
          onclick="window.validateSchema()"
          class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          ${t('settings.validateSchema', locale)}
        </button>
      </div>

      <!-- Migrations List -->
      <div class="backdrop-blur-md bg-white/10 rounded-lg border border-white/20 overflow-hidden">
        <div class="px-6 py-4 border-b border-white/10">
          <h4 class="text-lg font-medium text-white">${t('settings.migrationHistory', locale)}</h4>
          <p class="text-sm text-gray-300 mt-1">${t('settings.migrationHistorySubtitle', locale)}</p>
        </div>
        
        <div id="migrations-list" class="divide-y divide-white/10">
          <div class="px-6 py-8 text-center">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
            <p class="text-gray-300">${t('settings.loadingMigrationStatus', locale)}</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Load migration status when tab becomes active
      if (typeof refreshMigrationStatus === 'undefined') {
        window.refreshMigrationStatus = async function() {
          try {
            const response = await fetch('/admin/settings/api/migrations/status');
            const result = await response.json();
            
            if (result.success) {
              updateMigrationUI(result.data);
            } else {
              console.error('Failed to refresh migration status');
            }
          } catch (error) {
            console.error('Error loading migration status:', error);
          }
        };

        window.runPendingMigrations = async function() {
          const btn = document.getElementById('run-migrations-btn');
          if (!btn || btn.disabled) return;

          showConfirmDialog('run-migrations-confirm');
        };

        window.performRunMigrations = async function() {
          const btn = document.getElementById('run-migrations-btn');
          if (!btn) return;

          btn.disabled = true;
          btn.innerHTML = window.__i18n.running;

          try {
            const response = await fetch('/admin/settings/api/migrations/run', {
              method: 'POST'
            });
            const result = await response.json();

            if (result.success) {
              alert(result.message);
              setTimeout(() => window.refreshMigrationStatus(), 1000);
            } else {
              alert(result.error || window.__i18n.failedToRunMigrations);
            }
          } catch (error) {
            alert(window.__i18n.errorRunningMigrations);
          } finally {
            btn.disabled = false;
            btn.innerHTML = window.__i18n.runPending;
          }
        };

        window.validateSchema = async function() {
          try {
            const response = await fetch('/admin/settings/api/migrations/validate');
            const result = await response.json();

            if (result.success) {
              if (result.data.valid) {
                alert(window.__i18n.schemaValid);
              } else {
                alert(window.__i18n.schemaValidationFailed.replace('{{issues}}', result.data.issues.join(', ')));
              }
            } else {
              alert(window.__i18n.failedToValidateSchema);
            }
          } catch (error) {
            alert(window.__i18n.errorValidatingSchema);
          }
        };

        window.updateMigrationUI = function(data) {
          const totalEl = document.getElementById('total-migrations');
          const appliedEl = document.getElementById('applied-migrations');
          const pendingEl = document.getElementById('pending-migrations');

          if (totalEl) totalEl.textContent = data.totalMigrations;
          if (appliedEl) appliedEl.textContent = data.appliedMigrations;
          if (pendingEl) pendingEl.textContent = data.pendingMigrations;

          const runBtn = document.getElementById('run-migrations-btn');
          if (runBtn) {
            runBtn.disabled = data.pendingMigrations === 0;
          }

          // Update migrations list
          const listContainer = document.getElementById('migrations-list');
          if (listContainer && data.migrations && data.migrations.length > 0) {
            listContainer.innerHTML = data.migrations.map(migration => \`
              <div class="px-6 py-4 flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      \${migration.applied
                        ? '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                        : '<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                      }
                    </div>
                    <div>
                      <h5 class="text-white font-medium">\${migration.name}</h5>
                      <p class="text-sm text-gray-300">\${migration.filename}</p>
                      \${migration.description ? \`<p class="text-xs text-gray-400 mt-1">\${migration.description}</p>\` : ''}
                    </div>
                  </div>
                </div>

                <div class="flex items-center space-x-4 text-sm">
                  \${migration.size ? \`<span class="text-gray-400">\${(migration.size / 1024).toFixed(1)} KB</span>\` : ''}
                  <span class="px-2 py-1 rounded-full text-xs font-medium \${
                    migration.applied
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }">
                    \${migration.applied ? window.__i18n.applied : window.__i18n.pending}
                  </span>
                  \${migration.appliedAt ? \`<span class="text-gray-400">\${new Date(migration.appliedAt).toLocaleDateString()}</span>\` : ''}
                </div>
              </div>
            \`).join('');
          }
        };
      }
      
      // Auto-load when tab becomes active
      if (currentTab === 'migrations') {
        setTimeout(refreshMigrationStatus, 500);
      }
    </script>
  `
}

function renderDatabaseToolsSettings(settings?: DatabaseToolsSettings, locale = 'en'): string {
  return `
    <div class="space-y-6">
      <div>
        <h3 class="text-lg/7 font-semibold text-zinc-950 dark:text-white">${t('settings.dbToolsTitle', locale)}</h3>
        <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">${t('settings.dbToolsSubtitle', locale)}</p>
      </div>

      <!-- Database Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">${t('settings.totalTables', locale)}</p>
              <p id="total-tables" class="mt-2 text-3xl/8 font-semibold text-zinc-950 dark:text-white">${settings?.totalTables || '0'}</p>
            </div>
            <div class="rounded-lg bg-indigo-500/10 p-3">
              <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">${t('settings.totalRows', locale)}</p>
              <p id="total-rows" class="mt-2 text-3xl/8 font-semibold text-zinc-950 dark:text-white">${settings?.totalRows?.toLocaleString() || '0'}</p>
            </div>
            <div class="rounded-lg bg-green-500/10 p-3">
              <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Operations -->
      <div class="space-y-4">
        <!-- Safe Operations -->
        <div class="rounded-lg bg-white dark:bg-white/5 p-6 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10">
          <h4 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">${t('settings.safeOperations', locale)}</h4>
          <div class="flex flex-wrap gap-3">
            <button
              onclick="window.refreshDatabaseStats()"
              class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              ${t('settings.refreshStats', locale)}
            </button>

            <button
              onclick="window.createDatabaseBackup()"
              id="create-backup-btn"
              class="inline-flex items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              ${t('settings.createBackup', locale)}
            </button>

            <button
              onclick="window.validateDatabase()"
              class="inline-flex items-center justify-center rounded-lg bg-green-600 dark:bg-green-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 dark:hover:bg-green-400 transition-colors shadow-sm"
            >
              <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              ${t('settings.validateDatabase', locale)}
            </button>
          </div>
        </div>
      </div>

      <!-- Tables List -->
      <div class="rounded-lg bg-white dark:bg-white/5 ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 overflow-hidden">
        <div class="px-6 py-4 border-b border-zinc-950/10 dark:border-white/10">
          <h4 class="text-base/7 font-semibold text-zinc-950 dark:text-white">${t('settings.databaseTables', locale)}</h4>
          <p class="mt-1 text-sm/6 text-zinc-500 dark:text-zinc-400">${t('settings.databaseTablesSubtitle', locale)}</p>
        </div>

        <div id="tables-list" class="p-6 space-y-2">
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="text-zinc-500 dark:text-zinc-400">${t('settings.loadingDatabaseStats', locale)}</p>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="rounded-lg bg-red-50 dark:bg-red-950/20 p-6 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-base/7 font-semibold text-red-900 dark:text-red-400">${t('settings.dangerZone', locale)}</h4>
            <p class="mt-1 text-sm/6 text-red-700 dark:text-red-300">
              ${t('settings.dangerZoneWarning', locale)}
              <strong>${t('settings.dangerZonePreserve', locale)}</strong>${t('settings.dangerZoneDelete', locale)}
            </p>
            <div class="mt-4">
              <button
                onclick="window.truncateDatabase()"
                id="truncate-db-btn"
                class="inline-flex items-center justify-center rounded-lg bg-red-600 dark:bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 dark:hover:bg-red-400 transition-colors shadow-sm"
              >
                <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                ${t('settings.truncateAllData', locale)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}