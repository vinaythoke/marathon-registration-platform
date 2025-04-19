// jest.setup.cjs
require('@testing-library/jest-dom');

// Import your setup file that contains mocks
require('./src/__tests__/utils/setup');

// Add any global test setup here
jest.setTimeout(10000); // Set timeout for all tests to 10 seconds 