import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { get } from '../utils/routeMap';
import { getDiscussionSlug } from '../utils/globalFunctions';

class UnauthorizedAdministration extends React.Component {

  render() {
    const slug = getDiscussionSlug();
    const routeParams = { slug: slug };
    return (
      <div className="unauthorized-administration">
        <div>
          <Translate value="unauthorizedAdministration.unauthorizedMessage" />
        </div>
        <div> 
          <Link className="button-link button-dark margin-l" href={`${get('home', routeParams)}`}>
            <Translate value="unauthorizedAdministration.returnButton" />
          </Link>
        </div>
      </div>
    );
  }
}

export default UnauthorizedAdministration;