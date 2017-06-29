import React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

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

class Child extends React.Component {
  constructor() {
    super();
    this.renderToggleLink = this.renderToggleLink.bind(this);
  }

  renderToggleLink(expanded) {
    return <div className="plus">{expanded ? '-' : '+'}</div>;
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
      SeparatorComponent,
      toggleItem
    } = this.props;
    return (
      <div className={`level level-${level}`}>
        <InnerComponent {...this.props} />
        <a
          onClick={(event) => {
            event.stopPropagation();
            toggleItem(id);
            globalList.recomputeRowHeights();
          }}
          className="expand"
        >
          {children.length > 0 ? this.renderToggleLink(expanded) : null}
          {children && expanded
            ? children.map((child, idx) => {
              return (
                <ConnectedChildComponent
                  key={`${id}-child-${idx}`}
                  {...child}
                  ConnectedChildComponent={ConnectedChildComponent}
                  level={level + 1}
                  InnerComponent={InnerComponent}
                  InnerComponentFolded={InnerComponentFolded}
                  SeparatorComponent={SeparatorComponent}
                  toggleItem={toggleItem}
                />
              );
            })
            : children.map((child, idx) => {
              return <InnerComponentFolded key={idx} {...child} />;
            })}
        </a>
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
      <div key={`child-${index}`} style={style}>
        <ConnectedChildComponent
          {...childData}
          ConnectedChildComponent={ConnectedChildComponent}
          InnerComponent={InnerComponent}
          InnerComponentFolded={InnerComponentFolded}
          SeparatorComponent={SeparatorComponent}
          toggleItem={toggleItem}
        />
        {!childData.isOnlyTopLevel ? <SeparatorComponent /> : null}
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
  noRowsRenderer,
  SeparatorComponent, // separator component between first level children
  toggleItem,
  width
}) => {
  const ConnectedChildComponent = connectChildFunction(Child);
  return (
    <List
      rowHeight={cache.rowHeight}
      deferredMeasurementCache={cache}
      ConnectedChildComponent={ConnectedChildComponent}
      data={data}
      height={height}
      InnerComponent={InnerComponent}
      InnerComponentFolded={InnerComponentFolded}
      noRowsRenderer={noRowsRenderer}
      ref={function (ref) {
        globalList = ref;
      }}
      rowCount={data.length}
      rowRenderer={cellRenderer}
      SeparatorComponent={SeparatorComponent}
      toggleItem={toggleItem}
      width={width}
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
    <AutoSizer>
      {({ height, width }) => {
        return <Tree height={height} width={width} {...props} />;
      }}
    </AutoSizer>
  );
};