import { html, render, signal } from '../../scripts/lib/htm-preact.js';
import { domEl } from '../../scripts/dom-helpers.js';
// import General from './panels/general.js';
import SEO from './panels/seo.js';

const HEADING = 'Preflight';
const IMG_PATH = '/blocks/preflight/img';

const tabs = signal([
  // { title: 'General', selected: true },
  { title: 'SEO', selected: true },
]);

function setTab(active) {
  tabs.value = tabs.value.map((tab) => {
    const selected = tab.title === active.title;
    return { ...tab, selected };
  });
}

function setPanel(title) {
  switch (title) {
    case 'SEO':
      return html`<${SEO} />`;
    default:
      return html`<p>No matching panel.</p>`;
  }
}

function TabButton(props) {
  const id = `tab-${props.idx + 1}`;
  const selected = props.tab.selected === true;
  return html`
    <button
      id=${id}
      class=preflight-tab-button
      key=${props.tab.title}
      aria-selected=${selected}
      onClick=${() => setTab(props.tab)}>
      ${props.tab.title}
    </button>`;
}

function TabPanel(props) {
  const id = `panel-${props.idx + 1}`;
  const labeledBy = `tab-${props.idx + 1}`;
  const selected = props.tab.selected === true;

  return html`
    <div
      id=${id}
      class=preflight-tab-panel
      aria-labelledby=${labeledBy}
      key=${props.tab.title}
      aria-selected=${selected}
      role="tabpanel">
      ${setPanel(props.tab.title)}
    </div>`;
}

function Preflight() {
  return html`
    <div class=preflight-heading>
      <p id=preflight-title>${HEADING}</p>
      <div class=preflight-tab-button-group role="tablist" aria-labelledby=preflight-title>
        ${tabs.value.map((tab, idx) => html`<${TabButton} tab=${tab} idx=${idx} />`)}
      </div>
    </div>
    <div class=preflight-content>
      ${tabs.value.map((tab, idx) => html`<${TabPanel} tab=${tab} idx=${idx} />`)}
    </div>
  `;
}

function preloadAssets(el) {
  return new Promise((resolve) => {
    const bg = domEl('img', { src: `${window.hlx.codeBasePath}${IMG_PATH}/preflight-bg.png` });
    const pic = domEl('picture', { class: 'bg-img' }, bg);
    bg.addEventListener('load', () => {
      resolve(pic);
      el.insertAdjacentElement('afterbegin', pic);

      // Lazily load other images
      const check = domEl('link', { rel: 'preload', as: 'image', href: `${window.hlx.codeBasePath}${IMG_PATH}/check.svg` });
      const expand = domEl('link', { rel: 'preload', as: 'image', href: `${window.hlx.codeBasePath}${IMG_PATH}/expand.svg` });
      document.head.append(check, expand);
    });
  });
}

export default async function decorate(el) {
  await preloadAssets(el);
  render(html`<${Preflight} />`, el);
}
