// @flow
import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, object, select } from '@storybook/addon-knobs';

import FictionBodyToolbar, { type Props } from '../../../../components/debate/brightMirror/fictionBodyToolbar';
import { SENTIMENTS } from '../../../../constants';

export const props: Props = {
  position: { x: 100, y: 0 },
  postId: '2',
  mySentiment: 'LIKE',
  sentimentCounts: {
    disagree: 0,
    dontUnderstand: 0,
    like: 1,
    moreInfo: 0
  },
  isPhaseCompleted: false,
  client: action('client'),
  screenWidth: 100
};

storiesOf('FictionBodyToolbar', module)
  .addDecorator(withKnobs)
  .add('default', () => <FictionBodyToolbar {...props} />)
  .add('playground', () => (
    <FictionBodyToolbar
      postId={props.postId}
      position={props.position}
      screenWidth={props.screenWidth}
      isPhaseCompleted={props.isPhaseCompleted}
      mySentiment={select('my sentiment', SENTIMENTS, props.mySentiment)}
      sentimentCounts={object('sentiments counts', props.sentimentCounts)}
    />
  ));