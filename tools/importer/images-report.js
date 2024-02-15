/* global WebImporter */
export default {
  transform: ({ document, url }) => {
    const result = [];
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const u = new URL(img.src, url);
      const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
      const imgData = {
        path: newPath,
        from: img.src,
        report: {
          alt: img.getAttribute('alt'),
          naturalHeight: img.dataset.height,
          naturalWidth: img.dataset.width,
        },
      };
      result.push(imgData);
    });

    return result;
  },
  onLoad: async ({ document }) => {
    const p = new Promise((resolve) => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        img.dataset.width = img.naturalWidth || img.width;
        img.dataset.height = img.naturalHeight || img.height;
      });
      resolve();
    });
    await p;
  },
};
