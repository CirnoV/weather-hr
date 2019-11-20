import { getAWSWeather, AWSLocation } from './aws';

// 산불 지수
// http://forestfire.nifos.go.kr/mobile/jsp/fireGrade.jsp?cd=42&cdName=%EA%B0%95%EC%9B%90%EB%8F%84&subCd=42810&subCdName=%EC%9D%B8%EC%A0%9C%EA%B5%B0

(async function(){
  const weather = await getAWSWeather(new Date(), AWSLocation.인제);

  console.log(JSON.stringify(weather));
})();