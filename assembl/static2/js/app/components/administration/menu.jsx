import React from 'react';
import { Link } from 'react-router';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

class Menu extends React.Component {
  render() {
    const slug = { slug: getDiscussionSlug() };
    return (
      <ListGroup className="admin-menu">
        <ListGroupItem className="menu-item">Editer la discussion</ListGroupItem>
        <ListGroupItem className="menu-item">Landing Page</ListGroupItem>
        <ListGroupItem className="menu-item">
          <Link
            activeClassName="active"
            to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: 'survey' })}`}
          >
            Survey
          </Link>
        </ListGroupItem>
        <ListGroupItem className="menu-item">
          <Link
            activeClassName="active"
            to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: 'thread' })}`}
          >
            Thread
          </Link>
        </ListGroupItem>
      </ListGroup>
    );
  }
}

export default Menu;