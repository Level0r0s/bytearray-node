'use strict'

/**
 * Our dependencies
 * @constant
 */
const it = require('tape')
const ByteArray = require('../../src/')
const { randomBytes } = require('crypto')

/**
 * Our enums
 * @constant
 */
const ObjectEncoding = require('../../enums/ObjectEncoding')
const Unit = require('./unit')

it('Can write/read AMF0 values representing their marker', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

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

it('Can write/read AMF0 numbers', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  ba.writeObject(100)
  ba.writeObject(-5)
  ba.writeObject(563654)
  ba.writeObject(1.23)

  ba.position = 0

  tape.equal(ba.readObject(), 100)
  tape.equal(ba.readObject(), -5)
  tape.equal(ba.readObject(), 563654)
  tape.equal(ba.readObject(), 1.23)

  tape.end()
})

it('Can write/read AMF0 strings', (tape) => {
  tape.plan(2)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const longString = randomBytes(32768).toString('hex')

  ba.writeObject('Action Message Format.')
  ba.writeObject(longString)

  ba.position = 0

  tape.equal(ba.readObject(), 'Action Message Format.')
  tape.equal(ba.readObject(), longString)

  tape.end()
})

it('Can convert BigInt to string', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  ba.writeObject(BigInt(1))

  ba.position = 0

  tape.deepEqual(ba.readObject(), '1')

  tape.end()
})

it('Can write/read AMF0 objects', (tape) => {
  tape.plan(5)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const obj1 = { id: 1 }
  const obj2 = { id: 2 }

  const ref1 = { a: obj1, b: obj1 }
  const ref2 = { a: obj1, b: obj1, c: obj2, d: obj2 }

  const longKey = randomBytes(32768).toString('hex')
  const longString = randomBytes(32768).toString('hex')
  const longObj = { longKey: longString }

  ba.writeObject(obj1)
  ba.writeObject(obj2)
  ba.writeObject(ref1)
  ba.writeObject(ref2)
  ba.writeObject(longObj)

  ba.position = 0

  tape.deepEqual(ba.readObject(), obj1)
  tape.deepEqual(ba.readObject(), obj2)
  tape.deepEqual(ba.readObject(), ref1)
  tape.deepEqual(ba.readObject(), ref2)
  tape.deepEqual(ba.readObject(), longObj)

  tape.end()
})

it('Can write/read AMF0 arrays', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const obj1 = { id: 1 }
  const obj2 = { id: 2 }

  const ref1 = { a: obj1, b: obj1 }
  const ref2 = { a: obj1, b: obj1, c: obj2, d: obj2 }

  const denseArr1 = [1, 2, 3]

  const assocArr1 = Object.assign([], { 'Values': [1, 2, 3], 'Test': 'Daan' })
  const assocArr2 = Object.assign([], { 'A': 'B' })

  const refAssocArr = Object.assign([], { 'Test': [obj1, obj2, ref1, ref2] })
  const bigAssocArr = Object.assign([], { 'Test1': assocArr1, 'Test2': assocArr2, 'Test3': [assocArr1, assocArr2, refAssocArr] })

  ba.writeObject(denseArr1)
  ba.writeObject(assocArr1)
  ba.writeObject(refAssocArr)
  ba.writeObject(bigAssocArr)

  ba.position = 0

  tape.deepEqual(ba.readObject(), denseArr1)
  tape.deepEqual(ba.readObject(), assocArr1)
  tape.deepEqual(ba.readObject(), refAssocArr)
  tape.deepEqual(ba.readObject(), bigAssocArr)

  tape.end()
})

it('Can write/read AMF0 sets', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const set = new Set([1, 2, 3])

  ba.writeObject(set)

  ba.position = 0

  tape.deepEqual(ba.readObject(), set)

  tape.end()
})

it('Can write/read AMF0 dates', (tape) => {
  tape.plan(1)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const date = new Date(2001, 11, 25)

  ba.writeObject(date)

  ba.position = 0

  tape.deepEqual(ba.readObject(), date)

  tape.end()
})

it('Can write/read AMF0 typed objects', (tape) => {
  tape.plan(6)

  class Person {
    constructor(name, age, obj) {
      this.name = name
      this.age = age
      this.obj = obj
    }
  }

  const refObj = { id: 1 }

  ByteArray.registerClassAlias('com.person', Person)

  tape.equal(ByteArray.classMapping.get(Person), 'com.person')
  tape.equal(ByteArray.aliasMapping['com.person'], Person)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  const obj1 = new Person('Daan', 17, refObj)
  const obj2 = new Person('Gravix', 15, refObj)

  ba.writeObject(obj1)
  ba.writeObject(obj2)

  ba.position = 0

  const readObj1 = ba.readObject()
  const readObj2 = ba.readObject()

  tape.deepEqual(readObj1, obj1)
  tape.equal(readObj1.constructor.name, 'Person')
  tape.deepEqual(readObj2, obj2)
  tape.equal(readObj2.constructor.name, 'Person')

  tape.end()
})

it('Can write/read AMF0 anonymous typed objects', (tape) => {
  tape.plan(2)

  class Person {
    constructor(name) {
      this.name = name
    }
  }

  const ba = new ByteArray()
  const person = new Person('Daan')

  ba.objectEncoding = ObjectEncoding.AMF0
  ba.writeObject(person)
  ba.position = 0

  const obj = ba.readObject()

  tape.equal(obj.constructor, Object)
  tape.deepLooseEqual(obj, person)

  tape.end()
})

it('Passes the AMF0 object stress test', (tape) => {
  const samples = Unit.create_random_objects(10, 15)
  tape.plan(samples.length)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

  for (const i in samples) {
    ba.writeObject(samples[i])
  }

  ba.position = 0

  for (const i in samples) {
    tape.deepEqual(ba.readObject(), samples[i])
  }

  tape.end()
})

it('Supports the AVMPLUS marker', (tape) => {
  tape.plan(4)

  const ba = new ByteArray()
  const ba2 = new ByteArray()

  ba2.writeObject({ name: 'Daan' })

  ba.objectEncoding = ObjectEncoding.AMF0

  ba.writeObject({ id: 1 })
  ba.writeByte(0x11)
  ba.writeBytes(ba2)

  ba.position = 0

  tape.deepEqual(ba.readObject(), { id: 1 })
  tape.equal(ba.objectEncoding, ObjectEncoding.AMF0)
  tape.deepEqual(ba.readObject(), { name: 'Daan' })
  tape.equal(ba.objectEncoding, ObjectEncoding.AMF3)

  tape.end()
})

it('Can write/read AMF0 new constructed primitives', (tape) => {
  tape.plan(5)

  const arr = new Array([1, 2, 3])
  const obj = new Object({ id: 1 })
  const str = new String('Hello World.')
  const bool = new Boolean(true)
  const num = new Number(2)

  const ba = new ByteArray()
  ba.objectEncoding = ObjectEncoding.AMF0

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
