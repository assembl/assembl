import { getDomElementOffset } from './globalFunctions';

export default () => {
  const { hash } = window.location;
  if (hash !== '') {
    const id = hash.replace('#', '').split('?')[0];
    // Push onto callback queue so it runs after the DOM is updated,
    // this is required when navigating from a different page so that
    // the element is rendered on the page before trying to getElementById.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = getDomElementOffset(element).top - 160;
        window.scrollTo({ top: offset, left: 0, behavior: 'smooth' });
      }
    }, 0);
  }
};