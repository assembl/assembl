import React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import { connect } from 'react-redux';
import { getDomElementOffset, scrollToPosition } from '../../utils/globalFunctions';

/*
  TODO: avoid globalList
  TODO: InnerComponentFolded should be able to toggle the item
*/

let globalList;

const cache = new CellMeasurerCache({
  defaultHeight: 600,
  minHeight: 500,
  fixedWidth: true
});

const scrollToElement = (id) => {
  setTimeout(() => {
    const elm = document.getElementById(id);
    const elmOffset = getDomElementOffset(elm).top;
    scrollToPosition(elmOffset - 80, 400);
  }, 200);
};

class Child extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderToggleLink = this.renderToggleLink.bind(this);
    this.expandCollapse = this.expandCollapse.bind(this);
    this.resizeTreeHeight = this.resizeTreeHeight.bind(this);
  }
  componentDidMount() {
    this.resizeTreeHeight();
    window.addEventListener('resize', this.resizeTreeHeight);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeTreeHeight);
  }
  resizeTreeHeight() {
    if (globalList) {
      cache.clearAll();
      globalList.recomputeRowHeights();
    }
  }
  expandCollapse(event) {
    event.stopPropagation();
    const { id, rowIndex, toggleItem } = this.props;
    toggleItem(id);
    cache.clear(rowIndex, 0);
    globalList.recomputeRowHeights();
  }
  renderToggleLink(expanded, indented, id) {
    return (
      <div
        onClick={(event) => {
          if (expanded) {
            scrollToElement(`exp${id}`);
          }
          this.expandCollapse(event);
        }}
        className={indented ? 'expand-indented' : 'expand'}
      >
        {expanded ? <span className="assembl-icon-minus-circled" /> : <span className="assembl-icon-plus-circled" />}
      </div>
    );
  }

  render() {
    const {
      children,
      ConnectedChildComponent,
      expanded,
      id,
      InnerComponent,
      InnerComponentFolded,
      level,
      rowIndex, // the index of the row (i.e. level 0 item) in the List
      SeparatorComponent,
      toggleItem
    } = this.props;
    const cssClasses = () => {
      let cls = `level level-${level}`;
      if (level > 0) {
        cls += ' border-left child-level';
      }
      if (level > 3) {
        cls += ' no-shift';
      }
      if (level > 4) {
        cls += ' padding-right';
      }
      return cls;
    };
    return (
      <div className={cssClasses()}>
        <InnerComponent {...this.props} />
        {children && children.length > 0 ? this.renderToggleLink(expanded, level < 4, children[0].id) : null}
        {children && expanded
          ? children.map((child, idx) => {
            return (
              <ConnectedChildComponent
                key={`${id}-child-${idx}`}
                {...child}
                ConnectedChildComponent={ConnectedChildComponent}
                level={level + 1}
                rowIndex={rowIndex}
                InnerComponent={InnerComponent}
                InnerComponentFolded={InnerComponentFolded}
                SeparatorComponent={SeparatorComponent}
                toggleItem={toggleItem}
              />
            );
          })
          : <div
            id={`exp${children[0].id}`}
            className="postfolded-container"
            onClick={(event) => {
              this.expandCollapse(event);
              scrollToElement(children[0].id);
            }}
          >
            {children &&
            <div className="post-folded">
              <InnerComponentFolded nbPosts={children.length} />
            </div>}
          </div>}
      </div>
    );
  }
}
Child.defaultProps = {
  level: 0
};

const cellRenderer = ({ index, key, parent, style }) => {
  const { ConnectedChildComponent, data, toggleItem, InnerComponent, InnerComponentFolded, SeparatorComponent } = parent.props;
  const childData = data[index];
  return (
    <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
      <div style={style}>
        <ConnectedChildComponent
          {...childData}
          rowIndex={index}
          ConnectedChildComponent={ConnectedChildComponent}
          InnerComponent={InnerComponent}
          InnerComponentFolded={InnerComponentFolded}
          SeparatorComponent={SeparatorComponent}
          toggleItem={toggleItem}
        />
        {index + 1 < data.length ? <SeparatorComponent /> : null}
      </div>
    </CellMeasurer>
  );
};

const Tree = ({
  connectChildFunction,
  data,
  InnerComponent, // component that will be rendered in the child
  InnerComponentFolded, // component that will be used to render the children when folded
  noRowsRenderer,
  SeparatorComponent, // separator component between first level children
  toggleItem
}) => {
  const ConnectedChildComponent = connectChildFunction(Child);
  cache.clearAll();
  return (
    <AutoSizer
      disableHeight
      onResize={() => {
        return globalList.recomputeRowHeights();
      }}
    >
      {({ width }) => {
        return (
          <List
            autoHeight
            rowHeight={cache.rowHeight}
            deferredMeasurementCache={cache}
            ConnectedChildComponent={ConnectedChildComponent}
            data={data}
            height={600}
            InnerComponent={InnerComponent}
            InnerComponentFolded={InnerComponentFolded}
            noRowsRenderer={noRowsRenderer}
            ref={function (ref) {
              globalList = ref;
            }}
            rowCount={data.length}
            overscanRowCount={data.length}
            rowRenderer={cellRenderer}
            SeparatorComponent={SeparatorComponent}
            toggleItem={toggleItem}
            width={width}
            className="tree-list"
          />
        );
      }}
    </AutoSizer>
  );
};

Tree.defaultProps = {
  InnerComponentFolded: () => {
    return null;
  }
};

const mapStateToProps = ({ posts }) => {
  return {
    activeAnswerFormId: posts.activeAnswerFormId
  };
};

export default connect(mapStateToProps)(Tree);