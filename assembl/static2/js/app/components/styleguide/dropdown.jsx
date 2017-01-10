import React from 'react';
import { NavDropdown, MenuItem } from 'react-bootstrap';

class Dropdown extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="dropdown">DROPDOWN</div>
        <section>
          <ul className="dropdown-navbar" style={{margin: 0}}>
            <NavDropdown title="Dropdown" id="nav-dropdown">
              <MenuItem>Action</MenuItem>
              <MenuItem>Another action</MenuItem>
              <MenuItem divider />
              <MenuItem>Separated link</MenuItem>
            </NavDropdown>
          </ul>
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>ul className=&quot;dropdown-navbar&quot;</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 20 + 'px'}}>&lt;</span>
                <span>NavDropdown title=&quot;Dropdown&quot; id=&quot;nav-dropdown&quot;</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 40 + 'px'}}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>Action</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 40 + 'px'}}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>Another action</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 40 + 'px'}}>&lt;</span>
                <span>MenuItem divider /</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 40 + 'px'}}>&lt;</span>
                <span>MenuItem</span>
                <span>&gt;</span>
                <span>Separated link</span>
                <span>&lt;</span>
                <span>/MenuItem</span>
                <span>&gt;</span>
                <br/>
                <span style={{paddingLeft: 20 + 'px'}}>&lt;</span>
                <span>/NavDropdown</span>
                <span>&gt;</span>
                <br/>
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