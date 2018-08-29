// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import InstructionsText from '../../../../components/debate/brightMirror/instructionsText';
import type { InstructionsTextType } from '../../../../components/debate/brightMirror/instructionsText';

export const customInstructionsText: InstructionsTextType = {
  title: 'Instructions',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis tincidunt dolor.'
};

storiesOf('InstructionsText', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <InstructionsText {...customInstructionsText} />))
  .add(
    'playground',
    withInfo()(() => (
      <InstructionsText title={text('title', customInstructionsText.title)} body={text('body', customInstructionsText.body)} />
    ))
  );