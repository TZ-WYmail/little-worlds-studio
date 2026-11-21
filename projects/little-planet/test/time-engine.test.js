import assert from 'node:assert/strict'
import test from 'node:test'
import { formatHour, TimeEngine } from '../src/core/TimeEngine.js'

test('a slider edit settles the hour and cancels a preset transition', () => {
  const clock = new TimeEngine(18.5)
  clock.travel(6)
  clock.update(0.4)
  clock.set(22)
  clock.update(1)
  assert.equal(clock.hour, 22)
  assert.equal(clock.transition, null)
})

test('the shortest preset transition crosses midnight without a jump', () => {
  const clock = new TimeEngine(23.5)
  clock.travel(0.5, 2)
  clock.update(1)
  assert.equal(clock.hour, 0)
  clock.update(1)
  assert.equal(clock.hour, 0.5)
  assert.equal(formatHour(23.9998), '00:00')
})

test('the environment stays visually continuous at midnight', () => {
  const clock = new TimeEngine(23.999)
  const before = clock.sample()
  const sky = before.top.clone()
  const light = before.direction.clone()
  const ambient = before.ambient
  clock.set(0.001)
  const after = clock.sample()
  assert.ok(Math.abs(sky.r - after.top.r) < 0.001)
  assert.ok(light.distanceTo(after.direction) < 0.002)
  assert.ok(Math.abs(ambient - after.ambient) < 0.001)
})
