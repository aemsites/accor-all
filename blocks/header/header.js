import { loadScript } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function toggleMenu(navEl, navToggler, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : navToggler.getAttribute('aria-expanded') === 'true';
  navToggler.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
}

async function fetchHeaderContent() {
  let html = '';
  try {
    // TODO assign from metadata?
    const lang = 'en';
    const market = 'en_usa';

    const resp = await fetch(`https://all.accor.com/a/content/experience-fragments/all/header/navigation/${lang}/${market}/jcr:content.content.nocache.html`);
    html = await resp.text();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch nav html (likely due to CORS). Falling back to local.', e);
  }
  if (!html) {
    const resp = await fetch(`${window.hlx.codeBasePath}/blocks/header/header-fallback.html`);
    if (resp.ok) {
      html = await resp.text();
    }
  }

  const dp = new DOMParser();
  const doc = dp.parseFromString(html, 'text/html');
  const refEls = [{ tag: 'img', attr: 'src' }, { tag: 'a', attr: 'href' }, { tag: 'source', attr: 'srcset' }];
  refEls.forEach((refEl) => {
    doc.querySelectorAll(refEl.tag).forEach((t) => {
      if (t.getAttribute(refEl.attr).startsWith('/')) {
        t.setAttribute(refEl.attr, `https://all.accor.com${t.getAttribute(refEl.attr)}`);
      }
    });
  });

  doc.querySelectorAll('script').forEach((s) => s.remove());
  return doc;
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const headerDoc = await fetchHeaderContent();
  const headerWrapper = div({ class: 'header-wrapper' });
  const headerNav = div({ class: 'header-navigation' });
  headerWrapper.append(headerNav);
  headerNav.append(...headerDoc.querySelector('.ace-header-navigation').children);
  block.replaceChildren(headerWrapper);

  const navToggler = block.querySelector('.ace-navbar-toggler');
  const navEl = block.querySelector(`#${navToggler.getAttribute('aria-controls')}`);
  navToggler.addEventListener('click', () => toggleMenu(navEl, navToggler));
  // prevent mobile nav behavior on window resize
  // toggleMenu(navEl, navToggler, isDesktop.matches);
  // isDesktop.addEventListener('change', () => toggleMenu(navEl, navToggler, isDesktop.matches));

  const login = block.querySelector('.ace-header-navigation__loginconnect');
  if (login) {
    login.dataset.loaded = 'false';
    const vueProm = loadScript('https://all.accor.com/a/etc.clientlibs/ace/clientlibs/clienlibs-3rd-parties/clientlib-vue.lc-f35b543fbf132ab69f5c12eebf271456-lc.min.js');
    window.hlx.delayed.push(() => {
      vueProm.then(() => {
        loadScript('https://all.accor.com/a/etc.clientlibs/ace/clientlibs-modules/components/clientlib-login-connect.lc-b27595ed7b70c37aa84425e0ee358211-lc.min.js').then(() => {
          login.dataset.loaded = null;
        });
      });
    });
  }
}
