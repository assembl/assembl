import React from 'react';
import { AutoSizer, List } from 'react-virtualized';

/*
  TODO: avoid globalList
  TODO: adjust ROW_HEIGHT and FOLDED_CHILD_HEIGHT values
  TODO: InnerComponentFolded should be able to toggle the item
  TODO:
*/

let globalList;

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

const cellRenderer = ({ index, parent, style }) => {
  const { ConnectedChildComponent, data, toggleItem, InnerComponent, InnerComponentFolded, SeparatorComponent } = parent.props;
  const childData = data[index];
  return (
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
  );
};

const ROW_HEIGHT = 500;
const FOLDED_CHILD_HEIGHT = 50;

const getExpandedItemCount = (item) => {
  let count = 1;
  if (item.expanded) {
    count += item.children.map(getExpandedItemCount).reduce((total, childrenCount) => {
      return total + childrenCount;
    }, 0);
  }

  return count;
};

const rowHeight = (childData) => {
  if (childData.expanded) {
    return getExpandedItemCount(childData) * ROW_HEIGHT;
  }

  return ROW_HEIGHT + childData.children.length * FOLDED_CHILD_HEIGHT;
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
      rowHeight={({ index }) => {
        return rowHeight(data[index]);
      }}
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