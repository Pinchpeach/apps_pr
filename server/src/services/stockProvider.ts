export type StockPoint={time:string;price:number};export type StockQuote={symbol:string;name:string;market:'KR'|'US';currency:string;price:number;change:number;changePercent:number;asOf:string;history:StockPoint[]};export type StockProvider={quotes(symbols:string[]):Promise<StockQuote[]>};
const demo:StockQuote[]=[
{symbol:'005930',name:'삼성전자',market:'KR',currency:'KRW',price:0,change:0,changePercent:0,asOf:'',history:[]},
{symbol:'000660',name:'SK하이닉스',market:'KR',currency:'KRW',price:0,change:0,changePercent:0,asOf:'',history:[]},
{symbol:'AAPL',name:'Apple',market:'US',currency:'USD',price:0,change:0,changePercent:0,asOf:'',history:[]},
{symbol:'MSFT',name:'Microsoft',market:'US',currency:'USD',price:0,change:0,changePercent:0,asOf:'',history:[]}
];
export async function getStockQuotes(symbols:string[]){if(!process.env.KIS_APP_KEY||!process.env.KIS_APP_SECRET)return demo.filter(x=>symbols.includes(x.symbol)).map(x=>({...x,asOf:new Date().toISOString()}));return getKisProvider().quotes(symbols)}
function getKisProvider():StockProvider{return{async quotes(_symbols){throw new Error('KIS provider credentials are configured but the live adapter is not enabled yet')}}}
