// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import SideCommentAnchor, {
  type Props as SideCommentAnchorProps
} from '../../../../../components/debate/brightMirror/sideComment/sideCommentAnchor';

export const defaultSideCommentAnchor: SideCommentAnchorProps = {
  anchorPosition: { x: 50, y: 50 },
  handleClickAnchor: Function,
  handleMouseDown: Function
};

storiesOf('SideCommentAnchor', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <SideCommentAnchor {...defaultSideCommentAnchor} />));