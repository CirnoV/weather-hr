import req from 'request';
import cheerio from 'cheerio';

const pad2 = (n: number): string => n < 10 ? '0' + n : String(n);

export function yyMMddHHmm(date: Date): string {
  return `${String(date.getFullYear()).slice(-2)}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}`
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