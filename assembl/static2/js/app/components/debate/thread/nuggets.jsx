import React from 'react';
import { connect } from 'react-redux';

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
    const { extracts, isHarvesting } = this.props;
    const { top } = this.state;
    if (isHarvesting) {
      if (Array.isArray(extracts) && extracts.length > 0) {
        return (
          <div
            ref={(node) => {
              this.node = node;
            }}
            className="extracts extracts--is-harvesting"
            style={Nuggets.topToStyle(top)}
          >
            {extracts.map(extract => (
              <div key={extract.id} className="extract">
                <div className="extract-header">
                  <div className="extract-harvester">
                    <div className="extract-harvester-left">
                      <div className="extract-harvester-avatar">
                        <img
                          src="/static2/img/icons/avatar.png?TODO"
                          width="30"
                          height="30"
                          alt="Albert Boyd TODO"
                          onError={(e) => {
                            const target = e.target;
                            target.src = '/static2/img/icons/avatar.png';
                          }}
                        />
                      </div>
                    </div>
                    <div className="extract-harvester-right">
                      <div className="extract-harvester-name">Albert Boyd TODO</div>
                      <div className="extract-harvesting-date">2 days ago TODO</div>
                    </div>
                  </div>
                  <div className="extract-header-menu" />
                </div>
                <div className="extract-txt">{extract.body}</div>
              </div>
            ))}
          </div>
        );
      }
      return null;
    }

    const importantExtracts = Array.isArray(extracts) && extracts.filter(({ important }) => important);
    return importantExtracts && importantExtracts.length > 0 ? (
      <div
        ref={(node) => {
          this.node = node;
        }}
        className="extracts extracts--is-not-harvesting"
        style={Nuggets.topToStyle(top)}
      >
        <div className="badges">
          <div className="nugget-img">
            <span className="assembl-icon-pepite color2" />
          </div>
          <div>
            {importantExtracts.map(extract => (
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

const mapStateToProps = state => ({
  isHarvesting: state.context.isHarvesting
});

export default connect(mapStateToProps)(Nuggets);