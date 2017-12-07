import React from 'react';

import { getDomElementOffset, computeDomElementOffset } from '../../../utils/globalFunctions';

class Nuggets extends React.Component {
  static topToStyle(top) {
    switch (top) {
    case undefined:
      return { display: 'none' };
    case null:
      return {};
    default:
      return { top: top };
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      top: undefined
    };
  }

  componentDidMount() {
    if ('node' in this) this.props.nuggetsManager.add(this);
  }

  componentWillUnmount() {
    if ('node' in this) this.props.nuggetsManager.remove(this);
  }

  updateTop = (previousNuggets) => {
    this.setState({ top: this.computeNewTop(previousNuggets) });
  };

  computeNewTop(previousNuggets) {
    const prevExtract = previousNuggets ? previousNuggets.node : null;
    const postDOM = document.getElementById(this.props.postId);
    const postTop = getDomElementOffset(postDOM).top;
    if (prevExtract !== null) {
      const newTop = getDomElementOffset(prevExtract).top + prevExtract.getBoundingClientRect().height + Nuggets.SPACER_SIZE;
      if (newTop > postTop) return computeDomElementOffset(this.node, { top: newTop }).top;
    }
    return null;
  }

  render() {
    const { extracts } = this.props;
    const { top } = this.state;

    return Array.isArray(extracts) && extracts.length > 0 ? (
      <div
        ref={(node) => {
          this.node = node;
        }}
        className="extracts"
        style={Nuggets.topToStyle(top)}
      >
        <div className="badges">
          <div className="nugget-img">
            <span className="assembl-icon-pepite color2" />
          </div>
          <div>
            {extracts.map(extract => (
              <div key={extract.id} className="nugget">
                <div className="nugget-txt">{extract.body}</div>
                <div className="box-hyphen" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null;
  }
}

// Vertical space between overflowing extracts in px
Nuggets.SPACER_SIZE = 100;

export default Nuggets;