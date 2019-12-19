import iconv from 'iconv-lite';
import cheerio from 'cheerio';
import { yyMMddHHmm, requestOptions, request, cheerioToStr, translateCardinalPoint } from "./utils";

export interface WindDirection {
  각도: number | null;
  방위명: string;
}

export enum AWSLocation {
  원통 = 321,
  서화 = 594,
  진부령 = 595,
  향로봉 = 320,
  인제 = 211,
  해안 = 518,
}

export interface AWS {
  지역: string;
  출처: string;
  관측시각: string;
  // 강수: string;
  // 강수15: number;
  // 강수60: number;
  // 강수3H: number;
  // 강수6H: number;
  // 강수12H: number;
  일강수: number | null;
  기온: number | null;
  // 풍향1: WindDirection;
  // 풍속1: number;
  풍향10: WindDirection | null;
  풍속10: number | null;
  습도: number | null;
  해면기압: number | null;
}

export async function getAWSWeather(date: Date): Promise<AWS[]> {
  const awsLocations = [
    AWSLocation.서화,
    AWSLocation.원통,
    AWSLocation.인제,
    AWSLocation.진부령,
    AWSLocation.향로봉,
    AWSLocation.해안,
  ];

  const awsData: AWS[] = await Promise.all([
    ...awsLocations.map(loc => getWeather(date, loc)),
    getSudongWeather(date),
  ]);

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
  const filterbody = tbody.children().filter((_index, element) => {
    return !element.children.slice(1).every((child) => {
      const text = cheerioToStr(child).trim();
      return text === '' || text === '.' || text === '-';
    });
  });
  const rawData = $(filterbody[1]).children();

  const awsData: AWS = {
    지역: AWSLocation[location],
    출처: uri,
    관측시각: cheerioToStr(rawData[0]),
    // 강수: cheerioToStr(rawData[1]),
    // 강수15: Number(cheerioToStr(rawData[2])),
    // 강수60: Number(cheerioToStr(rawData[3])),
    // 강수3H: Number(cheerioToStr(rawData[4])),
    // 강수6H: Number(cheerioToStr(rawData[5])),
    // 강수12H: Number(cheerioToStr(rawData[6])),
    일강수: Number(cheerioToStr(rawData[7])),
    기온: Number(cheerioToStr(rawData[8])),
    // 풍향1: {
    //   각도: Number(cheerioToStr(rawData[9])),
    //   방위명: translateCardinalPoint(cheerioToStr(rawData[10])),
    // },
    // 풍속1: Number(cheerioToStr(rawData[11])),
    풍향10: {
      각도: Number(cheerioToStr(rawData[12])),
      방위명: translateCardinalPoint(cheerioToStr(rawData[13])),
    },
    풍속10: Number(cheerioToStr(rawData[14])),
    습도: Number(cheerioToStr(rawData[15])) || null,
    해면기압: Number(cheerioToStr(rawData[16])) || null,
  }

  if (awsData.지역 === '원통') {
    awsData.습도 = await getWontongHumidity();
  }

  return awsData;
};

const wontongUri = 'https://www.weather.go.kr/weather/process/timeseries-dfs-body-ajax.jsp?myPointCode=4281032000&unit=K';
export async function getWontongHumidity(): Promise<number | null> {
  const requestOptions: requestOptions = {
    method: 'GET',
    uri: wontongUri,
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
  const dataArr = Array.from($('.now_weather1 > dl > dd'));
  const humidity = parseFloat($(dataArr[2]).text());
  
  return humidity;
}

const sudongUri = 'https://www.weather.go.kr/weather/process/timeseries-dfs-body-ajax.jsp?myPointCode=4282034000&unit=K';
export async function getSudongWeather(date: Date): Promise<AWS> {
  const requestOptions: requestOptions = {
    method: 'GET',
    uri: sudongUri,
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

  return parseSudongWeather($);
}

export async function parseSudongWeather($: CheerioStatic): Promise<AWS> {
  let time: string = $('.MB5 > span:nth-child(2)').text();
  let regExpExec = /(\d+:\d+).*$/g.exec(time);
  if (regExpExec) {
    time = regExpExec[1];
  }
  
  const dataArr = Array.from($('.now_weather1 > dl > dd'));
  let temperature = parseFloat($(dataArr[0]).text());
  regExpExec = /(.*) (\d+\.\d{1,2})?km\/h$/g.exec($(dataArr[1]).text());
  let windSpeed: number | null = null;
  let windAngleName: string | null = null;
  if (regExpExec) {
    windAngleName = regExpExec[1];
    windSpeed = Number(regExpExec[2]);
    windSpeed = Math.round((windSpeed / 3.6) * 10) / 10;
  }
  const humidity = parseFloat($(dataArr[2]).text());

  const awsData: AWS = {
    지역: '수동',
    출처: sudongUri,
    관측시각: time,
    일강수: null,
    기온: temperature,
    풍향10: windAngleName ? {
      각도: null,
      방위명: windAngleName,
    } : null,
    풍속10: windSpeed,
    습도: humidity,
    해면기압: null,
  }

  return awsData;
}
