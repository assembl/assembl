// @flow
import * as React from 'react';
import Masonry from 'react-masonry-component';
import Animated from 'react-animated-transitions';
import { Grid } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
// Route helpers imports
// import { get } from '../../../utils/routeMap';
// Utils imports
// import { getDiscussionSlug, getConnectedUserId } from '../../../utils/globalFunctions';
import SynthesisPreview from './synthesisPreview';
// import Permissions, { connectedUserCan } from '../../../utils/permissions';
// import { displayAlert } from '../../../utils/utilityManager';
// Constant imports
// import { EMPTY_STRING, PICTURES_LENGTH } from '../../../constants';
// Type imports

export type Props = {
  syntheses: Array<SynthesisPreviw>,
  lang: string
};

const masonryOptions = {
  transitionDuration: 0,
  fitWidth: true,
  horizontalOrder: true
};

// Define callback functions
const deleteFictionHandler = () => {
  displayAlert('success', I18n.t('debate.brightMirror.deleteFictionSuccessMsg'));
};

const publicationStateCreationDateComparator = (a, b) => {
  const aDate: string = a.creationDate;
  const bDate: string = b.creationDate;
  const aState = a.publicationState;
  const bState = b.publicationState;

  if (aState === bState) {
    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  }
  return aState < bState ? -1 : 1;
};

const SynthesesList = ({ syntheses, lang }: Props) => {
  // const slug = getDiscussionSlug() || EMPTY_STRING;

  // const connectedUserId = getConnectedUserId();

  const childElements = syntheses.sort(publicationStateCreationDateComparator).reduce((result, synthesis) => {
    // Define user permissions
    const authorName = '';
    const userCanEdit = false;
    const userCanDelete = false;

    // if (post.creator) {
    //   const { userId, displayName, isDeleted } = post.creator;
    //   authorName = isDeleted ? I18n.t('deletedUser') : displayName;
    //   userCanEdit = connectedUserId === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);
    //   userCanDelete =
    //     (connectedUserId === String(userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
    //     connectedUserCan(Permissions.DELETE_POST);
    // }

    result.push(
      <Animated key={synthesis.id} preset="scalein">
        <SynthesisPreview {...synthesis} />
      </Animated>
    );
    return result;
  }, []);

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