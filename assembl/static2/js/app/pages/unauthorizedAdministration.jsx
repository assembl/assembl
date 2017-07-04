import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { get } from '../utils/routeMap';
import { getDiscussionSlug } from '../utils/globalFunctions';

let UnauthorizedAdministration = (props) => {
  const slug = getDiscussionSlug();
  return (
    <div className="unauthorized-administration">
      <div>
        <Translate value="unauthorizedAdministration.unauthorizedMessage" />
      </div>
      <div>
        <Link className="button-link button-dark margin-l" href={`${get('home', { slug })}`}>
          <Translate value="unauthorizedAdministration.returnButton" />
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedAdministration;