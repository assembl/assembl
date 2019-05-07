// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';
import { Grid } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

import SynthesisPreview from './synthesisPreview';
import { displayAlert } from '../../utils/utilityManager';
import { connectedUserIsAdmin } from '../../utils/permissions';
import type { SynthesisItem } from './types.flow';

export type Props = {
  syntheses: Array<SynthesisItem>
};

const masonryOptions = {
  transitionDuration: 0,
  fitWidth: true,
  horizontalOrder: true
};

const deleteSynthesisHandler = () => {
  displayAlert('success', I18n.t('debate.syntheses.deleteSuccessMessage'));
};

const publicationStateCreationDateComparator = (a: SynthesisItem, b: SynthesisItem) => {
  const aDate: string = a.creationDate;
  const bDate: string = b.creationDate;
  const aState = a.post.publicationState;
  const bState = b.post.publicationState;

  if (aState === bState) {
    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  }
  return aState < bState ? -1 : 1;
};

const SynthesesList = ({ syntheses }: Props) => {
  const childElements = syntheses
    .slice() // copy before sort
    .sort(publicationStateCreationDateComparator)
    .map((synthesis) => {
      const userCanEdit = connectedUserIsAdmin() || false;
      const userCanDelete = connectedUserIsAdmin() || false;
      return (
        <Animated key={synthesis.id} preset="scalein">
          <SynthesisPreview
            synthesis={synthesis}
            deleteSynthesisHandler={deleteSynthesisHandler}
            userCanDelete={userCanDelete}
            userCanEdit={userCanEdit}
          />
        </Animated>
      );
    });

  return (
    <section className="fictions-section">
      <Grid fluid className="background-grey">
        <div className="max-container">
          <div className="content-section">
            <Masonry
              className={'fictions-list'}
              elementType={'div'}
              options={masonryOptions}
              disableImagesLoaded={false}
              updateOnEachImageLoad={false}
            >
              {childElements}
            </Masonry>
          </div>
        </div>
      </Grid>
    </section>
  );
};

export default SynthesesList;