const { objValueStr2AST } = require('../lib');
module.exports = function ({ types: t }) {
  let directive_for = 'r-for'
  function JSXElementVisitor(path) {
    path.traverse({ JSXElement: JSXElementVisitor })
    const element = path.node.openingElement
    const for_attr = getAndRemoveForAttr(element)
    if (!for_attr) { return }
    let [params, array] = parseForAttr(for_attr)
    if (params.length < 1 || !array) { return };
    params = params.map(p => t.identifier(p))
    array = t.callExpression(
      t.memberExpression(t.identifier('Array'), t.identifier('from')),
      typeof array === 'string' ?
        [objValueStr2AST(array, t)] :
        [array]
    );
    const newNode = t.jSXExpressionContainer(
      t.callExpression(
        t.memberExpression(array, t.identifier('map')),
        [t.callExpression(
          t.memberExpression(
            t.arrowFunctionExpression(params, t.blockStatement([t.returnStatement(path.node)])),
            t.identifier('bind')
          ),
          [t.thisExpression()]
        )]
      )
    );
    path.replaceWith(newNode);

    function getAndRemoveForAttr(openingElement) {
      if (openingElement.type !== 'JSXOpeningElement') { return; };
      const index = openingElement.attributes.findIndex(attr => (attr && attr.name && attr.name.name) === directive_for)
      if (index < 0) { return };
      let for_attr = openingElement.attributes[index].value
      openingElement.attributes = openingElement.attributes.filter(attr => attr.name && attr.name.name !== directive_for)
      if (for_attr.type === 'Literal') { return for_attr.value }
      else if (for_attr.type === 'JSXExpressionContainer' && for_attr.expression) {
        if (for_attr.expression.type === 'Literal') { return for_attr.expression.value }
        else if (for_attr.expression.type === 'BinaryExpression') {
          return for_attr.expression
        }
      }

    }
    function parseForAttr(for_attr) {
      let params = null
      let array = null
      if (typeof for_attr === 'string') {
        [params, array] = for_attr.split(' in ').map(v => v.trim())
        params.replace(/(\(|\))/g, '').split(',').map(v => v.trim())
      } else if (typeof for_attr === 'object') {
        let { left, operator, right } = for_attr
        if (operator !== 'in') throw new Error(`Operator ${operator} illegality, using "in" instead!`);
        if (left.type === 'Identifier') {
          params = [left.name]
        } else if (left.type === 'SequenceExpression') {
          params = left.expressions.map(i => i.name)
        }
        if (right.type == 'Identifier') {
          array = right.name
        } else {
          array = right
        }
      }
      return [params, array]
    }

  }
  return {
    visitor: {
      JSXElement: JSXElementVisitor
    }
  }
}