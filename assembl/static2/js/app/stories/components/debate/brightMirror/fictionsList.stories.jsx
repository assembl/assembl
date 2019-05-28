// @flow
import React from 'react';
import { storiesOf } from '@storybook/react';

import { PublicationStates } from '../../../../constants';
import FictionsList, { type Props as FictionsListProps } from '../../../../components/debate/brightMirror/fictionsList';

export const customFictionsList: FictionsListProps = {
  posts: [
    {
      id: '0',
      dbId: 0,
      subjectEntries: [
        {
          value: 'Red is dead',
          localeCode: 'en'
        }
      ],
      creationDate: '2018-04-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      bodyEntries: [
        {
          value: 'Oh non c\'est affreux',
          localeCode: 'fr'
        }
      ]
    },
    {
      id: '1',
      dbId: 1,
      subjectEntries: [
        {
          value: 'Red is dead 2',
          localeCode: 'en'
        }
      ],
      creationDate: '2018-03-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      bodyEntries: [
        {
          value: 'Oh non c\'est affreux',
          localeCode: 'fr'
        }
      ]
    },
    {
      id: '2',
      dbId: 2,
      subjectEntries: [
        {
          value: 'Red is dead 3',
          localeCode: 'en'
        }
      ],
      creationDate: '2018-02-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.PUBLISHED,
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      bodyEntries: [
        {
          value: 'Oh non c\'est affreux',
          localeCode: 'fr'
        }
      ]
    },
    {
      id: '3',
      dbId: 3,
      subjectEntries: [
        {
          value: 'Red is dead 4',
          localeCode: 'en'
        }
      ],
      creationDate: '2018-10-26T09:19:01.492406+00:00',
      publicationState: PublicationStates.DRAFT,
      creator: {
        userId: '1',
        displayName: 'Odile DeRaie',
        isDeleted: false
      },
      bodyEntries: [
        {
          value: 'Oh non c\'est affreux',
          localeCode: 'fr'
        }
      ]
    }
  ],
  identifier: 'brightMirror',
  themeId: 'themeId',
  refetchIdea: Function,
  lang: 'en'
};

storiesOf('FictionsList', module).add('default', () => <FictionsList {...customFictionsList} />);