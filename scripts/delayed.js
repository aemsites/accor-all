// eslint-disable-next-line import/no-cycle
import { sampleRUM, loadScript } from './aem.js';
import { getConfig, checkBrowserDomain } from './utils.js';

/**
 * a helper to flush fragment plain html from browser cache so when authors edit them
 * they get flushed so when they subsequently view referencing pages
 * they see the right result
 */
async function flushFragmentCache() {
  if (window.location.pathname.includes('/fragments/')) {
    fetch(`${window.location.pathname}.plain.html`, { cache: 'reload' });
  }
}

function loadGoogleTagManager(config) {
  const { gtmId } = config;
  if (gtmId) {
    // eslint-disable-next-line
    (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f); })(window, document, 'script', 'dataLayer', gtmId);
  }
}

async function loadOneTrust(config) {
  const { onetrustId } = config;
  if (onetrustId) {
    window.OptanonWrapper = () => {
      if (window.OnetrustActiveGroups) {
        const activeGroups = window.OnetrustActiveGroups.split(',');
        // eslint-disable-next-line no-console
        console.log(`OneTrust Loaded. Active groups: ${activeGroups}`);
      }

      const bannerLoadedEvent = new Event('banner-loaded');
      window.dispatchEvent(bannerLoadedEvent);
    };

    await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
      type: 'text/javascript',
      charset: 'UTF-8',
      'data-domain-script': onetrustId,
      'data-document-language': 'true',
    });
  }
}

/**
 * execute all the delayed stuff.
 * This is in a function to avoid issues around top-level await
 */
const execDelayed = async () => {
  // Core Web Vitals RUM collection
  sampleRUM('cwv');

  const browserDomain = checkBrowserDomain();
  const isLibrary = document.body.classList.contains('sidekick-library');
  if (!isLibrary && !browserDomain.isPreview) {
    // load martec stack
    const config = await getConfig();
    await loadOneTrust(config);
    loadGoogleTagManager(config);
    await loadScript('https://cdn.evgnet.com/beacon/accorsa/accor/scripts/evergage.min.js');
  }

  // add more delayed functionality here
  flushFragmentCache();
};

execDelayed();
