import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import LegalContentsLinksList from './legalContentsLinksList';

configure({ adapter: new Adapter() });

const defaultLegalContentsLinksListProps = {
  legalContentsList: ['terms']
};

describe('<LegalContentsLinksList /> - with shallow', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(<LegalContentsLinksList {...defaultLegalContentsLinksListProps} />);
  });

  it('should render 1 Link', () => {
    expect(wrapper.find('Link')).toHaveLength(1);
    expect(
      wrapper
        .find('Translate')
        .last()
        .props().value
    ).toBe('legalContentsModal.ofThePlatform');
  });

  it('should render a list of 2 Links with the appropriate punctuation in the sentence', () => {
    wrapper.setProps({ legalContentsList: ['terms', 'privacyPolicy'] });
    expect(wrapper.find('Link')).toHaveLength(2);
    expect(
      wrapper
        .find('Translate')
        .at(1)
        .props().value
    ).toBe('and');
    expect(
      wrapper
        .find('Translate')
        .last()
        .props().value
    ).toBe('legalContentsModal.ofThePlatform');
  });

  it('should render a list of 3 Links with the appropriate punctuation in the sentence', () => {
    wrapper.setProps({ legalContentsList: ['terms', 'privacyPolicy', 'userGuidelines'] });
    expect(wrapper.find('Link')).toHaveLength(3);
    expect(
      wrapper
        .find('Translate')
        .at(2)
        .props().value
    ).toBe('and');
    expect(
      wrapper
        .find('Translate')
        .last()
        .props().value
    ).toBe('legalContentsModal.ofThePlatform');
  });
});