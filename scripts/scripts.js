import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
  getMetadata,
  toClassName,
  decorateBlock,
  loadBlock,
} from './aem.js';
import {
  checkDomain,
  linkTextIncludesHref,
  rewriteLinkUrl,
  wrapImgsInLinks,
  wrapTextNodes,
} from './utils.js';
import {
  p,
  div,
} from './dom-helpers.js';

const LCP_BLOCKS = ['hero']; // add your LCP blocks to the list

/**
 * Builds fragment blocks from links to fragments
 * @param {Element} main The container element
 */
function buildFragmentBlocks(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href);
    const domainCheck = checkDomain(url);
    if (domainCheck.isKnown && linkTextIncludesHref(a) && url.pathname.includes('/fragments/')) {
      const block = buildBlock('fragment', p(a.cloneNode(true)));
      a.replaceWith(block);
    }
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main, templateModule = undefined) {
  try {
    buildFragmentBlocks(main);
    if (templateModule && templateModule.default) {
      templateModule.default(main);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * add block level wrappers to all block content columns
 * @param {Element} main the main element
 */
function redecorateBlocks(main) {
  main.querySelectorAll('.block').forEach((block) => {
    wrapTextNodes(block);
  });
}

/**
 * decorate all links, includes creating buttons, making links relative, etc.
 * @param {Element} main the main element
 */
function decorateLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    rewriteLinkUrl(a);
    if (!linkTextIncludesHref(a) && !a.querySelector('img')) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
        a.className = 'button'; // default
        up.classList.add('button-container');
      }
      if (
        up.childNodes.length === 1
        && up.tagName === 'STRONG'
        && twoup.childNodes.length === 1
        && twoup.tagName === 'P'
      ) {
        a.className = 'button primary';
        twoup.classList.add('button-container');
      }
      if (
        up.childNodes.length === 1
        && up.tagName === 'EM'
        && twoup.childNodes.length === 1
        && twoup.tagName === 'P'
      ) {
        a.className = 'button secondary';
        twoup.classList.add('button-container');
      }
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, templateModule) {
  // hopefully forward compatible button decoration
  wrapImgsInLinks(main);
  decorateLinks(main);
  decorateIcons(main);
  buildAutoBlocks(main, templateModule);
  decorateSections(main);
  decorateBlocks(main);
  redecorateBlocks(main);
}

const validTemplates = [];
async function loadTemplate() {
  const templateName = toClassName(getMetadata('template'));
  if (templateName && validTemplates.includes(templateName)) {
    try {
      const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/template/${templateName}/${templateName}.css`);
      const mod = await import(
        `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.js`
      );
      await cssLoaded;
      return mod;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`failed to load template ${templateName}`, error);
    }
  }

  return undefined;
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const templateModule = await loadTemplate();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main, templateModule);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

function loadHeaderAndFooter(doc) {
  const header = doc.querySelector('header');
  const footer = doc.querySelector('footer');

  header.style.visibility = 'hidden';
  footer.style.visibility = 'hidden';

  const headerLoaded = loadHeader(header);
  const footerLoaded = loadFooter(footer);

  headerLoaded.then(() => {
    header.style.visibility = null;
  });
  footerLoaded.then(() => {
    footer.style.visibility = null;
  });

  return Promise.all([headerLoaded, footerLoaded]);
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  // no need to await any of these individually
  // but want them all to complete before moving on to delayed phase
  const lazyPromises = [];

  lazyPromises.push(loadHeaderAndFooter(doc));
  lazyPromises.push(loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`));
  lazyPromises.push(loadFonts());

  await Promise.all(lazyPromises);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * observe sidekick element for events
 */
function helixSideKickObserver() {
  const preflightListener = async () => {
    const wrapper = div();
    const preflightBlock = buildBlock('preflight', '');
    wrapper.appendChild(preflightBlock);
    decorateBlock(preflightBlock);
    await loadBlock(preflightBlock);
    // eslint-disable-next-line import/no-cycle
    const { createModal } = await import('../blocks/modal/modal.js');
    const modal = await createModal(wrapper.childNodes);
    modal.dialog.id = 'preflight';
    modal.dialog.addEventListener('close', () => {
      modal.block.remove();
    });
    modal.showModal();
  };

  let sk = document.querySelector('helix-sidekick');
  if (sk) {
    // sidekick already loaded
    sk.addEventListener('custom:preflight', preflightListener);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      sk = document.querySelector('helix-sidekick');
      sk.addEventListener('custom:preflight', preflightListener);
    }, { once: true });
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  helixSideKickObserver();
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
