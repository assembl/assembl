import React from 'react';
import renderer from 'react-test-renderer';

import ParticipateButton from '../../../../js/app/components/common/participateButton';

describe('ParticipateButton component', () => {
  const displayPhase = jest.fn(() => {});
  it('should render a button to navigate to the phase of a debate that is hidden', () => {
    const timeline = [];
    const component = renderer.create(<ParticipateButton displayPhase={displayPhase} timeline={timeline} btnClass="dark" />);
    const tree = component.toJSON();
    expect(tree.children).toEqual(null);
  });

  it('should render a button to navigate to the phase of a debate that is hidden', () => {
    const timeline = [
      { start: '2032-08-15T20:00:00+00:00' },
      { start: '2032-09-16T09:00:00+00:00' },
      { start: '2032-10-01T00:00:00+00:00' }
    ];
    const component = renderer.create(<ParticipateButton displayPhase={displayPhase} timeline={timeline} btnClass="dark" />);
    const tree = component.toJSON();
    expect(tree.children).toEqual(null);
  });

  it('should render a button to navigate to the phase of a debate that is not hidden', () => {
    const timeline = [
      { start: '2018-01-15T20:00:00+00:00' },
      { start: '2032-09-16T09:00:00+00:00' },
      { start: '2032-10-01T00:00:00+00:00' }
    ];
    const component = renderer.create(<ParticipateButton displayPhase={displayPhase} timeline={timeline} btnClass="dark" />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});