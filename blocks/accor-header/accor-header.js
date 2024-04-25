import { loadScript, loadCSS } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const themeCss = loadCSS('https://static-p46175-e229011.adobeaemcloud.com/c08337c02c45059ff20065d429f2864a3e5ca1b86217869f155c0e4c7c83b935/theme.css');
  const themeJs = loadScript('https://static-p46175-e229011.adobeaemcloud.com/c08337c02c45059ff20065d429f2864a3e5ca1b86217869f155c0e4c7c83b935/theme.js');
  const vue = loadScript('/scripts/lib/vue.js');

  window.hlx.delayed.push(() => {
    // load deps that aren't part of markup loaded from accor
    Promise.all([vue, themeCss, themeJs]).then(() => {
      block.querySelectorAll('script').forEach((script) => {
        const { src } = script;
        script.remove();
        loadScript(src);
      });
    });
  });
}
