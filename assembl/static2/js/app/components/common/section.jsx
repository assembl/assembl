// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { SECTION_INDEX_GENERATOR, getIndexesForIdeas } from '../../utils/section';

type SectionProps = {
  containerAdditionalClassNames: Array<string> | string,
  title: string,
  index: number,
  displayIndex: boolean,
  indexGenerator: Function,
  parents: Array<number>,
  children: React.Node,
  className: string,
  translate: boolean,
  innerRef?: Function,
  id?: string
};

const level1 = (title, index, translate) => (
  <div>
    <div className="title-hyphen">&nbsp;</div>
    <h1 className="section-title section-title1 dark-title-1">
      {index ? <span className="section-title-index">{index}</span> : null}
      {translate ? <Translate value={title} /> : title}
    </h1>
  </div>
);

const level2 = (title, index, translate) => (
  <h2 className="section-title section-title-2 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h2>
);

const level3 = (title, index, translate) => (
  <h3 className="section-title section-title-3 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h3>
);

const levelN = (title, index, translate) => (
  <h3 className="section-title section-title-3 dark-title-1">
    {index ? <span className="section-title-index">{index}</span> : null}
    {translate ? <Translate value={title} /> : title}
  </h3>
);

const LEVELS = [level1, level2, level3];

class Section extends React.Component<SectionProps> {
  static defaultProps = {
    containerAdditionalClassNames: [],
    index: 1,
    displayIndex: false,
    indexGenerator: SECTION_INDEX_GENERATOR.alphanumericOr,
    parents: [],
    className: 'themes-section',
    translate: false,
    innerRef: undefined
  };

  getIndexes = (): Array<number> => {
    const { index, parents } = this.props;
    const indexes = parents.slice();
    indexes.push(index);
    return indexes;
  };

  getTitle = () => {
    const { title, parents, indexGenerator, displayIndex, translate, index } = this.props;
    const indexes = getIndexesForIdeas(parents, index);
    const titleRenderer = LEVELS[parents.length] || levelN;
    return titleRenderer(title, displayIndex && indexGenerator(indexes), translate);
  };

  render() {
    const { className, children, containerAdditionalClassNames, innerRef, id } = this.props;
    const containerClassName = classnames('max-container', containerAdditionalClassNames);
    return (
      <section className={className} ref={innerRef} id={id}>
        <div className={containerClassName}>
          <div className="title-section">{this.getTitle()}</div>
          <div className="content-section margin-l">{children}</div>
        </div>
      </section>
    );
  }
}

export default Section;