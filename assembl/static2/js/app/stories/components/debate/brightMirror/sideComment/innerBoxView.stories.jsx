// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import { getExtractTagId } from '../../../../../utils/extract';
/* eslint-enable */

import InnerBoxView, { Props } from '../../../../../components/debate/brightMirror/sideComment/innerBoxView';
import { ExtractStates } from '../../../../../constants';

export const currentUser = {
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

export const commentor = {
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

export const richBody =
  '<p><strong>Lorem ipsum dolor sit amet.</strong></p><div class="atomic-block" data-blocktype="atomic">' +
  '<img class="attachment-image" src="https://picsum.photos/400/200/" alt="" title="loremPixel.jpg" ' +
  'data-id="1" data-mimetype="image/jpeg"></div><p></p><p>https://youtu.be/MzfBIcJaJSU</p>';

const comment = {
  id: '0',
  creationDate: '2018-01-26T09:19:01.492406+00:00',
  creator: commentor,
  body: richBody,
  attachments: []
};

export const extract0 = {
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
  comments: [comment]
};

export const extract1 = {
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
  comments: [comment]
};

export const extract2 = {
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
  comments: [comment]
};

export const defaultInnerBoxViewProps: Props = {
  contentLocale: 'en',
  extractIndex: 0,
  extracts: [extract0],
  comment: comment,
  changeCurrentExtract: action('changeCurrentExtract')
};

export const multipleInnerBoxViewProps: Props = {
  ...defaultInnerBoxViewProps,
  extractIndex: 1,
  extracts: [extract0, extract1, extract2]
};

storiesOf('InnerBoxView', module)
  .addDecorator(withKnobs)
  .add(
    'single comment',
    withInfo()(() => (
      <div className="harvesting-box">
        <InnerBoxView {...defaultInnerBoxViewProps} />
      </div>
    ))
  )
  .add(
    'multiple comments',
    withInfo()(() => (
      <div className="harvesting-box">
        <InnerBoxView {...multipleInnerBoxViewProps} />
      </div>
    ))
  );