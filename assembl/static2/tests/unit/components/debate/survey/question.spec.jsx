import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { createEditorStateWithText } from 'draft-js-plugins-editor';

import { Question as DumbQuestion } from '../../../../../js/app/components/debate/survey/question';
import { displayAlert } from '../../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/utilityManager');

describe('createPost method', () => {
  const scrollToQuestionSpy = jest.fn(() => Promise.resolve());
  const refetchThemeSpy = jest.fn(() => Promise.resolve());

  it('should create a post', async () => {
    const createPostSpy = jest.fn(() => Promise.resolve());
    const props = {
      isPhaseCompleted: false,
      title: 'To be or not to be?',
      contentLocale: 'en',
      questionId: 'my-question',
      scrollToQuestion: scrollToQuestionSpy,
      index: 0,
      refetchTheme: refetchThemeSpy,
      mutate: createPostSpy,
      screenHeight: 600,
      screenWidth: 800,
      questionsLength: 4
    };

    const wrapper = mount(<DumbQuestion {...props} />);
    wrapper.setState({
      buttonDisabled: false,
      postBody: createEditorStateWithText('That is the question')
    });

    await wrapper.instance().createPost();
    expect(createPostSpy).toHaveBeenCalledWith({
      variables: {
        body: '<p>That is the question</p>',
        contentLocale: 'en',
        ideaId: 'my-question'
      }
    });

    expect(refetchThemeSpy).toHaveBeenCalled();
    expect(scrollToQuestionSpy).toHaveBeenCalledWith(true, 1);
    expect(displayAlert).toHaveBeenCalledWith('success', 'Thanks for your participation. Your proposal has been sent!');
    expect(wrapper.state('buttonDisabled')).toBeFalsy();
    expect(
      wrapper
        .state('postBody')
        .getCurrentContent()
        .hasText()
    ).toBeFalsy();
  });

  it('should handle server errors', async (done) => {
    const props = {
      isPhaseCompleted: false,
      title: 'To be or not to be?',
      contentLocale: 'en',
      questionId: 'my-question',
      scrollToQuestion: scrollToQuestionSpy,
      index: 0,
      refetchTheme: refetchThemeSpy,
      screenHeight: 600,
      screenWidth: 800,
      questionsLength: 4
    };

    const wrapper = mount(<DumbQuestion {...props} />);
    const postBody = createEditorStateWithText('That is the question');
    wrapper.setState({
      buttonDisabled: false,
      postBody: postBody
    });

    const createPostSpy = jest.fn(() => Promise.reject(new Error('An error occured')));
    wrapper.setProps({
      mutate: createPostSpy
    });

    await wrapper.instance().createPost();

    // a bit hacky: wait for createPost promise to be rejected before to make assertions
    setTimeout(() => {
      expect(displayAlert).toHaveBeenCalledWith('danger', 'An error occured');
      expect(
        wrapper
          .state('postBody')
          .getCurrentContent()
          .hasText()
      ).toBeTruthy();
      expect(wrapper.state('buttonDisabled')).toBeFalsy();
      done();
    }, 100);
  });
});