// @flow
import * as React from 'react';
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';

type Props = {
  extracts: Array<Extract>,
  postId: string,
  lang: string,
  displayHarvestingBox: boolean,
  displayHarvestingAnchor: boolean,
  harvestingAnchorPosition: Object,
  setHarvestingBoxDisplay: Function,
  handleClickAnchor: Function,
  cancelHarvesting: Function,
  refetchPost: Function,
  isAuthorAccountDeleted: boolean,
  showNuggetAction: boolean
};

class HarvestingMenu extends React.Component<Props> {
  handleMouseDown = (event: SyntheticMouseEvent<>) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  render() {
    const {
      setHarvestingBoxDisplay,
      displayHarvestingBox,
      displayHarvestingAnchor,
      postId,
      handleClickAnchor,
      extracts,
      harvestingAnchorPosition,
      refetchPost,
      cancelHarvesting,
      isAuthorAccountDeleted,
      showNuggetAction,
      lang
    } = this.props;
    const selection = window.getSelection();
    return (
      <div className="harvesting-container">
        {extracts && extracts.length > 0 ? (
          <HarvestingBox
            postId={postId}
            key={`extracts-${postId}`}
            extracts={extracts}
            isAuthorAccountDeleted={isAuthorAccountDeleted}
            displayHarvestingBox={displayHarvestingBox}
            harvestingBoxPosition={null}
            refetchPost={refetchPost}
            cancelHarvesting={cancelHarvesting}
            setHarvestingBoxDisplay={setHarvestingBoxDisplay}
            showNuggetAction={showNuggetAction}
          />
        ) : null}
        {displayHarvestingBox && (
          <HarvestingBox
            postId={postId}
            selection={selection}
            lang={lang}
            extract={null}
            displayHarvestingBox={displayHarvestingBox}
            refetchPost={refetchPost}
            cancelHarvesting={cancelHarvesting}
            setHarvestingBoxDisplay={setHarvestingBoxDisplay}
            showNuggetAction={showNuggetAction}
          />
        )}
        {displayHarvestingAnchor &&
          selection.toString().length > 0 && (
            <HarvestingAnchor
              displayHarvestingBox={displayHarvestingBox}
              handleMouseDown={this.handleMouseDown}
              anchorPosition={harvestingAnchorPosition}
              handleClickAnchor={handleClickAnchor}
            />
          )}
      </div>
    );
  }
}

export default HarvestingMenu;