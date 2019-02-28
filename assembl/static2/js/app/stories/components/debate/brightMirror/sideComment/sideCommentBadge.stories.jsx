// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, number } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import SideCommentBadge, {
  type Props as SideCommentBadgeProps
} from '../../../../../components/debate/brightMirror/sideComment/sideCommentBadge';

export const defaultSideCommentBadge: SideCommentBadgeProps = {
  toggleExtractsBox: action('toggleExtractBox'),
  extractsNumber: 1,
  position: { x: 0, y: 0 },
  showBox: true
};

storiesOf('SideCommentBadge', module)
  .addDecorator(withKnobs)
  .add('default', () => <SideCommentBadge {...defaultSideCommentBadge} />)
  .add('playground', () => (
    <SideCommentBadge
      extractsNumber={number('extractsNumber', defaultSideCommentBadge.extractsNumber)}
      position={defaultSideCommentBadge.position}
      showBox={defaultSideCommentBadge.showBox}
      toggleExtractsBox={defaultSideCommentBadge.toggleExtractsBox}
    />
  ));