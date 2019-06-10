// @flow
import React from 'react';

import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';

import InnerBoxSubmit from '../../../../../../js/app/components/debate/brightMirror/sideComment/innerBoxSubmit';
import { defaultInnerBoxSubmitProps } from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/innerBoxSubmit.stories'; // eslint-disable-line max-len

// Cannot do storyshots because of draftjs

configure({ adapter: new Adapter() });

describe('<InnerBoxSubmit />', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InnerBoxSubmit {...defaultInnerBoxSubmitProps} />);
  });

  it('should render author name', () => {
    expect(wrapper.find('div[className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div[className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render richtext', () => {
    expect(wrapper.find('RichTextEditor')).toHaveLength(1);
  });

  it('should render footer', () => {
    expect(wrapper.find('div[className="harvesting-box-footer"]')).toHaveLength(1);
  });

  it('should execute submit when clicking on the button', () => {
    const onClickHandler = jest.fn();
    wrapper.setProps({ submit: onClickHandler });

    wrapper.find('Button[className="button-submit button-dark"]').simulate('click');

    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });

  it('should execute cancel when clicking on the button', () => {
    const onClickHandler = jest.fn();
    wrapper.setProps({ cancelSubmit: onClickHandler });

    wrapper.find('Button[className="button-cancel button-dark"]').simulate('click');

    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });
});