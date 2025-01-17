var postcss = require('postcss')
var parseColor = require('./colors')
var mixColors = require('mix-colors')

var safeParseColor = function(decl, result) {
  try {
    return parseColor(decl.value)
  } catch (e) {
    result.warn('Invalid parse color: ' + e)
  }
  return []
}

module.exports = postcss.plugin('postcss-gradient-polyfill', function(options) {
  options = options || {}
  var fallback = options.fallback || 'mixed'

  return function(css, result) {
    css.walkRules(function(rule) {
      var defaultBackground = undefined
      var gradientDecl = undefined
      rule.walkDecls('background', function(decl) {
        if (decl.value.startsWith('-')) {
          // ignore -webkit-gradient
          gradientDecl = decl
          return
        }
        if (defaultBackground) {
          // avoid duplicate
          return
        }
        var colors = safeParseColor(decl, result)

        if (colors.length <= 1) {
          defaultBackground = decl.value
          return
        }
        var fallbackColor
        if (fallback === 'start') {
          fallbackColor = colors[0]
        } else if (fallback === 'end') {
          fallbackColor = colors[colors.length - 1]
        } else {
          var reduce = Array.prototype.reduce
          try {
            Array.prototype.reduce = function() {
              const args = Array.from(arguments)
              if (args.length === 1) {
                args.push(0)
              }
              return reduce.apply(this, args)
            }
            fallbackColor = mixColors(colors)
          } finally {
            Array.prototype.reduce = reduce
          }
        }
        ;(gradientDecl || decl).cloneBefore({
          prop: 'background',
          value: fallbackColor
        })
        defaultBackground = fallbackColor
      })
    })
  }
})
