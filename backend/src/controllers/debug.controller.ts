import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { Octokit } from '@octokit/rest';
import { config } from '../config';

export class DebugController {
  private convex: ConvexHttpClient;

  constructor(convex: ConvexHttpClient) {
    this.convex = convex;
  }

  async debugCode(req: Request, res: Response) {
    try {
      const { code, errorMessage, language, aiProvider, userId } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      // Get user's API keys
      const settings = await this.convex.query(api.settings.getUserSettings, { userId });

      if (!settings) {
        return res.status(404).json({ error: 'User settings not found. Please configure API keys in Settings.' });
      }

      // Initialize AI service with user's keys
      const aiService = new AIService({
        provider: aiProvider || settings.aiProvider,
        openaiKey: settings.openaiKey,
        anthropicKey: settings.anthropicKey,
        geminiKey: settings.geminiKey,
      });

      // Create debugging prompt
      const prompt = this.createDebugPrompt(code, errorMessage, language);

      // Get AI response
      const aiResponse = await aiService.sendPrompt(prompt);

      // Parse the response to extract fixed code and explanation
      const result = this.parseDebugResponse(aiResponse, code);

      res.json(result);
    } catch (error: any) {
      console.error('Debug error:', error);
      res.status(500).json({
        error: 'Failed to debug code',
        message: error.message
      });
    }
  }

  async debugIssue(req: Request, res: Response) {
    try {
      const { issue, repositoryInfo, aiProvider, userId, sessionId } = req.body;

      if (!issue) {
        return res.status(400).json({ error: 'Issue is required' });
      }

      const settings = await this.convex.query(api.settings.getUserSettings, { userId });

      if (!settings) {
        return res.status(404).json({ error: 'User settings not found' });
      }

      // Create or get debug session if sessionId provided
      let debugSessionId = sessionId;
      if (!debugSessionId && repositoryInfo) {
        try {
          console.log('Creating debug session for userId:', userId);

          // Get user by githubId first
          const user = await this.convex.query(api.users.getUserByGithubId, {
            githubId: userId
          });

          if (!user) {
            console.warn('User not found with githubId:', userId);
            console.log('Attempting to create user...');

            // Try to create a basic user entry
            try {
              const newUserId = await this.convex.mutation(api.users.getOrCreateUser, {
                githubId: userId,
                username: userId,
                email: `${userId}@github.com`,
                accessToken: 'temp', // This will be updated on next login
              });
              console.log('Created new user:', newUserId);

              // Fetch the newly created user
              const newUser = await this.convex.query(api.users.getUser, { userId: newUserId });
              if (newUser && repositoryInfo) {
                // Try to create session with new user
                const repos = await this.convex.query(api.repositories.getByFullName, {
                  fullName: `${repositoryInfo.owner}/${repositoryInfo.repo}`
                });
                const repo = repos?.[0];

                if (repo) {
                  debugSessionId = await this.convex.mutation(api.debug.createDebugSession, {
                    userId: newUser._id,
                    repositoryId: repo._id,
                    sessionName: `Debug Session ${new Date().toLocaleString()}`,
                    totalIssues: 1,
                  });
                  console.log('Created debug session with new user:', debugSessionId);
                } else {
                  console.warn('Repository not found:', `${repositoryInfo.owner}/${repositoryInfo.repo}`);
                }
              }
            } catch (createError) {
              console.error('Failed to create user:', createError);
            }
          } else {
            console.log('Found user:', user._id);

            // Create new debug session
            const repos = await this.convex.query(api.repositories.getByFullName, {
              fullName: `${repositoryInfo.owner}/${repositoryInfo.repo}`
            });
            const repo = repos?.[0];

            if (repo) {
              debugSessionId = await this.convex.mutation(api.debug.createDebugSession, {
                userId: user._id,
                repositoryId: repo._id,
                sessionName: `Debug Session ${new Date().toLocaleString()}`,
                totalIssues: 1,
              });
              console.log('Created debug session:', debugSessionId);
            } else {
              console.warn('Repository not found:', `${repositoryInfo.owner}/${repositoryInfo.repo}`);
            }
          }
        } catch (sessionError) {
          console.error('Error creating debug session:', sessionError);
          // Continue without session - fixes will still work, just won't be persisted to Convex
        }
      }

      const aiService = new AIService({
        provider: aiProvider || settings.aiProvider,
        openaiKey: settings.openaiKey,
        anthropicKey: settings.anthropicKey,
        geminiKey: settings.geminiKey,
      });

      // Create issue-specific debugging prompt
      const prompt = this.createIssueDebugPrompt(issue, repositoryInfo);

      // Get AI response
      const aiResponse = await aiService.sendPrompt(prompt);

      // Parse the response
      const result = this.parseDebugResponse(aiResponse, issue.codeExample || '');

      // Save fix to Convex if we have a session
      if (debugSessionId) {
        try {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('💾 [DATABASE] Saving debug fix to Convex');
          console.log('Session ID:', debugSessionId);
          console.log('Issue Title:', issue.description?.substring(0, 100));
          console.log('Has Fixed Code:', !!result.fixedCode);
          console.log('Has Explanation:', !!result.explanation);

          const fixId = await this.convex.mutation(api.debug.createDebugFix, {
            sessionId: debugSessionId,
            issueTitle: issue.description?.substring(0, 100) || 'Untitled Issue',
            issueDescription: issue.description || '',
            originalCode: issue.codeExample,
            fixedCode: result.fixedCode,
            explanation: result.explanation,
            status: 'completed',
          });

          console.log('✅ [DATABASE] Debug fix saved successfully');
          console.log('Fix ID:', fixId);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } catch (convexError: any) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.error('❌ [DATABASE] Failed to save debug fix to Convex');
          console.error('Error:', convexError.message);
          console.error('Stack:', convexError.stack);
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          // Continue even if Convex save fails
        }
      } else {
        console.warn('⚠️ [DATABASE] No session ID - fix will not be persisted to Convex');
      }

      res.json({ ...result, sessionId: debugSessionId });
    } catch (error: any) {
      console.error('Debug issue error:', error);
      res.status(500).json({
        error: 'Failed to debug issue',
        message: error.message
      });
    }
  }

  async pushToGitHub(req: Request, res: Response) {
    try {
      const { repositoryInfo, fixes, userId } = req.body;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔄 [GITHUB PUSH] Request received');
      console.log('User ID:', userId);
      console.log('User ID type:', typeof userId);
      console.log('Repository:', repositoryInfo);
      console.log('Fixes count:', fixes?.length);

      if (!repositoryInfo || !fixes || fixes.length === 0) {
        return res.status(400).json({ error: 'Repository info and fixes are required' });
      }

      // Validate fixes structure
      for (const fix of fixes) {
        if (!fix.file || !fix.fixedCode) {
          console.error('Invalid fix structure:', fix);
          return res.status(400).json({
            error: 'Invalid fix structure',
            details: 'Each fix must have file and fixedCode properties'
          });
        }
      }

      // Get user to retrieve GitHub access token
      // If userId is a GitHub username (string), convert it to Convex user ID
      let user;
      console.log('🔍 [GITHUB PUSH] Looking up user...');
      
      if (userId && (userId.startsWith('k') || userId.startsWith('j'))) {
        // Already a Convex ID
        console.log('📋 [GITHUB PUSH] Using Convex ID directly:', userId);
        user = await this.convex.query(api.users.getUser, { userId });
      } else {
        // GitHub username - look up by githubId
        console.log('🔍 [GITHUB PUSH] Looking up by GitHub ID:', userId);
        user = await this.convex.query(api.users.getUserByGithubId, { githubId: userId });
      }

      console.log('👤 [GITHUB PUSH] User lookup result:', user ? 'Found' : 'Not found');
      if (user) {
        console.log('   - User ID:', user._id);
        console.log('   - GitHub ID:', user.githubId);
        console.log('   - Has access token:', !!user.accessToken);
      }

      if (!user) {
        console.log('❌ [GITHUB PUSH] User not found');
        return res.status(401).json({
          error: 'User not found',
          details: `No user found with identifier: ${userId}`
        });
      }

      if (!user.accessToken) {
        console.log('❌ [GITHUB PUSH] User has no access token');
        return res.status(401).json({
          error: 'GitHub authentication required',
          details: 'Please log in with GitHub to push fixes'
        });
      }

      const token = user.accessToken;

      const octokit = new Octokit({ auth: token });

      const { owner, repo, branch = 'main' } = repositoryInfo;

      console.log(`Creating fixes branch for ${owner}/${repo} based on ${branch}`);

      // Create a new branch for the fixes
      const timestamp = Date.now();
      const newBranch = `ai-fixes-${timestamp}`;

      // Get the SHA of the latest commit on the base branch
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const baseSha = refData.object.sha;

      // Create new branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: baseSha,
      });

      console.log(`Created branch: ${newBranch}`);

      // Update each file with fixes
      let successCount = 0;
      let failCount = 0;

      for (const fix of fixes) {
        try {
          console.log(`Updating file: ${fix.file}`);

          // Get current file content
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: fix.file,
            ref: newBranch,
          });

          if ('sha' in fileData) {
            // Update file
            await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: fix.file,
              message: `fix: ${fix.description || 'AI-generated fix'}`,
              content: Buffer.from(fix.fixedCode).toString('base64'),
              sha: fileData.sha,
              branch: newBranch,
            });
            successCount++;
            console.log(`Successfully updated: ${fix.file}`);
          }
        } catch (error: any) {
          failCount++;
          console.error(`Failed to update file ${fix.file}:`, error.message);
        }
      }

      console.log(`Push complete: ${successCount} succeeded, ${failCount} failed`);

      // Get the latest commit SHA on the new branch
      const { data: newRefData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${newBranch}`,
      });

      // Update debug session if sessionId is provided
      if (req.body.sessionId) {
        try {
          await this.convex.mutation(api.debug.updateDebugSession, {
            sessionId: req.body.sessionId,
            status: 'pushed',
            branch: newBranch,
          });
        } catch (convexError) {
          console.error('Failed to update debug session:', convexError);
          // Continue even if Convex update fails
        }
      }

      res.json({
        success: true,
        branch: newBranch,
        commitSha: newRefData.object.sha,
        message: `Created branch ${newBranch} with ${successCount} fix(es)${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        details: {
          successCount,
          failCount
        }
      });
    } catch (error: any) {
      console.error('Push to GitHub error:', error);
      res.status(500).json({
        error: 'Failed to push to GitHub',
        message: error.message,
        details: error.response?.data || error.stack
      });
    }
  }

  async getSessionFixes(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📖 [API] Fetching Session Fixes');
      console.log('Session ID:', sessionId);

      const fixes = await this.convex.query(api.debug.getSessionFixes, {
        sessionId: sessionId as any,
      });

      console.log('✅ [API] Retrieved', fixes.length, 'fixes');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      res.json(fixes);
    } catch (error: any) {
      console.error('❌ [API] Error fetching session fixes:', error);
      res.status(500).json({
        error: 'Failed to fetch session fixes',
        message: error.message,
      });
    }
  }

  async getUserSessions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📖 [API] Fetching User Debug Sessions');
      console.log('GitHub User ID:', userId);

      // Get user by githubId
      const user = await this.convex.query(api.users.getUserByGithubId, {
        githubId: userId,
      });

      if (!user) {
        console.log('⚠️ [API] User not found for githubId:', userId);
        return res.json([]);
      }

      console.log('✅ [API] Found user:', user._id);

      const sessions = await this.convex.query(api.debug.getUserDebugSessions, {
        userId: user._id,
      });

      console.log('✅ [API] Retrieved', sessions.length, 'sessions');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      res.json(sessions);
    } catch (error: any) {
      console.error('❌ [API] Error fetching user sessions:', error);
      res.status(500).json({
        error: 'Failed to fetch user sessions',
        message: error.message,
      });
    }
  }

  private createIssueDebugPrompt(issue: any, repositoryInfo: any): string {
    return `You are a Senior Software Engineer and Bug Resolution Specialist at a Fortune 500 technology company. Your expertise spans comprehensive code analysis, architectural design patterns, performance optimization, and production-grade debugging. Apply enterprise-level problem-solving methodologies to resolve this issue.

═══════════════════════════════════════════════════════════
📋 ISSUE ANALYSIS REQUEST
═══════════════════════════════════════════════════════════

**Severity**: ${issue.severity}
**Issue Type**: ${issue.type}
**Affected File**: ${issue.file}
${issue.line ? `**Line Number**: ${issue.line}` : ''}

**Issue Description**:
${issue.description}

${issue.suggestion ? `**Initial Suggestion**: ${issue.suggestion}\n` : ''}

${issue.codeExample ? `**Current Implementation**:
\`\`\`
${issue.codeExample}
\`\`\`
` : ''}

**Repository Context**:
- Owner: ${repositoryInfo.owner}
- Name: ${repositoryInfo.name}
- Language: ${repositoryInfo.language}

═══════════════════════════════════════════════════════════
🔍 REQUIRED ANALYSIS FRAMEWORK
═══════════════════════════════════════════════════════════

Execute a comprehensive multi-layered analysis:

**1. ROOT CAUSE ANALYSIS**
   • Identify the fundamental cause, not just symptoms
   • Analyze data flow and state management
   • Examine dependencies and side effects
   • Consider timing issues, race conditions, and edge cases

**2. STATIC CODE ANALYSIS**
   • Type safety and null safety violations
   • Unused variables, imports, and dead code
   • Code duplication and DRY principle violations
   • Complexity metrics (cyclomatic, cognitive)

**3. SECURITY ASSESSMENT**
   • Input validation and sanitization
   • Authentication and authorization checks
   • SQL injection, XSS, CSRF vulnerabilities
   • Secure data handling and encryption needs

**4. PERFORMANCE OPTIMIZATION**
   • Time complexity analysis (O notation)
   • Memory usage and potential leaks
   • Database query optimization
   • Caching opportunities
   • Asynchronous operation handling

**5. MAINTAINABILITY & SCALABILITY**
   • SOLID principles compliance
   • Design pattern applicability
   • Code readability and documentation
   • Testability and test coverage gaps
   • Future-proofing and extensibility

═══════════════════════════════════════════════════════════
✅ SOLUTION REQUIREMENTS
═══════════════════════════════════════════════════════════

Provide a production-grade solution that:

1. **Resolves the Core Issue**: Fix the identified problem completely
2. **Maintains Backward Compatibility**: Preserve existing functionality
3. **Follows Best Practices**: Apply industry standards and design patterns
4. **Optimizes Performance**: Improve efficiency where applicable
5. **Enhances Maintainability**: Write clean, documented, testable code
6. **Ensures Type Safety**: Use proper typing and validation
7. **Handles Edge Cases**: Consider all scenarios
8. **Includes Error Handling**: Implement robust error management

═══════════════════════════════════════════════════════════
📤 RESPONSE FORMAT (STRICTLY REQUIRED)
═══════════════════════════════════════════════════════════

ANALYSIS_START
**Root Cause**: [Detailed technical explanation of the underlying issue]

**Impact Assessment**: [Business and technical impact]

**Risk Analysis**: [Potential consequences if not fixed]
ANALYSIS_END

FIXED_CODE_START
\`\`\`
[Complete, production-ready, tested code solution]
\`\`\`
FIXED_CODE_END

EXPLANATION_START
**Problem Identified**:
- [Specific technical issue]
- [Why it occurs]
- [When it manifests]

**Solution Implemented**:
- [Step-by-step fix explanation]
- [Design patterns applied]
- [Best practices followed]

**Improvements Made**:
- [Performance optimizations]
- [Security enhancements]
- [Maintainability improvements]
- [Type safety additions]

**Testing Recommendations**:
- [Unit test scenarios]
- [Integration test cases]
- [Edge cases to verify]

**Additional Considerations**:
- [Migration steps if needed]
- [Documentation updates required]
- [Monitoring recommendations]
EXPLANATION_END

ERROR_IDENTIFIED_START
${issue.description}
ERROR_IDENTIFIED_END

═══════════════════════════════════════════════════════════
💼 ENTERPRISE STANDARDS
═══════════════════════════════════════════════════════════

Apply these corporate engineering principles:
• **Clean Code**: Self-documenting, readable, maintainable
• **SOLID Principles**: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion
• **DRY & KISS**: Don't repeat yourself, Keep it simple
• **Security First**: Defense in depth, principle of least privilege
• **Performance Aware**: Optimize critical paths, profile before optimizing
• **Test-Driven**: Write testable code with clear contracts
• **Documentation**: Clear comments for complex logic
• **Error Resilience**: Fail gracefully, log comprehensively

Deliver a solution that would pass rigorous code review in a Fortune 500 engineering organization.`;
  }

  private createDebugPrompt(code: string, errorMessage: string, language: string): string {
    return `You are a Senior Software Engineer and Code Quality Specialist with 15+ years of experience in enterprise software development. You are known for your meticulous attention to detail, comprehensive debugging methodology, and ability to transform problematic code into production-grade implementations.

═══════════════════════════════════════════════════════════
🎯 CODE DEBUGGING MISSION
═══════════════════════════════════════════════════════════

**Programming Language**: ${language}
**Mission**: Perform comprehensive code analysis and provide production-ready fixes

${errorMessage ? `**Reported Error/Issue**:
${errorMessage}
` : '**Task**: Comprehensive code audit and optimization\n'}

**Code Under Review**:
\`\`\`${language}
${code}
\`\`\`

═══════════════════════════════════════════════════════════
🔬 COMPREHENSIVE ANALYSIS PROTOCOL
═══════════════════════════════════════════════════════════

Conduct a thorough, enterprise-grade code inspection:

**LEVEL 1: CRITICAL ERRORS**
   ✓ Syntax errors (unclosed brackets, missing semicolons, invalid operators)
   ✓ Type errors (type mismatches, undefined properties, invalid operations)
   ✓ Runtime errors (null/undefined access, division by zero)
   ✓ Reference errors (undefined variables, scope issues)
   ✓ Import/dependency resolution errors

**LEVEL 2: LOGIC & ALGORITHM ANALYSIS**
   ✓ Control flow correctness (infinite loops, unreachable code)
   ✓ Conditional logic accuracy (incorrect boolean expressions)
   ✓ Off-by-one errors in loops and array access
   ✓ Edge case handling (empty arrays, null values, boundary conditions)
   ✓ Algorithm efficiency and time complexity
   ✓ State management and data flow integrity

**LEVEL 3: SECURITY AUDIT**
   ✓ Input validation and sanitization
   ✓ SQL injection vulnerabilities
   ✓ Cross-site scripting (XSS) risks
   ✓ Authentication and authorization weaknesses
   ✓ Sensitive data exposure
   ✓ Insecure dependencies or API usage
   ✓ CSRF protection
   ✓ Proper encryption for sensitive operations

**LEVEL 4: PERFORMANCE OPTIMIZATION**
   ✓ Time complexity analysis (identify O(n²) → O(n log n) opportunities)
   ✓ Memory efficiency (avoid memory leaks, unnecessary allocations)
   ✓ Database query optimization (N+1 queries, missing indexes)
   ✓ Caching opportunities (memoization, result caching)
   ✓ Lazy loading and code splitting
   ✓ Asynchronous operation optimization (Promise.all vs sequential awaits)
   ✓ Batch operations where applicable

**LEVEL 5: CODE QUALITY & MAINTAINABILITY**
   ✓ SOLID principles adherence
   ✓ Design pattern applicability (Factory, Strategy, Observer, etc.)
   ✓ Code duplication (DRY violations)
   ✓ Naming conventions (clear, descriptive identifiers)
   ✓ Function length and complexity (cyclomatic complexity < 10)
   ✓ Single Responsibility Principle compliance
   ✓ Proper separation of concerns
   ✓ Magic numbers and hardcoded values

**LEVEL 6: ERROR HANDLING & RESILIENCE**
   ✓ Try-catch block placement and coverage
   ✓ Error message quality and informativeness
   ✓ Graceful degradation strategies
   ✓ Proper logging for debugging and monitoring
   ✓ Resource cleanup (database connections, file handles)
   ✓ Transaction management
   ✓ Retry logic for transient failures

**LEVEL 7: TYPE SAFETY & VALIDATION**
   ✓ Proper type annotations (TypeScript/Flow)
   ✓ Runtime type validation where needed
   ✓ Null/undefined safety checks
   ✓ Input parameter validation
   ✓ API contract enforcement
   ✓ Proper use of generics

**LEVEL 8: TESTING & TESTABILITY**
   ✓ Code testability (dependency injection, mockable dependencies)
   ✓ Test coverage gaps identification
   ✓ Pure functions where possible
   ✓ Predictable behavior without side effects
   ✓ Clear function contracts

═══════════════════════════════════════════════════════════
✨ SOLUTION DELIVERY REQUIREMENTS
═══════════════════════════════════════════════════════════

Your corrected code must:

1. **Eliminate All Errors**: Zero syntax, type, or runtime errors
2. **Maintain Functionality**: Preserve original intent and behavior
3. **Apply Best Practices**: Follow ${language} idioms and conventions
4. **Optimize Performance**: Improve efficiency where applicable
5. **Enhance Security**: Address all security vulnerabilities
6. **Improve Readability**: Clear, self-documenting code
7. **Add Error Handling**: Comprehensive error management
8. **Enable Testing**: Write testable, modular code
9. **Document Complexity**: Add comments for non-obvious logic
10. **Production Ready**: Code that can deploy to production immediately

═══════════════════════════════════════════════════════════
📋 MANDATORY RESPONSE FORMAT
═══════════════════════════════════════════════════════════

ANALYSIS_START
**Critical Issues Found**: [List all critical errors]

**Logic Problems**: [Algorithm and flow issues]

**Security Vulnerabilities**: [Security concerns identified]

**Performance Bottlenecks**: [Efficiency improvements needed]

**Code Quality Issues**: [Maintainability concerns]
ANALYSIS_END

FIXED_CODE_START
\`\`\`${language}
[Production-ready, fully corrected, optimized code]
\`\`\`
FIXED_CODE_END

EXPLANATION_START
**Issues Identified and Resolved**:
1. [Issue 1]: [Explanation and fix]
2. [Issue 2]: [Explanation and fix]
3. [Issue 3]: [Explanation and fix]
[Continue for all issues...]

**Optimizations Applied**:
• [Performance improvement 1]
• [Security enhancement 1]
• [Maintainability improvement 1]

**Best Practices Implemented**:
• [Design pattern or principle applied]
• [Code quality enhancement]
• [Error handling strategy]

**Testing Strategy**:
• [Recommended unit tests]
• [Edge cases to validate]
• [Integration test scenarios]

**Deployment Considerations**:
• [Environment variables needed]
• [Dependencies to install]
• [Configuration changes required]
• [Monitoring points to add]
EXPLANATION_END

ERROR_IDENTIFIED_START
[Concise summary of the primary error/issue that was fixed]
ERROR_IDENTIFIED_END

═══════════════════════════════════════════════════════════
🏆 ENGINEERING EXCELLENCE STANDARDS
═══════════════════════════════════════════════════════════

Apply these Fortune 500 engineering principles:

**Code Craftsmanship**:
• Clean, readable, self-documenting code
• Proper abstraction levels
• Consistent formatting and style
• Clear naming conventions

**Architecture Principles**:
• SOLID (Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion)
• DRY (Don't Repeat Yourself)
• KISS (Keep It Simple, Stupid)
• YAGNI (You Aren't Gonna Need It)
• Separation of Concerns

**Security Mindset**:
• Defense in depth
• Principle of least privilege
• Input validation everywhere
• Output encoding
• Secure by default

**Performance Culture**:
• Profile before optimizing
• Optimize critical paths first
• Measure and monitor
• Consider scalability

**Reliability Engineering**:
• Fail gracefully
• Log comprehensively
• Handle errors explicitly
• Test thoroughly
• Monitor actively

**Professional Standards**:
• Code that would pass peer review at FAANG companies
• Production-grade quality
• Enterprise-level security
• Scalable architecture
• Maintainable for the next 5+ years

Deliver code that represents the gold standard of software engineering.`;
  }

  private parseDebugResponse(aiResponse: any, originalCode: string) {
    try {
      // If aiResponse is an object (from analyzeCode), convert to string
      let responseText: string;

      if (typeof aiResponse === 'object' && aiResponse !== null) {
        // AI service returned JSON object - convert to readable format
        responseText = JSON.stringify(aiResponse, null, 2);

        // Extract useful information from the analysis result
        const fixedCode = aiResponse.code_example || aiResponse.fixedCode || originalCode;
        const explanation = aiResponse.suggestion || aiResponse.explanation || aiResponse.overall_assessment || 'Code analyzed successfully.';
        const error = aiResponse.description || aiResponse.error || '';

        return {
          originalCode,
          fixedCode,
          explanation,
          error,
        };
      } else {
        responseText = String(aiResponse);
      }

      // Extract fixed code from string response
      const fixedCodeMatch = responseText.match(/FIXED_CODE_START\s*```[\w]*\s*([\s\S]*?)\s*```\s*FIXED_CODE_END/);
      const fixedCode = fixedCodeMatch ? fixedCodeMatch[1].trim() : originalCode;

      // Extract explanation
      const explanationMatch = responseText.match(/EXPLANATION_START\s*([\s\S]*?)\s*EXPLANATION_END/);
      const explanation = explanationMatch
        ? explanationMatch[1].trim()
        : 'The code has been analyzed and improved.';

      // Extract error identified
      const errorMatch = responseText.match(/ERROR_IDENTIFIED_START\s*([\s\S]*?)\s*ERROR_IDENTIFIED_END/);
      const error = errorMatch ? errorMatch[1].trim() : '';

      return {
        originalCode,
        fixedCode,
        explanation,
        error,
      };
    } catch (error) {
      console.error('Failed to parse debug response:', error);
      return {
        originalCode,
        fixedCode: originalCode,
        explanation: 'Failed to parse AI response. Please try again.',
        error: 'Parsing error',
      };
    }
  }
}
