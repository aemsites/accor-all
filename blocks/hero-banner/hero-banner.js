/**
 * decorate the hero block
 * @param {Element} block the block element
 */
export default async function decorate(block) {
  const heroInner = block.querySelector(':scope > div');
  heroInner.classList.add('hero-inner');
  heroInner.querySelectorAll(':scope > div').forEach((col) => {
    if (col.querySelector('picture')) {
      col.classList.add('hero-image');
    } else {
      col.classList.add('hero-content');
    }
  });
}
