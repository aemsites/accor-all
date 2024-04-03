/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */
import { domEl, p, div } from '../../scripts/dom-helpers.js';
import { fetchLanguagePlaceholders } from '../../scripts/utils.js';

async function embedYoutube(block, url, autoplay) {
  const usp = new URLSearchParams(url.search);
  const suffix = autoplay ? '&muted=1&autoplay=1' : '';
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const embed = url.pathname;
  if (!vid && embed.startsWith('/embed')) {
    vid = url.pathname.split('/').pop();
  }

  const langPlaceholders = await fetchLanguagePlaceholders();

  const videoEl = div(
    { style: 'left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;' },
    domEl('iframe', {
      src: `https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}`,
      style: 'border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;',
      allow: 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture',
      allowfullscreen: '',
      scrolling: 'no',
      title: langPlaceholders.contentFromYoutube || 'Content from Youtube',
      loading: 'lazy',
    }),
  );

  block.querySelector('.video-overlay').append(videoEl);
}

async function embedVimeo(block, url, autoplay) {
  const [, video] = url.pathname.split('/');
  const suffix = autoplay ? '?muted=1&autoplay=1' : '';

  const langPlaceholders = await fetchLanguagePlaceholders();

  const videoEl = div(
    { style: 'left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;' },
    domEl('iframe', {
      src: `https://player.vimeo.com/video/${video}${suffix}`,
      style: 'border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;',
      allow: 'autoplay; fullscreen; picture-in-picture',
      frameborder: '0',
      allowfullscreen: '',
      title: langPlaceholders.contentFromVimeo || 'Content from Vimeo',
      loading: 'lazy',
    }),
  );

  block.querySelector('.video-overlay').append(videoEl);
}

async function embedVideoElement(block, url, autoplay) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.dataset.loading = 'true';
  video.addEventListener('loadedmetadata', () => delete video.dataset.loading);
  if (autoplay) video.setAttribute('autoplay', '');

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', url);
  sourceEl.setAttribute('type', `video/${url.pathname.split('.').pop()}`);
  video.append(sourceEl);

  video.addEventListener('play', () => block.classList.add('playing'));
  video.addEventListener('pause', () => block.classList.remove('playing'));
  video.addEventListener('ended', () => block.classList.remove('playing'));

  block.querySelector('.video-overlay').append(video);
}

const loadVideoEmbed = async (block, link, autoplay, loaderFn) => {
  if (block.dataset.embedLoaded) {
    return;
  }
  const url = new URL(link);

  await loaderFn(block, url, autoplay);

  block.dataset.embedLoaded = true;
};

const detectVideoType = (linkHref) => {
  const types = [
    {
      type: 'mp4',
      load: embedVideoElement,
      match: (href) => href.includes('.mp4'),
    },
    {
      type: 'youtube',
      load: embedYoutube,
      match: (href) => href.includes('youtube') || href.includes('youtu.be'),
    },
    {
      type: 'vimeo',
      load: embedVimeo,
      match: (href) => href.includes('vimeo'),
    },
  ];
  const type = types.find((t) => t.match(linkHref));
  return type || types[0];
};

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a');
  const descriptionPars = [...block.querySelectorAll('p')].filter((par) => !par.contains(link) && !par.contains(placeholder));
  block.textContent = '';

  const videoType = detectVideoType(link.href);
  block.classList.add(`video-${videoType.type}`);

  const videoOverlay = div(
    { class: 'video-overlay' },
    div({ class: 'video-play-button' }, domEl('button', { type: 'button', title: 'Play' })),
  );
  if (placeholder) {
    placeholder.classList.add('video-placeholder');
    videoOverlay.append(placeholder);
    block.classList.add('with-placeholder');
  } else if (videoType.type === 'mp4') {
    const langPlaceholders = await fetchLanguagePlaceholders();

    const details = domEl(
      'details',
      domEl(
        'summary',
        p(langPlaceholders.playVideo || 'Play video'),
      ),
      div({ class: 'description-text' }, ...descriptionPars),
    );
    block.append(details);
  }

  block.prepend(videoOverlay);
  videoOverlay.addEventListener('click', () => {
    loadVideoEmbed(block, link.href, true, videoType.load);
  }, { once: true });

  if (videoType.type === 'mp4') {
    videoOverlay.querySelector('.video-play-button').addEventListener('click', () => {
      const videoEl = videoOverlay.querySelector('video');
      if (videoEl) {
        videoEl.play();
      }
    });
  }

  if (!placeholder) {
    block.classList.add('lazy-loading');
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadVideoEmbed(block, link.href, false, videoType.load);
      }
    });
    observer.observe(block);
  }
}
