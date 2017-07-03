import React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

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

class Child extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderToggleLink = this.renderToggleLink.bind(this);
  }

  renderToggleLink(expanded, indented) {
    const { id, rowIndex, toggleItem } = this.props;
    return (
      <div
        onClick={(event) => {
          event.stopPropagation();
          toggleItem(id);
          cache.clear(rowIndex, 0);
          globalList.recomputeRowHeights();
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
      if (level > 4) {
        cls += ' padding-right';
      }
      return cls;
    };
    return (
      <div className={cssClasses()}>
        <InnerComponent {...this.props} />
        {children.length > 0 ? this.renderToggleLink(expanded, level < 4) : null}
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
          : children.map((child, idx) => {
            return (
              <div
                key={idx}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleItem(id);
                  cache.clear(rowIndex, 0);
                  globalList.recomputeRowHeights();
                }}
                className="post-folded"
              >
                <InnerComponentFolded {...child} />
              </div>
            );
          })}
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
  height,
  InnerComponent, // component that will be rendered in the child
  InnerComponentFolded, // component that will be used to render the children when folded
  isScrolling,
  noRowsRenderer,
  onScroll,
  SeparatorComponent, // separator component between first level children
  toggleItem,
  width
}) => {
  const ConnectedChildComponent = connectChildFunction(Child);
  return (
    <List
      autoHeight
      rowHeight={cache.rowHeight}
      deferredMeasurementCache={cache}
      ConnectedChildComponent={ConnectedChildComponent}
      data={data}
      height={height}
      InnerComponent={InnerComponent}
      InnerComponentFolded={InnerComponentFolded}
      isScrolling={isScrolling}
      noRowsRenderer={noRowsRenderer}
      ref={function (ref) {
        globalList = ref;
      }}
      rowCount={data.length}
      overscanRowCount={data.length}
      onScroll={onScroll}
      rowRenderer={cellRenderer}
      SeparatorComponent={SeparatorComponent}
      toggleItem={toggleItem}
      width={width}
      className="tree-list"
    />
  );
};

Tree.defaultProps = {
  InnerComponentFolded: () => {
    return null;
  }
};

export default (props) => {
  return (
    <WindowScroller>
      {({ height, isScrolling, onChildScroll }) => {
        return (
          <AutoSizer disableHeight>
            {({ width }) => {
              return <Tree height={height} isScrolling={isScrolling} onScroll={onChildScroll} {...props} width={width} />;
            }}
          </AutoSizer>
        );
      }}
    </WindowScroller>
  );
};