import React from 'react';
import renderer from 'react-test-renderer';

import {
  DumbHeaderStatistics,
  statContributions,
  statMessages,
  statParticipants,
  statParticipations
} from '../../../../js/app/components/common/headerStatistics';
import '../../../helpers/setupTranslations';

describe('HeaderStatistics component', () => {
  it('should match HeaderStatistics snapshot', () => {
    const statElements = [statMessages(3), statContributions(5), statParticipants(2), statParticipations(27)];
    const component = renderer.create(<DumbHeaderStatistics statElements={statElements} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});