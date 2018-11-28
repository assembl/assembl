// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { getExtractTagId } from '../../../../../utils/extract';
/* eslint-enable */

import {
  DumbSideCommentBox,
  type Props as SideCommentBoxProps
} from '../../../../../components/debate/brightMirror/sideComment/sideCommentBox';
import { ExtractStates, PublicationStates } from '../../../../../constants';

const currentUser = {
  displayName: 'John Doe User',
  id: '1223456',
  userId: 1,
  isDeleted: false,
  isMachine: false,
  preferences: {
    harvestingTranslation: {
      localeFrom: 'en',
      localeInto: 'fr'
    }
  }
};

const commentor = {
  displayName: 'Odile Commenter',
  id: '21',
  userId: 2,
  isDeleted: false,
  isMachine: false,
  preferences: {
    harvestingTranslation: {
      localeFrom: 'en',
      localeInto: 'fr'
    }
  }
};

const richBody =
  '<p><strong>Lorem ipsum dolor sit amet.</strong></p><div class="atomic-block" data-blocktype="atomic">' +
  '<img class="attachment-image" src="https://picsum.photos/400/200/" alt="" title="loremPixel.jpg" ' +
  'data-id="1" data-mimetype="image/jpeg"></div><p></p><p>https://youtu.be/MzfBIcJaJSU</p>';

const extract0 = {
  body: 'This is the extract!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: currentUser,
  extractNature: 'issue',
  extractAction: 'classify',
  extractState: ExtractStates.PUBLISHED,
  id: '987643',
  lang: 'en',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
      xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
    }
  ],
  comments: [
    {
      id: '0',
      parentId: null,
      creationDate: '2018-01-26T09:19:01.492406+00:00',
      creator: commentor,
      body: richBody,
      attachments: [],
      publicationState: PublicationStates.PUBLISHED
    }
  ]
};

const extract1 = {
  body: 'This is the extract!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: currentUser,
  extractNature: 'issue',
  extractAction: 'classify',
  extractState: ExtractStates.PUBLISHED,
  id: '987643',
  lang: 'en',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
      xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
    }
  ],
  comments: [
    {
      id: '1',
      parentId: null,
      creationDate: '2017-02-12T09:19:01.492406+00:00',
      creator: currentUser,
      body: 'Second comment!',
      attachments: [],
      publicationState: PublicationStates.PUBLISHED
    }
  ]
};

const extract2 = {
  body: 'This is the extract!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: currentUser,
  extractNature: 'issue',
  extractAction: 'classify',
  extractState: ExtractStates.PUBLISHED,
  id: '987643',
  lang: 'en',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: `//div[@id='${getExtractTagId(3059)}']/`,
      xpathStart: `//div[@id='${getExtractTagId(3059)}']/`
    }
  ],
  comments: [
    {
      id: '2',
      parentId: null,
      creationDate: '2001-03-10T09:19:01.492406+00:00',
      creator: commentor,
      body: 'Third comment!',
      attachments: [],
      publicationState: PublicationStates.PUBLISHED
    }
  ]
};

const extractWithReply = {
  body: 'This is the extract!',
  creationDate: '2018-03-29T16:28:27.324276+00:00',
  creator: currentUser,
  extractNature: 'issue',
  extractAction: 'classify',
  extractState: ExtractStates.PUBLISHED,
  id: '987643',
  lang: 'en',
  important: false,
  textFragmentIdentifiers: [
    {
      offsetEnd: 988,
      offsetStart: 973,
      xpathEnd: '//div[@id=\'message-body-local:Content/3059\']/',
      xpathStart: '//div[@id=\'message-body-local:Content/3059\']/'
    }
  ],
  comments: [
    {
      id: '0',
      parentId: null,
      creationDate: '2018-01-26T09:19:01.492406+00:00',
      creator: commentor,
      body: richBody,
      attachments: [],
      publicationState: PublicationStates.PUBLISHED
    },
    {
      id: '1',
      parentId: '0',
      creationDate: '2018-01-27T10:19:01.492406+00:00',
      creator: currentUser,
      body: 'This is a reply to a comment',
      attachments: [],
      publicationState: PublicationStates.PUBLISHED
    }
  ]
};

export const defaultSideCommentBoxProps: SideCommentBoxProps = {
  ideaId: '0',
  extracts: [extract0],
  currentUser: currentUser,
  postId: '1',
  submitting: false,
  contentLocale: 'en',
  lang: 'en',
  selection: null,
  toggleSubmitDisplay: action('toggleSubmitDisplay'),
  cancelSubmit: action('cancelSubmit'),
  addPostExtract: action('addPostExtract'),
  createPost: action('createPost'),
  refetchPost: action('refetchPost'),
  toggleExtractsBox: action('toggleExtractsBox'),
  deleteExtract: action('deleteExtract'),
  deletePost: action('deletePost'),
  uploadDocument: action('uploadDocument'),
  updatePost: action('updatePost'),
  toggleCommentsBox: action('toggleCommentsBox'),
  position: { x: 0, y: 0 },
  setPositionToExtract: action('setPositionToExtract'),
  setPositionToCoordinates: action('setPositionToCoordinates'),
  clearHighlights: action('clearHighlights'),
  userCanReply: false
};

export const multipleSideCommentBoxProps: SideCommentBoxProps = {
  ...defaultSideCommentBoxProps,
  extracts: [extract0, extract1, extract2],
  setPositionToExtract: () => {}
};

export const submittingSideCommentBoxProps: SideCommentBoxProps = {
  ...defaultSideCommentBoxProps,
  submitting: true
};

export const canReplySideCommentBoxProps: SideCommentBoxProps = {
  ...defaultSideCommentBoxProps,
  userCanReply: true
};

export const withReplySideCommentBoxProps: SideCommentBoxProps = {
  ...defaultSideCommentBoxProps,
  extracts: [extractWithReply],
  setPositionToExtract: () => {}
};

storiesOf('SideCommentBox', module)
  .addDecorator(withKnobs)
  .add('single comment', withInfo()(() => <DumbSideCommentBox {...defaultSideCommentBoxProps} />))
  .add('multiple comments', withInfo()(() => <DumbSideCommentBox {...multipleSideCommentBoxProps} />))
  .add('submitting', withInfo()(() => <DumbSideCommentBox {...submittingSideCommentBoxProps} />))
  .add('can reply', withInfo()(() => <DumbSideCommentBox {...canReplySideCommentBoxProps} />))
  .add('with reply', withInfo()(() => <DumbSideCommentBox {...withReplySideCommentBoxProps} />));