// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import SideCommentAnchor, {
  type Props as SideCommentAnchorProps
} from '../../../../../components/debate/brightMirror/sideComment/sideCommentAnchor';

export const defaultSideCommentAnchor: SideCommentAnchorProps = {
  anchorPosition: { x: 50, y: 50 },
  handleClickAnchor: action('handleClickAnchor'),
  handleMouseDown: action('handleMouseDown')
};

storiesOf('SideCommentAnchor', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <SideCommentAnchor {...defaultSideCommentAnchor} />));