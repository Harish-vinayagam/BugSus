import type { Task } from '@/types/task';

// ─────────────────────────────────────────────────────────────────────────────
// DSA  (12 tasks)
// ─────────────────────────────────────────────────────────────────────────────
const DSA_TASKS: Task[] = [
  {
    id: 'dsa-001', category: 'DSA',
    title: 'SUM TWO NUMBERS',
    description: 'Write a function `add(a, b)` that returns the sum of two numbers.',
    starterCode: `function add(a, b) {\n  // TODO\n}`,
    solution: `function add(a, b) { return a + b; }`,
    testCases: [
      { label: 'add(1,2) === 3',      call: 'add(1,2)',     expected: 3 },
      { label: 'add(-1,1) === 0',     call: 'add(-1,1)',    expected: 0 },
      { label: 'add(100,200) === 300', call: 'add(100,200)', expected: 300 },
    ],
  },
  {
    id: 'dsa-002', category: 'DSA',
    title: 'REVERSE A STRING',
    description: 'Write a function `reverseString(s)` that returns the string reversed.',
    starterCode: `function reverseString(s) {\n  // TODO\n}`,
    solution: `function reverseString(s) { return s.split('').reverse().join(''); }`,
    testCases: [
      { label: '"hello" → "olleh"', call: 'reverseString("hello")', expected: 'olleh' },
      { label: '"abc" → "cba"',     call: 'reverseString("abc")',   expected: 'cba' },
      { label: '"" → ""',           call: 'reverseString("")',      expected: '' },
    ],
  },
  {
    id: 'dsa-003', category: 'DSA',
    title: 'IS PALINDROME',
    description: 'Write a function `isPalindrome(s)` that returns `true` if `s` reads the same forwards and backwards.',
    starterCode: `function isPalindrome(s) {\n  // TODO\n}`,
    solution: `function isPalindrome(s) { return s === s.split('').reverse().join(''); }`,
    testCases: [
      { label: '"racecar" → true',  call: 'isPalindrome("racecar")', expected: true },
      { label: '"hello" → false',   call: 'isPalindrome("hello")',   expected: false },
      { label: '"abba" → true',     call: 'isPalindrome("abba")',    expected: true },
    ],
  },
  {
    id: 'dsa-004', category: 'DSA',
    title: 'FIND MAX IN ARRAY',
    description: 'Write a function `findMax(nums)` that returns the largest number in a non-empty array.',
    starterCode: `function findMax(nums) {\n  // TODO\n}`,
    solution: `function findMax(nums) { return Math.max(...nums); }`,
    testCases: [
      { label: '[1,3,2] → 3',      call: 'findMax([1,3,2])',      expected: 3 },
      { label: '[-1,-3,-2] → -1', call: 'findMax([-1,-3,-2])',   expected: -1 },
      { label: '[5] → 5',          call: 'findMax([5])',           expected: 5 },
    ],
  },
  {
    id: 'dsa-005', category: 'DSA',
    title: 'COUNT VOWELS',
    description: 'Write a function `countVowels(s)` that counts vowels (a e i o u, case-insensitive).',
    starterCode: `function countVowels(s) {\n  // TODO\n}`,
    solution: `function countVowels(s) { return (s.match(/[aeiou]/gi) ?? []).length; }`,
    testCases: [
      { label: '"hello" → 2',    call: 'countVowels("hello")',    expected: 2 },
      { label: '"AEIOU" → 5',   call: 'countVowels("AEIOU")',    expected: 5 },
      { label: '"rhythm" → 0',  call: 'countVowels("rhythm")',   expected: 0 },
    ],
  },
  {
    id: 'dsa-006', category: 'DSA',
    title: 'FIBONACCI',
    description: 'Write a function `fib(n)` that returns the nth Fibonacci number (fib(0)=0, fib(1)=1).',
    starterCode: `function fib(n) {\n  // TODO\n}`,
    solution: `function fib(n) { if (n<=1) return n; let a=0,b=1; for(let i=2;i<=n;i++){[a,b]=[b,a+b];} return b; }`,
    testCases: [
      { label: 'fib(0)===0',  call: 'fib(0)',  expected: 0 },
      { label: 'fib(6)===8',  call: 'fib(6)',  expected: 8 },
      { label: 'fib(10)===55',call: 'fib(10)', expected: 55 },
    ],
  },
  {
    id: 'dsa-007', category: 'DSA',
    title: 'TWO SUM',
    description: 'Write a function `twoSum(nums, target)` that returns the two indices whose values add up to `target`.',
    starterCode: `function twoSum(nums, target) {\n  // TODO\n}`,
    solution: `function twoSum(nums,target){const m={};for(let i=0;i<nums.length;i++){const c=target-nums[i];if(m[c]!==undefined)return[m[c],i];m[nums[i]]=i;}}`,
    testCases: [
      { label: '[2,7,11,15],9→[0,1]', call: 'twoSum([2,7,11,15],9)', expected: [0,1] },
      { label: '[3,2,4],6→[1,2]',     call: 'twoSum([3,2,4],6)',     expected: [1,2] },
    ],
  },
  {
    id: 'dsa-008', category: 'DSA',
    title: 'FLATTEN ARRAY',
    description: 'Write a function `flatten(arr)` that flattens a nested array one level deep.',
    starterCode: `function flatten(arr) {\n  // TODO\n}`,
    solution: `function flatten(arr) { return [].concat(...arr); }`,
    testCases: [
      { label: '[[1,2],[3]]→[1,2,3]', call: 'flatten([[1,2],[3]])',   expected: [1,2,3] },
      { label: '[[1],[2],[3]]→[1,2,3]',call: 'flatten([[1],[2],[3]])', expected: [1,2,3] },
    ],
  },
  {
    id: 'dsa-009', category: 'DSA',
    title: 'BINARY SEARCH',
    description: 'Write a function `binarySearch(arr, target)` that returns the index of `target` in a sorted array, or -1 if not found.',
    starterCode: `function binarySearch(arr, target) {\n  // TODO\n}`,
    solution: `function binarySearch(arr,target){let lo=0,hi=arr.length-1;while(lo<=hi){const mid=(lo+hi)>>1;if(arr[mid]===target)return mid;else if(arr[mid]<target)lo=mid+1;else hi=mid-1;}return -1;}`,
    testCases: [
      { label: '[1,3,5,7,9],5→2',  call: 'binarySearch([1,3,5,7,9],5)',  expected: 2 },
      { label: '[1,3,5,7,9],4→-1', call: 'binarySearch([1,3,5,7,9],4)', expected: -1 },
    ],
  },
  {
    id: 'dsa-010', category: 'DSA',
    title: 'REMOVE DUPLICATES',
    description: 'Write a function `removeDuplicates(arr)` that returns the array with duplicates removed, preserving order.',
    starterCode: `function removeDuplicates(arr) {\n  // TODO\n}`,
    solution: `function removeDuplicates(arr) { return [...new Set(arr)]; }`,
    testCases: [
      { label: '[1,2,2,3]→[1,2,3]', call: 'removeDuplicates([1,2,2,3])', expected: [1,2,3] },
      { label: '[1,1,1]→[1]',        call: 'removeDuplicates([1,1,1])',   expected: [1] },
    ],
  },
  {
    id: 'dsa-011', category: 'DSA',
    title: 'CHUNK ARRAY',
    description: 'Write a function `chunk(arr, size)` that splits an array into chunks of the given size.',
    starterCode: `function chunk(arr, size) {\n  // TODO\n}`,
    solution: `function chunk(arr,size){const res=[];for(let i=0;i<arr.length;i+=size)res.push(arr.slice(i,i+size));return res;}`,
    testCases: [
      { label: '[1..4],2→[[1,2],[3,4]]',    call: 'chunk([1,2,3,4],2)',   expected: [[1,2],[3,4]] },
      { label: '[1..5],2→[[1,2],[3,4],[5]]', call: 'chunk([1,2,3,4,5],2)', expected: [[1,2],[3,4],[5]] },
    ],
  },
  {
    id: 'dsa-012', category: 'DSA',
    title: 'ARRAY INTERSECTION',
    description: 'Write a function `intersection(a, b)` that returns elements present in both arrays (no duplicates).',
    starterCode: `function intersection(a, b) {\n  // TODO\n}`,
    solution: `function intersection(a,b){const s=new Set(b);return[...new Set(a.filter(x=>s.has(x)))];}`,
    testCases: [
      { label: '[1,2,3],[2,3,4]→[2,3]', call: 'intersection([1,2,3],[2,3,4])', expected: [2,3] },
      { label: '[1,2],[3,4]→[]',         call: 'intersection([1,2],[3,4])',      expected: [] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FRONTEND  (12 tasks)
// ─────────────────────────────────────────────────────────────────────────────
const FRONTEND_TASKS: Task[] = [
  {
    id: 'fe-001', category: 'FRONTEND',
    title: 'CLAMP NUMBER',
    description: 'Write a function `clamp(value, min, max)` that returns `value` clamped between `min` and `max`.',
    starterCode: `function clamp(value, min, max) {\n  // TODO\n}`,
    solution: `function clamp(value,min,max){return Math.min(Math.max(value,min),max);}`,
    testCases: [
      { label: 'clamp(5,0,10)→5',   call: 'clamp(5,0,10)',  expected: 5 },
      { label: 'clamp(-1,0,10)→0',  call: 'clamp(-1,0,10)', expected: 0 },
      { label: 'clamp(15,0,10)→10', call: 'clamp(15,0,10)', expected: 10 },
    ],
  },
  {
    id: 'fe-002', category: 'FRONTEND',
    title: 'KEBAB CASE',
    description: 'Write a function `toKebabCase(str)` that converts camelCase or space-separated strings to kebab-case.',
    starterCode: `function toKebabCase(str) {\n  // TODO\n}`,
    solution: `function toKebabCase(str){return str.replace(/([a-z])([A-Z])/g,'$1-$2').replace(/\\s+/g,'-').toLowerCase();}`,
    testCases: [
      { label: '"helloWorld"→"hello-world"',  call: 'toKebabCase("helloWorld")',  expected: 'hello-world' },
      { label: '"hello world"→"hello-world"', call: 'toKebabCase("hello world")', expected: 'hello-world' },
      { label: '"myVarName"→"my-var-name"',   call: 'toKebabCase("myVarName")',   expected: 'my-var-name' },
    ],
  },
  {
    id: 'fe-003', category: 'FRONTEND',
    title: 'TRUNCATE STRING',
    description: 'Write a function `truncate(str, maxLen)` that truncates `str` to `maxLen` chars, appending "..." if truncated.',
    starterCode: `function truncate(str, maxLen) {\n  // TODO\n}`,
    solution: `function truncate(str,maxLen){return str.length>maxLen?str.slice(0,maxLen)+'...':str;}`,
    testCases: [
      { label: '"hello world",5→"hello..."', call: 'truncate("hello world",5)', expected: 'hello...' },
      { label: '"hi",10→"hi"',              call: 'truncate("hi",10)',          expected: 'hi' },
    ],
  },
  {
    id: 'fe-004', category: 'FRONTEND',
    title: 'PARSE QUERY STRING',
    description: 'Write a function `parseQuery(qs)` that parses a query string (without "?") into an object.',
    starterCode: `function parseQuery(qs) {\n  // TODO\n}`,
    solution: `function parseQuery(qs){return Object.fromEntries(qs.split('&').map(p=>p.split('=').map(decodeURIComponent)));}`,
    testCases: [
      { label: '"a=1&b=2"→{a:"1",b:"2"}', call: 'parseQuery("a=1&b=2")', expected: {a:'1',b:'2'} },
      { label: '"x=hello"→{x:"hello"}',   call: 'parseQuery("x=hello")', expected: {x:'hello'} },
    ],
  },
  {
    id: 'fe-005', category: 'FRONTEND',
    title: 'DEEP CLONE',
    description: 'Write a function `deepClone(obj)` that returns a deep clone of a plain JSON-serialisable object.',
    starterCode: `function deepClone(obj) {\n  // TODO\n}`,
    solution: `function deepClone(obj){return JSON.parse(JSON.stringify(obj));}`,
    testCases: [
      { label: 'nested value copied',  call: '(function(){const o={a:{b:1}};return deepClone(o).a.b;})()', expected: 1 },
      { label: 'not same reference',   call: '(function(){const o={a:1};return deepClone(o)!==o;})()',      expected: true },
    ],
  },
  {
    id: 'fe-006', category: 'FRONTEND',
    title: 'CAPITALIZE WORDS',
    description: 'Write a function `capitalizeWords(str)` that capitalizes the first letter of every word.',
    starterCode: `function capitalizeWords(str) {\n  // TODO\n}`,
    solution: `function capitalizeWords(str){return str.replace(/\\b\\w/g,c=>c.toUpperCase());}`,
    testCases: [
      { label: '"hello world"→"Hello World"', call: 'capitalizeWords("hello world")', expected: 'Hello World' },
      { label: '"foo bar"→"Foo Bar"',          call: 'capitalizeWords("foo bar")',     expected: 'Foo Bar' },
    ],
  },
  {
    id: 'fe-007', category: 'FRONTEND',
    title: 'IS EMPTY OBJECT',
    description: 'Write a function `isEmpty(obj)` that returns `true` if a plain object has no own enumerable keys.',
    starterCode: `function isEmpty(obj) {\n  // TODO\n}`,
    solution: `function isEmpty(obj){return Object.keys(obj).length===0;}`,
    testCases: [
      { label: '{}→true',    call: 'isEmpty({})',    expected: true },
      { label: '{a:1}→false',call: 'isEmpty({a:1})', expected: false },
    ],
  },
  {
    id: 'fe-008', category: 'FRONTEND',
    title: 'MEMOIZE',
    description: 'Write a function `memoize(fn)` that returns a memoized version of `fn` (cache by first argument).',
    starterCode: `function memoize(fn) {\n  // TODO\n}`,
    solution: `function memoize(fn){const c={};return function(arg){if(!(arg in c))c[arg]=fn(arg);return c[arg];};}`,
    testCases: [
      { label: 'returns correct value',  call: '(function(){const m=memoize(x=>x*2);return m(5);})()', expected: 10 },
      { label: 'caches: fn called once', call: '(function(){let n=0;const m=memoize(x=>{n++;return x;});m(3);m(3);return n;})()', expected: 1 },
    ],
  },
  {
    id: 'fe-009', category: 'FRONTEND',
    title: 'FORMAT CURRENCY',
    description: 'Write a function `formatUSD(amount)` that formats a number as a USD string with 2 decimal places (e.g. 1200.5 → "$1200.50").',
    starterCode: `function formatUSD(amount) {\n  // TODO\n}`,
    solution: `function formatUSD(amount){return '$'+amount.toFixed(2);}`,
    testCases: [
      { label: '1200.5→"$1200.50"', call: 'formatUSD(1200.5)', expected: '$1200.50' },
      { label: '0→"$0.00"',         call: 'formatUSD(0)',       expected: '$0.00' },
    ],
  },
  {
    id: 'fe-010', category: 'FRONTEND',
    title: 'GROUP BY',
    description: 'Write a function `groupBy(arr, key)` that groups an array of objects by the given key.',
    starterCode: `function groupBy(arr, key) {\n  // TODO\n}`,
    solution: `function groupBy(arr,key){return arr.reduce((acc,item)=>{(acc[item[key]]=acc[item[key]]||[]).push(item);return acc;},{});}`,
    testCases: [
      { label: 'groups correctly', call: `(function(){const r=groupBy([{t:'a'},{t:'b'},{t:'a'}],'t');return r.a.length===2&&r.b.length===1;})()`, expected: true },
    ],
  },
  {
    id: 'fe-011', category: 'FRONTEND',
    title: 'DEBOUNCE',
    description: 'Write a function `debounce(fn, delay)` that returns a debounced wrapper. The wrapper should return the setTimeout id when called.',
    starterCode: `function debounce(fn, delay) {\n  // TODO: return a debounced function\n}`,
    solution: `function debounce(fn,delay){let t;return function(...args){clearTimeout(t);t=setTimeout(()=>fn(...args),delay);return t;};}`,
    testCases: [
      { label: 'debounce returns a function',     call: 'typeof debounce(()=>{},100)',                                   expected: 'function' },
      { label: 'calling wrapper returns truthy id',call: '(function(){const d=debounce(()=>{},100);return d()>0;})()', expected: true },
    ],
  },
  {
    id: 'fe-012', category: 'FRONTEND',
    title: 'THROTTLE',
    description: 'Write a function `throttle(fn, limit)` that ensures `fn` is called at most once per `limit` ms.',
    starterCode: `function throttle(fn, limit) {\n  // TODO: return throttled function\n}`,
    solution: `function throttle(fn,limit){let last=0;return function(...args){const now=Date.now();if(now-last>=limit){last=now;return fn(...args);};};}`,
    testCases: [
      { label: 'throttle returns a function',   call: 'typeof throttle(()=>{},100)',                                              expected: 'function' },
      { label: 'first call passes through',     call: '(function(){let c=0;const t=throttle(()=>++c,1000);t();return c;})()', expected: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND  (12 tasks)
// ─────────────────────────────────────────────────────────────────────────────
const BACKEND_TASKS: Task[] = [
  {
    id: 'be-001', category: 'BACKEND',
    title: 'COMPOSE FUNCTIONS',
    description: 'Write a function `compose(...fns)` that composes functions right-to-left: compose(f,g)(x) === f(g(x)).',
    starterCode: `function compose(...fns) {\n  // TODO\n}`,
    solution: `function compose(...fns){return(x)=>fns.reduceRight((v,f)=>f(v),x);}`,
    testCases: [
      { label: 'compose(x=>x+1,x=>x*2)(3)===7', call: 'compose(x=>x+1,x=>x*2)(3)', expected: 7 },
      { label: 'compose(x=>x*2)(5)===10',         call: 'compose(x=>x*2)(5)',         expected: 10 },
    ],
  },
  {
    id: 'be-002', category: 'BACKEND',
    title: 'PIPE FUNCTIONS',
    description: 'Write a function `pipe(...fns)` that applies functions left-to-right: pipe(f,g)(x) === g(f(x)).',
    starterCode: `function pipe(...fns) {\n  // TODO\n}`,
    solution: `function pipe(...fns){return(x)=>fns.reduce((v,f)=>f(v),x);}`,
    testCases: [
      { label: 'pipe(x=>x*2,x=>x+1)(3)===7', call: 'pipe(x=>x*2,x=>x+1)(3)', expected: 7 },
      { label: 'pipe(x=>x+1)(5)===6',          call: 'pipe(x=>x+1)(5)',         expected: 6 },
    ],
  },
  {
    id: 'be-003', category: 'BACKEND',
    title: 'EVENT EMITTER',
    description: 'Write a class `EventEmitter` with `on(event, fn)` and `emit(event, ...args)`. `emit` calls all registered listeners.',
    starterCode: `class EventEmitter {\n  // TODO\n}`,
    solution: `class EventEmitter{constructor(){this._e={};}on(e,fn){(this._e[e]=this._e[e]||[]).push(fn);}emit(e,...a){(this._e[e]||[]).forEach(fn=>fn(...a));}}`,
    testCases: [
      { label: 'listener is called',        call: '(function(){let v=0;const ee=new EventEmitter();ee.on("x",n=>v=n);ee.emit("x",5);return v;})()', expected: 5 },
      { label: 'multiple listeners called', call: '(function(){let s=0;const ee=new EventEmitter();ee.on("x",()=>s+=1);ee.on("x",()=>s+=2);ee.emit("x");return s;})()', expected: 3 },
    ],
  },
  {
    id: 'be-004', category: 'BACKEND',
    title: 'DEEP MERGE',
    description: 'Write a function `deepMerge(target, source)` that merges `source` into `target` recursively without mutating originals.',
    starterCode: `function deepMerge(target, source) {\n  // TODO\n}`,
    solution: `function deepMerge(target,source){const out=Object.assign({},target);for(const k of Object.keys(source)){if(source[k]&&typeof source[k]==='object'&&!Array.isArray(source[k])){out[k]=deepMerge(target[k]||{},source[k]);}else{out[k]=source[k];}}return out;}`,
    testCases: [
      { label: 'shallow merge adds key',  call: 'deepMerge({a:1},{b:2}).b', expected: 2 },
      { label: 'deep merge preserves',    call: 'deepMerge({a:{x:1}},{a:{y:2}}).a.x', expected: 1 },
      { label: 'source overwrites',       call: 'deepMerge({a:1},{a:2}).a', expected: 2 },
    ],
  },
  {
    id: 'be-005', category: 'BACKEND',
    title: 'CURRY FUNCTION',
    description: 'Write a function `curry(fn)` that curries a binary function so it can be called as `f(a)(b)` or `f(a, b)`.',
    starterCode: `function curry(fn) {\n  // TODO\n}`,
    solution: `function curry(fn){return function(a,b){if(b!==undefined)return fn(a,b);return(b)=>fn(a,b);};}`,
    testCases: [
      { label: 'curry(add)(1)(2)===3', call: '(function(){const add=(a,b)=>a+b;return curry(add)(1)(2);})()', expected: 3 },
      { label: 'curry(add)(1,2)===3',  call: '(function(){const add=(a,b)=>a+b;return curry(add)(1,2);})()',  expected: 3 },
    ],
  },
  {
    id: 'be-006', category: 'BACKEND',
    title: 'LRU CACHE',
    description: 'Write a class `LRUCache(capacity)` with `get(key)` (returns value or -1) and `put(key, value)` methods.',
    starterCode: `class LRUCache {\n  constructor(capacity) {\n    // TODO\n  }\n  get(key) {}\n  put(key, value) {}\n}`,
    solution: `class LRUCache{constructor(c){this.cap=c;this.map=new Map();}get(k){if(!this.map.has(k))return -1;const v=this.map.get(k);this.map.delete(k);this.map.set(k,v);return v;}put(k,v){if(this.map.has(k))this.map.delete(k);else if(this.map.size>=this.cap)this.map.delete(this.map.keys().next().value);this.map.set(k,v);}}`,
    testCases: [
      { label: 'get missing key→-1',     call: 'new LRUCache(2).get(1)',                                                                                         expected: -1 },
      { label: 'put then get→value',     call: '(function(){const c=new LRUCache(2);c.put(1,10);return c.get(1);})()',                                           expected: 10 },
      { label: 'evicts LRU',             call: '(function(){const c=new LRUCache(2);c.put(1,1);c.put(2,2);c.put(3,3);return c.get(1);})()',                     expected: -1 },
    ],
  },
  {
    id: 'be-007', category: 'BACKEND',
    title: 'VALIDATE EMAIL',
    description: 'Write a function `isValidEmail(email)` that returns `true` for a valid email address.',
    starterCode: `function isValidEmail(email) {\n  // TODO\n}`,
    solution: `function isValidEmail(email){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);}`,
    testCases: [
      { label: '"a@b.com"→true',     call: 'isValidEmail("a@b.com")',    expected: true },
      { label: '"bad@"→false',       call: 'isValidEmail("bad@")',       expected: false },
      { label: '"no-at-sign"→false', call: 'isValidEmail("no-at-sign")', expected: false },
    ],
  },
  {
    id: 'be-008', category: 'BACKEND',
    title: 'FLATTEN OBJECT',
    description: 'Write a function `flattenObj(obj, prefix="")` that flattens a nested object with dot-notation keys.',
    starterCode: `function flattenObj(obj, prefix = '') {\n  // TODO\n}`,
    solution: `function flattenObj(obj,prefix=''){return Object.keys(obj).reduce((acc,k)=>{const full=prefix?prefix+'.'+k:k;if(typeof obj[k]==='object'&&obj[k]!==null&&!Array.isArray(obj[k]))Object.assign(acc,flattenObj(obj[k],full));else acc[full]=obj[k];return acc;},{});}`,
    testCases: [
      { label: '{a:{b:1}}→"a.b":1', call: 'flattenObj({a:{b:1}})["a.b"]', expected: 1 },
      { label: '{a:1}→{a:1}',       call: 'flattenObj({a:1}).a',           expected: 1 },
    ],
  },
  {
    id: 'be-009', category: 'BACKEND',
    title: 'PARSE CSV ROW',
    description: 'Write a function `parseCSVRow(row)` that splits a simple CSV row (no quotes) into an array of trimmed strings.',
    starterCode: `function parseCSVRow(row) {\n  // TODO\n}`,
    solution: `function parseCSVRow(row){return row.split(',').map(s=>s.trim());}`,
    testCases: [
      { label: '"a,b,c"→["a","b","c"]',   call: 'parseCSVRow("a,b,c")',     expected: ['a','b','c'] },
      { label: '"1, 2, 3"→["1","2","3"]', call: 'parseCSVRow("1, 2, 3")',   expected: ['1','2','3'] },
    ],
  },
  {
    id: 'be-010', category: 'BACKEND',
    title: 'RATE LIMITER',
    description: 'Write a function `createRateLimiter(max)` that returns an object with `check()` which returns `true` up to `max` times, then `false`.',
    starterCode: `function createRateLimiter(max) {\n  // TODO: return { check() {} }\n}`,
    solution: `function createRateLimiter(max){let count=0;return{check(){return ++count<=max;}};}`,
    testCases: [
      { label: 'first call within limit', call: 'createRateLimiter(2).check()', expected: true },
      { label: 'exceeds limit',           call: '(function(){const r=createRateLimiter(1);r.check();return r.check();})()', expected: false },
    ],
  },
  {
    id: 'be-011', category: 'BACKEND',
    title: 'RETRY FUNCTION',
    description: 'Write a function `retry(fn, times)` that calls synchronous `fn()` up to `times` attempts and returns the first truthy result, or throws.',
    starterCode: `function retry(fn, times) {\n  // TODO\n}`,
    solution: `function retry(fn,times){let last;for(let i=0;i<times;i++){try{const r=fn();if(r)return r;}catch(e){last=e;}}throw last||new Error('failed');}`,
    testCases: [
      { label: 'succeeds on first try',  call: 'retry(()=>42,3)', expected: 42 },
      { label: 'succeeds on second try', call: '(function(){let c=0;return retry(()=>++c>=2?99:0,3);})()', expected: 99 },
    ],
  },
  {
    id: 'be-012', category: 'BACKEND',
    title: 'OBJECT PICK',
    description: 'Write a function `pick(obj, keys)` that returns a new object with only the specified keys.',
    starterCode: `function pick(obj, keys) {\n  // TODO\n}`,
    solution: `function pick(obj,keys){return keys.reduce((acc,k)=>{if(k in obj)acc[k]=obj[k];return acc;},{});}`,
    testCases: [
      { label: 'picks specified keys', call: '(function(){const r=pick({a:1,b:2,c:3},["a","c"]);return r.a===1&&r.c===3&&!("b" in r);})()', expected: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// OOPS  (12 tasks)
// ─────────────────────────────────────────────────────────────────────────────
const OOPS_TASKS: Task[] = [
  {
    id: 'oo-001', category: 'OOPS',
    title: 'BASIC CLASS',
    description: 'Create a class `Animal` with a constructor that takes `name`, and a method `speak()` that returns `"<name> makes a noise."`.',
    starterCode: `class Animal {\n  constructor(name) {\n    // TODO\n  }\n  speak() {\n    // TODO\n  }\n}`,
    solution: `class Animal{constructor(name){this.name=name;}speak(){return this.name+' makes a noise.';}}`,
    testCases: [
      { label: 'new Animal("Dog").speak()', call: 'new Animal("Dog").speak()', expected: 'Dog makes a noise.' },
    ],
  },
  {
    id: 'oo-002', category: 'OOPS',
    title: 'INHERITANCE',
    description: 'Create a class `Dog` that extends `Animal`. Override `speak()` to return `"<name> barks."`.',
    starterCode: `class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return this.name + ' makes a noise.'; }\n}\n\nclass Dog extends Animal {\n  // TODO: override speak()\n}`,
    solution: `class Animal{constructor(name){this.name=name;}speak(){return this.name+' makes a noise.';}}class Dog extends Animal{speak(){return this.name+' barks.';}}`,
    testCases: [
      { label: 'new Dog("Rex").speak()',      call: 'new Dog("Rex").speak()',          expected: 'Rex barks.' },
      { label: 'Dog instanceof Animal',       call: 'new Dog("Rex") instanceof Animal', expected: true },
    ],
  },
  {
    id: 'oo-003', category: 'OOPS',
    title: 'STACK CLASS',
    description: 'Implement a class `Stack` with `push(val)`, `pop()`, `peek()`, and a `size` getter.',
    starterCode: `class Stack {\n  // TODO\n}`,
    solution: `class Stack{constructor(){this._d=[];}push(v){this._d.push(v);}pop(){return this._d.pop();}peek(){return this._d[this._d.length-1];}get size(){return this._d.length;}}`,
    testCases: [
      { label: 'push then peek',    call: '(function(){const s=new Stack();s.push(1);return s.peek();})()', expected: 1 },
      { label: 'push then pop',     call: '(function(){const s=new Stack();s.push(5);return s.pop();})()',  expected: 5 },
      { label: 'size after 2 push', call: '(function(){const s=new Stack();s.push(1);s.push(2);return s.size;})()', expected: 2 },
    ],
  },
  {
    id: 'oo-004', category: 'OOPS',
    title: 'QUEUE CLASS',
    description: 'Implement a class `Queue` with `enqueue(val)`, `dequeue()`, and a `size` getter.',
    starterCode: `class Queue {\n  // TODO\n}`,
    solution: `class Queue{constructor(){this._d=[];}enqueue(v){this._d.push(v);}dequeue(){return this._d.shift();}get size(){return this._d.length;}}`,
    testCases: [
      { label: 'FIFO dequeue', call: '(function(){const q=new Queue();q.enqueue(1);q.enqueue(2);return q.dequeue();})()', expected: 1 },
      { label: 'size',         call: '(function(){const q=new Queue();q.enqueue(1);q.enqueue(2);return q.size;})()',      expected: 2 },
    ],
  },
  {
    id: 'oo-005', category: 'OOPS',
    title: 'SINGLETON PATTERN',
    description: "Implement a class `Singleton` whose static method `getInstance()` always returns the same instance.",
    starterCode: `class Singleton {\n  // TODO\n}`,
    solution: `class Singleton{static _i=null;static getInstance(){if(!Singleton._i)Singleton._i=new Singleton();return Singleton._i;}}`,
    testCases: [
      { label: 'same instance returned', call: 'Singleton.getInstance()===Singleton.getInstance()', expected: true },
    ],
  },
  {
    id: 'oo-006', category: 'OOPS',
    title: 'OBSERVER PATTERN',
    description: 'Implement a class `Subject` with `subscribe(fn)`, `unsubscribe(fn)`, and `notify(data)`.',
    starterCode: `class Subject {\n  // TODO\n}`,
    solution: `class Subject{constructor(){this._s=[];}subscribe(fn){this._s.push(fn);}unsubscribe(fn){this._s=this._s.filter(f=>f!==fn);}notify(d){this._s.forEach(fn=>fn(d));}}`,
    testCases: [
      { label: 'subscriber called',      call: '(function(){let v=0;const s=new Subject();s.subscribe(d=>v=d);s.notify(42);return v;})()', expected: 42 },
      { label: 'unsubscribed not called', call: '(function(){let v=0;const s=new Subject();const fn=d=>v=d;s.subscribe(fn);s.unsubscribe(fn);s.notify(99);return v;})()', expected: 0 },
    ],
  },
  {
    id: 'oo-007', category: 'OOPS',
    title: 'FACTORY FUNCTION',
    description: 'Write a factory `createUser(name, role)` that returns an object with `name`, `role`, and `greet()` returning `"Hello, I am <name>"`.',
    starterCode: `function createUser(name, role) {\n  // TODO\n}`,
    solution: `function createUser(name,role){return{name,role,greet(){return 'Hello, I am '+this.name;}};}`,
    testCases: [
      { label: 'greet returns string', call: 'createUser("Alice","admin").greet()', expected: 'Hello, I am Alice' },
      { label: 'role stored',          call: 'createUser("Bob","user").role',        expected: 'user' },
    ],
  },
  {
    id: 'oo-008', category: 'OOPS',
    title: 'GETTER / SETTER',
    description: 'Create a class `Circle` whose constructor takes `radius`. Add a getter `area` returning π*r² rounded to 2 dp.',
    starterCode: `class Circle {\n  constructor(radius) {\n    // TODO\n  }\n  get area() {\n    // TODO\n  }\n}`,
    solution: `class Circle{constructor(r){this.radius=r;}get area(){return Math.round(Math.PI*this.radius*this.radius*100)/100;}}`,
    testCases: [
      { label: 'Circle(1).area≈3.14',  call: 'new Circle(1).area', expected: 3.14 },
      { label: 'Circle(5).area≈78.54', call: 'new Circle(5).area', expected: 78.54 },
    ],
  },
  {
    id: 'oo-009', category: 'OOPS',
    title: 'MIXIN PATTERN',
    description: 'Write a function `withTimestamp(obj)` that adds a `createdAt` Date property to a plain object and returns it.',
    starterCode: `function withTimestamp(obj) {\n  // TODO\n}`,
    solution: `function withTimestamp(obj){return{...obj,createdAt:new Date()};}`,
    testCases: [
      { label: 'createdAt is a Date', call: 'withTimestamp({}).createdAt instanceof Date', expected: true },
      { label: 'original props kept', call: 'withTimestamp({x:1}).x',                      expected: 1 },
    ],
  },
  {
    id: 'oo-010', category: 'OOPS',
    title: 'PROTOTYPE METHOD',
    description: 'Add `String.prototype.myRepeat` (if not present) that repeats the string `n` times.',
    starterCode: `if (!String.prototype.myRepeat) {\n  // TODO: String.prototype.myRepeat = ...\n}`,
    solution: `if(!String.prototype.myRepeat){String.prototype.myRepeat=function(n){return Array(n+1).join(this);};}`,
    testCases: [
      { label: '"ab".myRepeat(3)==="ababab"', call: '"ab".myRepeat(3)', expected: 'ababab' },
      { label: '"x".myRepeat(0)===""',        call: '"x".myRepeat(0)',  expected: '' },
    ],
  },
  {
    id: 'oo-011', category: 'OOPS',
    title: 'LINKED LIST',
    description: 'Implement a `LinkedList` class with `append(val)` and `toArray()` methods.',
    starterCode: `class LinkedList {\n  // TODO\n}`,
    solution: `class LinkedList{constructor(){this.head=null;}append(v){const n={val:v,next:null};if(!this.head){this.head=n;}else{let c=this.head;while(c.next)c=c.next;c.next=n;}}toArray(){const a=[];let c=this.head;while(c){a.push(c.val);c=c.next;}return a;}}`,
    testCases: [
      { label: 'append 1,2,3→[1,2,3]', call: '(function(){const l=new LinkedList();l.append(1);l.append(2);l.append(3);return l.toArray();})()', expected: [1,2,3] },
    ],
  },
  {
    id: 'oo-012', category: 'OOPS',
    title: 'DECORATOR PATTERN',
    description: 'Write a function `readonly(obj, key)` that uses `Object.defineProperty` to make `obj[key]` non-writable. Return `obj`.',
    starterCode: `function readonly(obj, key) {\n  // TODO\n}`,
    solution: `function readonly(obj,key){Object.defineProperty(obj,key,{writable:false,configurable:false});return obj;}`,
    testCases: [
      { label: 'key unchanged after write', call: '(function(){"use strict";const o={x:1};readonly(o,"x");try{o.x=99;}catch(e){}return o.x;})()', expected: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  ...DSA_TASKS,
  ...FRONTEND_TASKS,
  ...BACKEND_TASKS,
  ...OOPS_TASKS,
];

/** Fisher-Yates shuffle — does NOT mutate the original array. */
export const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Returns 10–12 randomly selected & shuffled tasks for the given category. */
export const getTasksForCategory = (category: string): Task[] => {
  const pool = shuffle(TASKS.filter((t) => t.category === category));
  const count = Math.min(pool.length, 10 + Math.floor(Math.random() * 3)); // 10–12
  return pool.slice(0, count);
};
