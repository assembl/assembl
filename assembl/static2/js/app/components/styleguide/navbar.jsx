import React from 'react';
import Navbar from '../common/navbar';

const NavBar = () => (
  <div>
    <div className="title-2 underline" id="buttons"># NAVBAR</div>
    <section>
      <div className="title-3">Example</div>
      <Navbar />
    </section>
    <section>
      <div className="title-3">Code</div>
      <div className="box">
        <div>
          <div className="code">
            <span>&lt;</span>
            <span>Navbar /</span>
            <span>&gt;</span>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default NavBar;