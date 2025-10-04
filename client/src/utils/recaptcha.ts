// Lightweight reCAPTCHA v3 helper
// Usage: const token = await getRecaptchaToken('login'); then include in request header or body.

let scriptPromise: Promise<void> | null = null;

function resolveSiteKey(): string | undefined {
  const env = (import.meta as any).env || {};
  return env.VITE_RECAPTCHA_SITE_KEY || env.RECAPTCHA_SITE_KEY || (window as any).__RECAPTCHA_SITE_KEY__;
}

function load(siteKey: string) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha="1"]');
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.defer = true;
    s.dataset.recaptcha = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function waitForExecute(timeoutMs = 4000) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    // @ts-ignore
    if (window.grecaptcha && window.grecaptcha.execute) return;
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('grecaptcha execute not available (timeout)');
}

export async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = resolveSiteKey();
  if (!siteKey) {
    const meta: any = (import.meta as any);
    if (meta?.env?.DEV) {
      console.warn('[recaptcha] site key missing; returning dummy token in dev');
      return 'dev-bypass-token';
    }
    throw new Error('reCAPTCHA site key not configured');
  }
  await load(siteKey);
  await waitForExecute();
  // @ts-ignore
  return window.grecaptcha.execute(siteKey, { action });
}
