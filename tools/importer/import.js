/* global WebImporter */

const getMetadata = (name, document) => {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...document.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content)
    .join(', ');
  return meta || '';
};

const rewritePath = (path) => {
  let finalPath = path.replace(/\/$/, '').replace(/\.(s)?html$/, '');

  const pathParts = path.split('/');
  const name = pathParts.pop();
  if (name.includes('.')) {
    const nameParts = name.split('.');
    finalPath = `/${nameParts[1]}${pathParts.join('/')}/${nameParts[0]}`;
  }

  return finalPath;
};

const rewriteURL = (url) => {
  const path = (new URL(url)).pathname;
  return rewritePath(path);
};

const toClassName = (name) => {
  if (typeof name === 'string') {
    const clsName = name.toLowerCase()
      .replace(/[^0-9a-z]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return clsName;
  }

  return '';
};

const buildSections = (main, document) => {
  document.querySelectorAll('.one-bloc-no-pics').forEach((content) => {
    const hasAlignCenter = [...content.children].some((c) => c.getAttribute('style')?.includes('text-align: center;'));
    if (!hasAlignCenter) {
      const section = document.createElement('div');
      content.before(section);
      section.append(content);

      const sectionMeta = WebImporter.DOMUtils.createTable([['Section Metadata'], ['Style', 'align-left']], document);
      section.append(sectionMeta);
      section.prepend(document.createElement('hr'));
      section.append(document.createElement('hr'));
    }
  });
};

const convertBlocksToTables = (main, document) => {
  main.querySelectorAll('.block').forEach((block) => {
    const cells = [];
    const blockName = `${block.dataset.blockName}${block.dataset.variants ? ` (${block.dataset.variants})` : ''}`;
    cells.push([blockName]);

    [...block.children].forEach((row) => {
      const rowCell = [];
      [...row.children].forEach((col) => {
        rowCell.push(col);
      });
      cells.push(rowCell);
    });

    const table = WebImporter.DOMUtils.createTable(cells, document);
    table.dataset.originalBlock = block.dataset.originalBlock || '';
    table.dataset.blockName = block.dataset.blockName || '';
    table.dataset.variants = block.dataset.variants || '';
    block.replaceWith(table);
  });
};

const createBlock = ({ blockname, variants, cells }, document) => {
  const block = document.createElement('div');
  block.className = `block ${toClassName(blockname)}`;
  block.dataset.blockName = blockname;
  if (variants) {
    variants.forEach((variant) => {
      block.classList.add(toClassName(variant));
    });
    block.dataset.variants = variants.join(', ');
  }
  let rowCount = 0;
  let colCount = 0;
  cells.forEach((row) => {
    const rowEl = document.createElement('div');
    block.append(rowEl);
    rowCount += 1;
    if (row.length > colCount) colCount = row.length;
    row.forEach((col) => {
      const colEl = document.createElement('div');
      colEl.append(col);
      rowEl.append(colEl);
    });
  });
  block.dataset.rows = rowCount;
  block.dataset.cols = colCount;
  return block;
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

  const robots = getMetadata('robots', document);
  if (robots && robots !== 'index, follow') {
    meta.Robots = robots;
  }

  return meta;
};

const buttonLineBreak = (content, classIdentifier, document) => {
  const buttonEl = content.querySelectorAll(classIdentifier);
  if (buttonEl !== null && buttonEl.length > 0) {
    const newParagraph = document.createElement('p');
    const anchorEl = buttonEl[0].parentNode;
    content.insertBefore(newParagraph, anchorEl);
    newParagraph.appendChild(anchorEl);
  }
};

const buildColumnRow = (row, cells, document, reverse = false) => {
  const left = row.classList.contains('one-bloc-left-pics');
  const img = left ? row.querySelector('.one-bloc-left-pics__img-wrap') : row.querySelector('.one-bloc-right-pics__img-wrap');
  const content = left ? row.querySelector('.one-bloc-left-pics__right-desc') : row.querySelector('.one-bloc-right-pics__left-desc');
  // forcing linebreak in case of button
  buttonLineBreak(content, '[class*="highlight-button-label"]', document);
  content.querySelectorAll('.one-bloc-left-pics__highlight-title, .one-bloc-right-pics__highlight-title').forEach((title) => {
    const titleEl = document.createElement('h2');
    titleEl.textContent = title.textContent;
    title.replaceWith(titleEl);
  });
  cells.push((reverse ? [content, img] : [img, content]));
};

const combineSubsequentBlocks = (main, blockName) => {
  let keepCombining = true;
  while (keepCombining) {
    const secondCols = main.querySelector(`.${blockName} + .${blockName}`);
    if (secondCols) {
      const firstCols = secondCols.previousElementSibling;
      if ((firstCols.dataset.variants === secondCols.dataset.variants)
        && (firstCols.dataset.cols === secondCols.dataset.cols)) {
        [...secondCols.children].forEach((row) => {
          firstCols.append(row);
          firstCols.dataset.originalBlock += `, ${secondCols.dataset.originalBlock}`;
        });
        secondCols.remove();
      } else {
        keepCombining = false;
      }
    } else {
      keepCombining = false;
    }
  }
};

const buildAccordions = (main, document) => {
  main.querySelectorAll('.accordion').forEach((el) => {
    const cells = [
    ];

    el.querySelectorAll('.accordion__item').forEach((item) => {
      const row = [item.querySelector('.accordion__title'), item.querySelector('.accordion__content')];
      cells.push(row);
    });

    const block = createBlock({
      blockname: 'Accordion',
      cells,
    }, document);
    block.dataset.originalBlock = 'accordion';
    el.replaceWith(block);
  });

  combineSubsequentBlocks(main, 'accordion');
};

const buildVideos = (main, document) => {
  main.querySelectorAll('.bloc-video').forEach((video) => {
    const cells = [];
    let videoSource;
    if (video.querySelector('.youtube-video')) {
      const ytIframe = video.querySelector('iframe[src*="https://www.youtube.com/embed"]');
      videoSource = ytIframe.src;
    } else if (video.querySelector('video source')) {
      const srcUrl = video.querySelector('video source').src;
      const sourceUrl = new URL(srcUrl);
      videoSource = `https://all.accor.com${sourceUrl.pathname}`;
    }

    const link = document.createElement('a');
    link.textContent = videoSource;
    link.href = videoSource;
    cells.push([link]);

    const details = video.querySelector('details .details__description');
    if (details) {
      cells.push([details]);
    }

    const block = createBlock({
      blockname: 'Video',
      cells,
    }, document);
    block.dataset.originalBlock = 'bloc-video';
    video.replaceWith(block);
  });
};

const buildImageColumns = (main, document) => {
  main.querySelectorAll('.one-bloc-left-pics').forEach((el) => {
    const cells = [];
    buildColumnRow(el, cells, document);

    const block = createBlock({
      blockname: 'Columns',
      cells,
    }, document);
    block.dataset.originalBlock = 'one-bloc-left-pics';
    el.replaceWith(block);
  });

  main.querySelectorAll('.one-bloc-right-pics').forEach((el) => {
    const cells = [];
    buildColumnRow(el, cells, document, true);

    const block = createBlock({
      blockname: 'Columns',
      cells,
    }, document);
    block.dataset.originalBlock = 'one-bloc-right-pics';
    el.replaceWith(block);
  });

  combineSubsequentBlocks(main, 'columns');
};

const buildBanners = (main, document) => {
  main.querySelectorAll('.blocEnrollBanner').forEach((enrollBanner) => {
    enrollBanner.querySelector('.blocEnrollBanner__link .mobile').remove();

    const cells = [[...enrollBanner.children]];

    const block = createBlock({
      blockname: 'Enroll Banner',
      cells,
    }, document);
    block.dataset.originalBlock = 'blocEnrollBanner';
    enrollBanner.replaceWith(block);
  });

  main.querySelectorAll('.heroBanner').forEach((hero) => {
    hero.querySelector('.heroBanner__description .roundButton.mobile').remove();

    const cells = [[...hero.children]];

    const block = createBlock({
      blockname: 'Hero Banner',
      cells,
    }, document);
    block.dataset.originalBlock = 'heroBanner';
    hero.replaceWith(block);
    hero.after(document.createElement('hr'));
  });
};

const buildCards = (main, document) => {
  main.querySelectorAll('.row-bloc-three').forEach((el) => {
    const cells = [];

    el.querySelectorAll('.three-bloc').forEach((card) => {
      cells.push([card.querySelector('.three-bloc-pics'), card.querySelector('.three-bloc-desc')]);
    });
    const block = createBlock({
      blockname: 'Cards',
      cells,
    }, document);
    block.dataset.originalBlock = 'row-bloc-three';
    el.replaceWith(block);
  });

  main.querySelectorAll('.row-bloc-two').forEach((el) => {
    const cells = [];

    el.querySelectorAll('.two-bloc').forEach((card) => {
      cells.push([card.querySelector('.two-bloc-pics'), card.querySelector('.two-bloc-desc')]);
    });
    const block = createBlock({
      blockname: 'Cards',
      variants: ['Two Columns'],
      cells,
    }, document);
    block.dataset.originalBlock = 'row-bloc-two';
    el.replaceWith(block);
  });

  main.querySelectorAll('.rowBlocs > .rowBlocs__content').forEach((el) => {
    const cells = [];

    el.querySelectorAll('.blocPicture').forEach((card) => {
      cells.push([card.querySelector('.blocPicture__image'), card.querySelector('.blocPicture__description')]);
    });
    const block = createBlock({
      blockname: 'Cards',
      variants: ['Four Columns'],
      cells,
    }, document);
    block.dataset.originalBlock = 'rowBlocs';
    el.parentNode.replaceWith(block);
  });

  main.querySelectorAll('.push-area').forEach((el) => {
    const variants = ['CTA'];
    if (el.classList.contains('area-two-four-desktop')) {
      variants.push('Two Columns');
    }
    const cells = [];

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
      buttonLineBreak(content, '.push-card__button-label', document);
      cells.push([img, content]);
    });
    const block = createBlock({
      blockname: 'Cards',
      variants,
      cells,
    }, document);
    block.dataset.originalBlock = 'push-area';
    el.replaceWith(block);
  });

  combineSubsequentBlocks(main, 'cards');
};

const buildReport = (main) => {
  const blockNames = new Set([...main.querySelectorAll('[data-block-name]')].map((block) => {
    const { blockName, variants } = block.dataset;
    return `${blockName}${variants ? ` (${variants})` : ''}`;
  }));

  const originalBlocks = new Set();
  main.querySelectorAll('[data-original-block]').forEach((block) => {
    block.dataset.originalBlock.split(',').forEach((blockName) => {
      originalBlocks.add(blockName.trim());
    });
  });

  const potentialBlocks = new Set();
  const ignoredClasses = ['clearfix', 'box', 'parent'];
  [...main.children].forEach((child) => {
    if (child.tagName === 'DIV') {
      if (child.classList.contains('main_content')) {
        [...child.children].forEach((gChild) => {
          if (gChild.tagName === 'DIV') {
            [...gChild.classList].forEach((cls) => {
              if (!ignoredClasses.includes(cls)) {
                potentialBlocks.add(cls);
              }
            });
          }
        });
      } else {
        [...child.classList].forEach((cls) => {
          if (!ignoredClasses.includes(cls)) {
            potentialBlocks.add(cls);
          }
        });
      }
    }
  });

  return {
    blockNames,
    originalBlocks,
    potentialBlocks,
  };
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

    buildBanners(main, document);
    buildImageColumns(main, document);
    buildCards(main, document);
    buildVideos(main, document);
    buildAccordions(main, document);
    buildSections(main, document);

    convertBlocksToTables(main, document);

    const report = buildReport(main);

    results.push({
      element: main,
      path: rewriteURL(params.originalURL),
      report,
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
    document.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href !== null && href.indexOf('shtml') > -1 && href.startsWith('/')) {
        link.setAttribute('href', rewritePath(href));
      }
    });
  },
};
