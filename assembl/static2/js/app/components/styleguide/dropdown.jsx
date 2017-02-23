import React from 'react';
import { NavDropdown, MenuItem } from 'react-bootstrap';

class Dropdown extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="dropdown" style={{ borderBottom: "1px solid #ccc"}}>DROPDOWN</h2>
        <section>
          <ul className="dropdown-xs" style={{ margin: 0 }}>
            <NavDropdown title="FR" id="nav-dropdown-xs">
              <MenuItem>EN</MenuItem>
              <MenuItem>DE</MenuItem>
            </NavDropdown>
          </ul>
          <ul className="dropdown-xl" style={{ margin: `${20}px`, width: `${100}%`, textAlign: 'center' }}>
            <NavDropdown title="Dropdown" id="nav-dropdown-xl">
              <MenuItem>Action</MenuItem>
              <MenuItem>Another action</MenuItem>
              <MenuItem divider />
              <MenuItem>Separated link</MenuItem>
            </NavDropdown>
          </ul>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            <div>&lt;ul className="dropdown-xs"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;NavDropdown title="FR" id="nav-dropdown-xs"&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem>EN&lt;/MenuItem&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem>DE&lt;/MenuItem&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;/NavDropdown&gt;</div>
            <div>&lt;/ul&gt;</div>
          </pre>
          <pre>
            <div>&lt;ul className="dropdown-xl"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;NavDropdown title="Dropdown" id="nav-dropdown-xl"&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem>Action&lt;/MenuItem&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem>Another action&lt;/MenuItem&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem divider /&gt;</div>
                <div style={{ marginLeft: `${40}px` }}>&lt;MenuItem>Separated link&lt;/MenuItem&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;/NavDropdown&gt;</div>
            <div>&lt;/ul&gt;</div>
          </pre>
        </section>
      </div>
    );
  }
}

export default Dropdown;