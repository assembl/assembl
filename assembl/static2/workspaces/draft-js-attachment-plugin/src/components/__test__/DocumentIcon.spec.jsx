// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

import DocumentIcon from '../DocumentIcon';

describe('DocumentIcon component', () => {
  it('should render a document icon', () => {
    let contentState = ContentState.createFromText('');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    contentState = contentState.createEntity('DOCUMENT', 'IMMUTABLE', {
      externalUrl: 'my-file.pdf',
      mimeType: 'application/pdf',
      title: 'My file'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    let editorState = EditorState.createWithContent(contentState);
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    contentState = editorState.getCurrentContent();
    const blocks = contentState.getBlocksAsArray();
    const atomicBlock = blocks[1];

    const props = {
      block: atomicBlock,
      contentState: contentState
    };
    const component = renderer.create(<DocumentIcon {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});