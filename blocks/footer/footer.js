import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { div, nav, button } from '../../scripts/dom-helpers.js';

// media query match that indicates mobile/tablet width
const isMobile = window.matchMedia('(max-width: 600px)');

const toggleAllNavSections = (navUl, expanded = false) => {
  navUl.querySelectorAll('li.nav-drop > button').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
};

const decorateNav = (navSection) => {
  if (!navSection) return;

  const navUl = navSection.querySelector('ul');
  if (navUl) {
    const navEl = nav({ 'aria-label': 'footer-nav' }, navUl);
    navSection.replaceChildren(navEl);
    navUl.querySelectorAll(':scope > li').forEach((li, idx) => {
      const subList = li.querySelector(':scope > ul');
      if (subList) {
        const textNodes = [...li.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
        const liText = textNodes.map((text) => text.textContent).join('').trim();
        const dropButton = button({ type: 'button', 'aria-expanded': false, 'aria-controls': `drop-${toClassName(liText)}-${idx}` }, liText);
        li.prepend(dropButton);
        textNodes.forEach((text) => text.remove());
        li.classList.add('nav-drop');
        subList.setAttribute('id', `drop-${toClassName(liText)}-${idx}`);
        dropButton.addEventListener('click', () => {
          if (isMobile.matches) {
            const expanded = dropButton.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navUl);
            dropButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          }
        });
      }
    });
  }
};

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  block.textContent = '';

  // load footer fragment
  const footerPath = footerMeta.footer || '/fragments/footer';
  const fragment = await loadFragment(footerPath);
  if (fragment) {
    // decorate footer DOM
    const footer = div({ class: 'footer-content' });
    const sectionNames = ['logo', 'nav', 'social', 'legal', 'copyright', 'logos'];
    let i = 0;
    while (fragment.firstElementChild) {
      fragment.firstElementChild.classList.add(`footer-${sectionNames[i]}`);
      footer.append(fragment.firstElementChild);
      i += 1;
    }
    decorateNav(footer.querySelector('.footer-nav'));

    // remove buttons
    footer.querySelectorAll('.button-container').forEach((btnCtn) => {
      btnCtn.classList.remove('.button-container');
      btnCtn.querySelectorAll('.button').forEach((btn) => btn.classList.remove('button'));
    });

    block.append(footer);
  }
}
