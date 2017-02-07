import React from 'react';
import { NavDropdown, MenuItem } from 'react-bootstrap';

class Dropdown extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="dropdown">DROPDOWN</h2>
        <section>
          <ul className="dropdown-xs" style={{ margin: 0 }}>
            <NavDropdown title="FR" id="nav-dropdown">
              <MenuItem>EN</MenuItem>
              <MenuItem>DE</MenuItem>
            </NavDropdown>
          </ul>
          <ul className="dropdown-xl" style={{ margin: `${20}px`, width: `${100}%`, textAlign: 'center' }}>
            <NavDropdown title="Dropdown" id="nav-dropdown2">
              <MenuItem>Action</MenuItem>
              <MenuItem>Another action</MenuItem>
              <MenuItem divider />
              <MenuItem>Separated link</MenuItem>
            </NavDropdown>
          </ul>
        </section>
        <section>
          <h3 className="title-3">Code</h3>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>ul className=&quot;dropdown-xs&quot;</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${20}px` }}>&lt;</span>
                <span>NavDropdown title=&quot;FR&quot; id=&quot;nav-dropdown&quot;</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>EN</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>DE</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${20}px` }}>&lt;</span>
                <span>/NavDropdown</span>
                <span>&gt;</span>
                <br />
                <span>&lt;</span>
                <span>/ul</span>
                <span>&gt;</span>
              </div>
              <br />
              <br />
              <div className="code">
                <span>&lt;</span>
                <span>ul className=&quot;dropdown-xl&quot;</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${20}px` }}>&lt;</span>
                <span>NavDropdown title=&quot;dropdown&quot; id=&quot;nav-dropdown&quot;</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>action</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>another action</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>Divider /</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${40}px` }}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>separated link</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br />
                <span style={{ paddingLeft: `${20}px` }}>&lt;</span>
                <span>/NavDropdown</span>
                <span>&gt;</span>
                <br />
                <span>&lt;</span>
                <span>/ul</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Dropdown;