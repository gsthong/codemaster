/**
 * constants.ts — Production constants only.
 * Mock/dev data lives in lib/mock-data.ts.
 */

export const CODE_TEMPLATES: Record<string, string> = {
  python: `def twoSum(nums, target):
    """
    Find two numbers that add up to target.
    """
    # Write your solution here
    pass`,

  cpp: `#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}`,

  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,

  javascript: `var twoSum = function(nums, target) {
    // Write your solution here
    return [];
};`,
};

export const LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'cpp', label: 'C++', icon: '⚙️' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'javascript', label: 'JavaScript', icon: '📘' },
] as const;

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const ESTIMATED_TIME: Record<string, number> = {
  easy: 15,
  medium: 30,
  hard: 60,
};
