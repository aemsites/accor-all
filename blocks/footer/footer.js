import { loadScript } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerInside = block.querySelector('footer.footerComponent');
  const replacementDiv = div();
  [...footerInside.attributes].forEach((attr) => {
    replacementDiv.setAttribute(attr.name, attr.value);
  });
  replacementDiv.append(...footerInside.children);
  footerInside.before(replacementDiv);
  footerInside.remove();

  block.querySelectorAll('script').forEach((script) => {
    const { src } = script;
    script.remove();
    loadScript(src);
  });
}
