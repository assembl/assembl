import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { EditorState, ContentState } from 'draft-js';

import { DumbAnswerForm } from '../../../../../js/app/components/debate/thread/answerForm';
import { displayAlert } from '../../../../../js/app/utils/utilityManager';

configure({ adapter: new Adapter() });

jest.mock('../../../../../js/app/utils/utilityManager');
displayAlert.mockImplementation(() => null);
jest.mock('draft-js/lib/generateRandomKey', () => () => 'EditorStateKey');

const timeline = [
  {
    identifier: 'foo',
    id: 'FooID',
    start: 'date1',
    end: 'date2',
    title: { entries: [{ en: 'Foo' }] }
  }
];

const props = {
  contentLocale: 'fr',
  createPost: jest.fn(),
  hideAnswerForm: jest.fn(),
  ideaId: 'AZERTYUIO',
  parentId: 'POIUYTRE',
  refetchIdea: jest.fn(),
  textareaRef: jest.fn(),
  timeline: timeline,
  phaseId: 'FooID',
  handleAnswerClick: jest.fn()
};

describe('AnswerForm component', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(<DumbAnswerForm {...props} />);
  });

  it('should submit an answer', async () => {
    const body = EditorState.createWithContent(ContentState.createFromText('Hello'));
    wrapper.instance().updateBody(body);
    wrapper
      .find('.button-submit')
      .first()
      .simulate('click');
    expect(displayAlert).not.toHaveBeenCalledWith('warning');
  });

  it('should render a answer form', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<DumbAnswerForm {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a hidden form', () => {
    const timelineCompleted = [
      {
        identifier: 'foo',
        id: 'FooID',
        start: 'date1',
        end: '2010-01-01T00:00:00Z',
        title: { entries: [{ en: 'Foo' }] }
      }
    ];

    const propsCompleted = {
      ...props,
      timeline: timelineCompleted
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbAnswerForm {...propsCompleted} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});