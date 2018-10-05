// @flow
import React from 'react';
// import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// Components imports
import TextareaAutosize from 'react-autosize-textarea';
import FictionCommentForm from '../../../../../js/app/components/debate/brightMirror/fictionCommentForm';

import type {
  FictionCommentFormProps,
  FictionCommentFormState
} from '../../../../../js/app/components/debate/brightMirror/fictionCommentForm';

// Separate the snapshots in directories next to each component
// Name should match with the story name
// Temporary remove the storyshot because of an error related to the component TextareaAutosize: need fix
// Error message: TypeError: Cannot read property 'dispatchEvent' of null
// initStoryshots({
//   storyKindRegex: /^FictionCommentForm$/
// });

configure({ adapter: new Adapter() });

describe('<FictionCommentForm /> - with shallow', () => {
  let wrapper;
  let fictionCommentForm: FictionCommentFormProps;

  beforeEach(() => {
    fictionCommentForm = {
      onCancelCommentCallback: jest.fn(),
      onSubmitCommentCallback: jest.fn()
    };
    wrapper = shallow(<FictionCommentForm {...fictionCommentForm} />);
  });

  it('should render one form tag', () => {
    expect(wrapper.find('form')).toHaveLength(1);
  });

  it('should render one TextareaAutosize', () => {
    expect(wrapper.find(TextareaAutosize)).toHaveLength(1);
  });

  describe('when the focus is on the textarea', () => {
    beforeEach(() => {
      wrapper.setState({ showFormActionButtons: true });
    });

    it('should render one cancel Button', () => {
      expect(wrapper.find('Button [className="cancel"]')).toHaveLength(1);
    });

    it('should render one submit Button', () => {
      expect(wrapper.find('Button [className="submit"]')).toHaveLength(1);
    });

    it('should render one enabled submit button when comment is filled', () => {
      const fictionCommentFormState: FictionCommentFormState = {
        ...wrapper.state,
        commentTextareaValue: 'Qui sunt cumque.'
      };
      wrapper.setState({ ...fictionCommentFormState });
      expect(wrapper.find('Button [className="submit"] [disabled=false]')).toHaveLength(1);
    });

    it('should render one disabled submit button when comment is empty', () => {
      expect(wrapper.find('Button [className="submit"] [disabled=true]')).toHaveLength(1);
    });

    it('should render one submit button that can be clicked when comment is typed', () => {
      const spy = jest.spyOn(wrapper.instance(), 'formSubmitHandler');
      const fictionCommentFormState: FictionCommentFormState = {
        ...wrapper.state,
        commentTextareaValue: 'Qui sunt cumque.'
      };
      wrapper.setState({ ...fictionCommentFormState });
      wrapper.find('Button [className="submit"]').simulate('click');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should render one cancel button that reset the comment textarea', () => {
      const spy = jest.spyOn(wrapper.instance(), 'formCancelHandler');
      const fictionCommentFormState: FictionCommentFormState = {
        ...wrapper.state,
        commentTextareaValue: 'Qui sunt cumque.'
      };

      wrapper.setState({ ...fictionCommentFormState });
      wrapper.find('Button [className="cancel"]').simulate('click');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(wrapper.state().commentTextareaValue).toEqual('');
    });
  });

  describe('when the focus is not on the textarea', () => {
    it('should render one cancel Button', () => {
      expect(wrapper.find('Button [className="cancel"]')).toHaveLength(0);
    });

    it('should render one submit Button', () => {
      expect(wrapper.find('Button [className="submit"]')).toHaveLength(0);
    });
  });
});