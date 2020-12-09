/**
 * Created Date: 2020/10/16
 * Author: fgh
 * Description: 根据sequelize模型自动生成gql定义
 */

const { DataTypes } = require('sequelize')
const { StringBuilder } = require('./util')

function upperCaseFirst (str) {
  return str[0].toUpperCase() + str.slice(1)
}

function makeEnumeName (name) {
  return `${upperCaseFirst(name)}Enum`
}

function makeEnumTypes (model) {
  const builder = new StringBuilder()
  for (const [k, v] of Object.entries(model.tableAttributes)) {
    if (v.type instanceof DataTypes.ENUM) {
      builder.write('enum ')
      builder.write(makeEnumeName(k))
      builder.write('{\n  ')
      builder.write(v.values.join('\n  '))
      builder.write('\n}\n\n')
    }
  }
  return builder.string()
}

function getFieldType (fieldDefine) {
  const { type } = fieldDefine
  if (type instanceof DataTypes.STRING || type instanceof DataTypes.TEXT) {
    return 'String'
  } if (type instanceof DataTypes.BIGINT || type instanceof DataTypes.DECIMAL) {
    return 'Float'
  } if (type instanceof DataTypes.BOOLEAN) {
    return 'Boolean'
  } if (type instanceof DataTypes.INTEGER || type instanceof DataTypes.TINYINT) {
    return 'Int'
  } if (type instanceof DataTypes.DATE) {
    return 'Date'
  } if (type instanceof DataTypes.ENUM) {
    return makeEnumeName(fieldDefine.fieldName)
  } else if (type instanceof DataTypes.VIRTUAL) {
    if (fieldDefine.comment && fieldDefine.comment.includes('|')) {
      return fieldDefine.comment.split('|')[0]
    }
    return '-未知-'
  }
  return '-未知-'
}

module.exports = function makeGql (model) {
  const builder = new StringBuilder(1024)
  builder.write(makeEnumTypes(model))
  builder.write('type ')
  builder.write(model.name)
  builder.write(' {\n')
  for (const [k, v] of Object.entries(model.rawAttributes)) {
    // if (k === 'id') {
    //   builder.write(`  id: ${model.name}Id\n`)
    //   continue
    // }
    if (v.comment) {
      builder.write(`  # ${v.comment}\n`)
    }
    builder.write(`  ${k}: `)
    builder.write(`${getFieldType(v)}\n`)
  }
  builder.write('}\n')
  return builder.string()
}
