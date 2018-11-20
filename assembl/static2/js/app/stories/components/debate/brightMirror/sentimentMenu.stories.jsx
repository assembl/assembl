// @flow
import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, object, select, boolean } from '@storybook/addon-knobs';

import SentimentMenu, { type Props } from '../../../../components/debate/brightMirror/sentimentMenu';
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
  screenWidth: 100,
  refetchPost: action('refetchPost')
};

storiesOf('SentimentMenu', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <SentimentMenu {...props} />))
  .add(
    'playground',
    withInfo()(() => (
      <SentimentMenu
        postId={props.postId}
        position={props.position}
        client={props.client}
        screenWidth={props.screenWidth}
        refetchPost={props.refetchPost}
        isPhaseCompleted={boolean('is phase completed?', props.isPhaseCompleted)}
        mySentiment={select('my sentiment', SENTIMENTS, props.mySentiment)}
        sentimentCounts={object('sentiments counts', props.sentimentCounts)}
      />
    ))
  );