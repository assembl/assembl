import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { convertToRaw, ContentState } from 'draft-js';

import { DumbPageForm } from '../../../../../js/app/components/administration/voteSession/pageForm';

describe('Vote Session DumbPageForm component', () => {
  it('should render a form to update the vote session page title, subtitle, header, instructions\' title, instructions and proposals section title', () => {
    const handleHeaderTitleChangeSpy = jest.fn(() => {});
    const handleHeaderSubtitleChangeSpy = jest.fn(() => {});
    const handleHeaderImageChangeSpy = jest.fn(() => {});
    const handleInstructionsTitleChangeSpy = jest.fn(() => {});
    const handleInstructionsContentChangeSpy = jest.fn(() => {});
    const handlePropositionSectionTitleChangeSpy = jest.fn(() => {});
    let rawContentState = convertToRaw(
      ContentState.createFromText('Vous disposez de 8 jetons favorables et de 3 jetons défavorables')
    );
    // We remove the generated key to avoid problems with the Snapshot testing
    rawContentState = { ...rawContentState, blocks: [{ ...rawContentState.blocks[0], key: '' }] };
    const prop = {
      handleHeaderTitleChange: handleHeaderTitleChangeSpy,
      handleHeaderSubtitleChange: handleHeaderSubtitleChangeSpy,
      handleHeaderImageChange: handleHeaderImageChangeSpy,
      handleInstructionsTitleChange: handleInstructionsTitleChangeSpy,
      handleInstructionsContentChange: handleInstructionsContentChangeSpy,
      handlePropositionSectionTitleChange: handlePropositionSectionTitleChangeSpy,
      headerTitle: 'Phase de vote a la majorite et estimation multicritere',
      headerSubtitle: 'La phase de vote est ouverte !',
      headerImgUrl: 'http://www.example.com/documents/myimage/data',
      headerImgMimeType: 'image/jpeg',
      instructionsTitle: 'Votez pour elire les 3 meilleures proppositions et leur alouer une estimation de cout!',
      instructionsContent: rawContentState,
      propositionSectionTitle: 'Vote sur 8 propositions',
      editLocale: 'fr'
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbPageForm {...prop} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});