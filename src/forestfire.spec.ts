import { getForestfire } from './forestfire';

describe('forestfire', () => {
  it('get forestfire data', async () => {
    const data = await getForestfire();
    expect(Number.isNaN(data)).toBe(false);
  })
});