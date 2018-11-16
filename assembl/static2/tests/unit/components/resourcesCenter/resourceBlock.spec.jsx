// @flow
import React from 'react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import type { Props as ResourceBlockProps } from '../../../../js/app/components/resourcesCenter/resourceBlock';
import ResourceBlock from '../../../../js/app/components/resourcesCenter/resourceBlock';
import { Medias } from '../../../../js/app/components/common/medias';

configure({ adapter: new Adapter() });

const props: ResourceBlockProps = {
  title: 'Resource title',
  text: 'Resource text',
  image: null,
  doc: null,
  embedCode: '',
  index: 1
};

describe('<ResourceBlock /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ResourceBlock {...props} />);
  });

  it('should render an image when the image props is not null', () => {
    wrapper.setProps({
      image: {
        externalUrl: '/data/Discussion/17/documents/2435/data',
        mimeType: 'image/jpeg',
        title: 'robot.jpg'
      }
    });
    expect(wrapper.find('img')).toHaveLength(1);
  });

  it('should render a medias component when the embedCode props is not null', () => {
    wrapper.setProps({
      embedCode: 'https://www.youtube.com/embed/3GrwiusjI9M'
    });
    expect(wrapper.find(Medias)).toHaveLength(1);
  });
});

describe('<ResourceBlock /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<ResourceBlock {...props} />);
  });

  it('should render a link to download when the doc props is not null', () => {
    wrapper.setProps({
      doc: {
        externalUrl: '/data/Discussion/17/documents/2436/data',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        title: 'pj_word.docx'
      }
    });
    expect(wrapper.find('.resource-download-link')).toHaveLength(1);
  });
});