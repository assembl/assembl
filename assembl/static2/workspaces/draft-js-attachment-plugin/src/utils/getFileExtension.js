// @flow
export default function (filename: string): string {
  const parts = filename.split('.');
  if (parts.length === 1) {
    return 'unknown';
  }

  return parts[parts.length - 1];
}