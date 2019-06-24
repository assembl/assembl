import { createGlobalStyle } from 'styled-components';

const defaultColors = {
  firstColor: '#192882',
  firstColorLight: '#0af',
  secondColor: '#dbdeef',
  opacityColor: 'rgba(25, 40, 130, 0.6)',
  minOpacityColor: 'rgba(25, 40, 130, 0.1)'
};

const firstColor = props => (props.firstColor ? props.firstColor : defaultColors.firstColor);

const firstColorLight = props => (props.firstColorLight ? props.firstColorLight : defaultColors.firstColorLight);

const secondColor = props => (props.secondColor ? props.secondColor : defaultColors.secondColor);

/* Potential regressions when replacing $first-color-opacity-70 with opacityColor for :
   * .overflow-menu .overflow-menu-action
   * .proposals .overflow-action
   * .posts .overflow-action
   * .idea .subject-prefix
  */
const opacityColor = props => (props.opacityColor ? props.opacityColor : defaultColors.opacityColor);

const size = {
  small: '768px',
  medium: '992px'
};

const screen = {
  small: `(min-width: ${size.small})`,
  maxMedium: `(max-width: ${size.medium})`
};

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
      background-color: ${firstColorLight};

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
  }

  .back-btn-container {
    .button-dark {
      color: ${firstColor};
    }
  }

  .background-color {
    background-color: ${firstColorLight};
  }

  .collapsed-title {
    background-color: ${firstColorLight};
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
    background-color: ${firstColorLight};
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
            background-color: ${firstColorLight};
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
    background-color: ${firstColorLight};

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
      background-color: ${firstColorLight};
    }
  }

  .fiction-preview {
    .draft-label {
      border-color: ${firstColorLight};
      color: ${firstColorLight};
    }
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
      background-color: ${firstColorLight};
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
        background-color: ${firstColorLight};
      }
    }

    .taxonomy-label.active {
      background-color: ${firstColorLight};
    }
  }

  .header-section {
    background-color: ${firstColor};

    .header-bkg-mask {
      background-color: ${opacityColor};
    }

    .statistic {
      background-color: ${opacityColor};
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
            background-color: ${opacityColor};
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
      color: ${opacityColor};
    }

    .child-level {
      .box {
        border-color: ${firstColorLight};
      }
    }

    .level-1,
    .level-2,
    .level-3,
    .level-4 {
      border-top-color: ${firstColorLight};
      border-left-color: ${firstColorLight};
    }

    .expand-indented {
      border-left-color: ${firstColorLight};
      color: ${firstColor};
    }

    .expand {
      border-left-color: ${firstColorLight};
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
      background-color: ${opacityColor};
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
          background-color: ${opacityColor};
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
        background-color: ${firstColorLight};
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
  }

  .nav-tabs {
    &.nav-justified {
      & > li > a {
        color: ${firstColor};
        border-color: ${secondColor};

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
      color: ${opacityColor};

      &:hover,
      &:active,
      &:focus {
        color: ${firstColor};
      }
    }
  }

  .posts {
    .overflow-action {
      color: ${opacityColor};

      &:hover {
        color: ${firstColor};
      }
    }

    .answer-form {
      border-color: ${firstColorLight};
      color: ${firstColorLight};

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
    .form-control {
      &:focus {
        border-color: ${secondColor};
      }
    }
  }

  .proposals {
    .user {
      .username {
        color: ${firstColor};
      }
    }

    .post-footer {
      .answer-form-inner .form-group {
        border-color: ${firstColorLight};
      }
    }

    .overflow-action {
      color: ${opacityColor};

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
        background-color: ${firstColorLight};
      }
    }

    &.react-tags-wrapper-admin {
      .ReactTags__selected {
        .ReactTags__tagInput {
          background-color: ${firstColor};
        }
      }

      .ReactTags__tagInput:focus-within {
        background-color: ${firstColorLight};
      }

      .ReactTags__suggestions {
        background-color: ${firstColorLight};

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

  .sentiments-count {
    .txt {
      color: ${firstColor};
    }
  }

  .sentiments-popover {
    background-color: ${firstColorLight};
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

  .scroll-one-page {
    span {
      background-color: ${secondColor};
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

  .votesession-page {
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
        background-color: ${firstColorLight};
      }
    }
  }

  @media screen and ${screen.maxMedium} {
    #thread-view {
      .level {
        border-top-color: ${firstColorLight};
      }
    }
  }
`;