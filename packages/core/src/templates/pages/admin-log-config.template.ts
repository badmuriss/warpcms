import { html } from 'hono/html'
import { adminLayoutV2 } from '../layouts/admin-layout-v2.template'
import type { LogConfig } from '../../db/schema'
import { t } from '../../i18n'

interface BaseUser {
  name: string
  email: string
  role: string
}

export interface LogConfigPageData {
  configs: LogConfig[]
  user?: BaseUser
  locale?: string
}

export function renderLogConfigPage(data: LogConfigPageData) {
  const { configs, user } = data
  const locale = data.locale || 'en'

  const content = html`
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <nav class="mb-4">
            <a href="/admin/logs" class="text-indigo-600 hover:text-indigo-900">
              &larr; ${t('logs.backToLogs', locale)}
            </a>
          </nav>
          <h1 class="text-2xl font-semibold text-gray-900">${t('logs.logConfiguration', locale)}</h1>
          <p class="mt-2 text-sm text-gray-700">
            ${t('logs.configSubtitle', locale)}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            hx-post="/admin/logs/cleanup"
            hx-confirm="${t('logs.cleanupConfirm', locale)}"
            hx-target="#cleanup-result"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            ${t('logs.runCleanup', locale)}
          </button>
        </div>
      </div>

      <div id="cleanup-result" class="mt-4"></div>

      <!-- Log Levels Reference -->
      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">${t('logs.logLevelsReference', locale)}</h2>
        </div>
        <div class="px-6 py-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                debug
              </span>
              <p class="mt-2 text-xs text-gray-500">${t('logs.debugDescription', locale)}</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                info
              </span>
              <p class="mt-2 text-xs text-gray-500">${t('logs.infoDescription', locale)}</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                warn
              </span>
              <p class="mt-2 text-xs text-gray-500">${t('logs.warnDescription', locale)}</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                error
              </span>
              <p class="mt-2 text-xs text-gray-500">${t('logs.errorDescription', locale)}</p>
            </div>
            <div class="text-center">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                fatal
              </span>
              <p class="mt-2 text-xs text-gray-500">${t('logs.fatalDescription', locale)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Cards -->
      <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${configs.map(config => html`
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 capitalize">${config.category}</h3>
                <div class="flex items-center">
                  ${config.enabled ? html`
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ${t('logs.enabled', locale)}
                    </span>
                  ` : html`
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      ${t('logs.disabled', locale)}
                    </span>
                  `}
                </div>
              </div>
            </div>

            <form hx-post="/admin/logs/config/${config.category}" hx-target="#config-result-${config.category}">
              <div class="px-6 py-4 space-y-4">
                <div class="flex gap-3">
                  <div class="flex h-6 shrink-0 items-center">
                    <div class="group grid size-4 grid-cols-1">
                      <input
                        id="enabled-${config.category}"
                        name="enabled"
                        type="checkbox"
                        ${config.enabled ? 'checked' : ''}
                        class="col-start-1 row-start-1 appearance-none rounded border border-zinc-950/10 dark:border-white/10 bg-white dark:bg-white/5 checked:border-indigo-500 checked:bg-indigo-500 indeterminate:border-indigo-500 indeterminate:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:border-zinc-950/5 dark:disabled:border-white/5 disabled:bg-zinc-950/10 dark:disabled:bg-white/10 disabled:checked:bg-zinc-950/10 dark:disabled:checked:bg-white/10 forced-colors:appearance-auto"
                      />
                      <svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-zinc-950/25 dark:group-has-[:disabled]:stroke-white/25">
                        <path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:checked]:opacity-100" />
                        <path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-[:indeterminate]:opacity-100" />
                      </svg>
                    </div>
                  </div>
                  <div class="text-sm/6">
                    <label for="enabled-${config.category}" class="font-medium text-zinc-950 dark:text-white">
                      ${t('logs.enableLogging', locale)}
                    </label>
                  </div>
                </div>

                <div>
                  <label for="level-${config.category}" class="block text-sm font-medium text-gray-700">
                    ${t('logs.minimumLogLevel', locale)}
                  </label>
                  <select
                    id="level-${config.category}"
                    name="level"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="debug" ${config.level === 'debug' ? 'selected' : ''}>${t('logs.levelDebug', locale)}</option>
                    <option value="info" ${config.level === 'info' ? 'selected' : ''}>${t('logs.levelInfo', locale)}</option>
                    <option value="warn" ${config.level === 'warn' ? 'selected' : ''}>${t('logs.levelWarning', locale)}</option>
                    <option value="error" ${config.level === 'error' ? 'selected' : ''}>${t('logs.levelError', locale)}</option>
                    <option value="fatal" ${config.level === 'fatal' ? 'selected' : ''}>${t('logs.levelFatal', locale)}</option>
                  </select>
                  <p class="mt-1 text-sm text-gray-500">${t('logs.minimumLogLevelHelp', locale)}</p>
                </div>

                <div>
                  <label for="retention-${config.category}" class="block text-sm font-medium text-gray-700">
                    ${t('logs.retentionPeriod', locale)}
                  </label>
                  <input
                    type="number"
                    id="retention-${config.category}"
                    name="retention"
                    value="${config.retention}"
                    min="1"
                    max="365"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-sm text-gray-500">${t('logs.retentionHelp', locale)}</p>
                </div>

                <div>
                  <label for="max_size-${config.category}" class="block text-sm font-medium text-gray-700">
                    ${t('logs.maximumLogCount', locale)}
                  </label>
                  <input
                    type="number"
                    id="max_size-${config.category}"
                    name="max_size"
                    value="${config.maxSize || ''}"
                    min="100"
                    max="100000"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p class="mt-1 text-sm text-gray-500">${t('logs.maximumLogCountHelp', locale)}</p>
                </div>
              </div>

              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div id="config-result-${config.category}" class="mb-4"></div>
                <button
                  type="submit"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ${t('logs.updateConfiguration', locale)}
                </button>
              </div>
            </form>

            <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div class="text-xs text-gray-500">
                <div>${t('logs.createdLabel', locale)} ${new Date(config.createdAt).toLocaleDateString()}</div>
                <div>${t('logs.updatedLabel', locale)} ${new Date(config.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Global Settings -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">${t('logs.globalLogSettings', locale)}</h2>
        </div>
        <div class="px-6 py-4">
          <div class="space-y-6">
            <div>
              <h3 class="text-base font-medium text-gray-900">${t('logs.storageInformation', locale)}</h3>
              <div class="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">${t('logs.totalLogEntries', locale)}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">${t('logs.storageUsed', locale)}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-gray-900">-</div>
                  <div class="text-sm text-gray-500">${t('logs.oldestLog', locale)}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-base font-medium text-gray-900">${t('logs.logCategoriesTitle', locale)}</h3>
              <div class="mt-2 text-sm text-gray-600">
                <ul class="list-disc list-inside space-y-1">
                  <li><strong>auth</strong> - ${t('logs.categoryAuthDesc', locale)}</li>
                  <li><strong>api</strong> - ${t('logs.categoryApiDesc', locale)}</li>
                  <li><strong>workflow</strong> - ${t('logs.categoryWorkflowDesc', locale)}</li>
                  <li><strong>plugin</strong> - ${t('logs.categoryPluginDesc', locale)}</li>
                  <li><strong>media</strong> - ${t('logs.categoryMediaDesc', locale)}</li>
                  <li><strong>system</strong> - ${t('logs.categorySystemDesc', locale)}</li>
                  <li><strong>security</strong> - ${t('logs.categorySecurityDesc', locale)}</li>
                  <li><strong>error</strong> - ${t('logs.categoryErrorDesc', locale)}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://unpkg.com/htmx.org@1.9.6"></script>
  `

  return adminLayoutV2({
    title: t('logs.logConfiguration', locale),
    user,
    content: content as string,
    locale
  })
}
