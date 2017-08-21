import React from 'react';
import renderer from 'react-test-renderer';
import { EditorState } from 'draft-js';

import Toolbar from '../../../../../js/app/components/common/richTextEditor/toolbar';

describe('Toolbar component', () => {
  it('should render a toolbar', () => {
    const buttonsConfig = [
      {
        id: 'bold',
        icon: 'text-bold',
        label: 'Bold',
        type: 'style',
        style: 'BOLD'
      }
    ];
    const editorState = EditorState.createEmpty();
    const focusEditorSpy = jest.fn(() => {});
    const onChangeSpy = jest.fn(() => {});
    const component = renderer.create(
      <Toolbar buttonsConfig={buttonsConfig} editorState={editorState} focusEditor={focusEditorSpy} onChange={onChangeSpy} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});