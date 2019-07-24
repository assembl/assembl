import { createGlobalStyle } from 'styled-components';

const defaultColors = {
  firstColor: '#192882',
  secondColor: '#dbdeef'
  // firstColorWithDarkOpacity: '#0af',
  // secondColorWithDarkOpacity: 'rgba(25, 40, 130, 0.6)'
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

const darkOpacity = 0.6;
const lightOpacity = 0.2;

const firstColor = props => (props.firstColor ? props.firstColor : defaultColors.firstColor);
const firstColorWithDarkOpacity = props =>
  (props.firstColor
    ? `rgba(${hexToRgb(props.firstColor)}, ${darkOpacity})`
    : `rgba(${hexToRgb(defaultColors.firstColor)}, ${darkOpacity})`);
const firstColorWithLightOpacity = props =>
  (props.firstColor
    ? `rgba(${hexToRgb(props.firstColor)}, ${lightOpacity})`
    : `rgba(${hexToRgb(defaultColors.firstColor)}, ${lightOpacity})`);

const secondColor = props => (props.secondColor ? props.secondColor : defaultColors.secondColor);
const secondColorWithDarkOpacity = props =>
  (props.secondColor
    ? `rgba(${hexToRgb(props.secondColor)}, ${darkOpacity})`
    : `rgba(${hexToRgb(defaultColors.secondColor)}, ${darkOpacity})`);
// const secondColorWithLightOpacity = props =>
//   (props.secondColor ?
//     `rgba(${hexToRgb(props.secondColor)}, ${lightOpacity})` :
//     `rgba(${hexToRgb(defaultColors.secondColor)}, ${lightOpacity})`);

const size = {
  small: '768px',
  medium: '992px'
};

const screen = {
  small: `(min-width: ${size.small})`,
  maxMedium: `(max-width: ${size.medium})`
};

// Define Assembl theme colors that can be used as component props (e.g Semantic Analysis component)
// export const assemblColors = {
//   firstColor: firstColor,
//   firstColorWithDarkOpacity: firstColorWithDarkOpacity,
//   firstColorWithLightOpacity: firstColorWithLightOpacity,
//   secondColor: secondColor,
//   secondColorWithDarkOpacity: secondColorWithDarkOpacity,
//   secondColorWithLightOpacity: secondColorWithLightOpacity
// };

// Define what props.theme will look like
export const GlobalStyle = createGlobalStyle`
  #first-color-hidden {
    color: ${firstColor};
  }

  #second-color-hidden {
    color: ${secondColor};
  }

  #thread-view {
    .level {
      .box {
        border-color: ${firstColor};
      }
    }
  }

  a {
    color: ${firstColor};
  }

  .administration {
    input[type='text'],
    input[type='textarea'],
    .form-control,
    .admin-dropdown,
    .dropdown-toggle,
    .btn-default {
      &:focus {
        border-color: ${firstColor};
      }
    }

    .admin-menu {
      li {
        a {
          &:hover {
            color: ${firstColor};
          }
        }
      }

      .active {
        color: ${firstColor};
      }
    }

    .plus {
      background-color: ${firstColor};
    }

    .admin-navbar {
      background-color: ${firstColorWithDarkOpacity};

      .step-numbers {
        .txt {
          color: ${firstColor};
        }

        .bar {
          background-color: ${firstColor};
        }
      }
    }

    .arrow-container {
      .arrow {
        .assembl-icon-up-open {
          color: ${firstColor};
        }

        .assembl-icon-down-open {
          color: ${firstColor};
        }
      }
    }

    .landing-page-admin {
      .modules-preview {
        .inner {
          .module-block:first-child,
          .module-block:last-child {
            background-color: ${firstColor};
          }

          .other-modules {
            .module-block {
              border-color: ${firstColor};
              color: ${firstColor};

              .admin-icons {
                color: ${firstColor};
              }
            }
          }
        }
      }
    }

    .vote-proposal-form {
      .settings-link {
        color: ${firstColor};
      }
    }

    .flag-container.active {
      border-color: ${firstColor};
    }

    .separator {
      border-bottom-color: ${firstColor};
    }
  }

  .annotation {
    color: ${firstColor};
  }

  .announcement {
    .announcement-statistics {
      .announcement-numbers {
        color: ${firstColor};
      }
    }
  }

  .attachment {
    .assembl-icon-text-attachment, .assembl-icon-delete {
      &:before {
        color: ${firstColor};
      }
    }
  }

  .avatar {
    .connection {
      color: ${firstColor};
    }

    .username {
      color: ${firstColor};
    }
  }

  .back-btn-container {
    .button-dark {
      color: ${firstColor};
    }
  }

  .background-color {
    background-color: ${firstColorWithLightOpacity};
  }

  .box-hyphen {
    border-top-color: ${secondColor};
  }

  .button-dark.button-dark {
    border-color: ${firstColor};

    &:hover,
    &:focus,
    &:active,
    &:focus:active,
    &:active:hover,
    &[disabled]:hover {
      border-color: ${firstColor};
    }

    &:before {
      background: ${firstColor};
    }
  }

  .button-diamond-dark {
    color: ${firstColor};

    .button-diamond-dark-back {
      border-color: ${firstColor};
    }
  }

  .button-diamond-dark:hover {
    .button-diamond-dark-back {
      background-color: ${firstColor};
      border-color: ${firstColor};

      &:before {
        background: ${firstColor};
      }
    }
  }

  .button-light.button-light {
    border-color: ${secondColor};

    &:hover,
    &:focus,
    &:active,
    &:focus:active,
    &:active:hover,
    &[disabled]:hover {
      border-color: ${secondColor};
    }

    &:before {
      background: ${secondColor};
    }
  }

  .button-link {
    border-color: ${secondColor};

    &:hover,
    &:focus,
    &:active,
    &:focus:active,
    &:active:hover,
    &[disabled]:hover {
      border-color: ${secondColor};
    }

    &:before {
      background: ${secondColor};
    }
  }

  .collapsed-title {
    background-color: ${firstColorWithDarkOpacity};
    color: ${firstColor};
  }

  .color {
    color: ${firstColor};
  }

  .color2 {
    color: ${secondColor};
  }

  .comment-container {
    .content {
      .toolbar {
        .action-edit {
          .editPostIcon {
            path {
              fill: ${firstColor};
              stroke: ${firstColor};
            }
          }
        }

        .action-delete {
          .deletePostIcon {
            .group {
              fill: ${firstColor};

              .path {
                stroke: ${firstColor};
              }
            }
          }
        }
      }
    }
  }

  .comment-form {
    border-color: ${firstColor};
  }

  .cookies-bar {
    background-color: ${firstColorWithDarkOpacity};
  }

  .cross-icon {
    .cross-icon-path {
      fill: ${firstColor};
    }
  }

  .custom-loader {
    .path {
      stroke: ${firstColor};
    }
  }

  .dark-title-1 {
    color: ${firstColor};
  }

  .dark-title-3 {
    color: ${firstColor};
  }

  .dark-title-4 {
    color: ${firstColor};
  }

  .dark-title-7 {
    color: ${firstColor};
  }

  .date {
    color: ${secondColor};
  }

  .debate {
    .questions {
      .questions-section {
        .txt-area {
          border-left-color: ${firstColor};
        }
      }
    }

    .navigation-section {
      .question-nav {
        color: ${firstColor};

        .question-numbers {
          .bar {
            background-color: ${firstColor};
          }
        }
      }
    }
  }

  .debate-link {
    .header-container {
      background-color: ${firstColor};

      .menu-table {
        .menu-item-container {
          .menu-item {
            .thumb-img {
              background-color: ${firstColor};
            }
          }

          &.active {
            background-color: ${firstColorWithDarkOpacity};
            color: ${firstColor};

            .thumb-img {
              border-color: ${firstColor};
            }
          }
        }
      }
    }
  }

  .debate-link.active {
    > .navbar-menu-item {
      background-color: ${firstColor};
    }
  }

  .description {
    .words-watson {
      color: ${firstColor};
    }
  }

  .dropdown-xl {
    .dropdown-toggle {
      color: ${firstColor};

      &:hover {
        color: ${firstColor};
      }

      &:focus {
        color: ${firstColor};
      }
    }

    .dropdown-menu {
      li {
        a {
          color: ${firstColor};
        }
      }
    }
  }

  .dropdown-xs {
    .dropdown-toggle {
      color: ${firstColor};

      &:hover {
        color: ${firstColor};
      }

      &:focus {
        color: ${firstColor};
      }
    }

    .dropdown-menu {
      li.active a {
        background-color: ${firstColor};
      }

      a {
        color: ${firstColor};
      }

      .caret {
        color: ${firstColor};
      }
    }
  }

  .error-page {
    background-color: ${firstColorWithDarkOpacity};

    .title-error-code {
      color: ${firstColor};
    }

    .title-error {
      color: ${firstColor};
    }

    button {
      color: ${secondColor};
      border-color: ${firstColor};
    }

    button:before {
      background: ${firstColor};
    }
  }

  .fiction-edit-modal {
    .modal-content {
      background-color: ${firstColorWithDarkOpacity};
    }
  }

  .fiction-preview {
    .draft-label {
      border-color: ${firstColorWithDarkOpacity};
      color: ${firstColorWithDarkOpacity};
    }
  }

  .form-title {
    color: ${firstColor};
  }

  .gauge-vote-for-proposal,
  .number-gauge-vote-for-proposal {
    .gauge-container {
      .rc-slider {
        .rc-slider-track {
          background-color: ${firstColor};
        }

        .rc-slider-mark-text {
          &.rc-slider-mark-text-active {
            color: ${firstColor};
          }
        }

        svg.pointer {
          fill: ${firstColor};
        }
      }
    }
  }

  .go-up {
    div {
      color: ${firstColor};
    }

    a {
      background-color: ${firstColorWithDarkOpacity};
    }
  }

  .harvesting-box {
    .harvesting-tags-form-container,
    .harvesting-tags-container {
      .harvesting-tags-edit {
        color: ${firstColor};
        border-color: ${firstColor};

        &:hover {
          background-color: ${firstColor};
        }
      }
    }

    .button-bar {
      .btn.active {
        border-color: ${secondColor};

        span {
          color: ${secondColor};
        }
      }

      .btn-default {
        &:hover {
          border-color: ${secondColor};

          span {
            color: ${secondColor};
          }
        }
      }
    }
  }

  .harvesting-menu {
    .button-taxonomy:hover {
      border-color: ${firstColor};
    }

    .taxonomy-label {
      &:hover {
        background-color: ${firstColorWithDarkOpacity};
      }
    }

    .taxonomy-label.active {
      background-color: ${firstColorWithDarkOpacity};
    }
  }

  .header-section {
    background-color: ${firstColor};

    .header-bkg-mask {
      background-color: ${firstColorWithDarkOpacity};
    }

    .statistic {
      background-color: ${firstColorWithDarkOpacity};
    }
  }

  .home {
    .header-section {
      background-color: ${firstColor};
    }

    .themes-section {
      .top-idea {
        .idea-link {
          &:hover {
            background-color: ${secondColorWithDarkOpacity};
          }

          .idea-link-title {
            color: ${firstColor};
          }
        }
      }
    }
  }

  .icon {
    &.tooltip {
      .text {
        fill: ${firstColor};
      }

      .circle {
        stroke: ${firstColor};
      }
    }

    &.no-data {
      fill: ${secondColor};
    }
  }

  .idea {
    .subject-prefix {
      color: ${firstColorWithDarkOpacity};
    }

    .child-level {
      .box {
        border-color: ${firstColorWithDarkOpacity};
      }
    }

    .level-1,
    .level-2,
    .level-3,
    .level-4 {
      border-top-color: ${firstColorWithDarkOpacity};
      border-left-color: ${firstColorWithDarkOpacity};
    }

    .expand-indented {
      border-left-color: ${firstColorWithDarkOpacity};
      color: ${firstColor};
    }

    .expand {
      border-left-color: ${firstColorWithDarkOpacity};
      color: ${firstColor};
    }

    .post-folded {
      color: ${firstColor};
    }

    .infinite-separator {
      border-bottom-color: ${firstColor};
    }
  }

  .idea-preview-selected {
    .color-box {
      background-color: ${secondColorWithDarkOpacity};
    }
  }

  .idea-synthesis {
    .synthesis-stats {
      .counters {
        .counter-with-icon {
          color: ${firstColor};
        }
      }
    }

    .statistics-doughnut {
      .statistics {
        .after {
          .doughnut-label-count {
            color: ${firstColor};
          }

          .doughnut-label-text {
            color: ${firstColor};
          }
        }
      }
    }

    .idea-link {
      color: ${firstColor};
    }
  }

  .illustration-box {
    .content-box {
      &:hover {
        .color-box {
          background-color: ${secondColorWithDarkOpacity};
        }
      }
    }
  }

  .keyword-info {
    h3 {
      color: ${firstColor};
    }
  }

  .mailIcon {
    g {
      fill: ${firstColor};
    }
  }

  .login-view {
    .terms-link {
      color: ${secondColor};
    }
  }

  .media-section {
    .container-fluid {
      .media-description {
        .description-txt {
          color: ${firstColor};
        }
      }
    }
  }

  .menu {
    li.menu-item {
      a {
        &:hover {
          color: ${firstColor};
        }
      }
    }
  }

  .minimized-timeline {
    .active {
      background-color: ${firstColor};
    }

    .timeline-graph {
      .timeline-bars {
        .timeline-bar-background-container {
          .timeline-bar-background {
            background-color: ${firstColor};
          }
        }
      }
    }

    .timeline-arrow {
      background-color: ${firstColor};
    }

    &.active {
      .txt-not-active {
        ~ .timeline-graph {
          .timeline-number {
            background-color: ${firstColor};
          }

          .timeline-bar-background-container {
            background-color: ${firstColor};
          }
        }

        .timeline-link {
          color: ${firstColor};
        }
      }
    }
  }

  .nav-bar {
    .burger-navbar {
      .burgermenu-language {
        > .dropdown {
          &.open > .dropdown-toggle {
            color: ${firstColor};
          }
        }
      }

      .active {
        background-color: ${firstColorWithDarkOpacity};
        color: ${firstColor};
      }
    }

    .navbar-icons {
      .is-harvesting-button {
        &.active {
          color: ${secondColor};
        }
      }
    }

    .navbar-menu-item {
      color: ${firstColor};

      &:hover {
        color: ${firstColor};
      }

      &:after {
        color: ${firstColor};
      }
    }

    .flat-navbar {
      .navbar-menu-item {
        &.active {
          border-bottom-color: ${secondColor};
          color: ${firstColor};
        }
      }

      .logo-active {
        border-bottom-color: ${secondColor};
      }
    }
  }

  .nav-tabs {
    &.nav-justified.nav-justified {
      & > li > a {
        color: ${firstColor};
        border-bottom-color: ${secondColor};

        &:hover {
          color: ${firstColor};
        }
      }

      & > .active {
        & > a,
        & > a:hover,
        & > a:focus {
          color: ${firstColor};
          border-bottom-color: ${secondColor};
        }
      }
    }
  }

  .overflow-menu {
    .overflow-menu-action {
      color: ${firstColorWithDarkOpacity};

      &:hover,
      &:active,
      &:focus {
        color: ${firstColor};
      }
    }
  }

  .posts {
    .overflow-action {
      color: ${firstColorWithDarkOpacity};

      &:hover {
        color: ${firstColor};
      }
    }

    .answer-form {
      border-color: ${firstColorWithDarkOpacity};
      color: ${firstColorWithDarkOpacity};

      .DraftEditor-root {
        border-color: ${firstColor};
      }
    }

    .collapsed-answer-form {
      .form-group {
        border-color: ${firstColor};
        color: ${firstColor};
      }
    }

    .extracts {
      .badges {
        .nugget {
          .nugget-txt {
            color: ${firstColor};
          }
        }
      }
    }
  }

  .profile {
    .dark-title-2 {
      color: ${firstColor};
    }

    .form-control {
      &:focus {
        border-color: ${secondColor};
      }
    }
  }

  .proposals {
    .box {
      border-left-color: ${firstColor};
    }

    .user {
      .username {
        color: ${firstColor};
      }
    }

    .post-footer {
      .answer-form-inner .form-group {
        border-color: ${firstColorWithDarkOpacity};
      }
    }

    .overflow-action {
      color: ${firstColorWithDarkOpacity};

      .deletePostIcon {
        .group {
          fill: ${firstColor};

          .path {
            stroke: ${firstColor};
          }
        }
      }

      &:hover {
        color: ${firstColor};
      }
    }

    .sentiment-label {
      color: ${firstColor};
    }
  }

  .question-footer {
    .button-light {
      color: ${firstColor};
    }
  }

  .ReactTags__tags {
    color: ${firstColor};

    .ReactTags__selected {
      .ReactTags__tag {
        background-color: ${firstColorWithLightOpacity};
      }
    }

    &.react-tags-wrapper-admin {
      .ReactTags__selected {
        .ReactTags__tagInput {
          background-color: ${firstColor};
        }
      }

      .ReactTags__tagInput:focus-within {
        background-color: ${firstColorWithLightOpacity};
      }

      .ReactTags__suggestions {
        background-color: ${firstColorWithLightOpacity};

        li {
          mark {
            color: ${firstColor};
          }
        }
      }
    }
  }

  .rich-text-editor {
    .insertion-box {
      input {
        &:focus {
          border-color: ${firstColor};
        }
      }
    }
  }

  .scroll-one-page {
    span {
      background-color: ${secondColor};
    }
  }

  .sentiments-count {
    .txt {
      color: ${firstColor};
    }
  }

  .sentiments-popover {
    background-color: ${firstColorWithDarkOpacity};
  }

  .share-button {
    background-color: ${firstColor};
  }

  .share-buttons-container {
    .btn-share {
      &.btn-copy {
        border-color: ${firstColor};
        background-color: ${firstColor};
      }

      &.btn-mail {
        border-color: ${firstColor};
        color: ${firstColor};
      }
    }
  }

  .side-comment-anchor {
    .button {
      background-color: ${firstColor};
    }

    .arrow-down {
      border-top-color: ${firstColor};
    }
  }

  .side-comment-badge {
    .side-comment-button {
      .assembl-icon-suggest {
        color: ${firstColor};
      }
    }
  }

  .sk-action-bar {
    .sk-filter-groups {
      color: ${firstColor};
    }
  }

  .sk-action-button {
    color: ${firstColor};
  }

  .sk-hits-grid-hit {
    a {
      color: ${firstColor};
    }
  }

  .sk-hits-list {
    a {
      color: ${firstColor};
    }

    em {
      background: ${firstColorWithDarkOpacity};
    }
  }

  .sk-hits-list-hit {
    border-bottom-color: ${firstColor};

    &__imgtype {
      &:before {
        color: ${firstColor};
      }
    }

    &__tags {
      .sk-tag-filter {
        &:hover {
          color: ${firstColor};
        }
      }
    }
  }

  .sk-selected-filters {
    &-option {
      &__name {
        color: ${firstColor};
      }

      &__remove-action {
        color: ${firstColor};
      }
    }
  }

  .sk-refinement-list {
    &__view-more-action {
      color: ${firstColor};
    }
  }

  .sk-reset-filters {
    color: ${firstColor};
  }

  .sk-tabs {
    &-option {
      color: ${firstColor};

      &.is-active {
        border-color: ${firstColor};
      }
    }
  }

  .sk-tag-filter {
    display: inline-block;

    &.is-active {
      background-color: ${firstColorWithDarkOpacity};
    }
  }

  .sk-toggle {
    &-option {
      &.is-active {
        background-color: ${firstColor};
        border-color: ${firstColor};
      }
    }
  }

  .synthesis-page {
    .synthesis-side-menu {
      .assembl-icon-down-open {
        color: ${firstColor};
      }

      .active {
        background: ${firstColor};
      }

      .side-menu-link-1 {
        color: ${firstColor};
      }

      .side-menu-link-2 {
        color: ${firstColor};
      }

      .side-menu-link-3 {
        color: ${firstColor};
      }
    }
  }

  .synthesis-preview {
    .light-title-4 {
      color: ${secondColor};
    }
  }

  .tab-selector > .tab-selector-buttons {
    .button-container {
      button {
        color: ${firstColor};
      }
    }
  }

  .theme-box {
    border-left-color: ${firstColor};
  }

  .timeline {
    .bar {
      background-color: ${firstColor};
    }

    .pointer {
      fill: ${firstColor};
    }

    .timeline-date {
      color: ${firstColor};
    }
  }

  .title-hyphen {
    border-top-color: ${secondColor};
  }

  .votesession-page {
    .link-button {
      color: ${firstColor};
    }

    .participants-count__text {
      color: ${firstColor};
    }

    .gauge-box__estimate {
      color: ${firstColor};
    }
  }

  @media screen and ${screen.small} {
    .proposals {
      .statistic {
        background-color: ${firstColorWithDarkOpacity};
      }
    }
  }

  @media screen and ${screen.maxMedium} {
    #thread-view {
      .level {
        border-top-color: ${firstColorWithDarkOpacity};
      }
    }
  }
`;