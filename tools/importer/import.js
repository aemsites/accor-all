/* global WebImporter */

const convertPath = (url, lang) => {
  const pagePath = new URL(url).pathname;
  const sanitized = WebImporter.FileUtils.sanitizePath(pagePath.replace(/\.(s)?html$/, '').toLowerCase());

  const langSelectorMatch = /.[a-z]{2}$/.exec(sanitized);
  if (langSelectorMatch) {
    return `${lang}/${sanitized.replace(langSelectorMatch[0], '')}`;
  }

  return sanitized;
};

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

const convertBlocks = (element, document) => {
  const banner = element.querySelector('.main-banner');
  if (banner) {
    const heroSection = document.createElement('section');
    heroSection.append(banner.querySelector('h1'));
    heroSection.append(banner.querySelector('.image-thematic'));
    heroSection.append(document.createElement('hr'));

    heroSection.dataset.blockName = 'hero';

    banner.replaceWith(heroSection);
  }

  element.querySelectorAll('.introduction').forEach((intro) => {
    intro.querySelectorAll('p').forEach((p) => {
      let breakPoint = p.querySelector('br + br');
      let count = 0;
      while (breakPoint && count < 10) {
        breakPoint.previousElementSibling.remove();
        const parMarker = document.createElement('hr');
        parMarker.className = 'paragraph-replace-marker';
        breakPoint.replaceWith(parMarker);
        count += 1;
        breakPoint = p.querySelector('br + br');
      }

      p.innerHTML = p.innerHTML.replace(/<hr class="paragraph-replace-marker">/g, '</p><p>');
    });
    intro.append(document.createElement('hr'));
    intro.dataset.blockName = 'introduction';
  });

  element.querySelectorAll('.destinations').forEach((destinations) => {
    if (destinations.querySelector('.destination')) {
      const carousel = [['Carousel']];
      destinations.querySelectorAll('.destination').forEach((destination) => {
        if (destination.classList.contains('slick-cloned')) {
          return;
        }
        const cardContent = destination.querySelector('.destination__infos');
        if (cardContent.querySelector('.destination__title')) {
          const title = document.createElement('strong');
          title.textContent = cardContent.querySelector('.destination__title').textContent;
          cardContent.querySelector('.destination__title').replaceWith(title);
        }
        carousel.push([destination.querySelector('.destination__image'), cardContent]);
      });

      const block = WebImporter.DOMUtils.createTable(carousel, document);
      block.dataset.blockName = 'carousel';
      destinations.replaceWith(block);
    } else {
      destinations.remove();
    }
  });

  element.querySelectorAll('.destination-guide').forEach((destinations) => {
    if (destinations.querySelector('.destination')) {
      const dg = [['Carousel (Inline)']];
      const heading = destinations.querySelector('h2');

      destinations.querySelectorAll('.destination').forEach((destination) => {
        if (destination.classList.contains('slick-cloned')) {
          return;
        }
        const cardContent = destination.querySelector('.destination__infos');
        if (cardContent.querySelector('.destination__location')) {
          const title = document.createElement('strong');
          title.textContent = cardContent.querySelector('.destination__location').textContent;
          cardContent.querySelector('.destination__location').replaceWith(title);
        }
        dg.push([destination.querySelector(':scope > img'), cardContent]);
      });

      const block = WebImporter.DOMUtils.createTable(dg, document);
      block.dataset.blockName = 'carousel (inline)';
      destinations.replaceWith(block);
      if (heading) {
        block.before(heading);
      }
    } else {
      destinations.remove();
    }
  });

  element.querySelectorAll('.other-themes').forEach((themes) => {
    if (themes.querySelector('.theme')) {
      const blockData = [['Carousel (Multiple)']];
      const heading = themes.querySelector('h2');
      themes.querySelectorAll('.theme').forEach((theme) => {
        if (theme.classList.contains('slick-cloned')) {
          return;
        }
        const img = theme.querySelector('.theme__image');
        const themeContent = document.createElement('div');
        const link = theme.querySelector('a');
        link.textContent = theme.querySelector('.theme__title').textContent;
        themeContent.append(link);
        blockData.push([img, themeContent]);
      });
      const block = WebImporter.DOMUtils.createTable(blockData, document);
      block.dataset.blockName = 'carousel (multiple)';
      themes.replaceWith(block);
      if (heading) {
        block.before(heading);
      }
    } else {
      themes.remove();
    }
  });

  element.querySelectorAll('.hotels-selection').forEach((hotels) => {
    if (hotels.querySelector('.hotel')) {
      const hotelsMeta = [['Hotels']];
      const heading = hotels.querySelector('h2');
      hotels.querySelectorAll('.hotel').forEach((hotel) => {
        const imageLink = hotel.querySelector('.photo__link');
        const hotelInfos = hotel.querySelector('.hotel__infos');
        const hotelContent = document.createElement('div');

        const name = document.createElement('h3');
        name.append(hotelInfos.querySelector('.hotel__name'));

        const location = document.createElement('strong');
        location.append(hotelInfos.querySelector('.hotel__location'));

        hotelContent.append(name);
        hotelContent.append(location);
        hotelContent.append(hotelInfos.querySelector('.hotel__description'));
        hotelsMeta.push([imageLink, hotelContent]);
      });
      const block = WebImporter.DOMUtils.createTable(hotelsMeta, document);
      block.prepend(heading);
      block.dataset.blockName = 'hotels';
      hotels.replaceWith(block);
    } else {
      hotels.remove();
    }
  });

  element.querySelectorAll('.montion-legal').forEach((legal) => {
    legal.dataset.fragmentName = 'legal';
  });

  element.querySelectorAll('.why-reservation').forEach((whyReserve) => {
    const blockContent = document.createElement('div');

    const title = whyReserve.querySelector('.container-title');
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = title.textContent;
      blockContent.append(strong);
    }

    const reasons = whyReserve.querySelector('ul.reasons');
    if (reasons) {
      reasons.querySelectorAll('li').forEach((reason) => {
        const liContent = reason.innerHTML;
        reason.innerHTML = `:${reason.className.split('-')[1]}: ${liContent}`.replace(/<br>/g, ' ');
      });
      blockContent.append(reasons);
    }

    const blockData = [['Why Reserve'], [blockContent]];
    const block = WebImporter.DOMUtils.createTable(blockData, document);
    block.dataset.blockName = 'why-reserve';
    whyReserve.replaceChildren(block);
    whyReserve.dataset.fragmentName = 'why-reserve';
  });
};

const gatherBlocks = (element) => [...element.querySelectorAll('[data-block-name]')].map((el) => el.dataset.blockName).join(', ');

const gatherPossibleBlocks = (element) => [...element.children].filter((child) => !child.dataset.blockName).map((el) => el.className).join(', ');

const importHandlers = [
  {
    test: ({ document }) => document.querySelector('.main-banner') && document.querySelector('.main-container'),
    transform: ({
      // eslint-disable-next-line no-unused-vars
      document, url, html, params,
    }) => {
      let { lang } = document.querySelector('html');
      if (!lang) lang = 'en';
      const path = convertPath(url, lang);
      const report = {
        handler: 'thematic',
        fragmentPaths: [],
      };
      const main = document.querySelector('.main-container');
      main.prepend(document.querySelector('.main-banner'));

      convertBlocks(main, document);

      const results = [{
        path,
        element: main,
        report,
      }];

      // extract fragments
      main.querySelectorAll('[data-fragment-name]').forEach((fragment) => {
        const fragmentPath = `/${lang}/fragments/${fragment.dataset.fragmentName}`;
        const fragmentLink = document.createElement('a');
        fragmentLink.href = fragmentPath;
        fragmentLink.dataset.blockName = 'fragment';
        fragmentLink.textContent = fragmentPath;

        report.fragmentPaths.push(fragmentPath);
        results.push({
          path: fragmentPath,
          element: fragment,
          report: {
            handler: 'thematic-fragment',
            blocks: gatherBlocks(fragment),
            possibleBlocks: gatherPossibleBlocks(fragment),
          },
        });

        if (fragment.dataset.fragmentName === 'legal') {
          // remove legal, will autoblock in
          fragment.remove();
        } else {
          fragment.replaceWith(fragmentLink);
        }
      });

      // rewrite links
      main.querySelectorAll('a[href]').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href.startsWith('https://') && !href.startsWith('http://') && !href.startsWith('/')) {
          // link is relative to current page, rewrite to absolute
          const u = new URL(url);
          const parentPath = u.pathname.split('/').slice(0, -1).join('/');
          link.href = `https://all.accor.com${parentPath}/${href}`;
        }

        if (href.startsWith('/')) {
          link.href = `https://all.accor.com${href}`;
          if (link.textContent === href) {
            link.textContent = link.href;
          }
        }
      });

      const meta = createMetadata(document);
      meta.Theme = 'thematic';
      const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
      metaBlock.dataset.blockName = 'metadata';
      main.prepend(metaBlock);

      report.blocks = gatherBlocks(main);
      report.possibleBlocks = gatherPossibleBlocks(main);

      return results;
    },
  },
];

export default {
  transform: (params) => {
    const handler = importHandlers.find((h) => h.test(params));
    if (handler) {
      const results = handler.transform(params);
      return results;
    }

    return [{
      element: params.document.body,
      path: convertPath(params.url),
      report: {
        handler: 'unknown',
      },
    }];
  },
  preprocess: ({ document }) => {
    document.querySelectorAll('img[data-lazy]').forEach((img) => {
      img.src = img.dataset.lazy;
      delete img.dataset.lazy;
    });
  },
};
