import { getAirGangwonData } from './airgangwon';

describe('airgangwon', () => {
  it('get airgangwon data', async () => {
    const result = await getAirGangwonData();
    console.log(result);
  });
});
