'use strict';
const assert = require('node:assert/strict');
const {makePlan,parseDate,ceilStudyMinutes} = require('../dist/app.js');
const base={start:'2026-10-05',deadline:'2026-11-02',units:240,pace:3,budget:60,review:3,buffer:2,weekdays:[1,2,3,4,5]};
let p=makePlan(base);
assert.equal(p.available,20);assert.equal(p.materialDays,15);assert.equal(p.max,16);assert.equal(p.minutes,48);
assert.equal(p.sessions.reduce((a,s)=>a+s.amount,0),240);assert.equal(p.sessions.at(-1).type,'review');assert.equal(p.sessions[15].type,'buffer');
p=makePlan({...base,units:10});assert.equal(p.sessions.filter(s=>s.type==='light').length,5);assert.equal(p.sessions.reduce((a,s)=>a+s.amount,0),10);
p=makePlan({...base,units:241});assert.equal(p.min,16);assert.equal(p.max,17);assert.equal(p.sessions.reduce((a,s)=>a+s.amount,0),241);
for(const patch of [{weekdays:[]},{units:-1},{units:1.5},{pace:NaN},{review:100},{deadline:base.start},{start:'2026-02-30'},{buffer:-1},{deadline:'2030-01-01'}]) assert.throws(()=>makePlan({...base,...patch}));
assert.ok(Number.isNaN(parseDate('2026-02-30')));
p=makePlan({...base,start:'2028-02-28',deadline:'2028-03-02',weekdays:[0,1,2,3,4,5,6],review:0,buffer:0,units:3});assert.equal(p.available,3);
// Exact-decimal ceiling regression: avoid a false over-budget warning.
p=makePlan({...base,start:'2026-10-07',deadline:'2026-10-08',weekdays:[0,1,2,3,4,5,6],review:0,buffer:0,units:25,pace:2.2,budget:55});
assert.equal(p.minutes,55);assert.equal(p.minutes<=p.budget,true);assert.equal(ceilStudyMinutes(p.sessions[0].amount,2.2),55);
// Real fractions, even tiny ones, must still round upward.
assert.equal(ceilStudyMinutes(25,2.200000000000001),56);
assert.equal(ceilStudyMinutes(1,1.0000000000000002),2);
assert.equal(ceilStudyMinutes(25,2.21),56);
assert.equal(ceilStudyMinutes(10,0.1),1);
assert.equal(ceilStudyMinutes(0,2.2),0);
assert.equal(ceilStudyMinutes(100000,1440),144000000);
console.log('PASS: calendar, workload, validation, decimal-safe ceiling, exact budget and true-fraction rounding regressions.');
