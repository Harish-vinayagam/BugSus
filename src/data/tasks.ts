import type { Task } from '@/types/task';

/**
 * Static task catalogue used while the backend task API is not yet wired up.
 * Future: fetch these from GET /api/tasks and cache locally.
 */
export const TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'SUM TWO NUMBERS',
    description:
      'Write a function `add` that accepts two numbers and returns their sum.\n\nSignature: function add(a: number, b: number): number',
    starterCode: `function add(a: number, b: number): number {\n  // TODO: return the sum\n}`,
    solution: `function add(a: number, b: number): number {\n  return a + b;\n}`,
  },
  {
    id: 'task-002',
    title: 'REVERSE A STRING',
    description:
      'Write a function `reverseString` that accepts a string and returns it reversed.\n\nSignature: function reverseString(s: string): string',
    starterCode: `function reverseString(s: string): string {\n  // TODO: return reversed string\n}`,
    solution: `function reverseString(s: string): string {\n  return s.split('').reverse().join('');\n}`,
  },
  {
    id: 'task-003',
    title: 'IS PALINDROME',
    description:
      'Write a function `isPalindrome` that returns true if the given string reads the same forwards and backwards.\n\nSignature: function isPalindrome(s: string): boolean',
    starterCode: `function isPalindrome(s: string): boolean {\n  // TODO: check if palindrome\n}`,
    solution: `function isPalindrome(s: string): boolean {\n  return s === s.split('').reverse().join('');\n}`,
  },
  {
    id: 'task-004',
    title: 'FIND MAX IN ARRAY',
    description:
      'Write a function `findMax` that returns the largest number in a non-empty array.\n\nSignature: function findMax(nums: number[]): number',
    starterCode: `function findMax(nums: number[]): number {\n  // TODO: return the max value\n}`,
    solution: `function findMax(nums: number[]): number {\n  return Math.max(...nums);\n}`,
  },
  {
    id: 'task-005',
    title: 'COUNT VOWELS',
    description:
      'Write a function `countVowels` that counts how many vowels (a, e, i, o, u) are in a string (case-insensitive).\n\nSignature: function countVowels(s: string): number',
    starterCode: `function countVowels(s: string): number {\n  // TODO: count vowels\n}`,
    solution: `function countVowels(s: string): number {\n  return (s.match(/[aeiou]/gi) ?? []).length;\n}`,
  },
];
