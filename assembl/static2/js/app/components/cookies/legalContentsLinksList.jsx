// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

type Props = {
  legalContentsList: Array<string>
};

const LegalContentsLinksList = ({ legalContentsList }: Props) => {
  const slug = getDiscussionSlug();
  // $FlowFixMe
  return legalContentsList.map((legalContentType, index) => {
    const translationKey = legalContentType && legalContentType === 'terms' ? 'termsAndConditions' : legalContentType;
    const length = legalContentsList.length;
    const isLast = index + 1 === length;
    const isForelast = index + 2 === length;
    let endOfBlock = ', ';
    if (isForelast) {
      endOfBlock = <Translate value="and" />;
    } else if (isLast) {
      endOfBlock = <Translate value="legalContentsModal.ofThePlatform" />;
    }

    return legalContentType ? (
      <React.Fragment key={legalContentType}>
        <Link to={get(`${legalContentType}`, { slug: slug })} target="_blank">
          <Translate value={`${translationKey}.link`} />
        </Link>
        {endOfBlock}
      </React.Fragment>
    ) : null;
  });
};

export default LegalContentsLinksList;