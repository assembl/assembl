// Flow removed due to many errors in different post attributes
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import FictionsList from '../../../../components/debate/brightMirror/fictionsList';

export const customFictionsList = {
  posts: [
    {
      id: '0',
      subject: 'Red is dead',
      creationDate: '2018-01-26T09:19:01.492406+00:00',
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      body: 'Oh non c\'est affreux'
    },
    {
      id: '1',
      subject: 'Red is dead 2',
      creationDate: '2018-01-26T09:19:01.492406+00:00',
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      body: 'Oh non c\'est affreux'
    },
    {
      id: '2',
      subject: 'Red is dead 3',
      creationDate: '2018-01-26T09:19:01.492406+00:00',
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      body: 'Oh non c\'est affreux'
    }
  ],
  identifier: 'brightMirror',
  themeId: 'themeId',
  refetchIdea: Function,
  contentLocale: 'en'
};

storiesOf('FictionsList', module).add('default', withInfo()(() => <FictionsList {...customFictionsList} />));