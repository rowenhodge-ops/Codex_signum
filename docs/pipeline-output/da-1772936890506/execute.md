# EXECUTE (gemini-3-flash-preview:default)

Quality: 0.70 | Duration: 72909ms

# Solution: Graph-Native Representation Generator for Engineering Bridge v2.1

```typescript
/**
 * createBridgeGraphRepresentation.ts
 * 
 * Creates a graph-native representation of the M-17 Engineering Bridge v2.1 
 * pipeline output, including BLOOM, SEED nodes, and their relationships.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import {
  createBloomNode,
  createSeedNode,
  createContainsRelationship,
  createDependsOnRelationship,
  createInstantiatesRelationship,
  findBloomById
} from './graph/queries';

// ============================================================================
// Type Definitions
// ============================================================================

interface TaskMetadata {
  sequence: number;
  title: string;
  qualityScore: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  charCount: number;
  timestamp: string;
  dependencies?: string[];
}

interface ManifestData {
  runId: string;
  specVersion: string;
  status: string;
  totalChars: number;
  tasks: Record<string, TaskMetadata>;
}

interface BloomProperties {
  id: string;
  name: string;
  type: string;
  specVersion: string;
  status: string;
  sourceRunId: string;
  totalChars: number;
  taskCount: number;
}

interface SeedProperties {
  id: string;
  title: string;
  content: string;
  seedType: string;
  order: number;
  qualityScore: number;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  charCount: number;
  timestamp: string;
}

interface CreationResult {
  bloomId: string;
  seedCount: number;
  containsRelationships: number;
  dependsOnRelationships: number;
  instantiatesCreated: boolean;
}

// ============================================================================
// Main Orchestration Function
// ============================================================================

/**
 * Creates the complete graph representation for Engineering Bridge v2.1
 * 
 * @param manifestPath - Path to the manifest JSON file
 * @param markdownDir - Directory containing the task markdown files
 * @returns Summary of created nodes and relationships
 */
export async function createBridgeGraphRepresentation(
  manifestPath: string,
  markdownDir: string
): Promise<CreationResult> {
  console.log('Starting graph representation creation for Engineering Bridge v2.1');
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Markdown directory: ${markdownDir}`);

  // Step 1: Read and parse manifest
  const manifest = await readManifestFile(manifestPath);
  console.log(`✓ Loaded manifest with ${Object.keys(manifest.tasks).length} tasks`);

  // Step 2: Create BLOOM node
  const bloomId = await createBridgeBloomNode(manifest);
  console.log(`✓ Created BLOOM node: ${bloomId}`);

  // Step 3: Create SEED nodes and CONTAINS relationships
  const seedMapping = await createSeedNodesWithContent(
    manifest,
    markdownDir,
    bloomId
  );
  console.log(`✓ Created ${seedMapping.size} SEED nodes with CONTAINS relationships`);

  // Step 4: Create DEPENDS_ON relationships
  const dependencyCount = await createDependencyRelationships(
    manifest,
    seedMapping
  );
  console.log(`✓ Created ${dependencyCount} DEPENDS_ON relationships`);

  // Step 5: Create INSTANTIATES relationship
  const instantiatesCreated = await createInstantiatesRelationshipToGrammar(bloomId);
  if (instantiatesCreated) {
    console.log(`✓ Created INSTANTIATES relationship to grammar-reference`);
  } else {
    console.log(`⚠ INSTANTIATES relationship not created (grammar-reference not found)`);
  }

  const result: CreationResult = {
    bloomId,
    seedCount: seedMapping.size,
    containsRelationships: seedMapping.size,
    dependsOnRelationships: dependencyCount,
    instantiatesCreated
  };

  console.log('\n=== Graph Representation Creation Complete ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ============================================================================
// Step 1: Manifest Processing
// ============================================================================

/**
 * Reads and validates the manifest file
 */
async function readManifestFile(manifestPath: string): Promise<ManifestData> {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content) as ManifestData;

    // Validate required fields
    if (!manifest.runId) {
      throw new Error('Manifest missing required field: runId');
    }
    if (!manifest.tasks || typeof manifest.tasks !== 'object') {
      throw new Error('Manifest missing required field: tasks');
    }

    return manifest;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read manifest file: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// Step 2: BLOOM Node Creation
// ============================================================================

/**
 * Creates the BLOOM node representing Engineering Bridge v2.1 specification
 */
async function createBridgeBloomNode(manifest: ManifestData): Promise<string> {
  const bloomProperties: BloomProperties = {
    id: 'bridge-v2.1',
    name: 'Engineering Bridge v2.1',
    type: 'specification',
    specVersion: manifest.specVersion || 'v4.3',
    status: manifest.status || 'review',
    sourceRunId: manifest.runId,
    totalChars: manifest.totalChars,
    taskCount: Object.keys(manifest.tasks).length
  };

  await createBloomNode(bloomProperties);
  return bloomProperties.id;
}

// ============================================================================
// Step 3: SEED Node Creation with CONTAINS Relationships
// ============================================================================

/**
 * Creates all SEED nodes from markdown files and establishes CONTAINS relationships
 * 
 * @returns Map of taskId -> seedId for dependency relationship creation
 */
async function createSeedNodesWithContent(
  manifest: ManifestData,
  markdownDir: string,
  bloomId: string
): Promise<Map<string, string>> {
  const seedMapping = new Map<string, string>();

  // Sort tasks by sequence to ensure proper ordering
  const sortedTasks = Object.entries(manifest.tasks)
    .sort(([, a], [, b]) => a.sequence - b.sequence);

  for (const [taskId, metadata] of sortedTasks) {
    // Read markdown content
    const markdownPath = path.join(markdownDir, `${taskId}.md`);
    const content = await readMarkdownFile(markdownPath, taskId);

    // Create SEED node
    const seedId = `seed-bridge-v2.1-${taskId}`;
    const seedProperties: SeedProperties = {
      id: seedId,
      title: metadata.title,
      content: content,
      seedType: 'document-section',
      order: metadata.sequence,
      qualityScore: metadata.qualityScore,
      modelId: metadata.modelId,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
      charCount: metadata.charCount,
      timestamp: metadata.timestamp
    };

    await createSeedNode(seedProperties);
    seedMapping.set(taskId, seedId);

    // Create CONTAINS relationship
    await createContainsRelationship(bloomId, seedId, {
      order: metadata.sequence
    });

    console.log(
      `  Created SEED [${metadata.sequence}]: ${taskId} (${metadata.charCount} chars)`
    );
  }

  return seedMapping;
}

/**
 * Reads a markdown file with error handling
 */
async function readMarkdownFile(
  filePath: string,
  taskId: string
): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to read markdown file for task ${taskId}: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// Step 4: DEPENDS_ON Relationships
// ============================================================================

/**
 * Creates DEPENDS_ON relationships between SEED nodes based on task dependencies
 * 
 * @returns Count of created relationships
 */
async function createDependencyRelationships(
  manifest: ManifestData,
  seedMapping: Map<string, string>
): Promise<number> {
  let count = 0;

  for (const [taskId, metadata] of Object.entries(manifest.tasks)) {
    if (!metadata.dependencies || metadata.dependencies.length === 0) {
      continue;
    }

    const dependentSeedId = seedMapping.get(taskId);
    if (!dependentSeedId) {
      console.warn(`⚠ Skipping dependencies for ${taskId}: SEED not found`);
      continue;
    }

    for (const dependencyTaskId of metadata.dependencies) {
      const dependencySeedId = seedMapping.get(dependencyTaskId);
      
      if (!dependencySeedId) {
        console.warn(
          `⚠ Skipping dependency ${dependencyTaskId} -> ${taskId}: source SEED not found`
        );
        continue;
      }

      // Create relationship: dependent DEPENDS_ON dependency
      await createDependsOnRelationship(dependentSeedId, dependencySeedId);
      count++;

      console.log(
        `  Created DEPENDS_ON: ${taskId} depends on ${dependencyTaskId}`
      );
    }
  }

  return count;
}

// ============================================================================
// Step 5: INSTANTIATES Relationship
// ============================================================================

/**
 * Creates INSTANTIATES relationship to grammar-reference BLOOM if it exists
 * 
 * @returns true if relationship was created, false otherwise
 */
async function createInstantiatesRelationshipToGrammar(
  bloomId: string
): Promise<boolean> {
  const grammarBloomId = 'grammar-reference';

  try {
    // Check if grammar-reference BLOOM exists
    const grammarBloom = await findBloomById(grammarBloomId);

    if (!grammarBloom) {
      console.warn(
        `Grammar reference BLOOM (${grammarBloomId}) not found in graph`
      );
      return false;
    }

    // Create INSTANTIATES relationship
    await createInstantiatesRelationship(bloomId, grammarBloomId);
    return true;
  } catch (error) {
    console.error(
      `Error creating INSTANTIATES relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    // Non-critical failure - don't throw
    return false;
  }
}

// ============================================================================
// Execution Script
// ============================================================================

/**
 * CLI execution handler
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: ts-node createBridgeGraphRepresentation.ts <manifestPath> <markdownDir>');
    console.error('');
    console.error('Example:');
    console.error('  ts-node createBridgeGraphRepresentation.ts \\');
    console.error('    ./data/manifest-2026-03-06T01-06-52.json \\');
    console.error('    ./data/outputs');
    process.exit(1);
  }

  const [manifestPath, markdownDir] = args;

  try {
    await createBridgeGraphRepresentation(manifestPath, markdownDir);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create graph representation');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
```

## Usage Example

```typescript
// programmatic-usage.ts
import { createBridgeGraphRepresentation } from './createBridgeGraphRepresentation';

async function example() {
  const result = await createBridgeGraphRepresentation(
    './data/manifest-2026-03-06T01-06-52.json',
    './data/outputs'
  );

  console.log(`Created BLOOM: ${result.bloomId}`);
  console.log(`Created ${result.seedCount} SEED nodes`);
  console.log(`Created ${result.dependsOnRelationships} dependencies`);
}
```

## Command Line Usage

```bash
# Direct execution
ts-node src/createBridgeGraphRepresentation.ts \
  ./data/manifest-2026-03-06T01-06-52.json \
  ./data/outputs

# Or with npm script (add to package.json)
npm run create-bridge-graph -- \
  ./data/manifest-2026-03-06T01-06-52.json \
  ./data/outputs
```

## Key Implementation Features

1. **Sequential Processing**: Tasks are processed in sequence order to maintain proper graph structure
2. **Error Handling**: Comprehensive try-catch blocks with descriptive error messages
3. **Progress Logging**: Clear console output showing creation progress
4. **Non-Critical Failures**: Grammar reference relationship fails gracefully if target doesn't exist
5. **Type Safety**: Full TypeScript typing for all data structures
6. **Validation**: Manifest validation ensures required fields are present
7. **Mapping Preservation**: Task ID to SEED ID mapping enables dependency resolution
8. **Property Compliance**: All node properties match the specified naming conventions
9. **Relationship Metadata**: CONTAINS relationships include order property
10. **Modular Design**: Separated concerns with dedicated functions for each step