/* eslint max-len: ["error", { "ignoreStrings": true }] */
import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTokensForm } from '../../../../../js/app/components/administration/voteSession/tokensForm';
import '../../../../helpers/setupTranslations';

describe('tokensForm component', () => {
  const handleInstructionsChangeSpy = jest.fn();
  const handleTVCNumberChangeSpy = jest.fn();
  const handleExclusiveChangeSpy = jest.fn();
  it('should render a form to configure a token vote with one token category', () => {
    const props = {
      id: 'my-tokens-form',
      instructions: 'Je vous prie de bien vouloir voter.',
      exclusiveCategories: true,
      tokenCategoryNumber: 1,
      tokenCategories: ['1234'],
      editLocale: 'fr',
      handleInstructionsChange: handleInstructionsChangeSpy,
      handleTokenVoteCategoryNumberChange: handleTVCNumberChangeSpy,
      handleExclusiveCategoriesCheckboxChange: handleExclusiveChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTokensForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a form to configure a token vote with 3 token categories', () => {
    const props = {
      id: 'my-tokens-form',
      instructions: 'Je vous prie de bien vouloir voter.',
      exclusiveCategories: false,
      tokenCategoryNumber: 3,
      tokenCategories: ['1234', '5678', '9874'],
      editLocale: 'fr',
      handleInstructionsChange: handleInstructionsChangeSpy,
      handleTokenVoteCategoryNumberChange: handleTVCNumberChangeSpy,
      handleExclusiveCategoriesCheckboxChange: handleExclusiveChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTokensForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});