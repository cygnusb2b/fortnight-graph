module.exports = {
  remove_special_chars: {
    type: 'pattern_replace',
    pattern: '[^\\p{Z}\\p{L}\\p{N}\\p{Pd}\\p{Pc}]+',
    replacement: '',
    flags: 'UNICODE_CHARACTER_CLASS',
  },
  force_dashes: {
    type: 'pattern_replace',
    pattern: '[\\p{Pd}\\p{Pc}]+',
    replacement: '-',
    flags: 'UNICODE_CHARACTER_CLASS',
  },
};
