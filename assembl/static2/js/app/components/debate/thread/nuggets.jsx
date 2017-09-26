import React from 'react';

import { getDomElementOffset, computeDomElementOffset } from '../../../utils/globalFunctions';

class Nuggets extends React.Component {
  static levelNodeExtracts(node) {
    let result = Nuggets.getChildsByClassName(node, 'posts')[0];
    if (result) result = Nuggets.getChildsByClassName(result, 'extracts')[0];
    return result || null;
  }

  static getChildsByClassName(node, className) {
    return Array.from(node.children).reduce((result, child) => {
      if (child.classList.contains(className)) result.push(child);
      return result;
    }, []);
  }

  static previousSibling(node) {
    if (!node.classList.contains('level')) throw new Error('previousSibling called on a non .level node', node);
    if (node.classList.contains('level-0')) {
      const baseLevelPrevSib = node.parentNode.previousSibling;
      return baseLevelPrevSib ? Nuggets.getChildsByClassName(baseLevelPrevSib, 'level-0')[0] : null;
    }
    let iterator = node;
    while (iterator.previousSibling !== null) {
      if (iterator.previousSibling.classList.contains('level')) return iterator.previousSibling;
      iterator = iterator.previousSibling;
    }
    return null;
  }

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

  static levelNodeBottomMostExtract(node) {
    if (!node.classList.contains('level')) throw new Error('levelNodeBottomMostExtract called on a non .level node', node);
    const children = Nuggets.getChildsByClassName(node, 'level');
    if (children.length > 0) {
      let bottomExtracts = null;
      children.reverse().some((childLevelNode) => {
        const childExtracts = Nuggets.levelNodeBottomMostExtract(childLevelNode);
        if (childExtracts !== null) {
          bottomExtracts = childExtracts;
          return true;
        }
        return false;
      });
      if (bottomExtracts !== null) return bottomExtracts;
    }
    return Nuggets.levelNodeExtracts(node);
  }

  static levelNodeParent(node) {
    if (!node.classList.contains('level')) throw new Error('levelNodeParent called on a non .level node', node);
    if (node.classList.contains('level-0')) return null;
    if (!node.parentNode.classList.contains('level')) throw new Error('parent is not a .level node', node);
    return node.parentNode;
  }

  static previousExtractImpl(levelNode) {
    if (!levelNode.classList.contains('level')) throw new Error('previousExtractImpl called on a non .level node', levelNode);
    const previousSibling = Nuggets.previousSibling(levelNode);
    if (previousSibling === null) {
      const parentLevelNode = Nuggets.levelNodeParent(levelNode);
      if (parentLevelNode === null) return null;
      const parentExtracts = Nuggets.levelNodeExtracts(parentLevelNode);
      if (parentExtracts !== null) return parentExtracts;
      return Nuggets.previousExtractImpl(parentLevelNode);
    }
    const previousBottomMostExtract = Nuggets.levelNodeBottomMostExtract(previousSibling);
    if (previousBottomMostExtract !== null) return previousBottomMostExtract;
    return Nuggets.previousExtractImpl(previousSibling);
  }

  constructor(props) {
    super(props);
    this.state = {
      top: undefined
    };
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
    const currentLevel = post.parentNode;
    return Nuggets.previousExtractImpl(currentLevel);
  }

  updateTop = () => {
    this.setState({ top: this.computeNewTop() });
  };

  computeNewTop() {
    const prevExtract = this.previousExtract();
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

    return Array.isArray(extracts) && extracts.length > 0
      ? <div
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