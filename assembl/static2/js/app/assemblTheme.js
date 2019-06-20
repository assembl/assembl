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

// const secondColor = props => (
//   props.secondColor ? props.secondColor : defaultColors.secondColor
// );

/* Potential regressions when replacing $first-color-opacity-70 with opacityColor for :
   * .overflow-menu .overflow-menu-action
   * .proposals .overflow-action
   * .posts .overflow-action
  */
const opacityColor = props => (props.opacityColor ? props.opacityColor : defaultColors.opacityColor);

// const minOpacityColor = props => (
//   props.minOpacityColor ? props.minOpacityColor : defaultColors.minOpacityColor
// );

const size = {
  small: '768px'
};

const screen = {
  small: `(min-width: ${size.small})`
};

// Define what props.theme will look like
export const GlobalStyle = createGlobalStyle`
  #first-color-hidden {
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
  }

  .nav-tabs {
    &.nav-justified {
      & > li > a {
        color: ${firstColor};

        &:hover {
          color: ${firstColor};
        }
      }

      & > .active {
        & > a,
        & > a:hover,
        & > a:focus {
          color: ${firstColor};
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

  @media screen and ${screen.small} {
    .proposals {
      .statistic {
        background-color: ${firstColorLight};
      }
    }
  }
`;