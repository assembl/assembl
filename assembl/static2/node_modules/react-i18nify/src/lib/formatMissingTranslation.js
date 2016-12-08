export default function formatMissingTranslation(text) {
  const keys = text.split('.');
  return keys[keys.length - 1]
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[A-Z]/g, (str) => str.toLowerCase())
    .replace(/_/g, ' ')
    .replace(/\b./g, (str) => str.toUpperCase());
}
