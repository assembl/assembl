import React from 'react';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { createEditorStateWithText } from 'draft-js-plugins-editor';

import { Question as DumbQuestion } from '../../../../../js/app/components/debate/survey/question';
import { displayAlert } from '../../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/permissions');
jest.mock('../../../../../js/app/utils/utilityManager');

describe('DumbQuestion component', () => {
  let wrapper;
  const scrollToQuestionSpy = jest.fn(() => Promise.resolve());
  const refetchThemeSpy = jest.fn(() => Promise.resolve());
  const createPostSpy = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    const props = {
      isDebateModerated: false,
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

    wrapper = mount(<DumbQuestion {...props} />);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost method', () => {
    it('should create a post', async () => {
      wrapper.setState({
        buttonDisabled: false,
        postBody: createEditorStateWithText('That is the question')
      });

      await wrapper.instance().createPost();
      expect(createPostSpy).toHaveBeenCalledWith({
        variables: {
          body: '<p>That is the question</p>',
          contentLocale: 'en',
          ideaId: 'my-question',
          publicationState: 'PUBLISHED'
        }
      });

      expect(refetchThemeSpy).toHaveBeenCalled();
      expect(scrollToQuestionSpy).toHaveBeenCalledWith(true, 1);
      expect(displayAlert).toHaveBeenCalledWith(
        'success',
        'Thanks for your participation. Your proposal has been sent!',
        false,
        10000
      );
      expect(wrapper.state('buttonDisabled')).toBeFalsy();
      expect(
        wrapper
          .state('postBody')
          .getCurrentContent()
          .hasText()
      ).toBeFalsy();
    });

    it('should create a pending post', async () => {
      wrapper.setProps({
        isDebateModerated: true
      });
      wrapper.setState({
        buttonDisabled: false,
        postBody: createEditorStateWithText('That is the question')
      });

      await wrapper.instance().createPost();
      expect(createPostSpy).toHaveBeenCalledWith({
        variables: {
          body: '<p>That is the question</p>',
          contentLocale: 'en',
          ideaId: 'my-question',
          publicationState: 'SUBMITTED_AWAITING_MODERATION'
        }
      });

      expect(refetchThemeSpy).toHaveBeenCalled();
      expect(scrollToQuestionSpy).toHaveBeenCalledWith(true, 1);
      expect(displayAlert).toHaveBeenCalledWith(
        'success',
        'Your contribution has been saved. To insure the quality of the debate, ' +
          'it will be visible to all participants once it has been reviewed by the animation team.',
        false,
        10000
      );
      expect(wrapper.state('buttonDisabled')).toBeFalsy();
      expect(
        wrapper
          .state('postBody')
          .getCurrentContent()
          .hasText()
      ).toBeFalsy();
    });

    it('should handle server errors', async (done) => {
      const createPostRejectedSpy = jest.fn(() => Promise.reject(new Error('An error occured')));
      wrapper.setProps({
        mutate: createPostRejectedSpy
      });

      const postBody = createEditorStateWithText('That is the question');
      wrapper.setState({
        buttonDisabled: false,
        postBody: postBody
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
});