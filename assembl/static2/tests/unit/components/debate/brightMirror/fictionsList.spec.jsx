// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionsList from '../../../../../js/app/components/debate/brightMirror/fictionsList';
// eslint-disable-next-line max-len
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
    expect(wrapper.find('h1[className="dark-title-1"]')).toHaveLength(1);
  });

  it('should render fiction list', () => {
    expect(wrapper.find('MasonryComponent[className="fictions-list"]')).toHaveLength(1);
  });

  it('should render fiction previews', () => {
    expect(wrapper.find('FictionPreview')).toHaveLength(4);
  });

  it('should render fiction previews in state order first then in date order', () => {
    const listPreviews = wrapper.find('FictionPreview');
    expect(listPreviews.get(0).props.title).toEqual('Red is dead 4');
    expect(listPreviews.get(1).props.title).toEqual('Red is dead');
    expect(listPreviews.get(2).props.title).toEqual('Red is dead 2');
    expect(listPreviews.get(3).props.title).toEqual('Red is dead 3');
  });
});