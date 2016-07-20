import * as util from '../src'

const { getOwnPropertyDescriptor } = Object

describe('Skypager Util', function() {
  describe('Property Utils', function() {
    it('hides a plain property', function() {
      const obj = { visible: true }
      util.hideProperty(obj, 'invisible', () => true, false)

      const descriptor = getOwnPropertyDescriptor(obj, 'invisible')

      descriptor.should.have.property('value').that.is.a('function')
      descriptor.should.have.property('enumerable').that.equals(false)
      descriptor.should.have.property('configurable').that.equals(false)
    })

    it('hides a getter', function() {
      const obj = { visible: true }
      util.hideGetter(obj, 'invisible', () => true, false)

      const descriptor = getOwnPropertyDescriptor(obj, 'invisible')

      descriptor.should.have.property('get').that.is.a('function')
      descriptor.should.have.property('enumerable').that.equals(false)
      descriptor.should.have.property('configurable').that.equals(false)
    })
  })
})
