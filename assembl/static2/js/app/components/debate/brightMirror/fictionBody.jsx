// @flow
import React from 'react';

import SideCommentMenu from './sideComment/sideCommentMenu';
import { elementContainsSelection, getConnectedUserId } from '../../../utils/globalFunctions';
import PostBody from '../common/post/postBody';
import { COMMENT_DYNAMIC_OFFSET, ANCHOR_OFFSET } from '../../../constants';
import { getExtractTagId } from '../../../utils/extract';

export type Props = {
  id: string,
  ideaId: string,
  title: string,
  content: string,
  contentLocale: string,
  lang: string,
  extracts: Array<FictionExtractFragment>,
  dbId: number,
  bodyMimeType: string,
  refetchPost: Function
};

type State = {
  displayCommentAnchor: boolean,
  displaySubmitBox: boolean,
  commentAnchorPosition: { x: number, y: number },
  commentBadgeFixedPosition: { x: number, y: number },
  commentBadgeDynamicPosition: { x: number, y: number },
  commentBadgePositionInit: boolean
};

const noTitleMessage: string = 'no title specified';
const noContentMessage: string = 'no content specified';

class FictionBody extends React.Component<Props, State> {
  fictionBodyView: { current: null | HTMLDivElement };

  constructor(props: Props) {
    super(props);
    this.state = {
      displayCommentAnchor: false,
      displaySubmitBox: false,
      commentAnchorPosition: { x: 0, y: 0 },
      commentBadgeDynamicPosition: { x: 0, y: 0 },
      commentBadgeFixedPosition: { x: 0, y: 0 },
      commentBadgePositionInit: false
    };
    this.fictionBodyView = React.createRef();
  }

  componentDidMount() {
    const { commentBadgePositionInit } = this.state;
    // Set badge to right of body right after rendering to get correct coordinates
    if (!commentBadgePositionInit) this.setCommentBadgeFixedPosition();
  }

  setCommentBadgeFixedPosition = () => {
    const { dbId } = this.props;
    // $FlowFixMe because element may be null
    const body = document.getElementById(getExtractTagId(dbId)).getBoundingClientRect();
    this.setState({
      commentBadgeFixedPosition: { x: body.right, y: body.top },
      commentBadgePositionInit: true
    });
  };

  setCommentBadgeToExtractPosition = (extract: FictionExtractFragment) => {
    const extractElement = document.getElementById(extract.id);
    if (extractElement && this.fictionBodyView) {
      // Scroll extract in middle of page
      const elementRect = extractElement.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - window.innerHeight / 2;
      window.scrollTo(0, middle);
      // $FlowFixMe this.fictionBodyView may be null
      const nexPositionY = extractElement.getBoundingClientRect().top - this.fictionBodyView.current.getBoundingClientRect().top;
      this.setState({
        commentBadgeDynamicPosition: {
          // $FlowFixMe this.fictionBodyView may be null
          x: this.fictionBodyView.current.offsetLeft + this.fictionBodyView.current.clientWidth,
          y: nexPositionY - COMMENT_DYNAMIC_OFFSET
        }
      });
    }
  };

  getAnchorPosition = () => {
    const selection = document.getSelection();
    const selectionRange = selection ? selection.getRangeAt(0) : null;
    const selectionRect = selectionRange ? selectionRange.getBoundingClientRect() : null;
    const selectionPositionY = selectionRect ? selectionRect.top : 0;
    const selectionPositionX = selectionRect ? selectionRect.left : 0;
    // $FlowFixMe this.fictionBodyView may be null
    const bodyPosition = this.fictionBodyView.current.getBoundingClientRect().left - selectionRect.width / 2;
    const anchorPositionX = selectionPositionX - bodyPosition - ANCHOR_OFFSET;
    // $FlowFixMe this.fictionBodyView may be null
    const anchorPositionY = selectionPositionY - this.fictionBodyView.current.getBoundingClientRect().top;
    return { x: anchorPositionX, y: anchorPositionY };
  };

  handleMouseUpWhileHarvesting = () => {
    const { dbId } = this.props;
    const isSelectionInBody = elementContainsSelection(document.getElementById(getExtractTagId(dbId)));

    if (getConnectedUserId() && isSelectionInBody) {
      const commentAnchorPosition = this.getAnchorPosition();
      this.setState({
        displayCommentAnchor: true,
        commentAnchorPosition: commentAnchorPosition,
        displaySubmitBox: false
      });
    } else {
      this.setState({ displayCommentAnchor: false });
    }
  };

  handleClickAnchor = () => {
    const { displayCommentAnchor, displaySubmitBox, commentAnchorPosition } = this.state;
    this.setState({
      displayCommentAnchor: !displayCommentAnchor,
      displaySubmitBox: !displaySubmitBox,
      // Set box on same line as selection
      commentBadgeDynamicPosition: {
        // $FlowFixMe because element may be null
        x: this.fictionBodyView.current.offsetLeft + this.fictionBodyView.current.clientWidth,
        y: commentAnchorPosition.y - COMMENT_DYNAMIC_OFFSET
      }
    });
  };

  toggleCommentBoxDisplay = () => this.setState(state => ({ ...state, displaySubmitBox: !state.displaySubmitBox }));

  cancelSubmit = () => {
    this.setState({ displaySubmitBox: false }, () => window.getSelection().removeAllRanges());
  };

  render() {
    const { id, title, content, contentLocale, lang, extracts, refetchPost, dbId, bodyMimeType, ideaId } = this.props;
    const {
      displayCommentAnchor,
      displaySubmitBox,
      commentAnchorPosition,
      commentBadgeDynamicPosition,
      commentBadgeFixedPosition
    } = this.state;

    return (
      <div ref={this.fictionBodyView}>
        <SideCommentMenu
          postId={id}
          ideaId={ideaId}
          lang={contentLocale}
          extracts={extracts}
          commentAnchorPosition={commentAnchorPosition}
          badgeDynamicPosition={commentBadgeDynamicPosition}
          badgeFixedPosition={commentBadgeFixedPosition}
          refetchPost={refetchPost}
          displayCommentAnchor={displayCommentAnchor}
          displaySubmitBox={displaySubmitBox}
          setCommentBoxDisplay={this.toggleCommentBoxDisplay}
          handleClickAnchor={this.handleClickAnchor}
          cancelSubmit={this.cancelSubmit}
          setCommentBadgeToExtractPosition={this.setCommentBadgeToExtractPosition}
        />

        <PostBody
          handleMouseUpWhileHarvesting={this.handleMouseUpWhileHarvesting}
          body={content || noContentMessage}
          dbId={dbId}
          extracts={extracts}
          bodyMimeType={bodyMimeType}
          contentLocale={contentLocale}
          id={id}
          lang={lang}
          subject={title || noTitleMessage}
          originalLocale={contentLocale}
          translate={false}
          translationEnabled={false}
          isHarvesting
        />
      </div>
    );
  }
}

export default FictionBody;