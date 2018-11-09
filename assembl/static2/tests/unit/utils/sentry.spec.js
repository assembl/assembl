// @flow
import * as Sentry from '@sentry/browser';

import { initializeSentry } from '../../../js/app/utils/sentry';

jest.mock('@sentry/browser');

describe('initializeSentry function', () => {
  beforeEach(() => {
    Sentry.init.mockReset();
  });

  it('should initialize sentry with the dsn carried by given element', () => {
    const element = document.createElement('div');
    element.dataset = {
      sentryDsn: 'http://78979791248@my-sentry-server.com/2'
    };
    initializeSentry(element);
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'http://78979791248@my-sentry-server.com/2'
    });
  });

  it('should not initialize sentry if there is no dsn on element', () => {
    const element = document.createElement('div');
    element.dataset = {};
    initializeSentry(element);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('should not initialize sentry if dsn is empty', () => {
    const element = document.createElement('div');
    element.dataset = {
      sentryDsn: ''
    };
    initializeSentry(element);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});