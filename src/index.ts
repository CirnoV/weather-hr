import Koa from 'koa';
import schedule from 'node-schedule';
import { getAWSWeather, AWSLocation, AWS } from './aws';
import { getForestfire, forestFireUri } from './forestfire';
import { getAirGangwonData, airGangWonUri } from './airgangwon';

interface IWeatherData {
  집계시각: number;
  AWS: AWS[];
  산불지수: {
    출처: string;
    현재산불지수: number;
  };
  미세먼지: {
    출처: string;
    pm10: string | number;
    pm25: string | number;
  };
}
let weatherData: IWeatherData[] = [];

let initialData: boolean = false;

async function getWeather() {
  if (initialData) {
    weatherData.pop();
    initialData = false;
  }

  const curTime = new Date();
  const awsData = await getAWSWeather(curTime);
  const forestFire = await getForestfire();
  let {pm10, pm25} = await getAirGangwonData();
  pm10 = Number(pm10);
  pm10 = Number.isNaN(pm10) ? 'NULL' : pm10;
  pm25 = Number(pm25);
  pm25 = Number.isNaN(pm25) ? 'NULL' : pm25;

  const result: IWeatherData = {
    집계시각: Date.now(),
    AWS: awsData,
    산불지수: {
      출처: forestFireUri,
      현재산불지수: forestFire,
    },
    미세먼지: {
      출처: 'http://www.airgangwon.go.kr/air_city/',
      pm10,
      pm25,
    },
  }
  weatherData = [...weatherData.slice(weatherData.length - 72), result];
}

schedule.scheduleJob('50 * * * *', getWeather);
getWeather().then(() => initialData = true);

const app = new Koa();

app.use((ctx) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.body = JSON.stringify(weatherData);
});

app.listen(8080);

// 산불 지수
// http://forestfire.nifos.go.kr/mobile/jsp/fireGrade.jsp?cd=42&cdName=%EA%B0%95%EC%9B%90%EB%8F%84&subCd=42810&subCdName=%EC%9D%B8%EC%A0%9C%EA%B5%B0

// (async function(){
//   const weather = await getAWSWeather(new Date(), AWSLocation.인제);

//   console.log(JSON.stringify(weather));
// })();