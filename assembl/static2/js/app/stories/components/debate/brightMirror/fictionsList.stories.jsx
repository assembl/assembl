// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import { PublicationStates } from '../../../../constants';
import FictionsList, { type Props as FictionsListProps } from '../../../../components/debate/brightMirror/fictionsList';

export const customFictionsList: FictionsListProps = {
  posts: [
    {
      id: '0',
      subject: 'Red is dead',
      creationDate: '2018-04-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
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
      creationDate: '2018-03-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
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
      creationDate: '2018-02-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      body: 'Oh non c\'est affreux'
    },
    {
      id: '3',
      subject: 'Red is dead 4',
      creationDate: '2018-10-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.DRAFT,
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
  lang: 'en'
};

storiesOf('FictionsList', module).add('default', withInfo()(() => <FictionsList {...customFictionsList} />));