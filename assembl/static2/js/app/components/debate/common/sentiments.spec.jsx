import React from 'react';
import renderer from 'react-test-renderer'; // eslint-disable-line

import Sentiments, { Sentiment } from './sentiments';
import Like from '../../svg/like';
import { likeTooltip } from '../../common/tooltips';

describe('Sentiments component', () => {
  const commonProps = {
    isPhaseCompleted: false,
    client: jest.fn(),
    mySentiment: null,
    placement: 'left',
    postId: '1234',
    sentimentCounts: {
      disagree: 2,
      dontUnderstand: 0,
      like: 1,
      moreInfo: 3
    }
  };
  it('should render a list of <Sentiment /> components', () => {
    const SentimentsProps = {
      ...commonProps
    };
    const component = renderer.create(<Sentiments {...SentimentsProps} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
  describe('Sentiment subcomponent', () => {
    it('should render a single <Sentiment /> component for a Like', () => {
      const SentimentProps = {
        ...commonProps,
        isSelected: false,
        sentiment: {
          type: 'LIKE',
          camelType: 'like',
          color: '#46D081',
          tooltip: likeTooltip,
          SvgComponent: Like
        }
      };
      const component = renderer.create(<Sentiment {...SentimentProps} />);
      const tree = component.toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});