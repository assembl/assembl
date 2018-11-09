// @flow
import * as Sentry from '@sentry/browser';

export function initializeSentry(element: HTMLElement): void {
  if (element && element.dataset.sentryDsn) {
    Sentry.init({ dsn: element.dataset.sentryDsn });
  }
}