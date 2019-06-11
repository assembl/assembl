import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { ContentState, EditorState, RichUtils } from 'draft-js';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import RichTextEditor from '../../../../../js/app/components/common/richTextEditor';

configure({ adapter: new Adapter() });

describe('RichTextEditor component', () => {
  xit('should render a rich text editor', () => {
    const contentState = ContentState.createFromText('foobar');
    const editorState = EditorState.createWithContent(contentState);
    const onChangeSpy = jest.fn();
    const props = {
      editorState: editorState,
      onChange: onChangeSpy,
      placeholder: 'Write here'
    };

    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<RichTextEditor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  describe('shouldHidePlaceholder method', () => {
    it('should return true if the content is empty and the block type is not unstyled', () => {
      const onChangeSpy = jest.fn();
      let editorState = EditorState.createWithContent(ContentState.createFromText(''));
      editorState = RichUtils.toggleBlockType(editorState, 'unordered-list-item');
      const wrapper = mount(<RichTextEditor editorState={editorState} onChange={onChangeSpy} />);
      const actual = wrapper.instance().shouldHidePlaceholder();
      expect(actual).toBeTruthy();
    });

    it('should return false if the content is not empty', () => {
      const onChangeSpy = jest.fn();
      const editorState = EditorState.createWithContent(ContentState.createFromText('Hello world'));
      const wrapper = mount(<RichTextEditor editorState={editorState} onChange={onChangeSpy} />);
      const actual = wrapper.instance().shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });

    it('should return false if the block type is unstyled', () => {
      const onChangeSpy = jest.fn();
      const editorState = EditorState.createWithContent(ContentState.createFromText(''));
      const wrapper = mount(<RichTextEditor editorState={editorState} onChange={onChangeSpy} />);
      const actual = wrapper.instance().shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });
  });
});

describe('RichtextEditor with counter', () => {
  it('should count characters', () => {
    const contentState = ContentState.createFromText('foobar');
    const editorState = EditorState.createWithContent(contentState);
    const onChangeSpy = jest.fn();
    const props = {
      editorState: editorState,
      onChange: onChangeSpy,
      placeholder: 'Write here',
      withCharacterCounter: 1000
    };
    const wrapper = mount(<RichTextEditor {...props} onChange={onChangeSpy} />);
    const actual = wrapper.instance().getCharCount();
    expect(actual).toBe(6);
  });

  it('should display characters count if activated', () => {
    const contentState = ContentState.createFromText('foobar');
    const editorState = EditorState.createWithContent(contentState);
    const onChangeSpy = jest.fn();
    const props = {
      editorState: editorState,
      onChange: onChangeSpy,
      placeholder: 'Write here',
      withCharacterCounter: 1000
    };
    const wrapper = mount(<RichTextEditor {...props} onChange={onChangeSpy} />);
    const actual = wrapper.instance().getCounter();
    expect(actual).toMatchSnapshot();
  });

  it('should not display characters count if not activated', () => {
    const contentState = ContentState.createFromText('foobar');
    const editorState = EditorState.createWithContent(contentState);
    const onChangeSpy = jest.fn();
    const props = {
      editorState: editorState,
      onChange: onChangeSpy,
      placeholder: 'Write here',
      withCharacterCounter: 0
    };
    const wrapper = mount(<RichTextEditor {...props} onChange={onChangeSpy} />);
    const actual = wrapper.instance().getCounter();
    expect(actual).toBeNull();
  });
});