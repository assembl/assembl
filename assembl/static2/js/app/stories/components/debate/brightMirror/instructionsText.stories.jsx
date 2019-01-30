// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import InstructionsText from '../../../../components/debate/brightMirror/instructionsText';
import type { InstructionsTextProps } from '../../../../components/debate/brightMirror/instructionsText';

export const customInstructionsText: InstructionsTextProps = {
  title: 'Test',
  body: 'Lorem Ipsum body',
  semanticAnalysisForThematicData: {
    id: '1234',
    nlpSentiment: {
      positive: null,
      negative: null,
      count: 0
    },
    title: 'Bright',
    topKeywords: []
  }
};

storiesOf('InstructionsText', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <InstructionsText {...customInstructionsText} />))
  .add(
    'playground',
    withInfo()(() => (
      <InstructionsText
        {...customInstructionsText}
        title={text('title', customInstructionsText.title)}
        body={text('body', customInstructionsText.body)}
      />
    ))
  );