import React from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';

const Menu = () => (
  <ListGroup>
    <ListGroupItem className="menu-item" href="#buttons">Buttons</ListGroupItem>
    <ListGroupItem className="menu-item" href="#titles">Titles</ListGroupItem>
    <ListGroupItem className="menu-item" href="#navbar">NavBar</ListGroupItem>
    <ListGroupItem className="menu-item" href="#box">Box</ListGroupItem>
  </ListGroup>
);

export default Menu;