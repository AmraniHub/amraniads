/* ─────────────────────────────────────────────────────────
   AmraniAds — Client Landing Page Engine
   Handles: routing, data fetch, render, pixel, events
   ───────────────────────────────────────────────────────── */

const ClientPage = (() => {

  let client = null;
  let pixelReady = false;
  let utmParams = {};
  let isPurchase = false;

  // ── Helpers ──────────────────────────────────────────────

  function getSlug() {
    const parts = window.location.pathname.replace(/\/$/, '').split('/');
    return parts[parts.length - 1];
  }

  function getUTMParams() {
    const p = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const result = {};
    keys.forEach(k => { if (p.get(k)) result[k] = p.get(k); });
    return result;
  }

  async function fetchClients() {
    const res = await fetch('/clients.json?_=' + Date.now());
    if (!res.ok) throw new Error('Could not load client data');
    return res.json();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Render ────────────────────────────────────────────────

  function buildPage(c) {
    const bulletsHtml = (c.bullets || []).map(b => `
      <li>
        <span class="bullet-icon">✓</span>
        <span>${escapeHtml(b)}</span>
      </li>
    `).join('');

    const urgencyHtml = c.urgency ? `
      <div class="urgency-wrap">
        <span class="urgency-badge">
          <span class="urgency-dot"></span>
          ${escapeHtml(c.urgency)}
        </span>
      </div>
    ` : '';

    const waText = escapeHtml(c.whatsappButtonText || 'Order via WhatsApp');

    return `
      <div class="client-page">
        <div class="top-bar">
          <span class="brand-tag">${escapeHtml(c.businessName)}</span>
          <span class="powered-tag">Powered by AmraniAds</span>
        </div>

        <section class="hero">
          <span class="business-name">${escapeHtml(c.businessName)}</span>
          <h1 class="headline">${escapeHtml(c.headline)}</h1>
          ${c.subheadline ? `<p class="subheadline">${escapeHtml(c.subheadline)}</p>` : ''}
        </section>

        ${bulletsHtml ? `<div class="bullets-wrap"><ul class="bullets">${bulletsHtml}</ul></div>` : ''}

        ${urgencyHtml}

        ${c.whatsappGroup ? `
        <div class="wa-group-wrap">
          <a href="${escapeHtml(c.whatsappGroup)}" id="wa-group-btn" class="wa-group-btn" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.856L0 24l6.335-1.498A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.804 9.804 0 01-5.006-1.372l-.36-.214-3.724.879.937-3.624-.235-.372A9.818 9.818 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182c5.424 0 9.818 4.393 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z"/>
            </svg>
            Join Our WhatsApp Group
          </a>
          <p class="wa-subtext">Get exclusive offers &amp; updates</p>
        </div>
        ` : ''}

        <div class="trust-strip">
          <div class="trust-item"><span class="icon">🚚</span> Free delivery</div>
          <div class="trust-item"><span class="icon">💵</span> Cash on Delivery</div>
          <div class="trust-item"><span class="icon">🔒</span> Secure order</div>
        </div>

        <footer class="client-footer">
          <a href="#" id="privacy-footer-link">Privacy Policy</a>
        </footer>
      </div>

      <div class="wa-sticky">
        <button id="wa-btn" class="wa-btn" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.856L0 24l6.335-1.498A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.804 9.804 0 01-5.006-1.372l-.36-.214-3.724.879.937-3.624-.235-.372A9.818 9.818 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182c5.424 0 9.818 4.393 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z"/>
          </svg>
          ${waText}
        </button>
        <p class="wa-subtext">Free — no registration required</p>
      </div>
    `;
  }

  function renderPage() {
    document.documentElement.style.setProperty('--client-color', client.primaryColor || '#E87722');
    document.title = `${client.businessName} — Special Offer`;

    const root = document.getElementById('page-root');
    root.innerHTML = buildPage(client);
    root.style.display = 'block';
    document.getElementById('loading').style.display = 'none';

    document.getElementById('privacy-footer-link').addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('privacy-modal').style.display = 'flex';
    });
  }

  function showState(title, body, link) {
    document.getElementById('loading').innerHTML = `
      <div class="state-screen">
        <h1>${title}</h1>
        <p>${body}</p>
        ${link ? `<a href="${link}">← Back to AmraniAds</a>` : ''}
      </div>
    `;
  }

  // ── Meta Pixel ────────────────────────────────────────────

  function initPixel() {
    const pixelId = client.pixelId;
    if (!pixelId || pixelId === 'YOUR_PIXEL_ID_HERE') return;

    /* eslint-disable */
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    fbq('init', pixelId);
    fbq('track', 'PageView');
    pixelReady = true;

    fbq('track', 'ViewContent', {
      content_name: client.headline,
      content_category: client.businessName,
      currency: client.currency || 'MAD',
      value: client.price || 0,
      ...utmParams
    });

    if (isPurchase) {
      fbq('track', 'Purchase', {
        currency: client.currency || 'MAD',
        value: client.price || 0,
        content_name: client.businessName,
        content_ids: [client.slug],
        content_type: 'product'
      });
    }
  }

  // ── Cookie Consent ────────────────────────────────────────

  function consentKey() {
    return `px_consent_${client.slug}`;
  }

  function setupConsent() {
    const stored = localStorage.getItem(consentKey());

    if (stored === 'accepted') {
      initPixel();
    } else if (stored !== 'declined') {
      showBanner();
    }
  }

  function showBanner() {
    const banner = document.getElementById('cookie-banner');
    banner.style.display = 'flex';

    document.getElementById('consent-accept').onclick = () => {
      localStorage.setItem(consentKey(), 'accepted');
      banner.style.display = 'none';
      initPixel();
    };

    document.getElementById('consent-decline').onclick = () => {
      localStorage.setItem(consentKey(), 'declined');
      banner.style.display = 'none';
    };
  }

  // ── WhatsApp button ───────────────────────────────────────

  function setupWhatsApp() {
    const btn = document.getElementById('wa-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (window.fbq && pixelReady) {
        fbq('track', 'Lead', {
          content_name: client.businessName,
          content_category: 'WhatsApp Click',
          currency: client.currency || 'MAD',
          value: client.price || 0,
          ...utmParams
        });
      }

      const phone = (client.whatsapp || '').replace(/\D/g, '');
      const msg   = encodeURIComponent(client.whatsappMessage || 'Hello! I\'m interested in your offer.');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener');
    });

    const groupBtn = document.getElementById('wa-group-btn');
    if (groupBtn) {
      groupBtn.addEventListener('click', () => {
        if (window.fbq && pixelReady) {
          fbq('track', 'Lead', {
            content_name: client.businessName,
            content_category: 'WhatsApp Group Click',
            currency: client.currency || 'MAD',
            value: client.price || 0,
            ...utmParams
          });
        }
      });
    }
  }

  // ── Direct group redirect ─────────────────────────────────

  function handleDirectRedirect() {
    const groupUrl = client.whatsappGroup;

    // Show fallback button immediately so users are never stuck
    document.getElementById('loading').innerHTML = `
      <div class="redirect-screen">
        <div class="redirect-spinner"></div>
        <p class="redirect-label">Opening WhatsApp…</p>
        <a href="${escapeHtml(groupUrl)}" class="redirect-btn" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.529 5.856L0 24l6.335-1.498A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.804 9.804 0 01-5.006-1.372l-.36-.214-3.724.879.937-3.624-.235-.372A9.818 9.818 0 012.182 12C2.182 6.575 6.575 2.182 12 2.182c5.424 0 9.818 4.393 9.818 9.818 0 5.424-4.394 9.818-9.818 9.818z"/></svg>
          Tap to Join the Group
        </a>
        <p class="redirect-hint">Didn't open automatically? Tap the button above.</p>
      </div>
    `;

    const pixelId = client.pixelId;

    if (pixelId && pixelId !== 'YOUR_PIXEL_ID_HERE') {
      // sendBeacon fires the request and survives page navigation — no waiting needed.
      // Facebook's noscript pixel endpoint accepts the same parameters.
      const fireBeacon = (ev, extra) => {
        const p = new URLSearchParams({ id: pixelId, ev, noscript: '1', ...extra });
        const url = `https://www.facebook.com/tr?${p.toString()}`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        } else {
          new Image().src = url; // fallback for very old browsers
        }
      };

      fireBeacon('PageView');
      fireBeacon('Lead', {
        'cd[content_name]':     client.businessName,
        'cd[content_category]': 'WhatsApp Group Click',
        'cd[currency]':         client.currency || 'MAD',
        'cd[value]':            String(client.price || 0),
      });
    }

    // 200ms — just enough for a smooth visual, pixel is already in-flight via beacon
    setTimeout(() => { window.location.href = groupUrl; }, 200);
  }

  // ── Privacy modal ─────────────────────────────────────────

  function setupPrivacyModal() {
    const overlay = document.getElementById('privacy-modal');
    const closeBtn = document.getElementById('modal-close');

    document.getElementById('privacy-link').addEventListener('click', e => {
      e.preventDefault();
      overlay.style.display = 'flex';
    });

    if (closeBtn) {
      closeBtn.onclick = () => { overlay.style.display = 'none'; };
    }

    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  }

  // ── Init ──────────────────────────────────────────────────

  async function init() {
    const slug = getSlug();
    utmParams  = getUTMParams();
    isPurchase = new URLSearchParams(window.location.search).get('purchase') === '1';

    if (!slug) {
      showState('Page not found', 'This URL is not valid.', '/');
      return;
    }

    try {
      const data = await fetchClients();
      client = (data.clients || []).find(c => c.slug === slug && c.active !== false);

      if (!client) {
        showState('Page not found', 'This client page does not exist or is inactive.', '/');
        return;
      }

      if (client.directGroupRedirect && client.whatsappGroup) {
        handleDirectRedirect();
        return;
      }

      renderPage();
      setupConsent();
      setupWhatsApp();
      setupPrivacyModal();

    } catch (err) {
      showState('Something went wrong', 'Please try again later.', '/');
    }
  }

  return { init };

})();

ClientPage.init();
