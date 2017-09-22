import React from 'react';

import { getDomElementOffset, computeDomElementOffset } from '../../../utils/globalFunctions';

class Nuggets extends React.Component {
  static nodeExtracts(node) {
    let result = Nuggets.getChildsByClassName(node, 'posts')[0];
    if (result) result = Nuggets.getChildsByClassName(result, 'extracts')[0];
    if (!result) result = null;
    return result;
  }

  static getChildsByClassName(node, className) {
    return Array.from(node.children).reduce((result, child) => {
      if (child.classList.contains(className)) result.push(child);
      return result;
    }, []);
  }

  static bottomMostExtractFromNode(node) {
    const childs = Nuggets.getChildsByClassName(node, 'level');
    let childExtract = null;
    if (childs.length > 0) {
      childs.reverse().some((child) => {
        childExtract = Nuggets.bottomMostExtractFromNode(child);
        return childExtract !== null;
      });
    }
    return childExtract || Nuggets.nodeExtracts(node);
  }

  static previousSibling(node) {
    let result = null;
    if (node.classList.contains('level-0')) {
      const baseLevelPrevSib = node.parentNode.previousSibling;
      if (baseLevelPrevSib) result = Nuggets.getChildsByClassName(baseLevelPrevSib, 'level-0')[0];
      else result = null;
    } else result = node.previousSibling;
    return result;
  }

  static previousBottomMostExtract(node) {
    let prevSibling = Nuggets.previousSibling(node);
    while (prevSibling && prevSibling.classList.contains('level')) {
      const bottomMostExtract = Nuggets.bottomMostExtractFromNode(prevSibling);
      if (bottomMostExtract !== null) return bottomMostExtract;
      prevSibling = Nuggets.previousSibling(prevSibling);
    }
    return null;
  }

  static previousExtractFromNode(node) {
    if (!node.classList.contains('level')) return null;
    const extracts = Nuggets.previousBottomMostExtract(node);
    if (extracts !== null) return extracts;
    return Nuggets.nodeExtracts(node.parentNode) || Nuggets.previousExtractFromNode(node.parentNode);
  }

  constructor(props) {
    super(props);
    this.state = {
      top: null
    };
    this.updateTop = this.updateTop.bind(this);
  }

  componentDidMount() {
    if ('node' in this) {
      this.updateTop();
      document.addEventListener('rowHeightRecomputed', this.updateTop);
    }
  }

  componentWillUnmount() {
    if ('node' in this) document.removeEventListener('rowHeightRecomputed', this.updateTop);
  }

  previousExtract() {
    const post = this.node.parentNode;
    const node = post.parentNode;
    const extracts = Nuggets.previousBottomMostExtract(node);
    if (extracts !== null) return extracts;
    return Nuggets.previousExtractFromNode(post.parentNode);
  }

  updateTop() {
    this.setState({ top: `${this.computeNewTop()}px` });
  }

  computeNewTop() {
    const prevExtract = this.previousExtract();
    const postDOM = document.getElementById(this.props.postId);
    const postTop = getDomElementOffset(postDOM).top;
    if (prevExtract !== null) {
      const newTop = getDomElementOffset(prevExtract).top + prevExtract.getBoundingClientRect().height + Nuggets.SPACER_SIZE;
      return computeDomElementOffset(this.node, { top: Math.max(postTop, newTop) }).top;
    }
    return computeDomElementOffset(this.node, { top: postTop }).top;
  }

  render() {
    const { extracts } = this.props;
    const style = this.state.top === null ? { display: 'none' } : { top: this.state.top };
    return Array.isArray(extracts) && extracts.length > 0
      ? <div
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
      : null;
  }
}

// Vertical space between overflowing extracts in px
Nuggets.SPACER_SIZE = 100;

export default Nuggets;