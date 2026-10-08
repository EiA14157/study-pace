'use strict';
const DAY = 86400000;
function parseDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN; const n=Date.parse(value+'T00:00:00Z'); return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:NaN; }
// Pace is validated in [0.1, 1440], so Number.toString uses ordinary decimal notation.
// Multiply its decimal representation exactly before rounding; binary floating-point
// multiplication can otherwise turn 25 * 2.2 into 55.00000000000001.
function ceilStudyMinutes(units, pace) {
 const [whole, fraction = ''] = String(pace).split('.');
 const scale = 10n ** BigInt(fraction.length);
 const product = BigInt(units) * BigInt(whole + fraction);
 return Number((product + scale - 1n) / scale);
}
function makePlan({start,deadline,units,pace,budget,review,buffer,weekdays}) {
 const first=parseDate(start), end=parseDate(deadline), days=(end-first)/DAY;
 if(!Number.isFinite(first)||!Number.isFinite(end)) throw Error('Choose valid start and exam dates.');
 if(days<1) throw Error('Your exam date must be after your start date.');
 if(days>732) throw Error('Choose dates no more than two years apart.');
 if(!Number.isInteger(units)||units<1||units>100000) throw Error('Enter 1 to 100,000 whole units of remaining work.');
 if(!Number.isFinite(pace)||pace<0.1||pace>1440) throw Error('Enter 0.1 to 1,440 minutes per unit.');
 if(!Number.isInteger(budget)||budget<1||budget>1440) throw Error('Enter a daily budget of 1 to 1,440 whole minutes.');
 if(![review,buffer].every(n=>Number.isInteger(n)&&n>=0&&n<=100)) throw Error('Review and catch-up days must each be whole numbers from 0 to 100.');
 if(!weekdays.length) throw Error('Choose at least one day of the week to study.');
 const available=[]; for(let d=first;d<end;d+=DAY) if(weekdays.includes(new Date(d).getUTCDay())) available.push(d);
 const materialDays=available.length-review-buffer;
 if(materialDays<1) throw Error('There are not enough study days. Reduce reserved days, choose more weekdays, or start earlier.');
 const base=Math.floor(units/materialDays), remainder=units%materialDays; let covered=0;
 const sessions=available.map((date,i)=>{let type=i<materialDays?'new':i<materialDays+buffer?'buffer':'review';let amount=type==='new'?base+(i<remainder?1:0):0;let from=covered+1;covered+=amount;if(type==='new'&&amount===0)type='light';return {date,type,amount,from,to:covered};});
 return {days,available:available.length,materialDays,sessions,max:Math.ceil(units/materialDays),min:base,minutes:ceilStudyMinutes(Math.ceil(units/materialDays),pace),totalHours:units*pace/60,review,buffer,budget,units};
}
if(typeof module!=='undefined') module.exports={makePlan,parseDate,ceilStudyMinutes};
if(typeof document!=='undefined') {
 const $=id=>document.getElementById(id), form=$('plan-form');
 const localToday=new Date();const today=Date.UTC(localToday.getFullYear(),localToday.getMonth(),localToday.getDate());
 const iso=n=>new Date(n).toISOString().slice(0,10);
 $('start').value=iso(today);$('deadline').value=iso(today+28*DAY);
 const dateLabel=(date,year=false)=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',...(year?{year:'numeric'}:{}),timeZone:'UTC'}).format(date);
 function render(){
  try{
   const values={start:$('start').value,deadline:$('deadline').value,units:Number($('units').value),pace:Number($('pace').value),budget:Number($('budget').value),review:Number($('review').value),buffer:Number($('buffer').value),weekdays:[...form.querySelectorAll('[name=weekday]:checked')].map(i=>Number(i.value))};
   for(const id of ['units','pace','budget','review','buffer']) if($(id).value.trim()==='')throw Error('Fill in all numeric fields before building your plan.');
   const p=makePlan(values),unit=$('unit').value;
   $('error').hidden=true;$('plan-notice').hidden=true;$('results').removeAttribute('aria-hidden');$('results').classList.remove('stale');$('schedule-section').hidden=false;$('print').disabled=false;
   $('countdown').textContent=p.days+' CALENDAR DAYS';
   $('daily').textContent=p.min===p.max?p.max:Math.max(0,p.min)+'–'+p.max;
   $('daily').classList.toggle('compact-number',String($('daily').textContent).length>7);
   $('daily-unit').textContent=unit+' / study day';
   const activeDays=p.sessions.filter(s=>s.type==='new').length,lightDays=p.materialDays-activeDays;
   $('pace-explanation').textContent=p.units.toLocaleString('en-US')+' '+unit+' across '+activeDays+' new-material days.'+(lightDays?' Plus '+lightDays+' light-review days.':'')+' '+p.available+' available study days in total.';
   $('daily-minutes').textContent=p.minutes.toLocaleString('en-US');$('total-hours').textContent=p.totalHours.toLocaleString('en-US',{maximumFractionDigits:1});
   const fits=p.minutes<=p.budget;
   $('status').className='status'+(fits?'':' warning');
   $('status').textContent=fits?'Fits your time budget. The busiest new-material day leaves about '+(p.budget-p.minutes)+' minutes of your '+p.budget+'-minute budget.':'Adjust the plan: the busiest new-material day needs about '+(p.minutes-p.budget)+' more minutes than your daily budget. Try more study days or a revised scope.';
   $('new-days').textContent=p.materialDays;$('buffer-days').textContent=p.buffer;$('review-days').textContent=p.review;
   $('bar').replaceChildren(...[['new',p.materialDays],['buffer',p.buffer],['review',p.review]].filter(x=>x[1]).map(([type,n])=>{let e=document.createElement('span');e.className=type;e.style.flex=n;return e}));
   const s=p.sessions[0];$('first-session').textContent=dateLabel(s.date)+': study '+s.amount+' '+unit+' ('+ceilStudyMinutes(s.amount,values.pace)+' estimated minutes), then check what you can recall.';
   $('schedule-range').textContent=dateLabel(parseDate(values.start),true)+' – '+dateLabel(parseDate(values.deadline),true);
   const weeks=new Map();p.sessions.forEach(s=>{const w=Math.floor((s.date-parseDate(values.start))/DAY/7);if(!weeks.has(w))weeks.set(w,[]);weeks.get(w).push(s)});
   $('schedule').replaceChildren(...[...weeks].map(([index,days])=>{
    const box=document.createElement('details');box.className='week';box.open=index===0;const sum=document.createElement('summary');sum.textContent='Week '+(index+1)+' · '+dateLabel(days[0].date);box.append(sum);
    days.forEach(s=>{const row=document.createElement('div');row.className='day';const date=document.createElement('span');date.textContent=new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(s.date);const task=document.createElement('b');task.textContent=s.type==='new'?s.amount+' '+unit:s.type==='buffer'?'Catch-up / breathing room':s.type==='light'?'Light review / free day':'Review & recall';row.append(date,task);box.append(row)});return box;
   }));
   return true;
  }catch(e){$('error').textContent=e.message;$('error').hidden=false;$('results').classList.add('stale');$('schedule-section').hidden=true;$('print').disabled=true;$('results').setAttribute('aria-hidden','true');$('plan-notice').textContent='No valid plan. Check the inputs and rebuild your plan.';$('plan-notice').hidden=false;return false;}
 }
 form.addEventListener('submit',e=>{e.preventDefault();render()});
 form.addEventListener('input',()=>{$('results').classList.add('stale');$('results').setAttribute('aria-hidden','true');$('schedule-section').hidden=true;$('print').disabled=true;$('plan-notice').textContent='Inputs changed. Build your plan to update the results.';$('plan-notice').hidden=false;});
 $('print').addEventListener('click',()=>{render();if(!$('error').hidden)return;window.print()});
 let openBefore=[];window.addEventListener('beforeprint',()=>{$('results').hidden=!render();openBefore=[...document.querySelectorAll('.week')].map(x=>x.open);document.querySelectorAll('.week').forEach(x=>x.open=true)});window.addEventListener('afterprint',()=>{$('results').hidden=false;document.querySelectorAll('.week').forEach((x,i)=>x.open=openBefore[i]);});
 render();
}
