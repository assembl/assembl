/* eslint react/no-multi-comp: "off" */
// @flow
import * as React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

import NuggetsManager from '../nuggetsManager';
import Child from './treeItem';
import type { FictionCommentExtraProps } from '../../../components/debate/brightMirror/fictionComment';
import type { ContentLocaleMapping } from '../../../actions/actionTypes';

type Props = {
  sharedProps?: Object, // props to pass to all items
  contentLocaleMapping: ContentLocaleMapping,
  identifier: string,
  phaseId?: string,
  messageViewOverride: string,
  initialRowIndex: ?number,
  lang: string,
  data: Array<ChildType>,
  InnerComponentFolded: ({ nbPosts: number }) => React.Node,
  InnerComponent: any => React.Node,
  SeparatorComponent: () => React.Node,
  noRowsRenderer: () => React.Node,
  fictionCommentExtraProps?: FictionCommentExtraProps
};

class Tree extends React.Component<Props> {
  static defaultProps = {
    sharedProps: {}
  };

  componentDidMount() {
    // Reset the global prevStopIndex to not overfetch posts when changing idea
    // or to avoid recreating all dom nodes if we go back to the same idea.
    this.cache.clearAll();
    this.prevStopIndex = 0;
    this.triggerScrollToRow(this.props.initialRowIndex);
  }

  componentWillReceiveProps(nextProps: Props) {
    const { data } = this.props;
    let invalidate = false;
    if (data.length !== nextProps.data.length) {
      invalidate = true;
    } else {
      for (let i = 0; i < data.length; i += 1) {
        if (data[i].dbId !== nextProps.data[i].dbId) {
          invalidate = true;
          break;
        }
      }
    }
    if (invalidate) {
      this.cache.clearAll();
      // If a new top post has been created, clear the cache
      // and rerender the List by changing its key
      // to be sure to recalculate the heights of all top posts.
      // Reset prevStopIndex because globalList.recomputeRowHeights() only update the 10 first top posts
      // because Grid.recomputeGridSize that is called by globalList.recomputeRowHeights
      // doesnt take into account our hack in overscanIndicesGetter.
      // This means that the posts after the 10th post are removed from the dom
      // and will be recreated when scrolling, losing the previous expand/collapse local state.
      this.prevStopIndex = 0;
    }
    this.invalidate = invalidate;
  }

  componentDidUpdate(prevProps: Props) {
    const { initialRowIndex } = this.props;
    if (prevProps.initialRowIndex !== initialRowIndex) {
      this.triggerScrollToRow(initialRowIndex);
    }
  }

  invalidate: boolean = false;

  triggerScrollToRow = (rowIndex: ?number) => {
    if (this.listRef && rowIndex !== null) {
      this.listRef.scrollToRow(rowIndex);
    }
  };

  nuggetsManager: NuggetsManager = new NuggetsManager();

  prevStopIndex: number = 0;

  cache: CellMeasurerCache = new CellMeasurerCache({
    defaultHeight: 500,
    minHeight: 100,
    fixedWidth: true
  });

  listRef: List | null = null;

  // override overscanIndicesGetter to not remove from the dom the posts once rendered
  // to fix various issue with scrolling with WindowScroller
  overscanIndicesGetter = ({
    cellCount,
    overscanCellsCount,
    stopIndex
  }: {
    cellCount: number,
    overscanCellsCount: number,
    stopIndex: number
  }) => {
    let overscanStopIndex;
    if (cellCount === 1) {
      // overscanIndicesGetter is called for columns, not rows
      // use default implementation
      overscanStopIndex = Math.min(cellCount - 1, stopIndex + overscanCellsCount);
    } else {
      this.prevStopIndex = Math.max(this.prevStopIndex, stopIndex);
      overscanStopIndex = Math.min(cellCount - 1, this.prevStopIndex + overscanCellsCount);
    }
    return {
      overscanStartIndex: 0,
      overscanStopIndex: overscanStopIndex
    };
  };

  cellRenderer = ({
    index,
    key,
    parent,
    style
  }: {
    index: number,
    key: string,
    parent: { props: Props },
    style: { [string]: string }
  }) => {
    const {
      sharedProps,
      data,
      identifier,
      phaseId,
      messageViewOverride,
      lang,
      InnerComponent, // component that will be rendered in the child
      InnerComponentFolded, // component that will be used to render the children when folded
      SeparatorComponent, // separator component between first level children
      fictionCommentExtraProps // Optional Bright Mirror fiction debate props
    } = this.props;
    const childData = data[index];
    return (
      <CellMeasurer cache={this.cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        <div style={style}>
          {index > 0 ? <SeparatorComponent /> : null}
          <Child
            {...sharedProps}
            {...childData}
            key={childData.id}
            identifier={identifier}
            phaseId={phaseId}
            messageViewOverride={messageViewOverride}
            lang={lang}
            rowIndex={index}
            contentLocaleMapping={parent.props.contentLocaleMapping}
            InnerComponent={InnerComponent}
            InnerComponentFolded={InnerComponentFolded}
            SeparatorComponent={SeparatorComponent}
            nuggetsManager={this.nuggetsManager}
            listRef={this.listRef}
            cache={this.cache}
            fictionCommentExtraProps={fictionCommentExtraProps}
          />
        </div>
      </CellMeasurer>
    );
  };

  render() {
    const { contentLocaleMapping, data, lang, noRowsRenderer, fictionCommentExtraProps } = this.props;
    const invalidate = this.invalidate;
    return (
      <WindowScroller>
        {({ height, isScrolling, onChildScroll, scrollTop }) => (
          <AutoSizer
            disableHeight
            onResize={() => {
              this.cache.clearAll();
              // $FlowFixMe listRef is not null
              this.listRef.recomputeRowHeights();
              this.nuggetsManager.update();
            }}
          >
            {({ width }) => {
              // Remove scrollTop props for Bright Mirror fiction page to prevent scrolling issue
              const listScrollTopProps = fictionCommentExtraProps ? null : { scrollTop: scrollTop };
              return (
                <List
                  contentLocaleMapping={contentLocaleMapping}
                  onRowsRendered={() => {
                    if (invalidate && this.listRef) {
                      this.listRef.forceUpdateGrid();
                    }
                  }}
                  height={height}
                  // pass lang to the List component to ensure that the rows are rendered again if we change the site language
                  lang={lang}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  {...listScrollTopProps}
                  autoHeight
                  rowHeight={this.cache.rowHeight}
                  deferredMeasurementCache={this.cache}
                  noRowsRenderer={noRowsRenderer}
                  ref={(ref) => {
                    // Add a guard because the List component's ref is recalculated many times onScroll
                    // Causing other components that have listRef as prop to re-render 4x-6x times.
                    if (!this.listRef) {
                      this.listRef = ref;
                    }
                  }}
                  rowCount={data.length}
                  overscanIndicesGetter={this.overscanIndicesGetter}
                  overscanRowCount={1}
                  rowRenderer={this.cellRenderer}
                  width={width}
                  className="tree-list"
                />
              );
            }}
          </AutoSizer>
        )}
      </WindowScroller>
    );
  }
}

export default Tree;