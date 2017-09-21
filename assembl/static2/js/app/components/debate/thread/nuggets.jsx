import React from 'react';
import range from 'lodash/range';

import { getDomElementOffset, computeDomElementOffset } from '../../../utils/globalFunctions';

class Nuggets extends React.Component {
  static completeLevelFromId(id) {
    return id.split('-').slice(1).map((ident) => {
      return Number(ident);
    });
  }

  static completeLevel(rowIndex, fullLevel) {
    return fullLevel ? [rowIndex, ...fullLevel] : [rowIndex];
  }

  static completeLevelGreater(a, b) {
    return range(Math.min(a.length, b.length)).reduce((result, index) => {
      if (result !== null) return result;
      if (a[index] === b[index] && (a.length === index + 1 || b.length === index + 1)) return a.length > b.length;
      return a[index] !== b[index] ? a[index] > b[index] : result;
    }, null);
  }

  static previousExtract(completeLevel, otherExtracts) {
    return !otherExtracts || !otherExtracts.length
      ? null
      : otherExtracts.reduce((prevExtract, extract) => {
        const currentCompleteLevel = prevExtract ? Nuggets.completeLevelFromId(prevExtract.getAttribute('id')) : null;
        const otherCompleteLevel = Nuggets.completeLevelFromId(extract.getAttribute('id'));
        if (
          Nuggets.completeLevelGreater(completeLevel, otherCompleteLevel) &&
            (prevExtract === null || Nuggets.completeLevelGreater(otherCompleteLevel, currentCompleteLevel))
        ) {
          return extract;
        }
        return prevExtract;
      }, null);
  }

  constructor(props) {
    super(props);
    this.state = {
      top: null
    };
    this.updateTop = this.updateTop.bind(this);
  }

  componentDidMount() {
    document.addEventListener('rowHeightRecomputed', this.updateTop);
  }

  componentWillUnmount() {
    document.removeEventListener('rowHeightRecomputed', this.updateTop);
  }

  updateTop() {
    this.setState({ top: `${this.computeNewTop()}px` });
  }

  computeNewTop() {
    const { fullLevel, rowIndex, postId } = this.props;
    const extracts = [].slice.call(document.getElementsByClassName('extracts'));
    const prevExtract = Nuggets.previousExtract(Nuggets.completeLevel(rowIndex, fullLevel), extracts);
    const postDOM = document.getElementById(postId);
    const postTop = getDomElementOffset(postDOM).top;
    if (prevExtract !== null) {
      const newTop = getDomElementOffset(prevExtract).top + prevExtract.getBoundingClientRect().height + Nuggets.SPACER_SIZE;
      return computeDomElementOffset(this.node, { top: Math.max(postTop, newTop) }).top;
    }
    return computeDomElementOffset(this.node, { top: postTop }).top;
  }

  render() {
    const { extracts, fullLevel, rowIndex } = this.props;
    const style = this.state.top === null ? {} : { top: this.state.top };
    return extracts.length > 0
      ? <div
        id={`extracts-${Nuggets.completeLevel(rowIndex, fullLevel).join('-')}`}
        ref={(node) => {
          this.node = node;
        }}
        className="extracts"
        style={style}
      >
        <div className="badges">
          <div className="nugget-img">
            <span className="assembl-icon-pepite color2" />
          </div>
          <div>
            {extracts.map((extract) => {
              return (
                <div key={extract.id} className="nugget">
                  <div className="nugget-txt">
                    {extract.body}
                  </div>
                  <div className="box-hyphen" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      : <div />;
  }
}

// Vertical space between overflowing extracts in px
Nuggets.SPACER_SIZE = 100;

export default Nuggets;