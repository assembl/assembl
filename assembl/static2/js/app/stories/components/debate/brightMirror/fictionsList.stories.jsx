// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import FictionsList from '../../../../components/debate/brightMirror/fictionsList';
import type { FictionsListType } from '../../../../components/debate/brightMirror/fictionsList';

export const customFictionsList: FictionsListType = {
  posts: [
    {
      id: 0,
      subject: 'Red is dead',
      creationDate: new Date('2018-01-26T09:19:01.492406+00:00'),
      creator: {
        displayName: 'Odile DeRaie',
        isDeleted: false
      }
    },
    {
      id: 1,
      subject: 'Red is dead 2',
      creationDate: new Date('2018-01-26T09:19:01.492406+00:00'),
      creator: {
        displayName: 'Odile DeRaie',
        isDeleted: false
      }
    },
    {
      id: 2,
      subject: 'Red is dead 3',
      creationDate: new Date('2018-01-26T09:19:01.492406+00:00'),
      creator: {
        displayName: 'Odile DeRaie',
        isDeleted: false
      }
    }
  ],
  identifier: 'brightMirror'
};

storiesOf('FictionsList', module).add('default', withInfo()(() => <FictionsList {...customFictionsList} />));