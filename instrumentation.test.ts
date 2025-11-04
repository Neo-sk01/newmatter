import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';

// Mock the modules
vi.mock('@opentelemetry/sdk-trace-node');
vi.mock('@langfuse/otel');

describe('Instrumentation Setup', () => {
  let consoleWarnSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let originalEnv: NodeJS.ProcessEnv;
  let mockProcessor: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Setup console spies
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a mock processor instance
    mockProcessor = {
      forceFlush: vi.fn(),
      shutdown: vi.fn(),
    };
    
    // Setup LangfuseSpanProcessor mock to return the mock processor
    vi.mocked(LangfuseSpanProcessor).mockImplementation(() => mockProcessor);
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset modules to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('NodeTracerProvider', () => {
    it('should create NodeTracerProvider correctly when credentials are present', async () => {
      // Set up environment variables
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key';
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key';

      // Mock the provider
      const mockProvider = {
        addSpanProcessor: vi.fn(),
        register: vi.fn(),
      };
      vi.mocked(NodeTracerProvider).mockImplementation(() => mockProvider as any);

      // Import and call register
      const { register } = await import('./instrumentation');
      register();

      // Verify NodeTracerProvider was created
      expect(NodeTracerProvider).toHaveBeenCalledTimes(1);
      expect(mockProvider.addSpanProcessor).toHaveBeenCalledTimes(1);
      expect(mockProvider.register).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Langfuse OpenTelemetry instrumentation initialized successfully'
      );
    });

    it('should not create NodeTracerProvider when credentials are missing', async () => {
      // Remove credentials
      delete process.env.LANGFUSE_SECRET_KEY;
      delete process.env.LANGFUSE_PUBLIC_KEY;

      // Import and call register
      const { register } = await import('./instrumentation');
      register();

      // Verify NodeTracerProvider was not created
      expect(NodeTracerProvider).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Langfuse credentials not found')
      );
    });

    it('should handle initialization errors gracefully', async () => {
      // Set up environment variables
      process.env.LANGFUSE_SECRET_KEY = 'test-secret-key';
      process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key';

      // Mock the provider to throw an error
      const mockError = new Error('Initialization failed');
      vi.mocked(NodeTracerProvider).mockImplementation(() => {
        throw mockError;
      });

      // Import and call register
      const { register } = await import('./instrumentation');
      register();

      // Verify error was logged but not thrown
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize Langfuse instrumentation:',
        mockError
      );
    });
  });

  describe('Span Filter', () => {
    it('should exclude Next.js spans', async () => {
      // Create a mock span with Next.js instrumentation scope
      const mockSpan: Partial<ReadableSpan> = {
        instrumentationScope: {
          name: 'next.js',
          version: '1.0.0',
        },
      };

      // Import the module to trigger processor creation
      await import('./instrumentation');
      
      // Get the shouldExportSpan function from the processor config
      const processorCalls = vi.mocked(LangfuseSpanProcessor).mock.calls;
      expect(processorCalls.length).toBeGreaterThan(0);
      
      const config = processorCalls[0]?.[0];
      expect(config).toBeDefined();
      const shouldExportSpan = config?.shouldExportSpan;
      expect(shouldExportSpan).toBeDefined();
      
      // Test that Next.js spans are filtered out
      const result = shouldExportSpan!({ otelSpan: mockSpan as ReadableSpan });
      expect(result).toBe(false);
    });

    it('should include non-Next.js spans', async () => {
      // Create a mock span with custom instrumentation scope
      const mockSpan: Partial<ReadableSpan> = {
        instrumentationScope: {
          name: 'custom-instrumentation',
          version: '1.0.0',
        },
      };

      // Import the module to trigger processor creation
      await import('./instrumentation');
      
      // Get the shouldExportSpan function from the processor config
      const processorCalls = vi.mocked(LangfuseSpanProcessor).mock.calls;
      const config = processorCalls[0]?.[0];
      expect(config).toBeDefined();
      const shouldExportSpan = config?.shouldExportSpan;
      expect(shouldExportSpan).toBeDefined();
      
      // Test that non-Next.js spans are included
      const result = shouldExportSpan!({ otelSpan: mockSpan as ReadableSpan });
      expect(result).toBe(true);
    });

    it('should include spans without instrumentation scope', async () => {
      // Create a mock span without instrumentation scope
      const mockSpan: Partial<ReadableSpan> = {
        instrumentationScope: undefined,
      };

      // Import the module to trigger processor creation
      await import('./instrumentation');
      
      // Get the shouldExportSpan function from the processor config
      const processorCalls = vi.mocked(LangfuseSpanProcessor).mock.calls;
      const config = processorCalls[0]?.[0];
      expect(config).toBeDefined();
      const shouldExportSpan = config?.shouldExportSpan;
      expect(shouldExportSpan).toBeDefined();
      
      // Test that spans without scope are included
      const result = shouldExportSpan!({ otelSpan: mockSpan as ReadableSpan });
      expect(result).toBe(true);
    });
  });

  describe('LangfuseSpanProcessor', () => {
    it('should initialize LangfuseSpanProcessor with shouldExportSpan filter', async () => {
      // Import the module to trigger processor creation
      await import('./instrumentation');

      // Verify LangfuseSpanProcessor was created
      expect(LangfuseSpanProcessor).toHaveBeenCalled();
      
      // Verify it was called with config containing shouldExportSpan
      const config = vi.mocked(LangfuseSpanProcessor).mock.calls[0]?.[0];
      expect(config).toBeDefined();
      expect(config).toHaveProperty('shouldExportSpan');
      expect(typeof config?.shouldExportSpan).toBe('function');
    });

    it('should export langfuseSpanProcessor for use in routes', async () => {
      // Import the processor
      const module = await import('./instrumentation');

      // Verify it's exported and defined
      expect(module.langfuseSpanProcessor).toBeDefined();
      
      // Verify it has the expected methods (since we're using a mock)
      expect(module.langfuseSpanProcessor).toHaveProperty('forceFlush');
      expect(module.langfuseSpanProcessor).toHaveProperty('shutdown');
    });
  });
});
