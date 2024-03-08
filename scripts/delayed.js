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

function OTLoaded() {
  if (window.OnetrustActiveGroups) {
    const activeGroups = window.OnetrustActiveGroups.split(',');
    // eslint-disable-next-line no-console
    console.log(`OneTrust Loaded. Active groups: ${activeGroups}`);
    // use active groups to determine what else is loaded
    // if blocks need to rely on this
    // we could send an event here that blocks could listen on to trigger their loading.
    // if (activeGroups.includes('C0004')) {
    //
    // }
  }
}

async function loadOneTrust(config) {
  const { onetrustId } = config;
  if (onetrustId) {
    window.OptanonWrapper = OTLoaded;

    await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
      type: 'text/javascript',
      charset: 'UTF-8',
      'data-domain-script': onetrustId,
    });
  }
}

const execLoad = async () => {
  // Core Web Vitals RUM collection
  sampleRUM('cwv');

  const browserDomain = checkBrowserDomain();
  const isLibrary = document.body.classList.contains('sidekick-library');
  if (!isLibrary && !browserDomain.isPreview) {
    const config = await getConfig();
    // add more delayed functionality here
    await loadOneTrust(config);
    loadGoogleTagManager(config);
  }

  // add more delayed functionality here
  flushFragmentCache();
};

execLoad();
