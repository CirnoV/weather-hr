import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { yyMMddHHmm, requestOptions, request, cheerioToStr, translateCardinalPoint } from "./utils";

export interface WindDirection {
  각도: number;
  방위명: string;
}

export enum AWSLocation {
  원통 = 321,
  서화 = 594,
  진부령 = 595,
  향로봉 = 320,
  인제 = 211,
}

export interface AWS {
  지역: string;
  출처: string;
  관측시각: string;
  강수: string;
  강수15: number;
  강수60: number;
  강수3H: number;
  강수6H: number;
  강수12H: number;
  일강수: number;
  기온: number;
  풍향1: WindDirection;
  풍속1: number;
  풍향10: WindDirection;
  풍속10: number;
  습도?: number;
  해변기압?: number;
}

export async function getAWSWeather(date: Date): Promise<AWS[]> {
  const awsLocations = [
    AWSLocation.서화,
    AWSLocation.원통,
    AWSLocation.인제,
    AWSLocation.진부령,
    AWSLocation.향로봉,
  ];

  const awsData: AWS[] = await Promise.all(awsLocations.map(loc => getWeather(date, loc)));

  return awsData;
}

async function getWeather(date: Date, location: AWSLocation): Promise<AWS> {
  date = new Date(date);
  const curMinutes = date.getMinutes();
  date.setMinutes(curMinutes - curMinutes % 10);
  
  const query = [yyMMddHHmm(date), 0, 'MINDB_1M', location, 'a', 'M'].join('&');
  const uri = `https://www.weather.go.kr/cgi-bin/aws/nph-aws_txt_min_cal_test?${query}`;
  const requestOptions: requestOptions = {
    method: 'GET',
    uri,
    encoding: null,
  };
  
  let response = null;
  try {
    response = await request(requestOptions);
  } catch(e) {
    throw e;
  }

  const strContents = Buffer.from(response);
  
  const html = iconv.decode(strContents, 'EUC-KR');
  const $ = cheerio.load(html);
  let tbody = $('body > table > tbody > tr > td > table > tbody');
  const filterbody = tbody.children().filter((index, element) => {
    return !element.children.some(child => {
      const text = cheerioToStr(child);
      return text === ' ' || text === '.';
    });
  });
  const rawData = $(filterbody[1]).children();

  const awsData: AWS = {
    지역: AWSLocation[location],
    출처: uri,
    관측시각: cheerioToStr(rawData[0]),
    강수: cheerioToStr(rawData[1]),
    강수15: Number(cheerioToStr(rawData[2])),
    강수60: Number(cheerioToStr(rawData[3])),
    강수3H: Number(cheerioToStr(rawData[4])),
    강수6H: Number(cheerioToStr(rawData[5])),
    강수12H: Number(cheerioToStr(rawData[6])),
    일강수: Number(cheerioToStr(rawData[7])),
    기온: Number(cheerioToStr(rawData[8])),
    풍향1: {
      각도: Number(cheerioToStr(rawData[9])),
      방위명: translateCardinalPoint(cheerioToStr(rawData[10])),
    },
    풍속1: Number(cheerioToStr(rawData[11])),
    풍향10: {
      각도: Number(cheerioToStr(rawData[12])),
      방위명: translateCardinalPoint(cheerioToStr(rawData[13])),
    },
    풍속10: Number(cheerioToStr(rawData[14])),
    습도: Number(cheerioToStr(rawData[15])) || undefined,
    해변기압: Number(cheerioToStr(rawData[16])) || undefined,
  }

  return awsData;
};