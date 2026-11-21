import assert from 'node:assert/strict'
import test from 'node:test'
import { DailyRoutine } from '../src/core/DailyRoutine.js'
import { TimeEngine } from '../src/core/TimeEngine.js'

const enabled = { enabled:true, transitioning:false }

test('watering, walking and closing the cover run at their own hours', () => {
  for (const [hour, id] of [[6,'water'],[12,'patrol'],[22,'cover']]) {
    const routine = new DailyRoutine()
    const first = routine.update(.30,hour,enabled)
    assert.equal(first.routine,id)
    if (id === 'cover') {
      const lift = routine.update(3.0,hour,enabled)
      assert.ok(lift.delivery.lift > .9)
      assert.ok(lift.grip > .8)
      const placed = routine.update(3.1,hour,enabled)
      assert.equal(placed.delivery.advance,1)
      assert.ok(placed.delivery.lift < .1)
    }
    assert.equal(routine.update(20,hour,enabled),null)
    assert.equal(routine.update(1,hour,enabled),null)
  }
})

test('a quick scrub never starts intermediate routines and a manual story takes priority', () => {
  const routine = new DailyRoutine()
  for (const hour of [6,12,22]) {
    assert.equal(routine.update(1,hour,{...enabled,transitioning:true}),null)
  }
  assert.equal(routine.update(.30,22,enabled).routine,'cover')
  assert.equal(routine.update(.2,22,{...enabled,enabled:false}),null)
  assert.equal(routine.update(.30,22,enabled).routine,'cover')
  routine.reset()
  assert.equal(routine.update(.30,6,enabled).routine,'water')
})

test('the patrol traces the planet surface, and the night cover can repeat the next day', () => {
  const routine = new DailyRoutine()
  const start = routine.update(.32,12,enabled).direction.clone()
  const midway = routine.update(6,12,enabled).direction.clone()
  assert.ok(start.distanceTo(midway) > .3)
  assert.ok(Math.abs(midway.length()-1) < 0.001)
  const arriving = routine.update(13,12,enabled)
  assert.equal(arriving.pose,'Standing')
  assert.ok(arriving.direction.distanceTo(start)<.001)
  assert.equal(routine.update(2,12,enabled),null)
  assert.equal(routine.update(.34,22,enabled).routine,'cover')
  routine.update(9,22,enabled)
  assert.equal(routine.update(.34,2,enabled),null)
  assert.equal(routine.update(.34,22,enabled).routine,'cover')
})

test('a manual cover choice wins at night and leaves the morning routine available', () => {
  const routine = new DailyRoutine()
  assert.equal(routine.update(1,22,{...enabled,manualCover:true}),null)
  assert.equal(routine.update(.34,6,{...enabled,manualCover:true}).routine,'water')
})

test('three consecutive days finish all routines at every playback speed', () => {
  for (const speed of [.5,1,2,4]) {
    const clock = new TimeEngine(5.8)
    const routine = new DailyRoutine()
    const finished = []
    let previous = null
    let raisedCover = false
    let placedCover = false
    let displayedDay = 0
    clock.speed = speed
    clock.playing = true
    for (let frame=0; frame<16000 && finished.length<9; frame++) {
      const before = clock.hour
      clock.update(.05,routine.clockRateLimit(clock.hour))
      if (clock.hour<before) displayedDay++
      const next = routine.update(.05,clock.hour,enabled)
      if (next?.routine==='cover') {
        raisedCover ||= next.delivery.lift>.9 && next.grip>.8
        placedCover ||= raisedCover && next.delivery.advance===1 && next.delivery.lift<.1
      }
      if (previous && !next) {
        finished.push([displayedDay,previous.routine])
        if (previous.routine==='cover') {
          assert.ok(raisedCover && placedCover,`${speed}× lost part of the cover animation`)
          raisedCover=false
          placedCover=false
        }
      }
      previous=next
    }
    assert.deepEqual(finished,[
      [0,'water'],[0,'patrol'],[0,'cover'],
      [1,'water'],[1,'patrol'],[1,'cover'],
      [2,'water'],[2,'patrol'],[2,'cover'],
    ],`${speed}× missed or repeated a routine`)
  }
})
