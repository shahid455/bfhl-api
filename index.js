app.get("/bfhl", (req, res) => {
  res.send("BFHL route is working");
});
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Helper Function
function isValidEdge(edge) {
  const trimmed = edge.trim();
  const regex = /^[A-Z]->[A-Z]$/;
  if (!regex.test(trimmed)) return false;

  const [parent, child] = trimmed.split("->");
  if (parent === child) return false;

  return true;
}

// Build adjacencyList
function buildadjacencyList(edges) {
  
  const adjacencyList = {};
  
  const childSet = new Set();

  edges.forEach((edge) => {
    const [parent, child] = edge.split("->");
    if (!adjacencyList[parent]) adjacencyList[parent] = [];
    adjacencyList[parent].push(child);

    childSet.add(child);
  });
  return { adjacencyList, childSet };
}

// Find roots
function findRoots(adjacencyList, childSet) {
  return Object.keys(adjacencyList).filter((node) => !childSet.has(node));
}

// DFS for tree building + cycle detection
function dfs(node, graph, visited, stack) {
  if (stack.has(node)) return { cycle: true };

  stack.add(node);
  visited.add(node);

  const children = graph[node] || []; // ✅ FIXED
  const subtree = {};

  let maxDepth = 1;

  for (let child of children) {
    const result = dfs(child, graph, visited, stack);

    if (result.cycle) return { cycle: true };

    subtree[child] = result.tree;
    maxDepth = Math.max(maxDepth, 1 + result.depth);
  }

  stack.delete(node);

  return { tree: subtree, depth: maxDepth };
}

//API 

app.post("/bfhl", (req, res) => {
  const input = req.body.data || [];

  const invalid = [];
  const duplicates = [];
  const seen = new Set();
  const validEdges = [];

  // Validate + duplicates
  input.forEach((edge) => {
    if (!isValidEdge(edge)) {
      invalid.push(edge);
    } else {
      const trimmed = edge.trim();
      if (seen.has(trimmed)) {
        if (!duplicates.includes(trimmed)) {
          duplicates.push(trimmed);
        }
      } else {
        seen.add(trimmed);
        validEdges.push(trimmed);
      }
    }
  });

  const { adjacencyList, childSet } = buildadjacencyList(validEdges);
  const roots = findRoots(adjacencyList, childSet);
  const visited = new Set();
  const hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  roots.forEach((root) => {
    const stack = new Set();
    const result = dfs(root, adjacencyList, visited, stack);

    if (result.cycle) {
      totalCycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      totalTrees++;

      if (result.depth > maxDepth) {
        maxDepth = result.depth;
        largestRoot = root;
      }

      hierarchies.push({
        root,
        tree: { [root]: result.tree },
        depth: result.depth
      });
    }
  });

  // Handle cycles without root
  if (roots.length === 0 && validEdges.length > 0) {
    totalCycles++;
    const nodes = Object.keys(adjacencyList).sort();
    const root = nodes[0];
    hierarchies.push({
      root,
      tree: {},
      has_cycle: true
    });
  }

  res.json({
    user_id: "shahid_03082004",   
    email_id: "sh6705@srmist.edu.in", 
    college_roll_number: "RA2311030010276",
    hierarchies,
    invalid_entries: invalid,
    duplicate_edges: duplicates,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestRoot
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});