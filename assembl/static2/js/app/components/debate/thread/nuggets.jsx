import React from 'react';
import range from 'lodash/range';

import { getDomElementOffset, setDomElementOffset } from '../../../utils/globalFunctions';

class Nuggets extends React.Component {
  static get SPACER_SIZE() {
    // Vertical space between overflowing extracts in px
    return 100;
  }

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

  componentDidMount() {
    this.callForceUpdate = this.callForceUpdate.bind(this);
    document.addEventListener('rowHeightRecomputed', this.callForceUpdate);
  }

  componentDidUpdate() {
    const { fullLevel, rowIndex, postId } = this.props;
    const extracts = [].slice.call(document.getElementsByClassName('extracts'));
    const prevExtract = Nuggets.previousExtract(Nuggets.completeLevel(rowIndex, fullLevel), extracts);
    if (prevExtract !== null) {
      const newTop = getDomElementOffset(prevExtract).top + prevExtract.getBoundingClientRect().height + Nuggets.SPACER_SIZE;
      const postTop = getDomElementOffset(document.getElementById(postId)).top;
      setDomElementOffset(this.node, { top: Math.max(postTop, newTop) });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('rowHeightRecomputed', this.callForceUpdate);
  }

  callForceUpdate() {
    // This is to prevent the event from passing arguments to forceUpdate, raising an error.
    // I did not use an arrow function because we need to pass the function to removeEventListener
    this.forceUpdate();
  }

  render() {
    const { extracts, fullLevel, rowIndex } = this.props;
    const thisCompleteLevel = fullLevel ? [rowIndex, ...fullLevel] : [rowIndex];
    return extracts.length > 0
      ? <div
        id={`extracts-${thisCompleteLevel.join('-')}`}
        ref={(node) => {
          this.node = node;
          return this.node;
        }}
        className="extracts"
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

export default Nuggets;