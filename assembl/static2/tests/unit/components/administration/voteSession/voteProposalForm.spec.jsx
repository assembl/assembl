import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { List } from 'immutable';

import { DumbVoteProposalForm } from '../../../../../js/app/components/administration/voteSession/voteProposalForm';

describe('VoteProposalForm component', () => {
  const markAsToDelete = jest.fn(() => {});
  const updateTitle = jest.fn(() => {});
  const updateDescription = jest.fn(() => {});
  const handleUpClick = jest.fn(() => {});
  const handleDownClick = jest.fn(() => {});

  it('should render an empty form to create a vote proposal without any checkbox below', () => {
    const props = {
      index: 1,
      title: null,
      description: null,
      _toDelete: false,
      markAsToDelete: markAsToDelete,
      updateTitle: updateTitle,
      updateDescription: updateDescription,
      editLocale: 'fr',
      nbProposals: 1,
      handleUpClick: handleUpClick,
      handleDownClick: handleDownClick,
      tokenModules: List(),
      gaugeModules: List()
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbVoteProposalForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});