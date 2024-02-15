/* global WebImporter */

const getMetadata = (name, document) => {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
};

const createMetadata = (document) => {
  const meta = {};

  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.textContent.replace(/[\n\t]/gm, '');
  }

  const desc = getMetadata('description', document);
  if (desc) {
    meta.Description = desc;
  }

  const img = getMetadata('og:image', document);
  if (img) {
    const el = document.createElement('img');
    el.src = img;
    meta.Image = el;

    const imgAlt = getMetadata('og:image:alt', document);
    if (imgAlt) {
      el.alt = imgAlt;
    }
  }

  const ogtitle = getMetadata('og:title', document);
  if (ogtitle && ogtitle !== meta.Title) {
    if (meta.Title) {
      meta['og:title'] = ogtitle;
    } else {
      meta.Title = ogtitle;
    }
  }

  const ogdesc = getMetadata('og:description', document);
  if (ogdesc && ogdesc !== meta.Description) {
    if (meta.Description) {
      meta['og:description'] = ogdesc;
    } else {
      meta.Description = ogdesc;
    }
  }

  const ttitle = getMetadata('twitter:title', document);
  if (ttitle && ttitle !== meta.Title) {
    if (meta.Title) {
      meta['twitter:title'] = ttitle;
    } else {
      meta.Title = ttitle;
    }
  }

  const tdesc = getMetadata('twitter:description', document);
  if (tdesc && tdesc !== meta.Description) {
    if (meta.Description) {
      meta['twitter:description'] = tdesc;
    } else {
      meta.Description = tdesc;
    }
  }

  const timg = getMetadata('twitter:image', document);
  if (timg && timg !== img) {
    const el = document.createElement('img');
    el.src = timg;
    meta['twitter:image'] = el;

    const imgAlt = getMetadata('twitter:image:alt', document);
    if (imgAlt) {
      el.alt = imgAlt;
    }
  }

  const robots = getMetadata('robots', document);
  if (robots && robots !== 'index, follow') {
    meta.Robots = robots;
  }

  return meta;
};

const buildColumnRow = (row, cells, document, reverse = false) => {
  const left = row.classList.contains('one-bloc-left-pics');
  const img = left ? row.querySelector('.one-bloc-left-pics__img-wrap') : row.querySelector('.one-bloc-right-pics__img-wrap');
  const content = left ? row.querySelector('.one-bloc-left-pics__right-desc') : row.querySelector('.one-bloc-right-pics__left-desc');
  content.querySelectorAll('.one-bloc-left-pics__highlight-title, .one-bloc-right-pics__highlight-title').forEach((title) => {
    const titleEl = document.createElement('h2');
    titleEl.textContent = title.textContent;
    title.replaceWith(titleEl);
  });
  cells.push((reverse ? [content, img] : [img, content]));
};

const buildZPatterns = (main, document) => {
  let zPatternLR = main.querySelector('.one-bloc-left-pics + .one-bloc-right-pics');
  while (zPatternLR) {
    const zDiv = document.createElement('div');
    zPatternLR.previousElementSibling.before(zDiv);
    const cells = [
      ['Columns (Z-Pattern)'],
    ];

    let moreRows = true;
    let curRow = zPatternLR.previousElementSibling;
    while (moreRows) {
      const curLeft = curRow.classList.contains('one-bloc-left-pics');
      buildColumnRow(curRow, cells, document);

      const nextRow = curRow.nextElementSibling;
      moreRows = curLeft ? nextRow.classList.contains('one-bloc-right-pics') : curRow.classList.contains('one-bloc-left-pics');
      curRow.remove();
      curRow = nextRow;
    }

    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'columns z-pattern';
    zDiv.append(block);
    zPatternLR = main.querySelector('.one-bloc-left-pics + .one-bloc-right-pics');
  }

  let zPatternRL = main.querySelector('.one-bloc-right-pics + .one-bloc-left-pics');
  while (zPatternRL) {
    const zDiv = document.createElement('div');
    zPatternRL.previousElementSibling.before(zDiv);
    const cells = [
      ['Columns (Z-Pattern, Reverse)'],
    ];

    let moreRows = true;
    let curRow = zPatternRL.previousElementSibling;
    while (moreRows) {
      const curLeft = curRow.classList.contains('one-bloc-left-pics');
      buildColumnRow(curRow, cells, document);

      const nextRow = curRow.nextElementSibling;
      moreRows = curLeft ? nextRow.classList.contains('one-bloc-right-pics') : curRow.classList.contains('one-bloc-left-pics');
      curRow.remove();
      curRow = nextRow;
    }

    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'columns z-pattern';
    zDiv.append(block);
    zPatternRL = main.querySelector('.one-bloc-right-pics + .one-bloc-left-pics');
  }
};

const buildImageColumns = (main, document) => {
  main.querySelectorAll('.one-bloc-left-pics').forEach((el) => {
    const cells = [
      ['Columns'],
    ];
    buildColumnRow(el, cells, document);

    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'columns';
    el.replaceWith(block);
  });

  main.querySelectorAll('.one-bloc-right-pics').forEach((el) => {
    const cells = [
      ['Columns'],
    ];
    buildColumnRow(el, cells, document, true);

    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'columns';
    el.replaceWith(block);
  });
};

const buildCards = (main, document) => {
  main.querySelectorAll('.row-bloc-three').forEach((el) => {
    const cells = [
      ['Cards'],
    ];

    el.querySelectorAll('.three-bloc').forEach((card) => {
      cells.push([card.querySelector('.three-bloc-pics'), card.querySelector('.three-bloc-desc')]);
    });
    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'cards';
    el.replaceWith(block);
  });

  main.querySelectorAll('.push-area').forEach((el) => {
    const cells = [
      ['Cards'],
    ];

    const title = el.querySelector('.push-area__title');
    if (title) {
      const h2 = document.createElement('h2');
      h2.textContent = title.textContent;
      el.before(h2);
    }

    el.querySelectorAll('.push-card').forEach((card) => {
      const img = card.querySelector('.push-card__img');
      const content = card.querySelector('.push-card__content');
      content.querySelectorAll('.push-card__title').forEach((cardTitle) => {
        const h3 = document.createElement('h3');
        h3.textContent = cardTitle.textContent;
        cardTitle.replaceWith(h3);
      });
      cells.push([img, content]);
    });
    const block = WebImporter.DOMUtils.createTable(cells, document);
    block.dataset.blockName = 'cards';
    el.replaceWith(block);
  });
};

export default {
  transform: ({
    document, _url, _html, params,
  }) => {
    const results = [];

    const main = document.querySelector('main');

    const meta = createMetadata(document);
    const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
    metaBlock.dataset.blockName = 'metadata';
    main.prepend(metaBlock);

    buildZPatterns(main, document);
    buildImageColumns(main, document);
    buildCards(main, document);

    results.push({
      element: main,
      path: new URL(params.originalURL).pathname,
    });

    return results;
  },
  preprocess: ({ document }) => {
    document.querySelectorAll('img').forEach((img) => {
      if (img.dataset.lazy) {
        img.src = img.dataset.lazy;
        delete img.dataset.lazy;
      }

      img.setAttribute('loading', 'eager');
    });
  },
};
