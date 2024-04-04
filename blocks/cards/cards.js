import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
      const anchor = div.querySelector('a');
      if (!block.classList.contains('cta') && anchor != null) {
        // remove button
        anchor.classList.remove('button');
        anchor.parentNode.classList.remove('button-container');
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => {
    const pic = img.closest('picture');
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    pic.replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
