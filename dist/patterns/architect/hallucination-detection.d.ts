/** Detection signal returned by source verification */
export interface HallucinationFlag {
    level: "signal" | "content" | "structural";
    severity: "warning" | "error";
    description: string;
}
/**
 * Verify that documents referenced in task output were actually provided
 * as context (via files_affected → readFileContext).
 *
 * Returns a flag for each referenced document that was NOT in providedFiles.
 * Only path references and mapped document-name references are checked.
 * Unknown document mentions do NOT produce signals (avoids false positives).
 *
 * @param output - Raw LLM output text
 * @param taskId - Task identifier (for descriptive messages)
 * @param providedFiles - Files that were actually included in the task prompt
 */
export declare function detectUnsourcedReferences(output: string, taskId: string, providedFiles: string[]): HallucinationFlag[];
//# sourceMappingURL=hallucination-detection.d.ts.map