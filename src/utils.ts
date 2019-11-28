import req from 'request';
import cheerio from 'cheerio';

const pad2 = (n: number): string => n < 10 ? '0' + n : String(n);

export function yyMMddHHmm(date: Date): string {
  return `${String(date.getFullYear()).slice(-2)}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}`;
}

export type requestOptions = req.CoreOptions & req.UriOptions;

export function request(requestOptions: requestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    req(requestOptions, (err, res, body) => {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}

export function cheerioToStr(elem: Cheerio | CheerioElement): string {
  return cheerio(elem).text();
}

export function translateCardinalPoint(point: string): string {
  point = point.toUpperCase();
  switch (point) {
    case 'N':   return '북';
    case 'NNE': return '북북동';
    case 'NE':  return '북동';
    case 'ENE': return '동북동';
    case 'E':   return '동';
    case 'ESE': return '동남동';
    case 'SE':  return '남동';
    case 'SSE': return '남남동';
    case 'S':   return '남';
    case 'SSW': return '남남서';
    case 'SW':  return '남서';
    case 'WSW': return '서남서';
    case 'W':   return '서';
    case 'WNW': return '서북서';
    case 'NW':  return '북서';
    case 'NNW': return '북북서';
    default:
      return '-';
  }
}
