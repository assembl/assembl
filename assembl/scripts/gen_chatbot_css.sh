#!/bin/sh
: ${botBackgroundColor:='#120D9C'}
: ${botTextColor:='white'}
: ${botTimeColor:='lightgrey'}

: ${humanBackgroundColor:='#b4f4be'}
: ${humanTextColor:='black'}
: ${humanTimeColor:='grey'}

: ${copier:=$(
    command -v pbcopy 2>/dev/null ||
    command -v xclip 2>/dev/null ||
    command -v less 2>/dev/null ||
    echo cat
)}

echo INFO: Copier is ${copier} 1>&2

echo "\
.message-input-wrap {
    padding: 0 !important;
    background: none !important;
}

.chat-preview > div {
    padding: 0 !important;
    background: none !important;
}

.form-control {
    border: none !important;
    padding-left: 20px;
}

.btn-primary {
    background: none !important;
    color: black !important;
}

.persistent-menu-container {
    display: none;
}

.page-main {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}

.message-input-row {
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 -1px 10px 0px rgba(0, 0, 0, 0.2);
}

.chats-wrap {
    height: calc(100% - 38px) !important;
}

.page-main > div:last-child {
    display: none;
}

.chat.chat-right .chat-body .chat-content {
    background-color: ${botBackgroundColor} !important;
}

.message-input-btn .btn-primary {
    background: none !important;
    border: none !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 1.5px;
}

.page-main .chats-wrap .chats > *:first-child {
    margin-top: 20px !important;
}

.VueCarousel-slide .btn-block {
    color: ${botTextColor} !important;
    background-color: ${botBackgroundColor} !important;
}

.chat-left .chat-body .chat-content {
    background-color: ${botBackgroundColor};
    color: ${botTextColor};
}

.chats .chat.chat-right .chat-body .chat-content {
    background-color: ${humanBackgroundColor} !important;
    color: ${humanTextColor};
}

.chat-right .chat-body .chat-content .chat-time {
    color: ${humanTimeColor};
}

.chat-left .chat-body .chat-content .chat-time {
    color: ${botTimeColor};
}

.chat-left .chat-body .chat-content .typing-indicator > span {
    background-color: ${botTextColor};
}

.chat-avatar .avatar {
    margin-top: 0 !important;
}

.chat-avatar .frame {
    width: 40px !important;
    height: 40px !important;
}
" | ${copier}
