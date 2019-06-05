// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
/* eslint-enable */

import SharePostButton from '../../../../components/debate/common/sharePostButton';
import type { BrightMirrorFictionProps } from '../../../../pages/brightMirrorFiction';
import type { Props as SharePostButtonProps } from '../../../../components/debate/common/sharePostButton';

const fictionMetaInfo: BrightMirrorFictionProps = {
  fictionId: 'his-name-s-forrest',
  phase: 'like-me',
  slug: 'i-named-him-after-his-daddy',
  themeId: 'he-got-a-daddy-named-forrest-too'
};

export const defaultSharePostButtonProps: SharePostButtonProps = {
  routerParams: fictionMetaInfo,
  linkClassName: '',
  modalTitleMsgKey: 'debate.brightMirror.shareFiction',
  type: 'brightMirrorFiction'
};

storiesOf('SharePostButton', module).add('default', () => <SharePostButton {...defaultSharePostButtonProps} />);