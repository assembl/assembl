// @flow
import * as React from 'react';
import SideCommentAnchor from './sideCommentAnchor';
import SideCommentBox from './sideCommentBox';
import SideCommentBadge from './sideCommentBadge';

type Props = {
  extracts: Array<FictionExtractFragment>,
  ideaId: string,
  postId: string,
  lang: string,
  displaySubmitBox: boolean,
  displayCommentAnchor: boolean,
  commentAnchorPosition: { x: number, y: number },
  badgeDynamicPosition: { x: number, y: number },
  badgeFixedPosition: { x: number, y: number },
  toggleSubmitDisplay: () => void,
  handleClickAnchor: () => void,
  cancelSubmit: () => void,
  refetchPost: Function,
  setPositionToExtract: (?FictionExtractFragment) => void,
  userCanReply: boolean
};

type State = {
  commentBoxDisplayed: boolean
};

class SideCommentMenu extends React.Component<Props, State> {
  state = { commentBoxDisplayed: false };

  handleMouseDown = (event: SyntheticMouseEvent<>) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  clearHighlights = () => {
    // Clear higlight for all extracts
    const allExtracts = document.getElementsByClassName('extract-in-message');
    Array.from(allExtracts).forEach((el) => {
      el.classList.remove('active-extract');
    });
  };

  toggleCommentsBox = () => {
    const { setPositionToExtract, extracts } = this.props;
    this.clearHighlights();
    this.setState((prevState) => {
      // If displaying box, set position to first extract
      if (!prevState.commentBoxDisplayed && extracts && extracts.length > 0) setPositionToExtract(extracts[0]);
      return { commentBoxDisplayed: !prevState.commentBoxDisplayed };
    });
  };

  cleanSelectedText = () => {
    const selections = document.getElementsByClassName('selection-highlight');
    Array.from(selections).forEach((el) => {
      const text = el.textContent;
      // $FlowFixMe el.parentNode may be null
      el.parentNode.replaceChild(document.createTextNode(text), el);
    });
  };

  render() {
    const {
      ideaId,
      toggleSubmitDisplay,
      displaySubmitBox,
      displayCommentAnchor,
      postId,
      handleClickAnchor,
      commentAnchorPosition,
      refetchPost,
      cancelSubmit,
      lang,
      extracts,
      badgeDynamicPosition,
      badgeFixedPosition,
      setPositionToExtract,
      userCanReply
    } = this.props;
    const { commentBoxDisplayed } = this.state;
    const hasExtracts = extracts && extracts.length > 0;
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    const showCommentBadge = hasExtracts;
    const showBoxInSubmitMode = displaySubmitBox && hasSelection;
    const showBox = (commentBoxDisplayed && hasExtracts && !displaySubmitBox) || showBoxInSubmitMode;
    const showCommentAnchor = displayCommentAnchor && hasSelection;
    const badgePosition = showBox ? badgeDynamicPosition : badgeFixedPosition;
    if (!hasSelection) this.cleanSelectedText();
    if (!showBox) this.clearHighlights();

    return (
      <div className="side-comment-container">
        {showCommentBadge && (
          <SideCommentBadge
            toggleExtractsBox={this.toggleCommentsBox}
            extractsNumber={extracts.length}
            position={badgePosition}
            showBox={showBox}
          />
        )}
        {showBox && (
          <SideCommentBox
            ideaId={ideaId}
            postId={postId}
            key={`extract-${postId}`}
            extracts={extracts}
            selection={selection}
            lang={lang}
            submitting={showBoxInSubmitMode}
            refetchPost={refetchPost}
            cancelSubmit={cancelSubmit}
            toggleSubmitDisplay={toggleSubmitDisplay}
            toggleCommentsBox={this.toggleCommentsBox}
            position={badgePosition}
            clearHighlights={this.clearHighlights}
            setPositionToExtract={setPositionToExtract}
            userCanReply={userCanReply}
          />
        )}
        {showCommentAnchor && (
          <SideCommentAnchor
            handleMouseDown={this.handleMouseDown}
            anchorPosition={commentAnchorPosition}
            handleClickAnchor={handleClickAnchor}
          />
        )}
      </div>
    );
  }
}

export default SideCommentMenu;