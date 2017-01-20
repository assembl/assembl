import React from 'react';
import { NavDropdown, MenuItem } from 'react-bootstrap';

class Dropdown extends React.Component {
  render() {
    return (
      <ul className="dropdown-xs right">
        <NavDropdown title="FR" id="nav-dropdown">
          <MenuItem>EN</MenuItem>
          <MenuItem>DE</MenuItem>
        </NavDropdown>
      </ul>
    );
  }
}

export default Dropdown;