import React from 'react';
import renderer from 'react-test-renderer';

import HeaderStatistics, {
  statContributions,
  statMessages,
  statParticipants,
  statParticipations
} from '../../../../js/app/components/common/headerStatistics';

describe('HeaderStatistics component', () => {
  it('should match HeaderStatistics snapshot', () => {
    const statElements = [statMessages(3), statContributions(5), statParticipants(2), statParticipations(27)];
    const component = renderer.create(<HeaderStatistics statElements={statElements} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});