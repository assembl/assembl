// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionsList from '../../../../../js/app/components/debate/brightMirror/fictionsList';
import { customFictionsList } from '../../../../../js/app/stories/components/debate/brightMirror/fictionsList.stories';

configure({ adapter: new Adapter() });

describe('<FictionsList /> - with shallow', () => {
  let wrapper;
  let fictionsList;

  beforeEach(() => {
    fictionsList = { ...customFictionsList };
    wrapper = shallow(<FictionsList {...fictionsList} />);
  });

  it('should render title', () => {
    expect(wrapper.find('h1 [className="dark-title-1"]')).toHaveLength(1);
  });

  it('should render fiction list', () => {
    expect(wrapper.find('MasonryComponent [className="fictions-list"]')).toHaveLength(1);
  });

  it('should render fiction previews', () => {
    expect(wrapper.find('FictionPreview')).toHaveLength(3);
  });
});