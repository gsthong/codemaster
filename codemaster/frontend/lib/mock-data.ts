/**
 * mock-data.ts — Development/Storybook only mock data.
 * Import from here in tests; never import in production components directly.
 */
import { Problem, SkillData, SyllabusTopic, Hint, ProblemStat } from './types';

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    description:
      'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume each input has exactly one solution, and you cannot use the same element twice.\n\nYou can return the answer in any order.',
    difficulty: 'easy',
    acceptance: 47.2,
    tags: ['Array', 'Hash Table'],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'nums[0] + nums[1] == 9, so we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'nums[1] + nums[2] == 6, so we return [1, 2].',
      },
    ],
    constraints: '2 ≤ nums.length ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9',
    syllabusTopic: 'Arrays & Hashing',
  },
  {
    id: 'median-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    description:
      'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).',
    difficulty: 'hard',
    acceptance: 29.8,
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.',
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.',
      },
    ],
    constraints:
      'nums1.length == m\nnums2.length == n\n0 ≤ m ≤ 1000\n0 ≤ n ≤ 1000\nm + n ≥ 1',
    syllabusTopic: 'Binary Search',
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'medium',
    acceptance: 33.2,
    tags: ['Hash Table', 'String', 'Sliding Window'],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
    ],
    constraints: '0 ≤ s.length ≤ 5 * 10^4',
    syllabusTopic: 'Strings & Sliding Window',
  },
];

export const MOCK_SKILL_DATA: SkillData[] = [
  { topic: 'Arrays', proficiency: 82, problemsSolved: 24, averageTime: 1800 },
  { topic: 'Binary Search', proficiency: 65, problemsSolved: 12, averageTime: 2400 },
  { topic: 'Trees', proficiency: 58, problemsSolved: 18, averageTime: 3200 },
  { topic: 'Dynamic Programming', proficiency: 45, problemsSolved: 8, averageTime: 4500 },
  { topic: 'Graphs', proficiency: 72, problemsSolved: 14, averageTime: 2800 },
  { topic: 'Strings', proficiency: 88, problemsSolved: 22, averageTime: 1500 },
];

export const MOCK_SYLLABUS: SyllabusTopic[] = [
  {
    id: 'arrays-hashing',
    name: 'Arrays & Hashing',
    description: 'Master array manipulation and hash table techniques',
    subtopics: ['Two Pointers', 'Sliding Window', 'Hash Maps'],
    relatedProblems: ['two-sum', 'contains-duplicate'],
    progress: 75,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    description: 'Learn efficient searching algorithms',
    subtopics: ['Search in Rotated Array', 'Search Range'],
    relatedProblems: ['median-sorted-arrays', 'search-target'],
    progress: 60,
  },
  {
    id: 'strings-sliding',
    name: 'Strings & Sliding Window',
    description: 'Advanced string manipulation',
    subtopics: ['Pattern Matching', 'Window Techniques'],
    relatedProblems: ['longest-substring', 'min-window'],
    progress: 85,
  },
  {
    id: 'trees',
    name: 'Binary Trees',
    description: 'Tree traversal and manipulation',
    subtopics: ['DFS', 'BFS', 'Tree Construction'],
    relatedProblems: ['inorder-traversal', 'level-order'],
    progress: 50,
  },
  {
    id: 'graphs',
    name: 'Graphs',
    description: 'Graph algorithms and traversals',
    subtopics: ['DFS', 'BFS', 'Topological Sort'],
    relatedProblems: ['number-islands', 'clone-graph'],
    progress: 70,
  },
  {
    id: 'dp',
    name: 'Dynamic Programming',
    description: 'Master optimization through DP',
    subtopics: ['Memoization', 'Tabulation', 'Patterns'],
    relatedProblems: ['coin-change', 'house-robber'],
    progress: 40,
  },
];

export const MOCK_HINTS: Record<string, Hint[]> = {
  'two-sum': [
    {
      level: 1,
      content:
        'Think about what data structure could help you quickly look up if a number exists in the array.',
      category: 'conceptual',
      unlocked: true,
    },
    {
      level: 2,
      content:
        'As you iterate through the array, store each number in a hash map along with its index. For each number, check if (target - number) exists in the map.',
      category: 'algorithm',
      unlocked: false,
    },
    {
      level: 3,
      content:
        "Watch out for edge cases like duplicate numbers. Make sure you're not using the same element twice.",
      category: 'edge_case',
      unlocked: false,
    },
  ],
  'median-sorted-arrays': [
    {
      level: 1,
      content:
        'The key insight is that you can partition both arrays in a way that divides the combined elements into two equal halves.',
      category: 'conceptual',
      unlocked: true,
    },
    {
      level: 2,
      content:
        'Use binary search on the smaller array. At each step, calculate the partition point for both arrays such that elements on the left ≤ elements on the right.',
      category: 'algorithm',
      unlocked: false,
    },
    {
      level: 3,
      content:
        'Handle even/odd length combined arrays carefully. For even total length, median is average of middle two elements.',
      category: 'edge_case',
      unlocked: false,
    },
  ],
};

export const MOCK_TEST_CASES = [
  { id: '1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
  { id: '2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
  { id: '3', input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]' },
];

export const MOCK_PROBLEM_STATS: ProblemStat[] = [
  { difficulty: 'Easy', solved: 12, total: 20 },
  { difficulty: 'Medium', solved: 10, total: 18 },
  { difficulty: 'Hard', solved: 2, total: 10 },
];
