// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import { compose, graphql } from 'react-apollo';
import { getCurrentView, getContextual } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import manageErrorAndLoading from './manageErrorAndLoading';
import DiscussionQuery from '../../graphql/DiscussionQuery.graphql';

type ButtonProps = {
  data: {
    discussion: {
      loginData: {
        url: string,
        local: boolean
      }
    }
  },
  label: React.Node | string
};

const DumbButton = ({ data: { discussion: { loginData: { url, local } } }, label }: ButtonProps): React.Node => {
  const slug = getDiscussionSlug();
  const next = getCurrentView();
  let link = `${getContextual('login', { slug: slug })}?next=${next}`;
  if (url && !local) {
    link = (url.includes('?')) ? `${url}&next=${next}` : `${url}?next=${next}`;
  }
  const handleButtonClick = () => {
    window.location = link;
  };
  return (
    <div>
      {local ? (
        <Link to={link} className="button-link button-dark">
          {label}
        </Link>
      ) : (
        <Button
          onClick={handleButtonClick}
          className="button-submit button-dark"
        >
          {label}
        </Button>
      )}
    </div>
  );
};

export default compose(graphql(DiscussionQuery), manageErrorAndLoading({ displayLoader: false }))(DumbButton);