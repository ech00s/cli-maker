/*
declare global {
  interface String {
    txt_red();
    txt_green();
    txt_blue();
    txt_yellow();
    txt_cyan();
    txt_white();
    txt_black();
    txt_magenta();

    bg_red();
    bg_green();
    bg_blue();
    bg_yellow();
    bg_cyan();
    bg_white();
    bg_black();
    bg_magenta();

    txt_underline();
    txt_bold();
    txt_italic();
    txt_reverse();
    txt_strike();
    txt_overline();
    txt_double_underline();
    txt_frame();
    txt_encircle();
  }
} */

function rm_dup_reset(str) {
  if (str.endsWith("\x1b[0m\x1b[0m")) return str.substring(0, str.length - 4);
  return str;
}

String.prototype.txt_overline = function () {
  return rm_dup_reset(`\x1b[53m${this}\x1b[0m`);
};
String.prototype.txt_double_underline = function () {
  return rm_dup_reset(`\x1b[21m${this}\x1b[0m`);
};
String.prototype.txt_frame = function () {
  return rm_dup_reset(`\x1b[51m${this}\x1b[0m`);
};
String.prototype.txt_encircle = function () {
  return rm_dup_reset(`\x1b[52m${this}\x1b[0m`);
};
String.prototype.txt_underline = function underline() {
  return rm_dup_reset(`\x1b[4m${this}\x1b[0m`);
};
String.prototype.txt_bold = function () {
  return rm_dup_reset(`\x1b[1m${this}\x1b[0m`);
};
String.prototype.txt_italic = function () {
  return rm_dup_reset(`\x1b[3m${this}\x1b[0m`);
};
String.prototype.txt_reverse = function () {
  return rm_dup_reset(`\x1b[7m${this}\x1b[0m`);
};
String.prototype.txt_strike = function () {
  return rm_dup_reset(`\x1b[9m${this}\x1b[0m`);
};

String.prototype.txt_black = function () {
  return rm_dup_reset(`\x1b[30m${this}\x1b[0m`);
};

String.prototype.txt_red = function () {
  return rm_dup_reset(`\x1b[31m${this}\x1b[0m`);
};

String.prototype.txt_green = function () {
  return rm_dup_reset(`\x1b[32m${this}\x1b[0m`);
};

String.prototype.txt_yellow = function () {
  return rm_dup_reset(`\x1b[33m${this}\x1b[0m`);
};

String.prototype.txt_blue = function () {
  return rm_dup_reset(`\x1b[34m${this}\x1b[0m`);
};

String.prototype.txt_magenta = function () {
  return rm_dup_reset(`\x1b[35m${this}\x1b[0m`);
};

String.prototype.txt_cyan = function () {
  return rm_dup_reset(`\x1b[36m${this}\x1b[0m`);
};

String.prototype.txt_white = function () {
  return rm_dup_reset(`\x1b[37m${this}\x1b[0m`);
};

String.prototype.bg_black = function () {
  return rm_dup_reset(`\x1b[40m${this}\x1b[0m`);
};

String.prototype.bg_red = function () {
  return rm_dup_reset(`\x1b[41m${this}\x1b[0m`);
};

String.prototype.bg_green = function () {
  return rm_dup_reset(`\x1b[42m${this}\x1b[0m`);
};

String.prototype.bg_yellow = function () {
  return rm_dup_reset(`\x1b[43m${this}\x1b[0m`);
};

String.prototype.bg_blue = function () {
  return rm_dup_reset(`\x1b[44m${this}\x1b[0m`);
};

String.prototype.bg_magenta = function () {
  return rm_dup_reset(`\x1b[45m${this}\x1b[0m`);
};

String.prototype.bg_cyan = function () {
  return rm_dup_reset(`\x1b[46m${this}\x1b[0m`);
};

String.prototype.bg_white = function () {
  return rm_dup_reset(`\x1b[47m${this}\x1b[0m`);
};
