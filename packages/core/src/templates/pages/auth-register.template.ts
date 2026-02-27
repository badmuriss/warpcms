import { renderAlert } from '../components/alert.template'
import { t } from '../../i18n'

export interface RegisterPageData {
  error?: string
  locale?: string
}

export function renderRegisterPage(data: RegisterPageData): string {
  const locale = data.locale || 'en'
  return `
    <!DOCTYPE html>
    <html lang="${locale}" class="h-full dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t('auth.register.pageTitle', locale)}</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <script src="https://unpkg.com/htmx.org@2.0.3"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {}
          }
        }
      </script>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
      </style>
    </head>
    <body class="h-full bg-zinc-950">
      <div class="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
        <!-- Logo Section -->
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white">
            <svg class="h-7 w-7 text-zinc-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="mt-6 text-3xl font-semibold tracking-tight text-white">WarpCMS</h1>
          <p class="mt-2 text-sm text-zinc-400">${t('auth.register.subtitle', locale)}</p>
        </div>

        <!-- Form Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-zinc-900 shadow-sm ring-1 ring-white/10 rounded-xl px-6 py-8 sm:px-10">
            <!-- Alerts -->
            ${data.error ? `<div class="mb-6">${renderAlert({ type: 'error', message: data.error })}</div>` : ''}

            <!-- Form -->
            <form
              id="register-form"
              hx-post="/auth/register/form"
              hx-target="#form-response"
              hx-swap="innerHTML"
              class="space-y-6"
            >
              <!-- First and Last Name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-white mb-2">
                    ${t('auth.register.firstName', locale)}
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                    placeholder="${t('auth.register.firstNamePlaceholder', locale)}"
                  >
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-white mb-2">
                    ${t('auth.register.lastName', locale)}
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                    placeholder="${t('auth.register.lastNamePlaceholder', locale)}"
                  >
                </div>
              </div>

              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-medium text-white mb-2">
                  ${t('auth.register.username', locale)}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="${t('auth.register.usernamePlaceholder', locale)}"
                >
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-white mb-2">
                  ${t('auth.register.emailLabel', locale)}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="${t('auth.register.emailPlaceholder', locale)}"
                >
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-white mb-2">
                  ${t('auth.register.passwordLabel', locale)}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  class="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition-shadow"
                  placeholder="${t('auth.register.passwordPlaceholder', locale)}"
                >
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
              >
                ${t('auth.register.createAccount', locale)}
              </button>
            </form>

            <!-- Links -->
            <div class="mt-6 text-center">
              <p class="text-sm text-zinc-400">
                ${t('auth.register.haveAccount', locale)}
                <a href="/auth/login" class="font-semibold text-white hover:text-zinc-300 transition-colors">${t('auth.register.signInHere', locale)}</a>
              </p>
            </div>

            <div id="form-response"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}