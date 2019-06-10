// @flow
import React from 'react';
import Adapter from 'enzyme-adapter-react-16.3';
import { configure, shallow, mount } from 'enzyme';
import { NavDropdown } from 'react-bootstrap';

import { Avatar, LocalAwareAnchor } from '../../../../js/app/components/common/avatar';
import type { Props } from '../../../../js/app/components/common/avatar';

configure({ adapter: new Adapter() });

const props: Props = {
  location: '/ai-consultation/profile/1234',
  slug: 'ai-consultation',
  connectedUserId: '1234',
  loginData: {
    url: '/ai-consultation/login',
    local: true
  },
  displayName: 'Johnny',
  split: true
};

describe('<Avatar /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Avatar {...props} />);
  });

  it('Should not render LocalAwareAnchor component when the user is connected', () => {
    expect(wrapper.find(LocalAwareAnchor)).toHaveLength(0);
  });

  it('Should render LocalAwareAnchor component when the user is disconnected', () => {
    wrapper.setProps({ connectedUserId: null });
    expect(wrapper.find(LocalAwareAnchor)).toHaveLength(1);
  });

  it('Should render NavDropdown component when the user is connected', () => {
    expect(wrapper.find(NavDropdown)).toHaveLength(1);
  });

  it('Should not render NavDropdown component when the user is disconnected', () => {
    wrapper.setProps({ connectedUserId: null });
    expect(wrapper.find(NavDropdown)).toHaveLength(0);
  });
});

describe('<Avatar /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<Avatar {...props} />);
  });

  it('Should split the display name if is longer than or equal to 17 length', () => {
    wrapper.setProps({ displayName: 'Johnny the king of kings' });
    const span = wrapper.find('span[className="user-account"]');
    expect(span.text()).toEqual('Johnny the king o...');
  });

  it('Should not split the display name if is smaller than 17 length', () => {
    const span = wrapper.find('span[className="user-account"]');
    expect(span.text()).toEqual('Johnny');
  });

  it('Should not split the display name if split prop is false', () => {
    wrapper.setProps({ displayName: 'Johnny the king of kings', split: false });
    const span = wrapper.find('span[className="user-account"]');
    expect(span.text()).toEqual('Johnny the king of kings');
  });
});