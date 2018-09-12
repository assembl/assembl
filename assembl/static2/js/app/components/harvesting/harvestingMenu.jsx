// @flow
import * as React from 'react';
import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';
import HarvestingBadge from './harvestingBadge';

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

type State = {
  displayExtractsBox: boolean
};

class HarvestingMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      displayExtractsBox: false
    };
  }

  handleMouseDown = (event: SyntheticMouseEvent<>) => {
    // This would otherwise clear the selection
    event.preventDefault();
    return false;
  };

  setExtractsBoxDisplay = (): void => {
    this.setState(prevState => ({ displayExtractsBox: !prevState.displayExtractsBox }));
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
    const { displayExtractsBox } = this.state;
    return (
      <div className="harvesting-container">
        {displayExtractsBox && extracts && extracts.length > 0 ? (
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
            setExtractsBoxDisplay={this.setExtractsBoxDisplay}
          />
        ) : null}
        {!displayExtractsBox && (
          <HarvestingBadge setExtractsBoxDisplay={this.setExtractsBoxDisplay} extractsNumber={extracts.length} />
        )}
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