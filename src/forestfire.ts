import cheerio from 'cheerio';
import { request, requestOptions } from "./utils";

export const forestFireUri = 'http://forestfire.nifos.go.kr/mobile/jsp/fireGrade.jsp?cd=42&cdName=%EA%B0%95%EC%9B%90%EB%8F%84&subCd=42810&subCdName=%EC%9D%B8%EC%A0%9C%EA%B5%B0';

export async function getForestfire(): Promise<number> {
  const requestOptions: requestOptions = {
    method: 'GET',
    uri: forestFireUri,
  }
  
  const data = await request(requestOptions);
  const $ = cheerio.load(data);
  const value = $('#content > div > div > div.greenTable > table > tbody > tr:nth-child(4) > td:nth-child(3)').text();

  return Number(value);
}
