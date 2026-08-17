export const seedCards = [
  {
    title: "Two Sum",
    category: "Arrays & Hashmaps",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Java optimal solution uses a HashMap.",
    code: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {}; // Or throw exception
    }
}`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    status: "learning"
  },
  {
    title: "Reverse a Linked List",
    category: "Linked Lists",
    difficulty: "Easy",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list. (Iterative approach in Java)",
    code: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nextTemp = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nextTemp;
        }
        return prev;
    }
}`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    status: "learning"
  },
  {
    title: "Valid Parentheses",
    category: "Stacks & Queues",
    difficulty: "Easy",
    description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Uses Stack class in Java.",
    code: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return stack.isEmpty();
    }
}`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    status: "learning"
  },
  {
    title: "Binary Search",
    category: "Searching & Sorting",
    difficulty: "Easy",
    description: "Given a sorted array `nums` and a `target`, write a function to search `target` in `nums`. Iterative binary search in Java.",
    code: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1;
    }
}`,
    timeComplexity: "O(log N)",
    spaceComplexity: "O(1)",
    status: "learning"
  },
  {
    title: "Invert Binary Tree",
    category: "Trees & Graphs",
    difficulty: "Easy",
    description: "Given the root of a binary tree, invert the tree, and return its root. Recursive approach in Java.",
    code: `class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        
        TreeNode temp = root.left;
        root.left = root.right;
        root.right = temp;
        
        invertTree(root.left);
        invertTree(root.right);
        
        return root;
    }
}`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    status: "learning"
  },
  {
    title: "Climbing Stairs",
    category: "Dynamic Programming",
    difficulty: "Easy",
    description: "Calculate how many distinct ways to reach the top of n stairs if you can climb 1 or 2 steps. Space-optimized DP in Java.",
    code: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int first = 1;
        int second = 2;
        for (int i = 3; i <= n; i++) {
            int third = first + second;
            first = second;
            second = third;
        }
        return second;
    }
}`,
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    status: "learning"
  },
  {
    title: "Merge Intervals",
    category: "Searching & Sorting",
    difficulty: "Medium",
    description: "Merge overlapping intervals in a list and return them. Custom sorting comparator and ArrayList implementation in Java.",
    code: `import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals.length <= 1) return intervals;
        
        // Sort intervals by start time
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        
        List<int[]> merged = new ArrayList<>();
        int[] currentInterval = intervals[0];
        merged.add(currentInterval);
        
        for (int[] nextInterval : intervals) {
            int currentEnd = currentInterval[1];
            int nextStart = nextInterval[0];
            int nextEnd = nextInterval[1];
            
            if (currentEnd >= nextStart) {
                currentInterval[1] = Math.max(currentEnd, nextEnd);
            } else {
                currentInterval = nextInterval;
                merged.add(currentInterval);
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }
}`,
    timeComplexity: "O(N log N)",
    spaceComplexity: "O(N)",
    status: "learning"
  }
];
