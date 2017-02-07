import React from 'react';

class Titles extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="titles">TITLES</h2>
        <section>
          <h1 className="title-1">Title 1</h1>
          <h2 className="title-2">Title 2</h2>
          <h3 className="title-3">Title 3</h3>
          <h4 className="title-4">Title 4</h4>
          <h5 className="title-5">Title 5</h5>
        </section>
        <section>
          <h3 className="title-3">Code</h3>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span><span>h1 className=&quot;title-1&quot;</span><span>&gt;</span>
              </div>
              <span>Title 1</span>
              <div className="code">
                <span>&lt;</span><span>/h1</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span><span>h2 className=&quot;title-2&quot;</span><span>&gt;</span>
              </div>
              <span>Title 2</span>
              <div className="code">
                <span>&lt;</span><span>/h2</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span><span>h3 className=&quot;title-3&quot;</span><span>&gt;</span>
              </div>
              <span>Title 3</span>
              <div className="code">
                <span>&lt;</span><span>/h3</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span><span>h4 className=&quot;title-4&quot;</span><span>&gt;</span>
              </div>
              <span>Title 4</span>
              <div className="code">
                <span>&lt;</span><span>/h4</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span><span>h5 className=&quot;title-5&quot;</span><span>&gt;</span>
              </div>
              <span>Title 5</span>
              <div className="code">
                <span>&lt;</span><span>/h5</span><span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
export default Titles;