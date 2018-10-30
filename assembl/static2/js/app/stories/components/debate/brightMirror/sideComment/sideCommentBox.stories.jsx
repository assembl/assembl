// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { getExtractTagId } from '../../../../../utils/extract';
/* eslint-enable */

import {
  DumbSideCommentBox,
  type Props as SideCommentBoxProps
} from '../../../../../components/debate/brightMirror/sideComment/sideCommentBox';
import { ExtractStates } from '../../../../../constants';

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
  comment: {
    id: '0',
    creationDate: '2018-01-26T09:19:01.492406+00:00',
    creator: commentor,
    body: richBody,
    attachments: []
  }
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
  comment: {
    id: '1',
    creationDate: '2017-02-12T09:19:01.492406+00:00',
    creator: currentUser,
    body: 'Second comment!',
    attachments: []
  }
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
  comment: {
    id: '2',
    creationDate: '2001-03-10T09:19:01.492406+00:00',
    creator: commentor,
    body: 'Third comment!',
    attachments: []
  }
};

export const defaultSideCommentBox: SideCommentBoxProps = {
  extracts: [extract0],
  currentUser: currentUser,
  postId: '1',
  submitting: false,
  contentLocale: 'en',
  lang: 'en',
  selection: null,
  displayCommentBox: true,
  setCommentBoxDisplay: Function,
  cancelSubmit: Function,
  addPostExtract: Function,
  addExtractComment: Function,
  refetchPost: Function,
  toggleExtractsBox: Function,
  position: { x: 0, y: 0 },
  setPositionToExtract: Function,
  clearHighlights: Function
};

export const multipleSideCommentBox: SideCommentBoxProps = {
  ...defaultSideCommentBox,
  extracts: [extract0, extract1, extract2],
  setPositionToExtract: () => {}
};

export const submittingSideCommentBox: SideCommentBoxProps = {
  ...defaultSideCommentBox,
  submitting: true
};

storiesOf('SideCommentBox', module)
  .addDecorator(withKnobs)
  .add('single comment', withInfo()(() => <DumbSideCommentBox {...defaultSideCommentBox} />))
  .add('multiple comments', withInfo()(() => <DumbSideCommentBox {...multipleSideCommentBox} />))
  .add('submitting', withInfo()(() => <DumbSideCommentBox {...submittingSideCommentBox} />));