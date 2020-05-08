'use strict'

/**
 * Our dependencies
 * @constant
 */
const it = require('tape')
const ByteArray = require('../../src/')

/**
 * Our enums
 * @constant
 */
const IExternalizable = require('../../enums/IExternalizable')
const Unit = require('./unit')

it('Can write/read AMF3 values representing their marker', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()

  ba.writeObject(null)
  ba.writeObject(undefined)
  ba.writeObject(true)
  ba.writeObject(false)

  ba.position = 0

  tape.equal(ba.readObject(), null)
  tape.equal(ba.readObject(), undefined)
  tape.ok(ba.readObject())
  tape.notOk(ba.readObject())

  tape.end()
})

it('Can write/read AMF3 numbers', (tape) => {
  tape.plan(6)

  const ba = new ByteArray()

  ba.writeObject(100)
  ba.writeObject(-5)
  ba.writeObject(563654)
  ba.writeObject(1.23)
  ba.writeObject(268435455)
  ba.writeObject(-268435456)

  ba.position = 0

  tape.equal(ba.readObject(), 100)
  tape.equal(ba.readObject(), -5)
  tape.equal(ba.readObject(), 563654)
  tape.equal(ba.readObject(), 1.23)
  tape.equal(ba.readObject(), 268435455)
  tape.equal(ba.readObject(), -268435456)

  tape.end()
})

it('Can write/read AMF3 strings', (tape) => {
  tape.plan(2)

  const ba = new ByteArray()

  ba.writeObject('Action Message Format.')
  ba.writeObject('This is a test.')

  ba.position = 0

  tape.equal(ba.readObject(), 'Action Message Format.')
  tape.equal(ba.readObject(), 'This is a test.')

  tape.end()
})

it('Can convert BigInt to string', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()

  ba.writeObject(BigInt(1))

  ba.position = 0

  tape.deepEqual(ba.readObject(), '1')

  tape.end()
})

it('Can write/read AMF3 dates', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const date = new Date(2001, 11, 25)

  ba.writeObject(date)

  ba.position = 0

  tape.deepEqual(ba.readObject(), date)

  tape.end()
})

it('Can write/read AMF3 arrays', (tape) => {
  tape.plan(2)

  const ba = new ByteArray()

  const arr1 = ['A', 'A', 'C']
  const arr2 = [1, 2, 3, true, 1.2]

  const ref1 = [arr1, arr1]
  const ref2 = [ref1, arr2, arr2]

  const assocArr1 = Object.assign([], [1, 2, 3])
  const assocArr2 = Object.assign([], { 'A': 'B' })

  const refAssocArr = Object.assign([], { 'Test': [arr1, arr2, ref1, ref2] })
  const bigAssocArr = Object.assign([], { 'Test1': assocArr1, 'Test2': assocArr2, 'Test3': [assocArr1, assocArr2, refAssocArr] })

  ba.writeObject(refAssocArr)
  ba.writeObject(bigAssocArr)

  ba.position = 0

  tape.deepEqual(ba.readObject(), refAssocArr)
  tape.deepEqual(ba.readObject(), bigAssocArr)

  tape.end()
})

it('Can write/read AMF3 objects', (tape) => {
  const ba = new ByteArray()

  ba.writeObject({ name: 'Daan' })

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 anonymous typed objects', (tape) => {
  class Person {
    constructor(name) {
      this.name = name
    }
  }

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 typed objects', (tape) => {
  class Person {
    constructor(name) {
      this.name = name
    }
  }

  ByteArray.registerClassAlias('src.person', Person)

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Can write/read AMF3 IExternalizable objects', (tape) => {
  class Person extends IExternalizable {
    constructor(name) {
      super()

      this.name = name
    }

    writeExternal(ba) {
      ba.writeUTF(this.name)
    }

    readExternal(ba) {
      this.name = ba.readUTF()
    }
  }

  ByteArray.registerClassAlias('src.person', Person)

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.writeObject(person)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { name: 'Daan' })

  tape.end()
})

it('Passes the AMF3 object stress test', (tape) => {
  const samples = Unit.create_random_objects(10, 15)
  tape.plan(samples.length)

  const ba = new ByteArray()

  for (const i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (const i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Can write/read AMF3 ByteArrays', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const data = new ByteArray()

  data.writeUTF('Hello.')

  ba.writeObject({ data })

  ba.position = 0

  tape.deepEqual(ba.readObject().data.readUTF(), 'Hello.')

  tape.end()
})

it('Can write/read AMF3 maps (dictionary)', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  const map = new Map()

  map.set('Name', 'Daan')
  map.set('Array', [1, 2, 3])
  map.set('Object', { id: 1 })

  ba.writeObject(map)

  ba.position = 0

  tape.deepEqual(ba.readObject(), map)

  tape.end()
})

it('Can write/read AMF3 typed arrays (vector)', (tape) => {
  tape.plan(9)

  const ba = new ByteArray()

  const normal_int_arr = new Int32Array([1, 2, 3])
  const fixed_int_arr = Object.preventExtensions(new Int32Array([4, 5, 6]))

  const normal_uint_arr = new Uint32Array([1, 2, 3])
  const fixed_uint_arr = Object.preventExtensions(new Uint32Array([4, 5, 6]))

  const normal_double_arr = new Float64Array([1.1, 2.2, 3.3])
  const fixed_double_arr = Object.preventExtensions(new Float64Array([4.4, 5.5, 6.6]))

  ba.writeObject(normal_int_arr)
  ba.writeObject(fixed_int_arr)

  ba.writeObject(normal_uint_arr)
  ba.writeObject(fixed_uint_arr)

  ba.writeObject(normal_double_arr)
  ba.writeObject(fixed_double_arr)

  ba.position = 0

  const read_normal_int_arr = ba.readObject()
  const read_fixed_int_arr = ba.readObject()

  const read_normal_uint_arr = ba.readObject()
  const read_fixed_uint_arr = ba.readObject()

  const read_normal_double_arr = ba.readObject()
  const read_fixed_double_arr = ba.readObject()

  tape.deepEqual(read_normal_int_arr, normal_int_arr)
  tape.deepEqual(read_fixed_int_arr, fixed_int_arr)
  tape.ok(Object.isExtensible(read_fixed_int_arr))

  tape.deepEqual(read_normal_uint_arr, normal_uint_arr)
  tape.deepEqual(read_fixed_uint_arr, fixed_uint_arr)
  tape.ok(Object.isExtensible(read_fixed_uint_arr))

  tape.deepEqual(read_normal_double_arr, normal_double_arr)
  tape.deepEqual(read_fixed_double_arr, fixed_double_arr)
  tape.ok(Object.isExtensible(read_fixed_double_arr))

  tape.end()
})

it('Can write/read AMF3 new constructed primitives', (tape) => {
  tape.plan(5)

  const arr = new Array([1, 2, 3])
  const obj = new Object({ id: 1 })
  const str = new String('Hello World.')
  const bool = new Boolean(true)
  const num = new Number(2)

  const ba = new ByteArray()

  ba.writeObject(arr)
  ba.writeObject(obj)
  ba.writeObject(str)
  ba.writeObject(bool)
  ba.writeObject(num)

  ba.position = 0

  tape.deepEqual(ba.readObject(), arr)
  tape.deepEqual(ba.readObject(), obj)
  tape.equal(ba.readObject(), str.toString())
  tape.ok(ba.readObject())
  tape.equal(ba.readObject(), 2)

  tape.end()
})
