// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import type { Props } from '../../../../js/app/components/common/medias';
import Medias from '../../../../js/app/components/common/medias';

configure({ adapter: new Adapter() });

const MediasProps: Props = {
  path: 'http://www.video.fr/videos/video.mp4'
};

describe('<Medias /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Medias {...MediasProps} />);
  });

  it('should display a video tag when the path is a mp4 file', () => {
    expect(wrapper.find('video')).toHaveLength(1);
    expect(wrapper.find('iframe')).toHaveLength(0);
  });

  it('should display an iframe tag when the path an embed video', () => {
    wrapper.setProps({ path: 'https://www.youtube.com/embed/8Ot8mNRCLkY' });
    expect(wrapper.find('iframe')).toHaveLength(1);
    expect(wrapper.find('video')).toHaveLength(0);
  });
});