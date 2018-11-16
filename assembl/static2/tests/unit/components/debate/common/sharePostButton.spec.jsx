// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import SharePostButton from '../../../../../js/app/components/debate/common/sharePostButton';
import type { BrightMirrorFictionProps } from '../../../../../js/app/pages/brightMirrorFiction';
import type { Props as SharePostButtonProps } from '../../../../../js/app/components/debate/common/sharePostButton';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^sharePostButton$/
});

configure({ adapter: new Adapter() });

describe('<SharePostButton /> - with shallow', () => {
  let wrapper;
  const fictionMetaInfo: BrightMirrorFictionProps = {
    fictionId: 'his-name-s-forrest',
    phase: 'like-me',
    slug: 'i-named-him-after-his-daddy',
    themeId: 'he-got-a-daddy-named-forrest-too'
  };

  const sharePostButtonProps: SharePostButtonProps = {
    metaInfo: fictionMetaInfo,
    linkClassName: '',
    modalTitleMsgKey: 'debate.brightMirror.shareFiction',
    type: 'brightMirrorFiction'
  };

  beforeEach(() => {
    wrapper = shallow(<SharePostButton {...sharePostButtonProps} />);
  });

  it('should render one Link with a share icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span [className="assembl-icon-share"]')).toHaveLength(1);
  });
});