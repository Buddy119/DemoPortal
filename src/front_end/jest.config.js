export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx$': '<rootDir>/jest.esbuild-transform.cjs'
  }
};
