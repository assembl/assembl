// @flow
import * as React from 'react';

import addPostExtractMutation from '../../graphql/mutations/addPostExtract.graphql'; // eslint-disable-line
import updateExtractMutation from '../../graphql/mutations/updateExtract.graphql'; // eslint-disable-line
import deleteExtractMutation from '../../graphql/mutations/deleteExtract.graphql'; // eslint-disable-line
import HarvestingAnchor from './harvestingAnchor';
import HarvestingBox from './harvestingBox';
import HarvestingBadge from './harvestingBadge';
import { getAnnotationData } from '../../utils/extract';

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
  static getDerivedStateFromProps(props: Props) {
    const { extracts } = props;
    const { hash } = window.location;
    if (hash !== '') {
      const hashExtractId = hash.split('#')[2];
      let isHashMatchId = false;
      extracts.forEach((extract) => {
        if (hashExtractId === extract.id) isHashMatchId = true;
      });
      return { displayExtractsBox: isHashMatchId };
    }
    return null;
  }

  state = { displayExtractsBox: false };

  toggleExtractsBox = (): void => {
    this.setState(prevState => ({ displayExtractsBox: !prevState.displayExtractsBox }));
  };

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
    const annotation = getAnnotationData(selection);
    const hasAnnotation = !!annotation;
    const { displayExtractsBox } = this.state;
    const showHarvestingBadge = !displayExtractsBox && extracts && extracts.length > 0;
    const showBoxWithExtracts = displayExtractsBox && extracts && extracts.length > 0 && !displayHarvestingBox;
    const showBoxInHarvestingMode = displayHarvestingBox && hasAnnotation;
    const showHarvestingAnchor = displayHarvestingAnchor && hasAnnotation;
    return (
      <div>
        {showHarvestingBadge && <HarvestingBadge toggleExtractsBox={this.toggleExtractsBox} extractsNumber={extracts.length} />}
        <div className="harvesting-container">
          {showBoxWithExtracts && (
            <HarvestingBox
              postId={postId}
              key={`extracts-${postId}`}
              extracts={extracts}
              isAuthorAccountDeleted={isAuthorAccountDeleted}
              displayHarvestingBox={displayHarvestingBox}
              refetchPost={refetchPost}
              cancelHarvesting={cancelHarvesting}
              setHarvestingBoxDisplay={setHarvestingBoxDisplay}
              showNuggetAction={showNuggetAction}
              toggleExtractsBox={this.toggleExtractsBox}
            />
          )}
          {showBoxInHarvestingMode && (
            <HarvestingBox
              postId={postId}
              key={`harvesting-${postId}`}
              annotation={annotation}
              lang={lang}
              displayHarvestingBox={displayHarvestingBox}
              refetchPost={refetchPost}
              cancelHarvesting={cancelHarvesting}
              setHarvestingBoxDisplay={setHarvestingBoxDisplay}
              showNuggetAction={showNuggetAction}
            />
          )}
          {showHarvestingAnchor && (
            <HarvestingAnchor
              displayHarvestingBox={displayHarvestingBox}
              handleMouseDown={this.handleMouseDown}
              anchorPosition={harvestingAnchorPosition}
              handleClickAnchor={handleClickAnchor}
            />
          )}
        </div>
      </div>
    );
  }
}

export default HarvestingMenu;