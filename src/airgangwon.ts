import { request, requestOptions } from "./utils";

export interface Realcitydata {
  cityname: string;
  caigrade: number;
  caivalue: string | number;
  caimain: string;
  pm10: string | number;
  pm25: string | number;
  o3: string | number;
  no2: string | number;
  so2: string | number;
  co: string | number;
}

export interface AirGangWon {
  date: string;
  time: string;
  realcitydata: Realcitydata[];
}

export const airGangWonUri = 'http://www.airgangwon.go.kr/include/php/json/json_RealCityData.php';

export async function getAirGangwonData(): Promise<Realcitydata> {
  const requestOptions: requestOptions = {
    method: 'GET',
    uri: airGangWonUri,
  }
  
  const data = await request(requestOptions);
  const result: AirGangWon = JSON.parse(data);

  return result.realcitydata.find(e => e.cityname === '인제군')! || {pm10: null, pm25: null};
}
