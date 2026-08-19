const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
const mockRelease = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease,
});

class Pool {
  constructor() {
    this.query = mockQuery;
    this.connect = mockConnect;
    this.on = jest.fn();
  }
}

module.exports = { Pool, __mockQuery: mockQuery, __mockConnect: mockConnect, __mockRelease: mockRelease };
